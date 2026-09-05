"""Automated Tests for OneSignal Push Notification Integration."""

import pytest
import uuid
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient

from app.main import create_app
from app.core.security import create_access_token
from app.db.client import database
from app.models.user import Role, User, UserStatus
from app.core.onesignal import (
    register_user_onesignal_player,
    send_onesignal_notification,
    send_onesignal_broadcast,
)


@pytest.fixture()
def client():
    with TestClient(create_app()) as test_client:
        yield test_client


async def _create_test_user(role: Role = Role.partner, name: str = "OneSignal Partner") -> User:
    uid = f"usr-os-{uuid.uuid4().hex[:8]}"
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
async def test_onesignal_config_endpoint(client):
    """GET /api/notifications/onesignal/config returns configured OneSignal App ID."""
    res = client.get("/api/notifications/onesignal/config")
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert data["appId"] == "184bda82-7c5b-4319-a977-4fcffbcca270"


@pytest.mark.asyncio
async def test_register_onesignal_player_id(client):
    """POST /api/notifications/onesignal/player-id registers subscription."""
    user = await _create_test_user(Role.partner, "Partner Alarm Subscriber")
    player_id = f"os-player-{uuid.uuid4().hex}"

    res = client.post(
        "/api/notifications/onesignal/player-id",
        json={"playerId": player_id, "deviceType": "android"},
        headers=_auth(user),
    )
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert data["registered"] is True
    assert data["playerId"] == player_id

    # Verify stored in DB
    stored = await database.collection("onesignal_subscriptions").find_one({"user_id": user.id})
    assert stored is not None
    assert stored["player_id"] == player_id
    assert stored["role"] == "partner"
    assert stored["device_type"] == "android"


@pytest.mark.asyncio
async def test_send_onesignal_notification_mock():
    """Test send_onesignal_notification builds and sends correct payload."""
    user_id = f"usr-{uuid.uuid4().hex[:8]}"

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.content = b'{"id": "notif-12345", "recipients": 1}'
    mock_resp.json.return_value = {"id": "notif-12345", "recipients": 1}

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        result = await send_onesignal_notification(
            user_id,
            title="🚨 NEW ORDER RECEIVED #QP-99",
            body="Tap to review and accept incoming order now.",
            data={"orderId": "ord-99", "kind": "order-new"},
            url="/orders/ord-99",
        )

        assert result["status"] == "delivered"
        assert result["id"] == "notif-12345"
        assert result["recipients"] == 1

        mock_post.assert_called_once()
        call_kwargs = mock_post.call_args[1]
        req_json = call_kwargs["json"]

        assert req_json["headings"]["en"] == "🚨 NEW ORDER RECEIVED #QP-99"
        assert req_json["contents"]["en"] == "Tap to review and accept incoming order now."
        assert req_json["android_sound"] == "order_alarm"
        assert req_json["priority"] == 10
        assert req_json["data"]["orderId"] == "ord-99"


@pytest.mark.asyncio
async def test_onesignal_test_endpoint(client):
    """POST /api/notifications/onesignal/test triggers push dispatch."""
    user = await _create_test_user(Role.customer, "Customer Test")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.content = b'{"id": "test-notif-777", "recipients": 1}'
    mock_resp.json.return_value = {"id": "test-notif-777", "recipients": 1}

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        res = client.post(
            "/api/notifications/onesignal/test",
            json={"title": "Test Alert", "body": "Checking OneSignal!"},
            headers=_auth(user),
        )

        assert res.status_code == 200
        data = res.json()
        assert data["ok"] is True
        assert data["result"]["status"] == "delivered"
