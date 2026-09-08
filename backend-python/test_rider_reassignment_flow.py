import asyncio
import os
import sys
import httpx

# Ensure backend root is on python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.db.client import database
from app.services import order_lifecycle as lifecycle
from app.services.smart_2ride_engine import smart_2ride_engine

async def main():
    print("=== Testing Rider Primary & Reassignment Flow ===")

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login with OTP as Rider 1
        res = await client.post(
            '/api/auth/phone/verify',
            json={'phone': '7060337258', 'code': '123456', 'role': 'rider'}
        )
        assert res.status_code == 200, f"Login failed: {res.text}"
        data = res.json()
        token1 = data['token']
        rider1_id = data['account']['id']
        print(f"✓ Rider 1 authenticated: {rider1_id} (+917060337258)")

        headers1 = {'Authorization': f'Bearer {token1}', 'Content-Type': 'application/json'}

        # 2. Create a fresh realistic order in customer_orders
        now = lifecycle.now_iso()
        test_order_id = f"test-reassign-ord-{int(asyncio.get_event_loop().time() * 1000)}"
        order_doc = {
            "_id": test_order_id,
            "code": "ORD-9821",
            "customerId": "cust-demo-1",
            "customerName": "Rohan Sharma",
            "customerPhone": "+919876543210",
            "partnerId": "store-kasganj-1",
            "partnerName": "Kasganj Express DryClean",
            "status": lifecycle.OUT_FOR_DELIVERY,
            "assignedRiderId": rider1_id,
            "riderId": rider1_id,
            "pickupLocation": {"lat": 27.8083, "lng": 78.6477, "address": "Market Road Kasganj"},
            "deliveryLocation": {"lat": 27.8180, "lng": 78.6550, "address": "Railway Colony Kasganj"},
            "total": 450.0,
            "createdAt": now,
            "updatedAt": now,
        }
        await database.collection("customer_orders").insert_one(order_doc)
        print(f"✓ Test order created in OUT_FOR_DELIVERY: {test_order_id}")

        # 3. Rider 1 calls unable-to-deliver
        res2 = await client.post(
            f'/api/rider/orders/{test_order_id}/unable-to-deliver',
            json={
                'reason': 'vehicle_breakdown',
                'remarks': 'Rear tire punctured near Gandhi Chowk',
                'location': {'lat': 27.8118, 'lng': 78.6490, 'address': 'Gandhi Chowk Kasganj'},
            },
            headers=headers1
        )
        print(f"✓ Unable to deliver response status: {res2.status_code}")
        assert res2.status_code == 200, f"Unable to deliver failed: {res2.text}"
        resp2 = res2.json()
        print(f"  Status: {resp2.get('status')}")
        print(f"  Handover OTP: {resp2.get('handoverOtp')}")
        print(f"  Pickup Leg Payout: ₹{resp2.get('pickupLegPayout')}")
        handover_otp = resp2.get('handoverOtp')
        assert handover_otp is not None, "Handover OTP must be present"

        # 4. Check handover-status endpoint as Rider 1
        res3 = await client.get(
            f'/api/rider/orders/{test_order_id}/handover-status',
            headers=headers1
        )
        assert res3.status_code == 200, f"Handover status check failed: {res3.text}"
        status_data = res3.json()
        print(f"✓ Handover status check: {status_data['status']}, OTP visible to Rider 1: {status_data.get('handoverOtp')}")

        # 5. Simulate Rider 2 verifying the handover OTP via the API endpoint
        # Create Rider 2 account/profile and log in to get Rider 2's token
        rider2_phone = "9123456780"
        rider2_id = "RDR-TRANSFER-2"
        await database.collection("rider_profiles").update_one(
            {"_id": rider2_id},
            {"$set": {"riderId": rider2_id, "fullName": "Captain Vikas", "phone": rider2_phone, "vehicleNumber": "UP-87-AB-4321", "isOnline": True, "status": "active"}},
            upsert=True
        )

        res_auth2 = await client.post(
            '/api/auth/phone/verify',
            json={'phone': rider2_phone, 'code': '123456', 'role': 'rider'}
        )
        token2 = res_auth2.json()['token']
        headers2 = {'Authorization': f'Bearer {token2}', 'Content-Type': 'application/json'}

        # Rider 2 calls verify-handover-otp
        res_verify = await client.post(
            f'/api/rider/orders/{test_order_id}/verify-handover-otp',
            json={'otp': handover_otp},
            headers=headers2
        )
        print(f"✓ Rider 2 verify OTP response: {res_verify.status_code}")
        assert res_verify.status_code == 200, f"Verify OTP failed: {res_verify.text}"
        verify_data = res_verify.json()
        print(f"  Message: {verify_data.get('message')}")
        print(f"  Delivery Leg Payout: ₹{verify_data.get('deliveryPayout')}")

        # 6. Verify order document in DB
        final_order = await lifecycle.find_order(test_order_id)
        print(f"✓ Final order status: {final_order.get('status')}")
        print(f"  Assigned Rider: {final_order.get('assignedRiderId')} ({final_order.get('riderName')})")
        print(f"  Handover completed: {final_order.get('reassignment', {}).get('handoverCompleted')}")

        # 7. Check Rider 1's wallet transaction was created
        credited_rider_id = final_order.get("reassignment", {}).get("originalRiderId") or rider1_id
        txns = await database.find_sorted(
            "rider_wallet_transactions",
            {"$or": [{"riderId": credited_rider_id}, {"rider_id": credited_rider_id}]},
            sort=[("date", -1)]
        )
        pickup_txns = [t for t in txns if t.get("kind") == "transfer_pickup"]
        print(f"✓ Rider 1 ({credited_rider_id}) received {len(pickup_txns)} pickup leg transaction(s). Latest: {pickup_txns[0].get('title')} (+₹{pickup_txns[0].get('amount')})")
        assert len(pickup_txns) > 0, "Rider 1 must have at least one pickup leg credit transaction"

        # Clean up test order
        await database.collection("customer_orders").delete_one({"_id": test_order_id})
        await database.collection("rides").delete_one({"_id": f"ride-transfer-{test_order_id}"})
        print("✓ Test cleaned up. ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(main())

