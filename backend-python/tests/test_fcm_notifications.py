"""Automated Tests for Firebase Cloud Messaging (FCM) Push Notifications."""

import pytest
import uuid
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import create_app
from app.core.security import create_access_token
from app.db.client import database
from app.models.user import Role, User, UserStatus
from app.core.fcm import register_fcm_token, unregister_fcm_token, send_fcm_push, send_topic_push
from app.services.order_notifications import (
    send_customer_notification,
    send_partner_notification,
    send_rider_notification,
)


@pytest.fixture()
def client():
    with TestClient(create_app()) as test_client:
        yield test_client


async def _create_test_user(role: Role = Role.customer, name: str = "Test User") -> User:
    uid = f"usr-fcm-{uuid.uuid4().hex[:8]}"
    user = User(
        id=uid,
        firebase_uid=f"fb-{uuid.uuid4().hex[:8]}",
        role=role,
        phone=f"+91987{uuid.uuid4().int % 10000000:07d}",
        display_name=name,
        status=UserStatus.active,
        is_verified=True,
    )
    doc = user.to_document()
    doc["_id"] = uid
    await database.collection("users").insert_one(doc)
    return user


def _auth(user: User) -> dict:
    token, _ = create_access_token(user.id, user.role.value)
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_fcm_token_registration_and_deduplication(client):
    """Test registering FCM tokens on user profile, deduplication, and max 5 limit."""
    user = await _create_test_user(Role.customer, "FCM Token User")

    # 1. Register first token
    token_1 = "fcm_token_device_alpha_111"
    res1 = client.post(
        "/api/notifications/fcm-token",
        json={"token": token_1, "device": "web"},
        headers=_auth(user),
    )
    assert res1.status_code == 200
    assert res1.json()["registered"] is True

    updated_u1 = await database.find_one("users", {"_id": user.id})
    assert token_1 in updated_u1.get("fcm_tokens", [])
    assert updated_u1.get("fcm_token") == token_1

    # 2. Register same token again -> should deduplicate
    res2 = client.post(
        "/api/notifications/fcm-token",
        json={"token": token_1, "device": "web"},
        headers=_auth(user),
    )
    assert res2.status_code == 200

    updated_u2 = await database.find_one("users", {"_id": user.id})
    assert updated_u2.get("fcm_tokens").count(token_1) == 1

    # 3. Register 5 more tokens -> ensure capped at 5
    for i in range(2, 8):
        tok = f"fcm_token_device_{i}"
        await register_fcm_token(user.id, tok, "android")

    updated_u3 = await database.find_one("users", {"_id": user.id})
    assert len(updated_u3.get("fcm_tokens", [])) <= 5
    assert "fcm_token_device_7" in updated_u3.get("fcm_tokens", [])


@pytest.mark.asyncio
async def test_fcm_token_unregistration(client):
    """Test unregistering specific token or all tokens on logout."""
    user = await _create_test_user(Role.partner, "FCM Unregister User")
    tok_a = "token_aaa_1"
    tok_b = "token_bbb_2"

    await register_fcm_token(user.id, tok_a, "web")
    await register_fcm_token(user.id, tok_b, "web")

    # Unregister tok_a
    res = client.delete(
        f"/api/notifications/fcm-token?token={tok_a}",
        headers=_auth(user),
    )
    assert res.status_code == 200

    u = await database.find_one("users", {"_id": user.id})
    assert tok_a not in u.get("fcm_tokens", [])
    assert tok_b in u.get("fcm_tokens", [])

    # Unregister all tokens
    res_all = client.delete(
        "/api/notifications/fcm-token",
        headers=_auth(user),
    )
    assert res_all.status_code == 200
    u_all = await database.find_one("users", {"_id": user.id})
    assert u_all.get("fcm_tokens") == []


@pytest.mark.asyncio
async def test_test_push_notification_endpoint(client):
    """Test POST /api/notifications/test-push works cleanly."""
    user = await _create_test_user(Role.customer, "Push Test User")
    await register_fcm_token(user.id, "fake_fcm_token_123", "web")

    res = client.post(
        "/api/notifications/test-push",
        json={"title": "Test Title", "body": "Test Body", "url": "/track/ord-101"},
        headers=_auth(user),
    )
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert "sentCount" in data
    assert data["user"] == user.id


@pytest.mark.asyncio
async def test_send_fcm_push_payload_formatting():
    """Verify send_fcm_push cleans string data and constructs messages properly."""
    user = await _create_test_user(Role.rider, "Rider Push User")
    await register_fcm_token(user.id, "mock_rider_token_999", "android")

    # Test with mock messaging.send
    with patch("app.core.fcm._firebase_app", return_value=MagicMock()):
        with patch("firebase_admin.messaging.send") as mock_send:
            count = await send_fcm_push(
                user.id,
                title="New Order Available",
                body="Order #QP1001 is ready for pickup",
                data={"orderId": "QP1001", "fare": "120", "numeric_val": 42},
                badge=2,
            )
            assert count == 1
            assert mock_send.called
            msg_arg = mock_send.call_args[0][0]
            assert msg_arg.notification.title == "New Order Available"
            assert msg_arg.data["numeric_val"] == "42"
            assert msg_arg.data["orderId"] == "QP1001"


@pytest.mark.asyncio
async def test_order_notification_helpers_trigger_push():
    """Verify customer, partner, and rider order notification functions invoke push dispatch."""
    cust = await _create_test_user(Role.customer, "Customer Order Ntf")
    part = await _create_test_user(Role.partner, "Partner Order Ntf")
    rdr = await _create_test_user(Role.rider, "Rider Order Ntf")

    with patch("app.core.onesignal.send_onesignal_notification") as mock_os_push:
        mock_os_push.return_value = {"status": "delivered", "id": "notif-1"}

        # 1. Customer notification
        c_doc = await send_customer_notification(
            cust.id,
            kind="order-placed",
            title="Order Placed Successfully",
            description="Your order #QP2001 has been received.",
            order_id="QP2001",
        )
        assert c_doc["_id"]
        assert mock_os_push.called

        # 2. Partner notification
        p_doc = await send_partner_notification(
            part.id,
            title="Incoming Order",
            description="New order assigned to your store.",
            order_id="QP2001",
        )
        assert p_doc["_id"]

        # 3. Rider notification
        r_doc = await send_rider_notification(
            rdr.id,
            title="Ride Assigned",
            message="Please proceed to customer location.",
            order_id="QP2001",
        )
        assert r_doc["_id"]

