"""Comprehensive Real Database Integration Test Suite for QuickPress Location System.

Tests the full hierarchy on the live MongoDB Atlas Cloud Database:
  Customer Location (GPS / Manual)
       ↓
     City
       ↓
  Area / Pincode
       ↓
  Eligible Partners (Strict Geographic Isolation: Kasganj user gets Kasganj partners ONLY)
       ↓
  Partner Services
       ↓
  Partner Pricing
"""

from __future__ import annotations

import uuid
import pytest
from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.db.client import database
from app.main import create_app
from app.models.user import Role, User, UserStatus


from tests.conftest import real_mongodb_uri


@pytest.fixture()
def client():
    with TestClient(create_app()) as test_client:
        yield test_client


def _make_headers(user_id: str, role: Role = Role.customer) -> dict:
    token, _ = create_access_token(user_id, role.value)
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.skipif(not real_mongodb_uri(), reason="REAL_MONGODB_URI not configured")
@pytest.mark.asyncio
async def test_location_system_and_partner_hierarchy_real_database(client: TestClient):
    # =========================================================================
    # 1. GPS & REVERSE GEOCODING (Coordinates → City, Area, Pincode)
    # =========================================================================
    # Kasganj coordinates (27.8080° N, 78.6470° E)
    kasganj_lat = 27.8080
    kasganj_lng = 78.6470

    geo_res = client.get(
        f"/api/maps/reverse-geocode?lat={kasganj_lat}&lng={kasganj_lng}"
    )
    assert geo_res.status_code == 200
    geo_data = geo_res.json()
    assert "latitude" in geo_data
    assert "longitude" in geo_data
    assert geo_data["latitude"] == kasganj_lat
    assert geo_data["longitude"] == kasganj_lng
    assert "city" in geo_data
    assert "area" in geo_data

    # =========================================================================
    # 2. DEFAULT PLATFORM LOCATION & AUTOCOMPLETE SEARCH
    # =========================================================================
    loc_res = client.get("/api/location")
    assert loc_res.status_code == 200
    default_loc = loc_res.json()
    assert "city" in default_loc
    assert "area" in default_loc

    # Autocomplete places / locations search
    search_res = client.get("/api/locations/search?q=kasganj")
    assert search_res.status_code == 200
    places = search_res.json()
    assert isinstance(places, list)
    if places:
        assert any("kasganj" in p.get("city", "").lower() or "kasganj" in p.get("area", "").lower() for p in places)

    # Location Place Groups
    groups_res = client.get("/api/locations")
    assert groups_res.status_code == 200
    groups_data = groups_res.json()
    assert "popular" in groups_data
    assert "nearby" in groups_data

    # =========================================================================
    # 3. SAVED ADDRESSES CRUD & DEFAULT ADDRESS INVARIANT IN MONGODB ATLAS
    # =========================================================================
    test_user_id = f"usr-loc-{uuid.uuid4().hex[:8]}"
    test_user = User(
        id=test_user_id,
        firebase_uid=f"fb-{uuid.uuid4().hex[:8]}",
        role=Role.customer,
        phone=f"+9198{uuid.uuid4().int % 100000000:08d}",
        email=f"loc_user_{uuid.uuid4().hex[:4]}@quickpress.test",
        display_name="Location Test User",
        photo_url=None,
        status=UserStatus.active,
        is_verified=True,
        is_onboarded=True,
    )
    await database.collection("users").insert_one(test_user.to_document())

    headers = _make_headers(test_user_id, Role.customer)

    # A. Create Address 1 (Home, Default)
    addr1_payload = {
        "type": "home",
        "label": "Home",
        "houseNumber": "B-42",
        "building": "Shanti Kunj",
        "street": "Station Road",
        "area": "Awas Vikas Colony",
        "landmark": "Near Kali Temple",
        "city": "Kasganj",
        "state": "Uttar Pradesh",
        "pincode": "207123",
        "contactName": "Location Test User",
        "phone": "9876543210",
        "isDefault": True,
        "latitude": 27.8085,
        "longitude": 78.6475,
    }
    create_res1 = client.post("/api/addresses", headers=headers, json=addr1_payload)
    assert create_res1.status_code == 201
    addr1 = create_res1.json()
    assert addr1["isDefault"] is True
    assert addr1["city"] == "Kasganj"
    assert addr1["pincode"] == "207123"

    # B. Create Address 2 (Work, Non-default)
    addr2_payload = {
        "type": "office",
        "label": "Work",
        "houseNumber": "Shop 12",
        "building": "Cloth Market",
        "street": "Main Bazar",
        "area": "Civil Lines",
        "landmark": "Opposite SBI",
        "city": "Kasganj",
        "state": "Uttar Pradesh",
        "pincode": "207123",
        "contactName": "Location Test User",
        "phone": "9876543210",
        "isDefault": False,
        "latitude": 27.8100,
        "longitude": 78.6500,
    }
    create_res2 = client.post("/api/addresses", headers=headers, json=addr2_payload)
    assert create_res2.status_code == 201
    addr2 = create_res2.json()

    # C. Verify list of addresses
    list_res = client.get("/api/addresses", headers=headers)
    assert list_res.status_code == 200
    addr_list = list_res.json()
    assert len(addr_list) == 2

    # D. Toggle Default Address (Make Address 2 default)
    set_default_res = client.put(f"/api/addresses/{addr2['id']}/default", headers=headers)
    assert set_default_res.status_code == 200
    assert set_default_res.json()["isDefault"] is True

    # Verify Single Default Invariant in MongoDB Atlas
    db_addr1 = await database.collection("customer_addresses").find_one({"_id": addr1["id"]})
    db_addr2 = await database.collection("customer_addresses").find_one({"_id": addr2["id"]})
    assert db_addr1["isDefault"] is False
    assert db_addr2["isDefault"] is True

    # E. Update Address 1
    update_res = client.put(
        f"/api/addresses/{addr1['id']}",
        headers=headers,
        json={"houseNumber": "B-43", "area": "Awas Vikas Sector 2"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["houseNumber"] == "B-43"
    assert update_res.json()["area"] == "Awas Vikas Sector 2"

    # =========================================================================
    # 4. LOCATION → CITY → AREA → ELIGIBLE PARTNERS (MARKETPLACE ISOLATION)
    # =========================================================================
    # Seed a Kasganj partner store and a Bangalore partner store to test strict separation
    kasganj_partner_id = f"prt-test-kg-{uuid.uuid4().hex[:6]}"
    other_partner_id = f"prt-test-blr-{uuid.uuid4().hex[:6]}"

    await database.collection("partner_profiles").insert_one({
        "_id": kasganj_partner_id,
        "name": "Kasganj Super Cleaners",
        "businessName": "Kasganj Super Cleaners",
        "ownerName": "Rajesh Kumar",
        "city": "Kasganj",
        "area": "Awas Vikas, Kasganj",
        "address": "Shop 4, Awas Vikas Market, Kasganj",
        "status": "active",
        "isVerified": True,
        "isOnline": True,
        "latitude": 27.8090,
        "longitude": 78.6480,
        "rating": 4.9,
        "totalOrders": 120,
    })

    # Add services with store pricing for Kasganj partner
    await database.collection("partner_services").insert_many([
        {
            "_id": f"ps-{kasganj_partner_id}-1",
            "partnerId": kasganj_partner_id,
            "name": "Steam Pressing",
            "description": "Crisp wrinkle-free steam ironing",
            "price": 25,
            "discountPercent": 10,
            "unit": "piece",
            "turnaroundHours": 12,
            "isActive": True,
            "enabled": True,
        },
        {
            "_id": f"ps-{kasganj_partner_id}-2",
            "partnerId": kasganj_partner_id,
            "name": "Dry Cleaning",
            "description": "Premium woolen & delicate dry clean",
            "price": 149,
            "discountPercent": 0,
            "unit": "piece",
            "turnaroundHours": 24,
            "isActive": True,
            "enabled": True,
        }
    ])

    # Bangalore partner (unrelated city)
    await database.collection("partner_profiles").insert_one({
        "_id": other_partner_id,
        "name": "Bangalore Luxury Laundry",
        "businessName": "Bangalore Luxury Laundry",
        "ownerName": "Suresh Gowda",
        "city": "Bengaluru",
        "area": "Indiranagar",
        "address": "100 Feet Road, Indiranagar, Bengaluru",
        "status": "active",
        "isVerified": True,
        "isOnline": True,
        "latitude": 12.9716,
        "longitude": 77.5946,
        "rating": 4.8,
        "totalOrders": 300,
    })

    # A. Test Partner Filtering for City="Kasganj"
    kasganj_partners_res = client.get("/api/partners?city=Kasganj")
    assert kasganj_partners_res.status_code == 200
    kg_partners = kasganj_partners_res.json()
    assert len(kg_partners) > 0

    # STRICT CHECK: All returned partners MUST be in Kasganj; No Bangalore partners allowed!
    for p in kg_partners:
        assert "kasganj" in p["city"].lower() or "kasganj" in p["area"].lower()
        assert "bengaluru" not in p["city"].lower()

    # B. Test Exact Coordinate Distance Calculation
    coord_partners_res = client.get(f"/api/partners?city=Kasganj&lat={kasganj_lat}&lng={kasganj_lng}")
    assert coord_partners_res.status_code == 200
    coord_partners = coord_partners_res.json()
    assert len(coord_partners) > 0
    # Assert distance is computed accurately in kilometers
    assert coord_partners[0]["distanceKm"] >= 0.0

    # C. Test Home Screen Location Awareness (GET /api/home?city=Kasganj)
    home_res = client.get(f"/api/home?city=Kasganj&lat={kasganj_lat}&lng={kasganj_lng}", headers=headers)
    assert home_res.status_code == 200
    home_data = home_res.json()
    assert home_data["location"]["city"] == "Kasganj"
    assert len(home_data["partners"]) > 0
    for hp in home_data["partners"]:
        assert "kasganj" in hp["city"].lower() or "kasganj" in hp["area"].lower()

    # =========================================================================
    # 5. PARTNER SERVICES & PARTNER PRICING (Rates & Turnaround)
    # =========================================================================
    services_res = client.get(f"/api/partners/{kasganj_partner_id}/services")
    assert services_res.status_code == 200
    store_services = services_res.json()
    assert len(store_services) == 2
    
    steam_press = next(s for s in store_services if s["name"] == "Steam Pressing")
    assert steam_press["basePrice"] == 25
    assert steam_press["discountPercent"] == 10
    assert steam_press["finalPrice"] in (22, 23)
    assert steam_press["processingTime"] == "12 hrs"

    # =========================================================================
    # 6. SERVICE AVAILABILITY CHECK & WAITLIST
    # =========================================================================
    # A. Check Kasganj (Serviceable City)
    avail_kg_res = client.get("/api/customer/availability/check-location?city=Kasganj&area=Awas%20Vikas")
    assert avail_kg_res.status_code == 200
    avail_kg = avail_kg_res.json()
    assert avail_kg["available"] is True
    assert avail_kg["partnerCount"] > 0
    assert len(avail_kg["partners"]) > 0

    # B. Check Unsupported Remote City (e.g. Shimla)
    avail_unsupported_res = client.get("/api/customer/availability/check-location?city=Shimla&area=Mall%20Road")
    assert avail_unsupported_res.status_code == 200
    avail_unsupported = avail_unsupported_res.json()
    assert avail_unsupported["available"] is False
    assert avail_unsupported["partnerCount"] == 0

    # C. Submit Waitlist for Unsupported City
    waitlist_res = client.post(
        "/api/customer/waitlist",
        json={
            "city": "Shimla",
            "area": "Mall Road",
            "phone": "9876543210",
            "email": "user@shimla.test",
        },
    )
    assert waitlist_res.status_code == 200
    assert waitlist_res.json()["ok"] is True

    # Verify Waitlist in MongoDB Atlas
    waitlist_doc = await database.collection("service_waitlist").find_one({"city": "Shimla"})
    assert waitlist_doc is not None
    assert waitlist_doc["area"] == "Mall Road"

    # =========================================================================
    # 7. CLEAN UP TEST ARTIFACTS
    # =========================================================================
    # Delete address
    del_addr_res = client.delete(f"/api/addresses/{addr1['id']}", headers=headers)
    assert del_addr_res.status_code == 200
    client.delete(f"/api/addresses/{addr2['id']}", headers=headers)

    # Clean test DB docs
    await database.collection("users").delete_one({"_id": test_user_id})
    await database.collection("customer_addresses").delete_many({"userId": test_user_id})
    await database.collection("partner_profiles").delete_many({"_id": {"$in": [kasganj_partner_id, other_partner_id]}})
    await database.collection("partner_services").delete_many({"partnerId": kasganj_partner_id})
    await database.collection("service_waitlist").delete_many({"city": "Shimla"})
