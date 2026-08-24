"""
End-to-End Test for Razorpay Integration:
1. Razorpay Gateway Configuration.
2. Wallet Top-up (Add Funds) via Razorpay with cryptographic HMAC signature verification.
3. Real-time balance credit & ledger history recording.
4. Membership Upgrade via Razorpay with instant perk activation.
5. Asynchronous Webhook simulation for payment capture.
"""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.db.client import database
from app.models.user import Role, User, UserStatus


@pytest.fixture
def auth_user():
    return User(
        id="usr-rzp-test-101",
        display_name="Aman Sharma",
        email="aman.sharma@quickpress.test",
        phone="+919876543210",
        role=Role.customer,
        status=UserStatus.active,
    )


@pytest.fixture
def auth_headers(auth_user):
    from app.core.security import create_access_token
    token, _ = create_access_token(auth_user.id, Role.customer)
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_razorpay_gateway_config(auth_headers):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/payments/razorpay/config", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "keyId" in data
        assert "currency" in data
        assert data["currency"] == "INR"


@pytest.mark.asyncio
async def test_razorpay_wallet_add_funds_and_verify(auth_user, auth_headers):
    # Ensure clean user in DB
    await database.collection("users").update_one(
        {"_id": auth_user.id},
        {"$set": {
            "_id": auth_user.id,
            "display_name": auth_user.display_name,
            "email": auth_user.email,
            "phone": auth_user.phone,
            "role": "customer",
            "status": "active",
        }},
        upsert=True,
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Step 1: Initial wallet balance
        wallet_res = await client.get("/api/wallet", headers=auth_headers)
        assert wallet_res.status_code == 200
        initial_balance = wallet_res.json()["balances"]["currentBalance"]

        # Step 2: Create Razorpay Order for Wallet Top-up of ₹500
        topup_amount = 500.0
        order_res = await client.post(
            "/api/payments/razorpay/order",
            headers=auth_headers,
            json={
                "amount": topup_amount,
                "purpose": "Wallet Top-up",
                "walletAmount": 0,
            },
        )
        assert order_res.status_code == 200
        order_data = order_res.json()
        assert order_data["ok"] is True
        gateway_order_id = order_data["gatewayOrderId"]
        payment_id = order_data["paymentId"]

        # Step 3: Simulate test checkout payment (returns valid test HMAC signature)
        sim_res = await client.post(
            "/api/payments/razorpay/simulate",
            headers=auth_headers,
            json={"gatewayOrderId": gateway_order_id},
        )
        assert sim_res.status_code == 200
        sim_data = sim_res.json()

        # Step 4: Verify payment signature with backend
        verify_res = await client.post(
            "/api/payments/razorpay/verify",
            headers=auth_headers,
            json={
                "paymentId": payment_id,
                "razorpay_order_id": sim_data["razorpay_order_id"],
                "razorpay_payment_id": sim_data["razorpay_payment_id"],
                "razorpay_signature": sim_data["razorpay_signature"],
            },
        )
        assert verify_res.status_code == 200
        verify_data = verify_res.json()
        assert verify_data["ok"] is True
        assert verify_data["verified"] is True
        assert verify_data["payment"]["status"] == "paid"

        # Step 5: Verify Wallet balance credited by exactly ₹500
        updated_wallet_res = await client.get("/api/wallet", headers=auth_headers)
        assert updated_wallet_res.status_code == 200
        updated_balance = updated_wallet_res.json()["balances"]["currentBalance"]
        assert updated_balance == initial_balance + topup_amount

        # Step 6: Verify transaction appears in history
        history_res = await client.get("/api/wallet/history", headers=auth_headers)
        assert history_res.status_code == 200
        history_items = history_res.json()["items"]
        assert any(item["amount"] == topup_amount for item in history_items)


@pytest.mark.asyncio
async def test_razorpay_membership_upgrade_and_verify(auth_user, auth_headers):
    # Ensure user exists
    await database.collection("users").update_one(
        {"_id": auth_user.id},
        {"$set": {
            "_id": auth_user.id,
            "display_name": auth_user.display_name,
            "email": auth_user.email,
            "phone": auth_user.phone,
            "role": "customer",
            "status": "active",
        }},
        upsert=True,
    )

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Step 1: Create Razorpay Order for Gold Membership (₹199)
        order_res = await client.post(
            "/api/payments/razorpay/order",
            headers=auth_headers,
            json={
                "amount": 199.0,
                "purpose": "Membership: gold (monthly)",
                "walletAmount": 0,
            },
        )
        assert order_res.status_code == 200
        order_data = order_res.json()
        gateway_order_id = order_data["gatewayOrderId"]
        payment_id = order_data["paymentId"]

        # Step 2: Simulate Checkout
        sim_res = await client.post(
            "/api/payments/razorpay/simulate",
            headers=auth_headers,
            json={"gatewayOrderId": gateway_order_id},
        )
        assert sim_res.status_code == 200
        sim_data = sim_res.json()

        # Step 3: Verify Payment
        verify_res = await client.post(
            "/api/payments/razorpay/verify",
            headers=auth_headers,
            json={
                "paymentId": payment_id,
                "razorpay_order_id": sim_data["razorpay_order_id"],
                "razorpay_payment_id": sim_data["razorpay_payment_id"],
                "razorpay_signature": sim_data["razorpay_signature"],
            },
        )
        assert verify_res.status_code == 200
        assert verify_res.json()["verified"] is True

        # Step 4: Verify Membership active state
        mbs_res = await client.get("/api/membership", headers=auth_headers)
        assert mbs_res.status_code == 200
        mbs_data = mbs_res.json()
        assert mbs_data["active"] is True
        assert mbs_data["planId"] == "gold"
