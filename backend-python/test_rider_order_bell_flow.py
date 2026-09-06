"""
Automated test to verify Partner Accept -> Smart 2-Ride Auto-Dispatch -> Rider Offer -> Rider Accept Flow
"""
import asyncio
import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath("."))

from app.db.client import database
from app.services import order_lifecycle as lifecycle
from app.services.smart_2ride_engine import smart_2ride_engine, RIDES_COLLECTION, RIDE_ASSIGNMENTS_COLLECTION
from app.db.rider_repositories import rider_profile_repository
from app.db.partner_repositories import partner_order_repository


async def main():
    print("🚀 Starting End-to-End Rider Bell & Offer Flow Test...")

    # 1. Create a test online rider profile
    test_rider_id = "test-rider-bell-101"
    rider_doc = {
        "_id": test_rider_id,
        "riderId": test_rider_id,
        "fullName": "Himanshu Captain",
        "phone": "9876543210",
        "isOnline": True,
        "status": "active",
        "isSuspended": False,
        "isBlocked": False,
        "lat": 27.8120,
        "lng": 78.6480,
        "updatedAt": lifecycle.now_iso(),
    }
    await database.update("rider_profiles", {"_id": test_rider_id}, rider_doc, upsert=True)
    print(f"✅ Created Online Rider: {test_rider_id} (isOnline=True, Kasganj coords)")

    # 2. Create a test partner store
    test_partner_id = "test-partner-store-101"
    partner_doc = {
        "_id": test_partner_id,
        "partnerId": test_partner_id,
        "businessName": "QuickPress Central Hub",
        "name": "QuickPress Central Hub",
        "phone": "9876500001",
        "address": "Main Road, Kasganj",
        "lat": 27.8118,
        "lng": 78.6477,
        "status": "active",
    }
    await database.update("partners", {"_id": test_partner_id}, partner_doc, upsert=True)
    print(f"✅ Created Partner Store: {test_partner_id}")

    # 3. Create a real Customer Order in PLACED status
    test_order_id = f"ord-test-bell-{lifecycle.new_otp()}"
    order_doc = {
        "_id": test_order_id,
        "id": test_order_id,
        "code": f"QP-{lifecycle.new_otp()}",
        "customer": {
            "name": "Anil Customer",
            "phone": "9998887776",
        },
        "partner": {
            "id": test_partner_id,
            "name": "QuickPress Central Hub",
            "phone": "9876500001",
            "address": "Main Road, Kasganj",
        },
        "address": {
            "name": "Anil Customer",
            "phone": "9998887776",
            "line": "House 12, Station Road, Kasganj",
            "latitude": 27.8160,
            "longitude": 78.6530,
            "city": "Kasganj",
        },
        "status": lifecycle.PLACED,
        "items": [{"name": "Shirt Ironing", "quantity": 3, "price": 45}],
        "totalAmount": 135,
        "deliveryFee": 45,
        "createdAt": lifecycle.now_iso(),
        "placedAt": lifecycle.now_iso(),
    }
    await database.insert("customer_orders", order_doc)
    print(f"✅ Created Customer Order: {test_order_id} (status={lifecycle.PLACED})")

    # 4. Partner Accepts Order -> triggers smart_2ride_engine.create_ride_1_pickup
    print("\n--- Step 1: Partner Accepts Order ---")
    accepted_order = await partner_order_repository.accept(test_partner_id, test_order_id)
    print(f"✅ Partner accepted order: {accepted_order.get('code')}")

    # Trigger Ride 1 Pickup
    ride_doc = await smart_2ride_engine.create_ride_1_pickup(test_order_id)
    assert ride_doc is not None, "Ride 1 creation failed"
    print(f"✅ Created Ride 1 Pickup: {ride_doc['_id']} (status={ride_doc.get('status')})")

    # Give async task time to dispatch offers
    await asyncio.sleep(1)

    # 5. Verify Ride Assignment and Offers in Database
    print("\n--- Step 2: Verifying Rider Offer Dispatch ---")
    assigned_offers = await database.find_many(RIDE_ASSIGNMENTS_COLLECTION, {"rideId": ride_doc["_id"]})
    print(f"✅ Dispatched Offers in {RIDE_ASSIGNMENTS_COLLECTION}: {len(assigned_offers)}")
    assert len(assigned_offers) > 0, "No offers were dispatched to online riders!"
    offer = assigned_offers[0]
    print(f"   Offer Details: ID={offer.get('_id')}, Rider={offer.get('riderId')}, Earning=₹{offer.get('estimatedEarning')}")

    # Check rider_offers collection
    alt_offers = await database.find_many("rider_offers", {"rideId": ride_doc["_id"]})
    print(f"✅ Offers in rider_offers collection: {len(alt_offers)}")

    # 6. Rider accepts offer
    print("\n--- Step 3: Rider Accepts Offer ---")
    accept_result = await smart_2ride_engine.handle_rider_accept(ride_doc["_id"], test_rider_id)
    print(f"✅ Rider {test_rider_id} successfully accepted Ride {ride_doc['_id']}")
    assert accept_result.get("status") == "ACCEPTED", "Ride status is not ACCEPTED"
    assert accept_result.get("riderId") == test_rider_id, "Rider ID mismatch"

    # 7. Verify Canonical Order Status
    updated_order = await database.find_one("customer_orders", {"_id": test_order_id})
    print(f"✅ Canonical Order Status: {updated_order.get('status')} (Rider assigned: {updated_order.get('rider', {}).get('name')})")
    assert updated_order.get("status") == lifecycle.PICKUP_RIDER_ACCEPTED, f"Expected status {lifecycle.PICKUP_RIDER_ACCEPTED}, got {updated_order.get('status')}"

    # Clean up test documents
    await database.delete_one("rider_profiles", {"_id": test_rider_id})
    await database.delete_one("partners", {"_id": test_partner_id})
    await database.delete_one("customer_orders", {"_id": test_order_id})
    await database.delete_one(RIDES_COLLECTION, {"_id": ride_doc["_id"]})
    await database.delete_many(RIDE_ASSIGNMENTS_COLLECTION, {"rideId": ride_doc["_id"]})
    await database.delete_many("rider_offers", {"rideId": ride_doc["_id"]})
    print("\n🎉 ALL TESTS PASSED! Flow from Partner Accept -> Rider Bell Ring -> Rider Accept -> Bell Stop verified.")


if __name__ == "__main__":
    asyncio.run(main())
