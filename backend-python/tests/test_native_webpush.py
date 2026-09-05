"""Automated Tests for Pure Native WebPush (VAPID / RFC 8292)."""

import pytest
import uuid
import json
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import create_app
from app.core.security import create_access_token
from app.db.client import database
from app.models.user import Role, User, UserStatus
from app.core.webpush import (
    get_vapid_public_key,
    save_webpush_subscription,
    delete_webpush_subscription,
    send_native_webpush,
)


@pytest.fixture()
def client():
    with TestClient(create_app()) as test_client:
        yield test_client


async def _create_test_user(role: Role = Role.customer, name: str = "WebPush User") -> User:
    uid = f"usr-wp-{uuid.uuid4().hex[:8]}"
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
async def test_vapid_public_key_endpoint(client):
    """GET /api/notifications/webpush/vapid-public-key returns standard VAPID public key."""
    res = client.get("/api/notifications/webpush/vapid-public-key")
    assert res.status_code == 200
    data = res.json()
    assert data["ok"] is True
    assert len(data["publicKey"]) > 20
    assert data["publicKey"] == get_vapid_public_key()


@pytest.mark.asyncio
async def test_webpush_subscription_and_unsubscription(client):
    """Test subscribing and unsubscribing browser endpoints via API."""
    user = await _create_test_user(Role.customer, "Native Subscriber")

    sub_data = {
        "endpoint": "https://updates.push.services.mozilla.com/wpush/v2/gAAAAAB12345",
        "keys": {
            "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpHMJGmgYPwtJ0ZElGQQ2XPRmTC9",
            "auth": "tBHItJI5svbpez7KI4CCXg",
        },
    }

    # 1. Subscribe
    res = client.post(
        "/api/notifications/webpush/subscribe",
        json={"subscription": sub_data, "device": "firefox_mac"},
        headers=_auth(user),
    )
    assert res.status_code == 200
    assert res.json()["subscribed"] is True

    u = await database.find_one("users", {"_id": user.id})
    assert len(u.get("webpush_subscriptions", [])) == 1
    assert u.get("webpush_subscriptions")[0]["endpoint"] == sub_data["endpoint"]

    # 2. Duplicate subscription with same endpoint updates without adding duplicate
    res_dup = client.post(
        "/api/notifications/webpush/subscribe",
        json={"subscription": sub_data, "device": "firefox_mac"},
        headers=_auth(user),
    )
    assert res_dup.status_code == 200
    u2 = await database.find_one("users", {"_id": user.id})
    assert len(u2.get("webpush_subscriptions", [])) == 1

    # 3. Unsubscribe specific endpoint
    res_unsub = client.delete(
        f"/api/notifications/webpush/unsubscribe?endpoint={sub_data['endpoint']}",
        headers=_auth(user),
    )
    assert res_unsub.status_code == 200
    assert res_unsub.json()["unsubscribed"] is True

    u3 = await database.find_one("users", {"_id": user.id})
    assert len(u3.get("webpush_subscriptions", [])) == 0


@pytest.mark.asyncio
async def test_test_webpush_endpoint(client):
    """POST /api/notifications/webpush/test endpoint dispatches test push."""
    user = await _create_test_user(Role.partner, "Test WebPush Partner")

    sub_data = {
        "endpoint": "https://fcm.googleapis.com/fcm/send/fake_browser_endpoint_123",
        "keys": {"p256dh": "key_p256dh_sample", "auth": "auth_sample"},
    }
    await save_webpush_subscription(user.id, sub_data, "chrome")

    import sys
    mock_module = MagicMock()
    with patch.dict(sys.modules, {"pywebpush": mock_module}):
        res = client.post(
            "/api/notifications/webpush/test",
            json={"title": "Custom Test", "body": "Custom Body", "url": "/orders"},
            headers=_auth(user),
        )
        assert res.status_code == 200
        assert res.json()["ok"] is True
        assert res.json()["sentCount"] == 1
        assert mock_module.webpush.called
        call_kwargs = mock_module.webpush.call_args[1]
        payload = json.loads(call_kwargs["data"])
        assert payload["notification"]["title"] == "Custom Test"
        assert payload["data"]["url"] == "/orders"


@pytest.mark.asyncio
async def test_send_native_webpush_stale_subscription_pruning():
    """Verify dead/expired subscriptions (HTTP 410 Gone) are automatically pruned from DB."""
    user = await _create_test_user(Role.rider, "Prune Test Rider")
    dead_endpoint = "https://fcm.googleapis.com/fcm/send/dead_endpoint_410"

    await save_webpush_subscription(
        user.id,
        {"endpoint": dead_endpoint, "keys": {"p256dh": "k", "auth": "a"}},
    )

    class Mock410Exception(Exception):
        def __init__(self):
            self.response = MagicMock(status_code=410)

    import sys
    mock_module = MagicMock()
    mock_module.webpush.side_effect = Mock410Exception()
    mock_module.WebPushException = Mock410Exception
    with patch.dict(sys.modules, {"pywebpush": mock_module}):
        count = await send_native_webpush(
            user.id,
            title="Order Alert",
            body="New pickup available",
        )
        assert count == 0

    # Verify dead subscription was pruned
    updated_user = await database.find_one("users", {"_id": user.id})
    assert len(updated_user.get("webpush_subscriptions", [])) == 0

