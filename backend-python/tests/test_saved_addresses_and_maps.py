"""Automated test suite for Saved Addresses API and Maps reverse-geocode / autocomplete.

Verifies:
  1. GET /api/maps/reverse-geocode with lat/lng & latitude/longitude query params.
  2. GET /api/maps/autocomplete for real places search.
  3. POST /api/addresses, GET /api/addresses, PUT /api/addresses/{id},
     PUT /api/addresses/{id}/default, DELETE /api/addresses/{id}.
  4. Single default address enforcement per customer.
  5. Multi-customer ownership isolation (Customer A vs Customer B).
  6. Integration with GET /api/checkout.
"""

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.security import create_access_token
from app.db.client import database
from app.db.repositories import users
from app.main import app
from app.models.user import Role


@pytest.fixture
async def test_customers():
    """Creates two isolated test customers in MongoDB."""
    user_a = await users.upsert_from_firebase(
        firebase_uid="test_firebase_cust_a_maps_addr",
        role=Role.customer,
        phone="+919876543211",
        email=None,
        display_name="Customer A",
        photo_url=None,
    )
    token_a, _ = create_access_token(user_a.id, user_a.role.value)

    user_b = await users.upsert_from_firebase(
        firebase_uid="test_firebase_cust_b_maps_addr",
        role=Role.customer,
        phone="+919876543212",
        email=None,
        display_name="Customer B",
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
    await database.collection("customer_addresses").delete_many(
        {"userId": {"$in": [user_a.id, user_b.id]}}
    )
    await database.collection("users").delete_many(
        {"_id": {"$in": [user_a.id, user_b.id]}}
    )


@pytest.mark.asyncio
async def test_reverse_geocode_lat_lng():
    """Verify GET /api/maps/reverse-geocode with lat/lng returns 200 with address."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/maps/reverse-geocode?lat=12.9352&lng=77.6245")
        assert resp.status_code == 200
        data = resp.json()
        assert "formattedAddress" in data
        assert data["latitude"] == pytest.approx(12.9352, abs=0.01)
        assert data["longitude"] == pytest.approx(77.6245, abs=0.01)
        assert len(data["formattedAddress"]) > 0


@pytest.mark.asyncio
async def test_reverse_geocode_latitude_longitude():
    """Verify GET /api/maps/reverse-geocode with latitude/longitude query params returns 200."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/maps/reverse-geocode?latitude=12.9352&longitude=77.6245")
        assert resp.status_code == 200
        data = resp.json()
        assert "formattedAddress" in data
        assert data["latitude"] == pytest.approx(12.9352, abs=0.01)
        assert data["longitude"] == pytest.approx(77.6245, abs=0.01)


@pytest.mark.asyncio
async def test_autocomplete_search():
    """Verify GET /api/maps/autocomplete returns place suggestions."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/maps/autocomplete?q=Indiranagar")
        assert resp.status_code == 200
        suggestions = resp.json()
        assert isinstance(suggestions, list)
        assert len(suggestions) > 0
        assert "primaryText" in suggestions[0]


@pytest.mark.asyncio
async def test_address_book_crud_and_isolation(test_customers):
    """Verify full CRUD lifecycle, default management, and customer isolation."""
    token_a = test_customers["token_a"]
    user_a = test_customers["user_a"]
    token_b = test_customers["token_b"]
    user_b = test_customers["user_b"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Customer A creates Address 1 (Home)
        addr1_payload = {
            "type": "home",
            "label": "Home",
            "houseNumber": "Flat 402",
            "building": "Sunrise Apts",
            "street": "100ft Road",
            "area": "Indiranagar",
            "landmark": "Near Metro",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560038",
            "contactName": "Customer A",
            "phone": "+919876543211",
            "latitude": 12.9784,
            "longitude": 77.6408,
            "isDefault": True,
        }
        res1 = await client.post(
            "/api/addresses",
            json=addr1_payload,
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert res1.status_code == 201
        addr1 = res1.json()
        addr1_id = addr1["id"]
        assert addr1["isDefault"] is True
        assert addr1["latitude"] == pytest.approx(12.9784)

        # 2. Customer A creates Address 2 (Work)
        addr2_payload = {
            "type": "office",
            "label": "Office",
            "houseNumber": "Suite 800",
            "building": "Tech Park",
            "street": "Outer Ring Road",
            "area": "Bellandur",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560103",
            "contactName": "Customer A Work",
            "phone": "+919876543211",
            "latitude": 12.9304,
            "longitude": 77.6784,
            "isDefault": True,  # Making this default should clear Address 1 default
        }
        res2 = await client.post(
            "/api/addresses",
            json=addr2_payload,
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert res2.status_code == 201
        addr2 = res2.json()
        addr2_id = addr2["id"]
        assert addr2["isDefault"] is True

        # 3. List Customer A addresses — verify Address 2 is default, Address 1 is not
        list_res_a = await client.get(
            "/api/addresses", headers={"Authorization": f"Bearer {token_a}"}
        )
        assert list_res_a.status_code == 200
        addrs_a = list_res_a.json()
        assert len(addrs_a) == 2
        default_count_a = sum(1 for a in addrs_a if a["isDefault"])
        assert default_count_a == 1

        # 4. Customer B Isolation Test: Customer B lists addresses -> should be 0
        list_res_b = await client.get(
            "/api/addresses", headers={"Authorization": f"Bearer {token_b}"}
        )
        assert list_res_b.status_code == 200
        addrs_b = list_res_b.json()
        assert len(addrs_b) == 0

        # 5. Customer B cannot edit or delete Customer A's address
        edit_attempt = await client.put(
            f"/api/addresses/{addr1_id}",
            json={"houseNumber": "Hacked 999"},
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert edit_attempt.status_code == 404

        delete_attempt = await client.delete(
            f"/api/addresses/{addr1_id}",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert delete_attempt.status_code == 404

        # 6. Set Address 1 back as default
        set_def_res = await client.put(
            f"/api/addresses/{addr1_id}/default",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert set_def_res.status_code == 200
        assert set_def_res.json()["isDefault"] is True

        # Verify only Address 1 is default now
        list_after_def = await client.get(
            "/api/addresses", headers={"Authorization": f"Bearer {token_a}"}
        )
        addrs_after_def = list_after_def.json()
        for a in addrs_after_def:
            if a["id"] == addr1_id:
                assert a["isDefault"] is True
            elif a["id"] == addr2_id:
                assert a["isDefault"] is False

        # 7. Customer A edits Address 1
        update_res = await client.put(
            f"/api/addresses/{addr1_id}",
            json={
                "houseNumber": "Flat 402B",
                "area": "Indiranagar 2nd Stage",
                "city": "Bengaluru",
                "pincode": "560038",
                "phone": "+919876543211",
            },
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert update_res.status_code == 200
        assert update_res.json()["houseNumber"] == "Flat 402B"

        # 8. Customer A deletes Address 2
        del_res = await client.delete(
            f"/api/addresses/{addr2_id}",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert del_res.status_code == 200

        # Verify Customer A now has only 1 address
        list_final = await client.get(
            "/api/addresses", headers={"Authorization": f"Bearer {token_a}"}
        )
        assert len(list_final.json()) == 1


@pytest.mark.asyncio
async def test_checkout_addresses_integration(test_customers):
    """Verify GET /api/checkout loads saved addresses."""
    token_a = test_customers["token_a"]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create address
        await client.post(
            "/api/addresses",
            json={
                "type": "home",
                "label": "Home",
                "houseNumber": "12",
                "building": "Tower B",
                "street": "Main Road",
                "area": "Koramangala",
                "city": "Bengaluru",
                "state": "Karnataka",
                "pincode": "560034",
                "phone": "+919876543211",
                "latitude": 12.9352,
                "longitude": 77.6245,
                "isDefault": True,
            },
            headers={"Authorization": f"Bearer {token_a}"},
        )

        checkout_res = await client.get(
            "/api/checkout", headers={"Authorization": f"Bearer {token_a}"}
        )
        assert checkout_res.status_code == 200
        checkout_data = checkout_res.json()
        assert len(checkout_data["addresses"]) >= 1
        assert checkout_data["selectedAddressId"] != ""
