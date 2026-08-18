"""P0 — ONE order, ONE canonical id, travelling Customer -> Partner -> Rider -> Delivered.

The test drives the real HTTP API (no repository shortcuts) and asserts that
every app sees the SAME orderId and the SAME status at every step, that the
audit trail is written, that OTPs are per-order (not universal) and that
unauthenticated or unrelated accounts are rejected.
"""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.db.client import database
from app.db.identity_seed import align_partner_identities
from app.main import create_app
from app.models.user import Role, User, UserStatus
from app.db.repositories import users as user_repository


PARTNER_STORE_ID = "prt-2001"
RIDER_PROFILE_ID = "rdr-1"


async def _make_user(role: Role, name: str) -> User:
    user = User(
        id=str(uuid.uuid4()),
        firebase_uid=f"uid-{uuid.uuid4().hex[:8]}",
        role=role,
        phone=f"+9190000{uuid.uuid4().int % 100000:05d}",
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
def actors(client):
    """A customer, a linked partner store account, a linked rider and an admin."""
    import anyio

    async def build():
        await align_partner_identities()
        from app.db.partner_repositories import partner_repository
        from app.db.rider_repositories import rider_profile_repository

        customer = await _make_user(Role.customer, "Test Customer")
        partner = await _make_user(Role.partner, "Test Partner")
        rider = await _make_user(Role.rider, "Test Rider")
        admin = await _make_user(Role.admin, "Test Admin")
        await partner_repository.link_account(partner.id, PARTNER_STORE_ID)
        await rider_profile_repository.link_account(rider.id, RIDER_PROFILE_ID)
        return {"customer": customer, "partner": partner, "rider": rider, "admin": admin}

    return anyio.from_thread.run_sync if False else anyio.run(build)


def _place_order(client, customer: User) -> dict:
    headers = _auth(customer)
    add = client.post(
        "/api/cart/items",
        headers=headers,
        json={
            "id": "s1",
            "itemId": "s1",
            "serviceId": "s1",
            "partnerId": PARTNER_STORE_ID,
            "name": "Wash & Iron",
            "price": 79,
            "qty": 2,
        },
    )
    assert add.status_code in (200, 201), add.text
    response = client.post(
        "/api/orders",
        headers=headers,
        json={
            "partnerId": PARTNER_STORE_ID,
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
    assert response.status_code in (200, 201), response.text
    return response.json()


def test_single_order_travels_end_to_end(client, actors):
    customer, partner, rider, admin = (
        actors["customer"],
        actors["partner"],
        actors["rider"],
        actors["admin"],
    )

    created = _place_order(client, customer)
    order_id = created["orderId"]
    assert created["order"]["status"] == "pending_partner_acceptance"

    # OTPs are generated per order, never the universal "1234".
    otp = created["order"]["otp"]
    assert otp["pickup"] and otp["delivery"] and otp["pickup"] != otp["delivery"]

    # --- Partner sees the SAME order id -----------------------------------
    listing = client.get("/api/partner/orders", headers=_auth(partner))
    assert listing.status_code == 200, listing.text
    ids = [item["id"] for item in listing.json()["items"]]
    assert order_id in ids

    accepted = client.post(f"/api/partner/orders/{order_id}/accept", headers=_auth(partner))
    assert accepted.status_code == 200, accepted.text
    assert accepted.json()["id"] == order_id
    assert accepted.json()["status"] == "accepted"

    # Customer immediately sees the partner acceptance on the same order.
    tracked = client.get(f"/api/orders/{order_id}", headers=_auth(customer))
    assert tracked.status_code == 200
    assert tracked.json()["status"] == "partner_accepted"

    # --- Admin assigns the rider on the same order ------------------------
    assigned = client.post(
        f"/api/admin/orders/{order_id}/assign-rider",
        headers=_auth(admin),
        json={"riderId": RIDER_PROFILE_ID},
    )
    assert assigned.status_code == 200, assigned.text
    assert assigned.json()["id"] == order_id
    assert assigned.json()["status"] == "rider_assigned"

    # --- Rider works the SAME order ---------------------------------------
    tasks = client.get("/api/rider/orders", headers=_auth(rider))
    assert tasks.status_code == 200, tasks.text
    assert order_id in [item["id"] for item in tasks.json()["items"]]

    assert (
        client.post(f"/api/rider/orders/{order_id}/accept", headers=_auth(rider)).json()["status"]
        == "accepted"
    )

    wrong_otp = client.post(
        f"/api/rider/orders/{order_id}/pickup", headers=_auth(rider), json={"otp": "0000"}
    )
    assert wrong_otp.status_code == 400

    picked = client.post(
        f"/api/rider/orders/{order_id}/pickup", headers=_auth(rider), json={"otp": otp["pickup"]}
    )
    assert picked.status_code == 200, picked.text
    assert picked.json()["status"] == "picked"

    assert (
        client.post(f"/api/rider/orders/{order_id}/drop-at-partner", headers=_auth(rider)).json()[
            "status"
        ]
        == "at-partner"
    )

    # --- Partner processes and completes ----------------------------------
    processing = client.post(
        f"/api/partner/orders/{order_id}/start-processing", headers=_auth(partner)
    )
    assert processing.status_code == 200, processing.text
    assert processing.json()["status"] == "processing"

    completed = client.post(f"/api/partner/orders/{order_id}/complete", headers=_auth(partner))
    assert completed.json()["status"] == "ready"

    # --- Rider delivers ----------------------------------------------------
    out = client.post(f"/api/rider/orders/{order_id}/start-delivery", headers=_auth(rider))
    assert out.json()["status"] == "ready-for-delivery"

    delivered = client.post(
        f"/api/rider/orders/{order_id}/deliver",
        headers=_auth(rider),
        json={"otp": otp["delivery"]},
    )
    assert delivered.status_code == 200, delivered.text
    assert delivered.json()["status"] == "delivered"

    # --- Everyone agrees, on the same canonical id -------------------------
    customer_view = client.get(f"/api/orders/{order_id}", headers=_auth(customer)).json()
    partner_view = client.get(
        f"/api/partner/orders/{order_id}", headers=_auth(partner)
    ).json()
    rider_view = client.get(f"/api/rider/orders/{order_id}", headers=_auth(rider)).json()
    admin_view = client.get(f"/api/admin/orders/{order_id}", headers=_auth(admin)).json()

    assert customer_view["id"] == partner_view["id"] == rider_view["id"] == admin_view["id"]
    assert customer_view["status"] == "delivered"
    assert partner_view["status"] == "delivered"
    assert rider_view["status"] == "delivered"
    assert admin_view["status"] == "delivered"
    assert customer_view["payment"]["paid"] is True

    # --- Audit trail --------------------------------------------------------
    events = [row["event"] for row in admin_view["auditTrail"]]
    assert events == [
        "ORDER_CREATED",
        "PARTNER_ACCEPTED",
        "RIDER_ASSIGNED",
        "RIDER_ACCEPTED",
        "PICKED_UP",
        "AT_PARTNER",
        "PROCESSING_STARTED",
        "PROCESSING_COMPLETED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
    ]
    assert {row["actorRole"] for row in admin_view["auditTrail"]} == {
        "customer",
        "partner",
        "admin",
        "rider",
    }


def test_illegal_transitions_and_authorization(client, actors):
    customer, partner, rider = actors["customer"], actors["partner"], actors["rider"]
    created = _place_order(client, customer)
    order_id = created["orderId"]

    # Rider cannot touch an order that is not assigned to them.
    blocked = client.post(f"/api/rider/orders/{order_id}/accept", headers=_auth(rider))
    assert blocked.status_code == 403

    # Unauthenticated calls are rejected — no demo fallback identity.
    assert client.get("/api/partner/orders").status_code == 401
    assert client.post(f"/api/rider/orders/{order_id}/pickup", json={"otp": "1234"}).status_code == 401

    # A partner account with no linked store gets 403, not someone else's orders.
    import anyio

    unlinked = anyio.run(_make_user, Role.partner, "Unlinked Partner")
    assert client.get("/api/partner/orders", headers=_auth(unlinked)).status_code == 403

    # Skipping a step is refused.
    assert (
        client.post(f"/api/partner/orders/{order_id}/complete", headers=_auth(partner)).status_code
        == 400
    )

    # Accepting twice is refused.
    assert (
        client.post(f"/api/partner/orders/{order_id}/accept", headers=_auth(partner)).status_code
        == 200
    )
    assert (
        client.post(f"/api/partner/orders/{order_id}/accept", headers=_auth(partner)).status_code
        == 400
    )
