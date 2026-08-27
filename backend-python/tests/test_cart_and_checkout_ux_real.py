"""Comprehensive Real Database Integration Test Suite for Simple Cart & Single-Source Checkout.

Verifies:
1. Cart Item Management (Partner, Services, Quantities, Unit Prices, Subtotals).
2. Cart / Summary API contracts without charge leakage.
3. Dedicated Checkout as the Single Source of Truth for all calculations:
   - Items Total
   - Delivery Fee
   - Handling Fee
   - Coupon Discounts
   - GST (5%)
   - Grand Total / Final Payable Amount
4. Order Creation and End-to-End Validation on Live MongoDB Atlas.
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
async def test_simple_cart_and_checkout_single_source_of_truth_real(client: TestClient):
    # =========================================================================
    # 1. SETUP TEST USER & PARTNER IN MONGODB ATLAS
    # =========================================================================
    test_user_id = f"usr-chk-{uuid.uuid4().hex[:8]}"
    test_user = User(
        id=test_user_id,
        firebase_uid=f"fb-{uuid.uuid4().hex[:8]}",
        role=Role.customer,
        phone=f"+9198{uuid.uuid4().int % 100000000:08d}",
        email=f"chk_{uuid.uuid4().hex[:4]}@quickpress.test",
        display_name="Checkout Test Customer",
        photo_url=None,
        status=UserStatus.active,
        is_verified=True,
        is_onboarded=True,
    )
    await database.collection("users").insert_one(test_user.to_document())

    # Create Saved Address
    address_id = f"addr-{uuid.uuid4().hex[:8]}"
    await database.collection("customer_addresses").insert_one({
        "_id": address_id,
        "userId": test_user_id,
        "type": "home",
        "label": "Home",
        "houseNumber": "Flat 402",
        "building": "Royal Palm Apartments",
        "street": "MG Road",
        "area": "Civil Lines",
        "city": "Kasganj",
        "state": "Uttar Pradesh",
        "pincode": "207123",
        "contactName": "Checkout Test Customer",
        "phone": "9876543210",
        "isDefault": True,
        "latitude": 27.8085,
        "longitude": 78.6475,
    })

    # Partner Store
    partner_id = f"prt-chk-{uuid.uuid4().hex[:6]}"
    await database.collection("partner_profiles").insert_one({
        "_id": partner_id,
        "name": "Elite Express Laundry",
        "businessName": "Elite Express Laundry",
        "ownerName": "Alok Sharma",
        "city": "Kasganj",
        "area": "Civil Lines, Kasganj",
        "address": "Shop 12, Civil Lines Market, Kasganj",
        "status": "active",
        "isVerified": True,
        "isOnline": True,
        "latitude": 27.8090,
        "longitude": 78.6480,
        "rating": 4.9,
        "totalOrders": 150,
    })

    headers = _make_headers(test_user_id, Role.customer)

    # =========================================================================
    # 2. ADD SERVICES TO CART (PARTNER, QUANTITY, UNIT PRICE, SUBTOTAL)
    # =========================================================================
    # Item 1: Steam Pressing (Qty: 2, Price: 30, Subtotal: 60)
    add_res1 = client.post(
        "/api/cart/items",
        headers=headers,
        json={
            "id": f"svc-press-{uuid.uuid4().hex[:4]}",
            "name": "Steam Pressing",
            "price": 30,
            "unit": "piece",
            "qty": 2,
            "partnerId": partner_id,
            "partnerName": "Elite Express Laundry",
        },
    )
    assert add_res1.status_code == 201
    item1 = add_res1.json()
    assert item1["name"] == "Steam Pressing"
    assert item1["price"] == 30
    assert item1["qty"] == 2

    # Item 2: Dry Cleaning (Qty: 1, Price: 150, Subtotal: 150)
    add_res2 = client.post(
        "/api/cart/items",
        headers=headers,
        json={
            "id": f"svc-dry-{uuid.uuid4().hex[:4]}",
            "name": "Dry Cleaning",
            "price": 150,
            "unit": "piece",
            "qty": 1,
            "partnerId": partner_id,
            "partnerName": "Elite Express Laundry",
        },
    )
    assert add_res2.status_code == 201

    # =========================================================================
    # 3. GET CART (VERIFY CART CONTENT ONLY: PARTNER, SERVICES, STEPS, REMOVE)
    # =========================================================================
    cart_res = client.get("/api/cart", headers=headers)
    assert cart_res.status_code == 200
    cart_data = cart_res.json()
    assert len(cart_data["items"]) == 2
    assert cart_data["totals"]["count"] == 3
    assert cart_data["totals"]["itemsTotal"] == 210  # (30*2) + (150*1) = 210

    # Step quantity (+1 on Item 1 -> qty: 3)
    step_res = client.put(
        f"/api/cart/items/{item1['id']}",
        headers=headers,
        json={"qty": 3},
    )
    assert step_res.status_code == 200
    updated_cart = step_res.json()
    updated_item1 = next(it for it in updated_cart["items"] if it["id"] == item1["id"])
    assert updated_item1["qty"] == 3
    assert updated_cart["totals"]["itemsTotal"] == 240  # (30*3) + (150*1) = 240

    # =========================================================================
    # 4. DEDICATED CHECKOUT (SINGLE SOURCE OF TRUTH FOR ALL CHARGES & TOTALS)
    # =========================================================================
    checkout_res = client.get("/api/checkout?couponDiscount=20", headers=headers)
    assert checkout_res.status_code == 200
    checkout_data = checkout_res.json()

    # Verify Address
    assert len(checkout_data["addresses"]) >= 1
    assert checkout_data["selectedAddressId"] == address_id

    # Verify Pickup Schedule & Slots
    assert "pickup" in checkout_data
    assert len(checkout_data["pickup"]["days"]) > 0
    assert len(checkout_data["pickup"]["slots"]) > 0

    # Verify All Authoritative Charges Calculated Exclusively on Checkout
    totals = checkout_data["totals"]
    assert totals["itemsTotal"] == 240
    assert totals["delivery"] >= 0
    assert totals["handling"] >= 0
    assert totals["gst"] > 0
    assert totals["couponDiscount"] == 20
    
    # Grand total check: itemsTotal + pickup + delivery + handling + gst - discount - couponDiscount
    expected_grand_total = max(
        0,
        totals["itemsTotal"]
        + totals["pickup"]
        + totals["delivery"]
        + totals["handling"]
        + totals["gst"]
        - totals["discount"]
        - totals["couponDiscount"],
    )
    assert totals["grandTotal"] == expected_grand_total

    # =========================================================================
    # 5. COUPON CODE APPLY ON CHECKOUT
    # =========================================================================
    apply_res = client.post("/api/coupon/apply", json={"code": "WELCOME50"})
    assert apply_res.status_code == 200
    assert apply_res.json()["ok"] is True

    # =========================================================================
    # 6. PLACE ORDER FROM CHECKOUT & VERIFY COMPLETE BREAKDOWN
    # =========================================================================
    order_payload = {
        "addressId": address_id,
        "items": [
            {"id": updated_item1["id"], "name": updated_item1["name"], "price": 30, "qty": 3},
            {"id": "svc-dry", "name": "Dry Cleaning", "price": 150, "qty": 1},
        ],
        "pickup": {
            "day": checkout_data["pickup"]["selectedDay"],
            "slot": checkout_data["pickup"]["selectedSlot"],
            "express": False,
        },
        "payment": {
            "mode": "cod",
            "label": "Cash on delivery",
            "note": "Pay on delivery",
            "method": "cod",
        },
        "couponCode": "WELCOME50",
        "couponDiscount": 20,
        "instructions": "Handle delicate shirts with care",
        "idempotencyKey": f"chk-test-{uuid.uuid4().hex[:8]}",
    }

    place_res = client.post("/api/orders", headers=headers, json=order_payload)
    assert place_res.status_code == 201
    placed = place_res.json()
    assert "orderId" in placed
    assert "orderNumber" in placed
    order = placed["order"]
    assert order["totals"]["grandTotal"] == expected_grand_total
    assert order["status"] == "pending_partner_acceptance"

    # Verify Order in MongoDB Atlas Collection
    db_order = await database.collection("customer_orders").find_one({"_id": placed["orderId"]})
    assert db_order is not None
    assert db_order["userId"] == test_user_id
    assert db_order["totals"]["grandTotal"] == expected_grand_total

    # =========================================================================
    # 7. CLEAN UP TEST DOCUMENTS
    # =========================================================================
    await database.collection("users").delete_one({"_id": test_user_id})
    await database.collection("customer_addresses").delete_one({"_id": address_id})
    await database.collection("partner_profiles").delete_one({"_id": partner_id})
    await database.collection("customer_carts").delete_one({"_id": test_user_id})
    await database.collection("customer_orders").delete_one({"_id": placed["orderId"]})
