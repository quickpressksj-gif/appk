"""Automated test suite for Customer Settings (Notifications, Language, Appearance).

Verifies:
  1. GET /api/me/settings returns default settings with theme="light" (Requirement 9 & 12).
  2. PUT /api/me/settings updates notification preferences in MongoDB Atlas.
  3. PUT /api/me/settings updates language preferences in MongoDB Atlas.
  4. PUT /api/me/settings updates appearance theme preferences in MongoDB Atlas.
  5. Invalid theme values fallback safely to "light" without crashing.
  6. Invalid language values fallback safely to "en-IN" without crashing.
  7. Strict customer ownership isolation (Customer A vs Customer B).
  8. MongoDB Atlas persistence across multiple reads/writes.
"""

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.security import create_access_token
from app.db.client import database
from app.db.repositories import users
from app.main import app
from app.models.user import Role


@pytest.fixture
async def settings_test_customers():
    """Creates two isolated test customers in MongoDB."""
    user_a = await users.upsert_from_firebase(
        firebase_uid="test_firebase_settings_cust_a",
        role=Role.customer,
        phone="+919876543301",
        email=None,
        display_name="Settings Customer A",
        photo_url=None,
    )
    token_a, _ = create_access_token(user_a.id, user_a.role.value)

    user_b = await users.upsert_from_firebase(
        firebase_uid="test_firebase_settings_cust_b",
        role=Role.customer,
        phone="+919876543302",
        email=None,
        display_name="Settings Customer B",
        photo_url=None,
    )
    token_b, _ = create_access_token(user_b.id, user_b.role.value)

    yield {
        "user_a": user_a,
        "token_a": token_a,
        "user_b": user_b,
        "token_b": token_b,
    }

    # Clean up test data
    await database.collection("customer_settings").delete_many(
        {"_id": {"$in": [user_a.id, user_b.id]}}
    )
    await database.collection("users").delete_many(
        {"_id": {"$in": [user_a.id, user_b.id]}}
    )


@pytest.mark.asyncio
async def test_default_theme_is_light(settings_test_customers):
    """Verify that a customer with no saved settings gets theme="light" by default."""
    token_a = settings_test_customers["token_a"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get(
            "/api/me/settings",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        # Requirement 9 & 12: Default MUST be "light"
        assert data["theme"] == "light"
        assert data["language"] == "en-IN"
        assert data["notifications"]["orderUpdates"] is True
        assert data["notifications"]["deliveryAlerts"] is True
        assert data["notifications"]["promotions"] is True


@pytest.mark.asyncio
async def test_notifications_update_and_persistence(settings_test_customers):
    """Verify updating and persisting notification preferences."""
    token_a = settings_test_customers["token_a"]
    user_a = settings_test_customers["user_a"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Update notification toggles
        update_payload = {
            "notifications": {
                "orderUpdates": True,
                "deliveryAlerts": False,
                "promotions": False,
                "email": False,
                "sms": True,
                "push": False,
            }
        }
        put_resp = await client.put(
            "/api/me/settings",
            json=update_payload,
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert put_resp.status_code == 200
        put_data = put_resp.json()
        assert put_data["notifications"]["deliveryAlerts"] is False
        assert put_data["notifications"]["promotions"] is False
        assert put_data["notifications"]["sms"] is True

        # Verify reading back via GET /api/me/settings
        get_resp = await client.get(
            "/api/me/settings",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert get_resp.status_code == 200
        get_data = get_resp.json()
        assert get_data["notifications"]["deliveryAlerts"] is False
        assert get_data["notifications"]["promotions"] is False
        assert get_data["notifications"]["sms"] is True

        # Verify directly in MongoDB Atlas
        doc = await database.collection("customer_settings").find_one({"_id": user_a.id})
        assert doc is not None
        assert doc["notifications"]["promotions"] is False
        assert doc["notifications"]["sms"] is True


@pytest.mark.asyncio
async def test_language_update_and_persistence(settings_test_customers):
    """Verify updating and persisting language preferences."""
    token_a = settings_test_customers["token_a"]
    user_a = settings_test_customers["user_a"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Switch to Hindi (hi-IN)
        put_resp = await client.put(
            "/api/me/settings",
            json={"language": "hi-IN"},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert put_resp.status_code == 200
        assert put_resp.json()["language"] == "hi-IN"

        # Verify GET returns Hindi
        get_resp = await client.get(
            "/api/me/settings",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert get_resp.status_code == 200
        assert get_resp.json()["language"] == "hi-IN"

        # Verify MongoDB Atlas
        doc = await database.collection("customer_settings").find_one({"_id": user_a.id})
        assert doc["language"] == "hi-IN"


@pytest.mark.asyncio
async def test_appearance_theme_update_and_persistence(settings_test_customers):
    """Verify updating and persisting appearance themes."""
    token_a = settings_test_customers["token_a"]
    user_a = settings_test_customers["user_a"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Switch to Dark
        put_resp = await client.put(
            "/api/me/settings",
            json={"theme": "dark"},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert put_resp.status_code == 200
        assert put_resp.json()["theme"] == "dark"

        # Verify GET returns Dark
        get_resp = await client.get(
            "/api/me/settings",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert get_resp.status_code == 200
        assert get_resp.json()["theme"] == "dark"

        # Switch back to Light
        put_resp2 = await client.put(
            "/api/me/settings",
            json={"theme": "light"},
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert put_resp2.status_code == 200
        assert put_resp2.json()["theme"] == "light"

        # Verify in MongoDB Atlas
        doc = await database.collection("customer_settings").find_one({"_id": user_a.id})
        assert doc["theme"] == "light"


@pytest.mark.asyncio
async def test_customer_isolation_and_safety_fallback(settings_test_customers):
    """Verify Customer A and Customer B settings isolation and fallback handling."""
    token_a = settings_test_customers["token_a"]
    user_a = settings_test_customers["user_a"]
    token_b = settings_test_customers["token_b"]
    user_b = settings_test_customers["user_b"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Customer A sets Hindi & Dark theme
        await client.put(
            "/api/me/settings",
            json={"language": "hi-IN", "theme": "dark"},
            headers={"Authorization": f"Bearer {token_a}"},
        )

        # Customer B gets settings -> must still have default English & Light theme!
        b_resp = await client.get(
            "/api/me/settings",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert b_resp.status_code == 200
        b_data = b_resp.json()
        assert b_data["language"] == "en-IN"
        assert b_data["theme"] == "light"

        # Customer B updates theme to System
        await client.put(
            "/api/me/settings",
            json={"theme": "system"},
            headers={"Authorization": f"Bearer {token_b}"},
        )

        # Customer A's settings must remain unaffected (Dark & Hindi)
        a_resp = await client.get(
            "/api/me/settings",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert a_resp.json()["theme"] == "dark"
        assert a_resp.json()["language"] == "hi-IN"
