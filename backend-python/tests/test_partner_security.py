"""Automated Security & Tenant Isolation Tests for QuickPress Partner Panel."""

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.security import create_access_token
from app.db.client import database
from app.models.user import Role, User, UserStatus


@pytest.fixture(autouse=True)
async def setup_db():
    await database.connect()


@pytest.fixture
async def partner_a_user():
    user = User(
        id="usr-partner-a",
        firebase_uid="fb-partner-a",
        role=Role.partner,
        phone="+919876543210",
        status=UserStatus.active,
        is_phone_verified=True,
    )
    doc = user.to_document()
    doc["_id"] = "usr-partner-a"
    await database.collection("users").update_one(
        {"_id": "usr-partner-a"},
        {"$set": doc},
        upsert=True,
    )
    await database.collection("partner_profiles").update_one(
        {"_id": "PRT-AAA-100"},
        {
            "$set": {
                "_id": "PRT-AAA-100",
                "partnerId": "PRT-AAA-100",
                "userId": "usr-partner-a",
                "businessName": "Partner Store A",
                "phone": "+919876543210",
                "status": "active",
                "isOnline": True,
            }
        },
        upsert=True,
    )
    await database.collection("partner_wallets").update_one(
        {"accountId": "PRT-AAA-100"},
        {
            "$set": {
                "_id": "wal-AAA-100",
                "accountId": "PRT-AAA-100",
                "balance": 2500,
                "cashbackBalance": 0,
                "rewardPoints": 0,
                "referralEarned": 0,
            }
        },
        upsert=True,
    )
    return user


@pytest.fixture
async def partner_b_user():
    user = User(
        id="usr-partner-b",
        firebase_uid="fb-partner-b",
        role=Role.partner,
        phone="+919876543211",
        status=UserStatus.active,
        is_phone_verified=True,
    )
    doc = user.to_document()
    doc["_id"] = "usr-partner-b"
    await database.collection("users").update_one(
        {"_id": "usr-partner-b"},
        {"$set": doc},
        upsert=True,
    )
    await database.collection("partner_profiles").update_one(
        {"_id": "PRT-BBB-200"},
        {
            "$set": {
                "_id": "PRT-BBB-200",
                "partnerId": "PRT-BBB-200",
                "userId": "usr-partner-b",
                "businessName": "Partner Store B",
                "phone": "+919876543211",
                "status": "active",
                "isOnline": True,
            }
        },
        upsert=True,
    )
    return user


@pytest.fixture
async def suspended_partner_user():
    user = User(
        id="usr-partner-suspended",
        firebase_uid="fb-partner-suspended",
        role=Role.partner,
        phone="+919876543299",
        status=UserStatus.suspended,
        is_phone_verified=True,
    )
    doc = user.to_document()
    doc["_id"] = "usr-partner-suspended"
    await database.collection("users").update_one(
        {"_id": "usr-partner-suspended"},
        {"$set": doc},
        upsert=True,
    )
    return user


@pytest.mark.asyncio
async def test_partner_tenant_isolation_services(partner_a_user, partner_b_user):
    """Partner A creates a service; Partner B must NOT be able to view, update, or delete it."""
    token_a, _ = create_access_token(partner_a_user.id, role="partner")
    token_b, _ = create_access_token(partner_b_user.id, role="partner")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Partner A creates service
        resp = await client.post(
            "/api/partner/services",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"name": "Steam Ironing Store A", "price": 99, "unit": "piece"},
        )
        assert resp.status_code in (200, 201)
        service_a_id = resp.json()["id"]

        # Partner B tries to read Service A by ID -> must fail (404/403)
        resp_b_read = await client.get(
            f"/api/partner/services/{service_a_id}",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert resp_b_read.status_code in (403, 404)

        # Partner B tries to modify Service A -> must fail (403/404)
        resp_b_update = await client.put(
            f"/api/partner/services/{service_a_id}",
            headers={"Authorization": f"Bearer {token_b}"},
            json={"price": 10},
        )
        assert resp_b_update.status_code in (403, 404)

        # Partner B tries to delete Service A -> must fail (403/404)
        resp_b_delete = await client.delete(
            f"/api/partner/services/{service_a_id}",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert resp_b_delete.status_code in (403, 404)


@pytest.mark.asyncio
async def test_partner_tenant_isolation_orders(partner_a_user, partner_b_user):
    """Partner B cannot view or perform operations on Partner A's order."""
    token_a, _ = create_access_token(partner_a_user.id, role="partner")
    token_b, _ = create_access_token(partner_b_user.id, role="partner")

    # Create Order for Partner A
    order_doc = {
        "_id": "ord-iso-test-01",
        "id": "ord-iso-test-01",
        "code": "QP-ISO-01",
        "status": "partner_accepted",
        "partner": {"id": "PRT-AAA-100", "name": "Partner Store A"},
        "userId": "usr-cust-99",
        "amount": 350,
        "items": [],
    }
    await database.collection("customer_orders").update_one(
        {"_id": "ord-iso-test-01"},
        {"$set": order_doc},
        upsert=True,
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Partner A can view
        resp_a = await client.get(
            "/api/partner/orders/ord-iso-test-01",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert resp_a.status_code == 200

        # Partner B cannot view -> 403 or 404
        resp_b = await client.get(
            "/api/partner/orders/ord-iso-test-01",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert resp_b.status_code in (403, 404)


@pytest.mark.asyncio
async def test_partner_wallet_negative_withdrawal_rejection(partner_a_user):
    """Withdrawal of negative, zero, or overdraft amount must be rejected."""
    token_a, _ = create_access_token(partner_a_user.id, role="partner")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Negative amount
        resp = await client.post(
            "/api/partner/withdraw",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"amount": -500},
        )
        assert resp.status_code in (400, 422)

        # Overdraft amount (more than balance 2500)
        resp_overdraft = await client.post(
            "/api/partner/withdraw",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"amount": 99999},
        )
        assert resp_overdraft.status_code in (400, 422)


@pytest.mark.asyncio
async def test_suspended_partner_blocked(suspended_partner_user):
    """Suspended partner account must be rejected on authenticated endpoints."""
    token, _ = create_access_token(suspended_partner_user.id, role="partner")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(
            "/api/partner/profile",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_invalid_order_state_transition_rejected(partner_a_user):
    """Partner cannot jump states (e.g. from placed directly to completed)."""
    token_a, _ = create_access_token(partner_a_user.id, role="partner")

    # Create a fresh order awaiting acceptance
    order_doc = {
        "_id": "ord-test-security-101",
        "id": "ord-test-security-101",
        "code": "QP-SEC-101",
        "status": "pending_partner_acceptance",
        "partner": {"id": "PRT-AAA-100", "name": "Partner Store A"},
        "userId": "usr-cust-1",
        "amount": 250,
        "items": [],
    }
    await database.collection("customer_orders").update_one(
        {"_id": "ord-test-security-101"},
        {"$set": order_doc},
        upsert=True,
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Partner tries to complete before pickup & processing -> must fail 400
        resp = await client.post(
            "/api/partner/orders/ord-test-security-101/complete",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert resp.status_code == 400
