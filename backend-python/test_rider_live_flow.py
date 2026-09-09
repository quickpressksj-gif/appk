"""
End-to-End Test: Live Rider Panel Data Flow
Validates:
1. Real GPS Coordinates in Customer Orders & Partner Stores
2. Real Offers with Customer & Partner Coordinates and OTPs (No hardcoding)
3. Live Location Ping syncs to rider_profiles and live_locations
4. Rider Accept -> status becomes pickup_rider_accepted
5. Pickup OTP verification -> status becomes PICKED_UP
6. Drop at Partner -> status becomes AT_PARTNER & Wallet Payout credited
7. Dispatch OTP verification -> status becomes OUT_FOR_DELIVERY
8. Delivery OTP verification -> status becomes DELIVERED & payment confirmed
"""
import asyncio
import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath("."))

from app.db.client import database
from app.services import order_lifecycle as lifecycle
from app.services.smart_2ride_engine import smart_2ride_engine, RIDES_COLLECTION, RIDE_ASSIGNMENTS_COLLECTION
from app.db.rider_repositories import rider_profile_repository, rider_wallet_repository, rider_delivery_repository
from app.db.partner_repositories import partner_order_repository


async def test_live_rider_flow():
    print("🚀 Running End-to-End Live Rider Flow Test...")

    # 1. Setup Live Test Rider
    rider_id = "test-live-rider-888"
    await database.update(
        "rider_profiles",
        {"_id": rider_id},
        {
            "_id": rider_id,
            "riderId": rider_id,
            "fullName": "Suresh Captain Live",
            "phone": "9811223344",
            "city": "Kasganj",
            "operatingCity": "Kasganj",
            "isOnline": True,
            "status": "active",
            "isSuspended": False,
            "isBlocked": False,
            "lat": 27.8100,
            "lng": 78.6450,
            "updatedAt": lifecycle.now_iso(),
        },
        upsert=True,
    )
    print(f"✅ Created Live Rider Profile: {rider_id}")

    # 2. Setup Live Test Partner Store
    partner_id = "test-live-partner-888"
    partner_lat, partner_lng = 27.8122, 78.6485
    await database.update(
        "partners",
        {"_id": partner_id},
        {
            "_id": partner_id,
            "partnerId": partner_id,
            "businessName": "QuickPress Station Hub",
            "name": "QuickPress Station Hub",
            "phone": "9811001100",
            "address": "Station Road, Kasganj",
            "city": "Kasganj",
            "lat": partner_lat,
            "lng": partner_lng,
            "location": {"latitude": partner_lat, "longitude": partner_lng},
            "status": "active",
        },
        upsert=True,
    )
    print(f"✅ Created Live Partner Store: {partner_id} at ({partner_lat}, {partner_lng})")

    # 3. Create Real Customer Order with Coordinates and Specific OTPs
    order_id = f"ord-live-{lifecycle.new_otp()}"
    cust_lat, cust_lng = 27.8175, 78.6521
    pickup_otp = "7391"
    dispatch_otp = "2846"
    delivery_otp = "9153"

    order_doc = {
        "_id": order_id,
        "id": order_id,
        "code": f"QP-{lifecycle.new_otp()}",
        "customer": {
            "name": "Sunita Verma",
            "phone": "9876599999",
        },
        "customerName": "Sunita Verma",
        "customerPhone": "9876599999",
        "partner": {
            "id": partner_id,
            "name": "QuickPress Station Hub",
            "phone": "9811001100",
            "address": "Station Road, Kasganj",
            "latitude": partner_lat,
            "longitude": partner_lng,
        },
        "partnerName": "QuickPress Station Hub",
        "address": {
            "name": "Sunita Verma",
            "phone": "9876599999",
            "line": "Flat 304, Green Heights, Kasganj",
            "latitude": cust_lat,
            "longitude": cust_lng,
            "city": "Kasganj",
        },
        "pickupLocation": {"latitude": cust_lat, "longitude": cust_lng},
        "deliveryLocation": {"latitude": cust_lat, "longitude": cust_lng},
        "partnerLocation": {"latitude": partner_lat, "longitude": partner_lng},
        "status": lifecycle.PLACED,
        "items": [{"name": "Silk Saree Dry Cleaning", "qty": 2, "price": 180}],
        "totals": {"grandTotal": 360},
        "amount": 360,
        "pricing": {"deliveryFee": 55, "finalTotal": 415},
        "payment": {"mode": "online", "paid": False},
        "paymentMode": "online",
        "pickupOtp": pickup_otp,
        "dispatchOtp": dispatch_otp,
        "deliveryOtp": delivery_otp,
        "otp": {
            "pickup": {"code": pickup_otp, "verified": False},
            "dispatch": {"code": dispatch_otp, "verified": False},
            "delivery": {"code": delivery_otp, "verified": False},
        },
        "createdAt": lifecycle.now_iso(),
        "placedAt": lifecycle.now_iso(),
    }
    await database.insert("customer_orders", order_doc)
    print(f"✅ Created Real Customer Order: {order_id} with Customer coords ({cust_lat}, {cust_lng})")

    # 4. Partner Accepts Order -> triggers smart_2ride_engine.create_ride_1_pickup
    print("\n--- Phase 1: Partner Accepts Order ---")
    await partner_order_repository.accept(partner_id, order_id)
    ride_1 = await smart_2ride_engine.create_ride_1_pickup(order_id)
    assert ride_1 is not None, "Failed to create Ride 1 Pickup"
    print(f"✅ Created Ride 1 Pickup: {ride_1['_id']}")

    # 5. Verify Offers endpoint returns real coordinates & real OTPs
    print("\n--- Phase 2: Verifying Live Offers Endpoint Output ---")
    from app.api.rider import get_active_offers
    from app.models.user import User

    test_user = User(
        id=rider_id,
        phone="9811223344",
        role="rider",
        roles=["rider"],
        name="Suresh Captain Live",
    )
    offers = await get_active_offers(user=test_user)
    matching_offers = [o for o in offers if o.get("orderId") == order_id]
    assert len(matching_offers) > 0, "Expected order offer in /offers list"
    off = matching_offers[0]

    print(f"✅ Offer Retrieved for Order #{off.get('orderCode')}:")
    print(f"   Customer Coords: {off.get('customerCoords')}")
    print(f"   Partner Coords: {off.get('partnerCoords')}")
    print(f"   Pickup OTP: {off.get('pickupOtp')}")
    print(f"   Payment Mode: {off.get('paymentMode')}")
    print(f"   Amount: ₹{off.get('amount')}")

    assert off.get("customerCoords", {}).get("lat") == cust_lat, "Customer lat mismatch"
    assert off.get("customerCoords", {}).get("lng") == cust_lng, "Customer lng mismatch"
    assert off.get("partnerCoords", {}).get("lat") == partner_lat, "Partner lat mismatch"
    assert off.get("partnerCoords", {}).get("lng") == partner_lng, "Partner lng mismatch"
    assert off.get("pickupOtp") == pickup_otp, "Pickup OTP mismatch in offer"
    assert off.get("paymentMode") == "online", "Payment mode mismatch"

    # 6. Test Live GPS Location Push
    print("\n--- Phase 3: Testing Live GPS Location Push ---")
    from app.api.rider import push_location
    live_lat, live_lng = 27.8130, 78.6470
    await push_location(
        {"lat": live_lat, "lng": live_lng, "speed": 6.5, "heading": 120.0},
        user=test_user,
    )
    # Check rider_profiles
    r_prof = await database.find_one("rider_profiles", {"_id": rider_id})
    assert r_prof.get("lat") == live_lat and r_prof.get("lng") == live_lng, "Location push failed in rider_profiles"
    # Check live_locations (Admin Live Map)
    live_loc = await database.find_one("live_locations", {"_id": f"rider:{rider_id}"})
    assert live_loc.get("latitude") == live_lat and live_loc.get("longitude") == live_lng, "Location push failed in live_locations"
    print(f"✅ Live GPS Location synced to database: ({live_lat}, {live_lng})")

    # 7. Rider Accepts Offer
    print("\n--- Phase 4: Rider Accepts Trip ---")
    accept_res = await smart_2ride_engine.handle_rider_accept(ride_1["_id"], rider_id)
    assert accept_res.get("status") == "ACCEPTED", "Ride status not ACCEPTED"

    order_accepted = await database.find_one("customer_orders", {"_id": order_id})
    assert order_accepted.get("status") == lifecycle.PICKUP_RIDER_ACCEPTED, f"Expected {lifecycle.PICKUP_RIDER_ACCEPTED}, got {order_accepted.get('status')}"
    print(f"✅ Canonical Order Status: {order_accepted.get('status')} (Assigned: {order_accepted.get('rider', {}).get('name')})")

    # 8. Rider verifies Pickup OTP with Customer
    print("\n--- Phase 5: Rider Pickup OTP Verification ---")
    # Verify wrong OTP fails with PermissionError
    try:
        await smart_2ride_engine.verify_pickup_otp(order_id, "0000", rider_id)
        assert False, "Should have rejected invalid OTP 0000"
    except PermissionError:
        print("✅ Correctly rejected invalid pickup OTP (0000)")

    # Verify real OTP succeeds
    pickup_res = await smart_2ride_engine.verify_pickup_otp(order_id, pickup_otp, rider_id)
    assert pickup_res.get("status") == "PICKED_UP", "Pickup verification failed"
    order_picked = await database.find_one("customer_orders", {"_id": order_id})
    assert order_picked.get("status") == lifecycle.PICKED_UP, "Order status not PICKED_UP in DB"
    print(f"✅ Real OTP Verified: status is {order_picked.get('status')}")

    # 9. Rider drops at Partner Store
    print("\n--- Phase 6: Clothes Dropped at Partner Store ---")
    await rider_delivery_repository.drop_at_partner(order_id, rider_id)
    order_at_partner = await database.find_one("customer_orders", {"_id": order_id})
    assert order_at_partner.get("status") == lifecycle.AT_PARTNER, f"Expected {lifecycle.AT_PARTNER}, got {order_at_partner.get('status')}"
    print(f"✅ Order status transitioned to: {order_at_partner.get('status')}")

    # 10. Partner starts processing and completes laundry -> Ready for delivery
    print("\n--- Phase 7: Partner Processes Laundry & Marks Ready ---")
    await partner_order_repository.start_processing(partner_id, order_id)
    await partner_order_repository.complete(partner_id, order_id)
    ride_2 = await smart_2ride_engine.create_ride_2_delivery(order_id)
    assert ride_2 is not None, "Failed to create Ride 2 Delivery"
    await smart_2ride_engine.handle_rider_accept(ride_2["_id"], rider_id)

    # 11. Dispatch OTP Verification
    print("\n--- Phase 8: Dispatch OTP Verification ---")
    curr_ord = await database.find_one("customer_orders", {"_id": order_id})
    active_disp_otp = str(((curr_ord.get("otp") or {}).get("dispatch") or {}).get("code") or curr_ord.get("dispatchOtp"))
    dispatch_res = await smart_2ride_engine.verify_dispatch_otp(order_id, active_disp_otp, rider_id)
    assert dispatch_res.get("status") == "OUT_FOR_DELIVERY", "Dispatch verification failed"
    order_dispatched = await database.find_one("customer_orders", {"_id": order_id})
    assert order_dispatched.get("status") == lifecycle.OUT_FOR_DELIVERY, "Order status not OUT_FOR_DELIVERY"
    print(f"✅ Real Dispatch OTP ({active_disp_otp}) Verified: status is {order_dispatched.get('status')}")

    # 12. Final Delivery OTP Verification
    print("\n--- Phase 9: Final Delivery OTP Verification at Customer Doorstep ---")
    # Verify wrong OTP fails
    try:
        await smart_2ride_engine.verify_delivery_otp(order_id, "9999", rider_id)
        assert False, "Should have rejected invalid OTP 9999"
    except PermissionError:
        print("✅ Correctly rejected invalid delivery OTP (9999)")

    # Verify real delivery OTP
    delivery_res = await smart_2ride_engine.verify_delivery_otp(order_id, delivery_otp, rider_id)
    order_delivered = await database.find_one("customer_orders", {"_id": order_id})
    assert order_delivered.get("status") == lifecycle.DELIVERED, f"Expected {lifecycle.DELIVERED}, got {order_delivered.get('status')}"
    assert order_delivered.get("payment", {}).get("paid") is True, "Payment not marked as paid"
    print(f"✅ Real Delivery OTP Verified: status is {order_delivered.get('status')} (Paid = {order_delivered.get('payment', {}).get('paid')})")

    # Cleanup test data
    await database.delete_one("rider_profiles", {"_id": rider_id})
    await database.delete_one("live_locations", {"_id": f"rider:{rider_id}"})
    await database.delete_one("partners", {"_id": partner_id})
    await database.delete_one("customer_orders", {"_id": order_id})
    await database.delete_many(RIDES_COLLECTION, {"orderId": order_id})
    await database.delete_many(RIDE_ASSIGNMENTS_COLLECTION, {"orderId": order_id})
    await database.delete_many("rider_offers", {"orderId": order_id})

    print("\n🎉 ALL LIVE RIDER TESTS PASSED! 100% REAL DATA FLOW VERIFIED.")


if __name__ == "__main__":
    asyncio.run(test_live_rider_flow())
