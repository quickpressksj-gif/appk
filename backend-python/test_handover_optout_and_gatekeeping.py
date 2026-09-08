import asyncio
import sys
import os

# Ensure backend-python is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "backend-python")))

async def main():
    print("=" * 70)
    print("RUNNING AUTOMATED TEST: GATEKEEPING, OPTOUT 25% PENALTY & 20% BONUS")
    print("=" * 70)

    from app.services import order_lifecycle as lifecycle
    from app.db.partner_repositories import partner_order_repository
    from app.services.smart_2ride_engine import smart_2ride_engine, RIDES_COLLECTION
    from app.db.client import database

    # -------------------------------------------------------------
    # TEST 1: PARTNER GATEKEEPING (Cannot start processing before at_partner)
    # -------------------------------------------------------------
    print("\n[TEST 1] Verifying Partner Processing Gatekeeping...")
    test_order_id = "test-ord-gatekeep-001"
    test_partner_id = "partner-store-kasganj-01"
    now = lifecycle.now_iso()

    order_doc = {
        "_id": test_order_id,
        "orderId": test_order_id,
        "code": "GK001",
        "partnerId": test_partner_id,
        "partner": {
            "partnerId": test_partner_id,
            "name": "QuickPress Partner Store Kasganj",
            "lat": 27.8118,
            "lng": 78.6477,
            "city": "Kasganj",
        },
        "customer": {"name": "Test Customer", "phone": "9876543210"},
        "address": {"city": "Kasganj", "latitude": 27.8160, "longitude": 78.6500, "line": "Main Bazaar"},
        "status": lifecycle.PICKED_UP,
        "createdAt": now,
        "updatedAt": now,
    }
    await database.collection("customer_orders").update_one(
        {"_id": test_order_id}, {"$set": order_doc}, upsert=True
    )

    # Partner attempts to start processing while status is PICKED_UP (en route to store)
    blocked = False
    try:
        await partner_order_repository.start_processing(test_partner_id, test_order_id)
    except Exception as e:
        blocked = True
        print(f"  ✓ CORRECTLY BLOCKED: {e}")

    assert blocked, "Partner start_processing MUST be blocked when status is PICKED_UP!"

    # Now Captain reaches store -> status becomes AT_PARTNER
    await database.collection("customer_orders").update_one(
        {"_id": test_order_id},
        {"$set": {"status": lifecycle.AT_PARTNER, "updatedAt": lifecycle.now_iso()}}
    )
    print("  -> Captain marked Arrival at Store (status: at_partner)")

    # Partner attempts start_processing again -> should succeed!
    updated_order = await partner_order_repository.start_processing(test_partner_id, test_order_id)
    assert updated_order["status"] in ("processing", "washing"), f"Expected processing status, got {updated_order['status']}"
    print(f"  ✓ SUCCESS: Partner started processing after store arrival! Status = {updated_order['status']}")

    # -------------------------------------------------------------
    # TEST 2: CAPTAIN OPT-OUT (25% Deduction Fee & +20% Bonus for Replacement Rider)
    # -------------------------------------------------------------
    print("\n[TEST 2] Verifying Captain Opt-Out: 25% penalty deduction & +20% bonus...")
    test_order_id_2 = "test-ord-optout-002"
    rider_1_id = "test-rider-optout-01"

    order_doc_2 = {
        "_id": test_order_id_2,
        "orderId": test_order_id_2,
        "code": "OPT002",
        "partnerId": test_partner_id,
        "partner": {
            "partnerId": test_partner_id,
            "name": "QuickPress Partner Store Kasganj",
            "lat": 27.8118,
            "lng": 78.6477,
            "city": "Kasganj",
        },
        "customer": {"name": "Test Customer 2", "phone": "9876543211"},
        "address": {"city": "Kasganj", "latitude": 27.8200, "longitude": 78.6550, "line": "City Road"},
        "status": lifecycle.AT_PARTNER,
        "assignedRiderId": rider_1_id,
        "createdAt": now,
        "updatedAt": now,
    }
    await database.collection("customer_orders").update_one(
        {"_id": test_order_id_2}, {"$set": order_doc_2}, upsert=True
    )

    # Pickup ride doc for Rider 1 with gross earning ₹40.0
    ride_1_doc = {
        "_id": f"ride-pk-{test_order_id_2}",
        "orderId": test_order_id_2,
        "rideType": "pickup",
        "riderId": rider_1_id,
        "estimatedEarning": 40.0,
        "fare": 40.0,
        "status": "COMPLETED",
    }
    await database.collection(RIDES_COLLECTION).update_one(
        {"_id": ride_1_doc["_id"]}, {"$set": ride_1_doc}, upsert=True
    )

    # Rider 1 calls request_delivery_reassignment (Unable to Deliver / Drop & Exit)
    reassign_res = await smart_2ride_engine.request_delivery_reassignment(
        order_id=test_order_id_2,
        rider_id=rider_1_id,
        reason="vehicle_breakdown",
        remarks="Unable to do delivery leg after store handover",
    )

    # Check 25% deduction
    gross_payout = reassign_res["pickupGrossPayout"]
    deduction = reassign_res["pickupOptOutDeduction"]
    net_payout = reassign_res["pickupLegPayout"]

    print(f"  Gross Pickup Pay: ₹{gross_payout:.2f}")
    print(f"  25% Opt-Out Deduction: ₹{deduction:.2f}")
    print(f"  Net Credited to Rider 1: ₹{net_payout:.2f}")

    assert abs(deduction - (gross_payout * 0.25)) < 0.05, f"Expected 25% deduction ({gross_payout * 0.25}), got {deduction}"
    assert abs(net_payout - (gross_payout * 0.75)) < 0.05, f"Expected 75% net payout ({gross_payout * 0.75}), got {net_payout}"
    print("  ✓ 25% PENALTY DEDUCTION CONFIRMED: Rider 1 received 75% net payout.")

    # Check +20% bonus for replacement delivery rider
    base_del = reassign_res.get("baseDeliveryPayout") or 25.0
    del_payout = reassign_res["deliveryLegPayout"]
    bonus_pct = reassign_res.get("extraBonusPercent")

    print(f"  New Rider Delivery Fare: ₹{del_payout:.2f} (+{bonus_pct}% bonus included)")
    assert bonus_pct == 20, f"Expected 20% bonus, got {bonus_pct}"
    assert del_payout > base_del, "Delivery payout must include the 20% extra bonus!"
    print("  ✓ 20% REASSIGNMENT BONUS CONFIRMED: Replacement rider gets +20% extra fare.")

    # Now verify create_ride_2_delivery acknowledges opt-out
    ride_2 = await smart_2ride_engine.create_ride_2_delivery(test_order_id_2)
    assert ride_2 is not None, "Ride 2 must be created"
    assert ride_2.get("isReassignedBonus") is True, "Ride 2 must have isReassignedBonus = True"
    assert ride_2.get("extraBonusPercent") == 20, "Ride 2 must have extraBonusPercent = 20"
    assert ride_2.get("preferredRiderId") is None, "Ride 2 must NOT be preferred to Rider 1 who opted out"
    print("  ✓ RIDE 2 CREATION CONFIRMED: Created with 20% bonus and unassigned from Rider 1.")

    # -------------------------------------------------------------
    # TEST 3: RETAIN FULL ORDER (Captain stays on trip)
    # -------------------------------------------------------------
    print("\n[TEST 3] Verifying Retain Full Order (No opt-out)...")
    test_order_id_3 = "test-ord-retain-003"
    rider_stay_id = "test-rider-stay-03"

    order_doc_3 = {
        "_id": test_order_id_3,
        "orderId": test_order_id_3,
        "code": "RET003",
        "partnerId": test_partner_id,
        "partner": {
            "partnerId": test_partner_id,
            "name": "QuickPress Partner Store Kasganj",
            "lat": 27.8118,
            "lng": 78.6477,
            "city": "Kasganj",
        },
        "customer": {"name": "Test Customer 3", "phone": "9876543212"},
        "address": {"city": "Kasganj", "latitude": 27.8200, "longitude": 78.6550, "line": "City Road"},
        "status": lifecycle.READY_FOR_DELIVERY,
        "assignedRiderId": rider_stay_id,
        "riderDeliveryOptOut": False,
        "createdAt": now,
        "updatedAt": now,
    }
    await database.collection("customer_orders").update_one(
        {"_id": test_order_id_3}, {"$set": order_doc_3}, upsert=True
    )

    ride_1_doc_3 = {
        "_id": f"ride-pk-{test_order_id_3}",
        "orderId": test_order_id_3,
        "rideType": "pickup",
        "riderId": rider_stay_id,
        "estimatedEarning": 38.0,
        "fare": 38.0,
        "status": "COMPLETED",
    }
    await database.collection(RIDES_COLLECTION).update_one(
        {"_id": ride_1_doc_3["_id"]}, {"$set": ride_1_doc_3}, upsert=True
    )

    ride_2_stay = await smart_2ride_engine.create_ride_2_delivery(test_order_id_3)
    assert ride_2_stay.get("preferredRiderId") == rider_stay_id, f"Ride 2 should be reserved for original Captain {rider_stay_id}, got {ride_2_stay.get('preferredRiderId')}"
    assert ride_2_stay.get("isReassignedBonus") is False, "Ride 2 should not have reassignment bonus when retained"
    print(f"  ✓ RETAIN FULL ORDER CONFIRMED: Ride 2 preferred directly to original Captain ({rider_stay_id})!")

    # Cleanup test documents
    for oid in (test_order_id, test_order_id_2, test_order_id_3):
        await database.collection("customer_orders").delete_one({"_id": oid})
        await database.collection("orders").delete_one({"_id": oid})
        await database.collection(RIDES_COLLECTION).delete_many({"orderId": oid})

    print("\n" + "=" * 70)
    print("ALL TESTS PASSED SUCCESSFULLY! 🚀")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(main())
