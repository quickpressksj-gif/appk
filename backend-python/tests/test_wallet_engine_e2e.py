"""QuickPress Wallet Engine E2E Integration Tests.

Validates:
1. Customer wallet initialization (snapshot balance and double-entry ledger).
2. Customer adding funds via `POST /api/wallet/add-funds` (UPI, Card, Instant).
3. Dual-synchronization across `wallets`, `wallet_transactions`, and `wallet_ledger`.
4. In-app notification creation upon successful top-up.
5. Spendable balance querying (`GET /api/wallet` and `GET /api/wallet/history`).
6. Order payment debit and never-negative overdraft protection.
7. Razorpay top-up order creation and signature verification auto-credit.
"""

import uuid
import pytest
from httpx import AsyncClient, ASGITransport

from app.core.security import create_access_token
from app.db import repositories as user_repo
from app.db.client import database
from app.main import app
from app.models.user import Role, User
from app.services import wallet_ledger as ledger


@pytest.fixture
async def wallet_customer():
    raw_uid = f"cust_wallet_test_{uuid.uuid4().hex[:8]}"
    phone = f"+9198765{uuid.uuid4().int % 90000 + 10000}"
    user = await user_repo.users.upsert_from_firebase(
        firebase_uid=raw_uid,
        role=Role.customer,
        phone=phone,
        email=f"wallet_test_{uuid.uuid4().hex[:6]}@quickpress.test",
        display_name="Wallet Test Customer",
        photo_url=None,
    )
    token, _ = create_access_token(user.id, user.role.value)

    yield {"user": user, "token": token, "phone": phone}

    # Teardown
    await database.collection("users").delete_one({"_id": user.id})
    await database.collection("wallets").delete_one({"user_id": user.id})
    await database.collection("wallet_transactions").delete_many({"user_id": user.id})
    await database.collection("wallet_ledger").delete_many({"accountId": user.id})
    await database.collection("notifications").delete_many({"user_id": user.id})
    await database.collection("gateway_payments").delete_many({"accountId": user.id})


@pytest.mark.asyncio
async def test_customer_can_add_funds_and_sync_ledger(wallet_customer):
    user = wallet_customer["user"]
    token = wallet_customer["token"]
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Initial wallet query — balance is 0
        get_res = await client.get("/api/wallet", headers=headers)
        assert get_res.status_code == 200
        data = get_res.json()
        assert data["balances"]["currentBalance"] == 0.0
        assert data["totalBalance"] == 0.0

        # 2. Add ₹500 via UPI
        add_res = await client.post(
            "/api/wallet/add-funds",
            headers=headers,
            json={"amount": 500, "method": "upi"},
        )
        assert add_res.status_code == 200, add_res.text
        add_payload = add_res.json()
        assert add_payload["ok"] is True
        assert "500" in add_payload["message"]
        assert add_payload["wallet"]["balances"]["currentBalance"] == 500.0

        # 3. Add ₹1,000 via Card
        add_card_res = await client.post(
            "/api/wallet/add-funds",
            headers=headers,
            json={"amount": 1000, "method": "card"},
        )
        assert add_card_res.status_code == 200
        assert add_card_res.json()["wallet"]["balances"]["currentBalance"] == 1500.0

        # 4. Verify MongoDB collections synchronization:
        # a) `wallets` collection
        wallet_doc = await database.collection("wallets").find_one({"user_id": user.id})
        assert wallet_doc is not None
        assert wallet_doc["balance"] == 1500.0

        # b) `wallet_ledger` collection (double-entry append-only)
        ledger_entries = await database.find_many("wallet_ledger", {"accountId": user.id})
        assert len(ledger_entries) == 2
        assert sum(e["amount"] for e in ledger_entries if e["direction"] == "credit") == 1500.0
        assert await ledger.balance(user.id) == 1500.0

        # c) `wallet_transactions` collection
        txns = await database.find_many("wallet_transactions", {"user_id": user.id})
        assert len(txns) == 2

        # d) `notifications` collection
        notifs = await database.find_many("notifications", {"user_id": user.id})
        assert len(notifs) >= 2
        assert any("500" in n["description"] for n in notifs)

        # 5. Query wallet history
        hist_res = await client.get("/api/wallet/history", headers=headers)
        assert hist_res.status_code == 200
        hist_items = hist_res.json()["items"]
        assert len(hist_items) == 2
        assert hist_items[0]["direction"] == "credit"


@pytest.mark.asyncio
async def test_wallet_debit_and_overdraft_protection(wallet_customer):
    user = wallet_customer["user"]
    token = wallet_customer["token"]
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Add ₹300 first
        await client.post(
            "/api/wallet/add-funds",
            headers=headers,
            json={"amount": 300, "method": "instant"},
        )
        assert await ledger.balance(user.id) == 300.0

        # Create a payment using wallet
        pay_res = await client.post(
            "/api/payments/create",
            headers=headers,
            json={"amount": 200, "method": "wallet", "purpose": "Order payment", "orderId": "ord-test-1"},
        )
        assert pay_res.status_code == 200, pay_res.text
        pay_data = pay_res.json()
        assert pay_data["payment"]["status"] == "paid"
        assert pay_data["wallet"]["balances"]["currentBalance"] == 100.0
        assert await ledger.balance(user.id) == 100.0

        # Attempt to pay more than the remaining balance (₹500 when only ₹100 left)
        over_res = await client.post(
            "/api/payments/create",
            headers=headers,
            json={"amount": 500, "method": "wallet", "purpose": "Order payment", "orderId": "ord-test-2"},
        )
        assert over_res.status_code == 400
        assert "Insufficient" in over_res.text
        # Balance must remain intact at ₹100
        assert await ledger.balance(user.id) == 100.0


@pytest.mark.asyncio
async def test_razorpay_topup_flow_and_verification(wallet_customer):
    user = wallet_customer["user"]
    token = wallet_customer["token"]
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create a topup order
        topup_res = await client.post(
            "/api/wallet/topup",
            headers=headers,
            json={"amount": 750},
        )
        assert topup_res.status_code == 200
        order_info = topup_res.json()
        assert order_info["ok"] is True
        assert order_info["amount"] == 750
        assert order_info["gatewayOrderId"] is not None

        # 2. Simulate / verify checkout
        sim_res = await client.post(
            "/api/payments/razorpay/simulate",
            headers=headers,
            json={"gatewayOrderId": order_info["gatewayOrderId"]},
        )
        assert sim_res.status_code == 200
        sim_payload = sim_res.json()

        verify_res = await client.post(
            "/api/payments/razorpay/verify",
            headers=headers,
            json={
                "paymentId": order_info["paymentId"],
                "razorpay_order_id": order_info["gatewayOrderId"],
                "razorpay_payment_id": sim_payload["razorpay_payment_id"],
                "razorpay_signature": sim_payload["razorpay_signature"],
            },
        )
        assert verify_res.status_code == 200
        assert verify_res.json()["verified"] is True

        # Verify wallet credited ₹750
        wallet_res = await client.get("/api/wallet", headers=headers)
        assert wallet_res.json()["balances"]["currentBalance"] == 750.0
        assert await ledger.balance(user.id) == 750.0
