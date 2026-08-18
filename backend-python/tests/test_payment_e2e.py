"""P0 #2 — Razorpay payment rails over the real HTTP API.

TEST MODE ONLY. No live credentials, no real money: the gateway order id and
the Checkout payload come from the server's test-mode simulator, which signs
`{order_id}|{payment_id}` exactly the way Razorpay does, so the production
signature-verification path runs unchanged.

Covered: payment order creation, server-side verification, persistence, order
paymentStatus, ledger entries, duplicate verification, invalid signature,
cross-account access, refunds and refund duplicate protection.
"""

from __future__ import annotations

import uuid

import anyio
import pytest
from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.db.client import database
from app.main import create_app
from app.models.user import Role, User, UserStatus
from app.db.repositories import users as user_repository
from app.services import wallet_ledger as ledger


async def _make_user(role: Role, name: str) -> User:
    user = User(
        id=str(uuid.uuid4()),
        firebase_uid=f"uid-{uuid.uuid4().hex[:8]}",
        role=role,
        phone=f"+9190001{uuid.uuid4().int % 100000:05d}",
        email=None,
        display_name=name,
        photo_url=None,
        status=UserStatus.active,
        is_verified=True,
        is_onboarded=True,
    )
    return await user_repository.create(user)


def _auth(user: User) -> dict:
    token, _ = create_access_token(user.id, user.role.value)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def client():
    with TestClient(create_app()) as test_client:
        yield test_client


@pytest.fixture()
def people(client):
    async def build():
        return {
            "customer": await _make_user(Role.customer, "Pay Customer"),
            "other": await _make_user(Role.customer, "Other Customer"),
            "admin": await _make_user(Role.admin, "Pay Admin"),
        }

    return anyio.run(build)


def _place_order(client, customer: User) -> str:
    headers = _auth(customer)
    add = client.post(
        "/api/cart/items",
        headers=headers,
        json={
            "id": "s1",
            "itemId": "s1",
            "serviceId": "s1",
            "partnerId": "prt-2001",
            "name": "Wash & Iron",
            "price": 79,
            "qty": 2,
        },
    )
    assert add.status_code in (200, 201), add.text
    placed = client.post(
        "/api/orders",
        headers=headers,
        json={
            "partnerId": "prt-2001",
            "address": {
                "label": "Home",
                "line": "Flat 12, Indiranagar",
                "city": "Bengaluru",
                "phone": "+91 90000 11111",
            },
            "pickup": {"date": "today", "slot": "morning", "express": False},
            "payment": {"mode": "cod", "label": "Cash on delivery"},
        },
    )
    assert placed.status_code in (200, 201), placed.text
    return placed.json()["orderId"]


def test_razorpay_payment_e2e(client, people):
    customer, other, admin = people["customer"], people["other"], people["admin"]
    headers = _auth(customer)

    # 1. config is exposed and in test mode (never live in the test suite).
    config = client.get("/api/payments/razorpay/config", headers=headers).json()
    assert config["mode"] != "live"

    # 2. Customer places a real order via the untouched lifecycle API.
    order_id = _place_order(client, customer)

    # 3. Payment order created against the canonical orderId.
    created = client.post(
        "/api/payments/razorpay/order",
        headers=headers,
        json={"amount": 500, "orderId": order_id, "purpose": "Order payment"},
    )
    assert created.status_code == 200, created.text
    order_payload = created.json()
    payment_id = order_payload["paymentId"]
    gateway_order_id = order_payload["gatewayOrderId"]
    assert gateway_order_id
    assert order_payload["payableAmount"] == 500

    # 4. TEST-MODE checkout payload (signed server side, no real money).
    sim = client.post(
        "/api/payments/razorpay/simulate",
        headers=headers,
        json={"gatewayOrderId": gateway_order_id},
    )
    assert sim.status_code == 200, sim.text
    signed = sim.json()

    # 5. Server-side signature verification succeeds.
    verified = client.post("/api/payments/razorpay/verify", headers=headers, json=signed)
    assert verified.status_code == 200, verified.text
    body = verified.json()
    assert body["verified"] is True
    assert body["payment"]["status"] == "paid"
    assert body["payment"]["signatureVerified"] is True

    # 6. Payment persisted and readable by its owner.
    fetched = client.get(f"/api/payments/gateway/{payment_id}", headers=headers)
    assert fetched.status_code == 200
    assert fetched.json()["orderId"] == order_id

    # 7. Canonical order now reads as paid — status untouched.
    order = client.get(f"/api/orders/{order_id}", headers=headers).json()
    assert order["payment"]["paid"] is True
    assert order["status"] == "pending_partner_acceptance"

    # 8. Duplicate verification is idempotent (no second paid transition).
    again = client.post("/api/payments/razorpay/verify", headers=headers, json=signed)
    assert again.status_code == 200
    assert again.json()["verified"] is True

    # 9. Invalid signature is rejected and never marks the payment paid.
    second = client.post(
        "/api/payments/razorpay/order",
        headers=headers,
        json={"amount": 200, "orderId": order_id},
    ).json()
    bad = client.post(
        "/api/payments/razorpay/verify",
        headers=headers,
        json={
            "paymentId": second["paymentId"],
            "razorpay_order_id": second["gatewayOrderId"],
            "razorpay_payment_id": "pay_forged",
            "razorpay_signature": "deadbeef",
        },
    )
    assert bad.status_code == 200
    assert bad.json()["verified"] is False
    assert bad.json()["payment"]["status"] == "failed"

    # 10. Another customer cannot read or verify this payment.
    assert client.get(f"/api/payments/gateway/{payment_id}", headers=_auth(other)).status_code == 403
    assert (
        client.post(
            "/api/payments/razorpay/verify", headers=_auth(other), json=signed
        ).status_code
        == 403
    )
    # 11. Unauthenticated access is rejected.
    assert client.get(f"/api/payments/gateway/{payment_id}").status_code in (401, 403)

    # 12. Admin has payment visibility.
    dashboard = client.get("/api/admin/payments/dashboard", headers=_auth(admin))
    assert dashboard.status_code == 200

    # 13. Refund flow + duplicate protection.
    refund = client.post(
        f"/api/payments/{payment_id}/refund",
        headers=headers,
        json={"reason": "Test refund", "destination": "wallet"},
    )
    assert refund.status_code == 200, refund.text
    refund_id = refund.json()["refund"]["id"]
    duplicate = client.post(
        f"/api/payments/{payment_id}/refund",
        headers=headers,
        json={"reason": "Test refund", "destination": "wallet"},
    )
    assert duplicate.status_code == 409
    assert client.get(f"/api/refunds/{refund_id}", headers=headers).status_code == 200


def test_wallet_payment_creates_single_ledger_debit(client, people):
    customer = people["customer"]
    headers = _auth(customer)

    async def topup():
        await ledger.append_entry(
            account_id=customer.id,
            role="customer",
            direction="credit",
            reason="wallet-topup",
            amount=300,
            note="Test top-up",
        )
        return await ledger.balance(customer.id)

    assert anyio.run(topup) >= 300

    created = client.post(
        "/api/payments/razorpay/order",
        headers=headers,
        json={"amount": 100, "walletAmount": 100, "purpose": "Wallet payment"},
    )
    assert created.status_code == 200, created.text
    payload = created.json()
    assert payload["fullyPaidByWallet"] is True
    assert payload["walletApplied"] == 100

    async def debits():
        entries = await database.find_many(
            ledger.LEDGER_COLLECTION, {"accountId": customer.id}
        )
        return [
            e
            for e in entries
            if e.get("direction") == "debit" and e.get("paymentId") == payload["paymentId"]
        ]

    assert len(anyio.run(debits)) == 1

    # Wallet cannot go negative: asking for more than the balance only applies
    # what is available, the rest becomes a gateway payable.
    over = client.post(
        "/api/payments/razorpay/order",
        headers=headers,
        json={"amount": 10_000, "walletAmount": 10_000},
    ).json()
    assert over["walletApplied"] <= 200
    assert over["payableAmount"] == 10_000 - over["walletApplied"]
