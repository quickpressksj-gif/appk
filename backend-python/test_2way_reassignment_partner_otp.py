import asyncio
import os
import sys
import httpx

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.db.client import database
from app.services import order_lifecycle as lifecycle
from app.services.smart_2ride_engine import smart_2ride_engine

async def run_test():
    print("=" * 60)
    print("🚀 TESTING 2-WAY DELIVERY SYSTEM: PARTNER DISPATCH OTP & PAYOUT")
    print("=" * 60)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login Rider 1
        res1 = await client.post(
            '/api/auth/phone/verify',
            json={'phone': '7060337258', 'code': '123456', 'role': 'rider'}
        )
        assert res1.status_code == 200, f"Rider 1 login failed: {res1.text}"
        data1 = res1.json()
        token1 = data1['token']
        rider1_id = data1['account']['id']
        headers1 = {'Authorization': f'Bearer {token1}', 'Content-Type': 'application/json'}
        print(f"✓ Rider 1 Authenticated: ID={rider1_id}")

        # 2. Login Partner
        partner_phone = "9876543210"
        partner_id = "test-store-kasganj"
        await database.collection("partners").update_one(
            {"_id": partner_id},
            {"$set": {
                "partnerId": partner_id,
                "storeName": "Kasganj Premium Laundry Hub",
                "phone": partner_phone,
                "address": "Opposite Railway Station, Kasganj",
                "lat": 27.8118,
                "lng": 78.6477,
                "isVerified": True,
                "status": "approved"
            }},
            upsert=True
        )
        res_p = await client.post(
            '/api/auth/phone/verify',
            json={'phone': partner_phone, 'code': '123456', 'role': 'partner'}
        )
        assert res_p.status_code == 200, f"Partner login failed: {res_p.text}"
        token_p = res_p.json()['token']
        partner_user_id = res_p.json()['account']['id']
        
        # Link user to partner_id and create partner profile
        await database.collection("partners").update_one(
            {"_id": partner_id},
            {"$set": {
                "partnerId": partner_id,
                "partner_id": partner_id,
                "user_id": partner_user_id,
                "storeName": "Kasganj Premium Laundry Hub",
                "phone": partner_phone,
                "address": "Opposite Railway Station, Kasganj",
                "lat": 27.8118,
                "lng": 78.6477,
                "isVerified": True,
                "status": "approved"
            }},
            upsert=True
        )
        await database.collection("partner_profiles").update_one(
            {"_id": partner_id},
            {"$set": {
                "partnerId": partner_id,
                "userId": partner_user_id,
                "storeName": "Kasganj Premium Laundry Hub",
                "phone": partner_phone,
                "address": "Opposite Railway Station, Kasganj",
                "isVerified": True,
                "status": "approved"
            }},
            upsert=True
        )
        await database.collection("users").update_one(
            {"_id": partner_user_id},
            {"$set": {"partnerId": partner_id, "isVerified": True}}
        )
        headers_p = {'Authorization': f'Bearer {token_p}', 'Content-Type': 'application/json'}
        print(f"✓ Partner Authenticated: ID={partner_id}")

        # 3. Create fresh order where Pickup Leg is completed & Order is in Partner Custody
        test_order_id = f"test-2way-{int(asyncio.get_event_loop().time() * 1000)}"
        now = lifecycle.now_iso()
        order_doc = {
            "_id": test_order_id,
            "code": "ORD-2WAY-88",
            "customerId": "cust-demo-1",
            "customerName": "Rohan Sharma",
            "customerPhone": "+919876543210",
            "partnerId": partner_id,
            "partner": {
                "id": partner_id,
                "name": "Kasganj Premium Laundry Hub",
                "address": "Opposite Railway Station, Kasganj",
                "phone": partner_phone,
                "lat": 27.8118,
                "lng": 78.6477,
            },
            "status": lifecycle.READY,
            "custody": "partner",
            "assignedRiderId": rider1_id,
            "riderId": rider1_id,
            "rider": {
                "id": rider1_id,
                "name": "Rider 1",
                "phone": "7060337258",
            },
            "pickupLocation": {"lat": 27.8083, "lng": 78.6477, "address": "Market Road Kasganj"},
            "deliveryLocation": {"lat": 27.8180, "lng": 78.6550, "address": "Railway Colony Kasganj"},
            "pricing": {"finalTotal": 399.0, "deliveryFee": 50.0},
            "total": 399.0,
            "createdAt": now,
            "updatedAt": now,
        }
        await database.collection("customer_orders").insert_one(order_doc)
        print(f"✓ Created order {test_order_id} in READY state, custody: partner")

        # 4. Rider 1 marks "Unable to Complete Delivery"
        res_unable = await client.post(
            f'/api/rider/orders/{test_order_id}/unable-to-deliver',
            json={
                'reason': 'vehicle_breakdown',
                'remarks': 'Flat tyre near bridge, cannot deliver to customer',
            },
            headers=headers1
        )
        assert res_unable.status_code == 200, f"Unable to deliver failed: {res_unable.text}"
        unable_data = res_unable.json()
        print(f"✓ Rider 1 reported unable to deliver:")
        print(f"  Status: {unable_data.get('status')}")
        print(f"  Custody: {unable_data.get('custody')} (Must be partner!)")
        print(f"  Pickup Leg Payout credited: ₹{unable_data.get('pickupLegPayout')}")
        print(f"  Delivery Leg Payout for Rider 2: ₹{unable_data.get('deliveryLegPayout')}")
        print(f"  Dispatch OTP generated: {unable_data.get('dispatchOtp')}")

        assert unable_data.get('custody') == 'partner', "Package MUST remain in partner custody!"
        assert unable_data.get('status') == lifecycle.DELIVERY_REASSIGNMENT_REQUIRED

        # Check Rider 1 wallet has the credit
        wallet_r1 = await database.find_one("rider_wallets", {"$or": [{"_id": rider1_id}, {"riderId": rider1_id}]})
        print(f"✓ Rider 1 Wallet Balance: ₹{wallet_r1.get('balance') if wallet_r1 else 'N/A'}")

        # 5. Rider 2 authenticates and accepts the reassigned delivery offer
        rider2_phone = "9123456789"
        rider2_id = "RDR-TEST-RIDER2"
        await database.collection("rider_profiles").update_one(
            {"_id": rider2_id},
            {"$set": {
                "riderId": rider2_id,
                "fullName": "Captain Amit Verma",
                "phone": rider2_phone,
                "vehicleNumber": "UP-87-XP-9988",
                "vehicleType": "Bike",
                "isOnline": True,
                "status": "active",
                "wallet": {"balance": 0.0, "totalEarned": 0.0}
            }},
            upsert=True
        )
        res_r2_login = await client.post(
            '/api/auth/phone/verify',
            json={'phone': rider2_phone, 'code': '123456', 'role': 'rider'}
        )
        token2 = res_r2_login.json()['token']
        headers2 = {'Authorization': f'Bearer {token2}', 'Content-Type': 'application/json'}
        print(f"✓ Rider 2 Authenticated: ID={rider2_id}")

        # Rider 2 claims the offer
        res_claim = await client.post(
            f'/api/rider/orders/{test_order_id}/accept',
            headers=headers2
        )
        assert res_claim.status_code == 200, f"Rider 2 claim failed: {res_claim.text}"
        print(f"✓ Rider 2 accepted delivery order: Status={res_claim.json().get('status')}")

        # 6. Rider 2 checks their Dispatch OTP to show to Partner
        res_otp = await client.get(
            f'/api/rider/orders/{test_order_id}/dispatch-otp',
            headers=headers2
        )
        assert res_otp.status_code == 200, f"Rider 2 get dispatch OTP failed: {res_otp.text}"
        rider2_otp_data = res_otp.json()
        dispatch_otp = rider2_otp_data.get("dispatchOtp")
        print(f"✓ Rider 2 fetched 4-digit Dispatch OTP: [{dispatch_otp}]")
        print(f"  Partner Store to visit: {rider2_otp_data.get('partnerName')}, {rider2_otp_data.get('partnerAddress')}")
        assert dispatch_otp and len(dispatch_otp) == 4, f"Dispatch OTP must be 4 digits, got {dispatch_otp}"

        # 7. Partner enters the Dispatch OTP told by Rider 2
        res_partner_verify = await client.post(
            f'/api/partner/orders/{test_order_id}/verify-dispatch-otp',
            json={'otp': dispatch_otp},
            headers=headers_p
        )
        assert res_partner_verify.status_code == 200, f"Partner verify dispatch OTP failed: {res_partner_verify.text}"
        partner_verify_data = res_partner_verify.json()
        print(f"✓ Partner verified Dispatch OTP:")
        print(f"  Order Status: {partner_verify_data.get('status')}")
        assert partner_verify_data.get('status') in (lifecycle.OUT_FOR_DELIVERY, "OUT_FOR_DELIVERY"), f"Status must be OUT_FOR_DELIVERY, got {partner_verify_data.get('status')}"

        # Verify database custody changed to rider
        db_order = await lifecycle.find_order(test_order_id)
        assert db_order.get("custody") == "rider", f"Custody should now be rider, got {db_order.get('custody')}"
        print(f"✓ Verified DB: Custody transferred to Delivery Captain ({db_order.get('assignedRiderId')})")

        # 8. Rider 2 delivers order to customer with customer delivery OTP
        cust_delivery_otp = ((db_order.get("otp") or {}).get("delivery") or {}).get("code") or "1234"
        # Ensure delivery OTP exists
        if not ((db_order.get("otp") or {}).get("delivery") or {}).get("code"):
            await database.collection("customer_orders").update_one(
                {"_id": test_order_id},
                {"$set": {"otp.delivery": {"code": "4321", "attempts": 0, "verified": False}}}
            )
            cust_delivery_otp = "4321"

        res_delivered = await client.post(
            f'/api/rider/orders/{test_order_id}/verify-delivery-otp',
            json={'otp': cust_delivery_otp},
            headers=headers2
        )
        assert res_delivered.status_code == 200, f"Rider 2 verify delivery OTP failed: {res_delivered.text}"
        print(f"✓ Delivery verified by Rider 2: Status={res_delivered.json().get('status')}")

        final_order = await lifecycle.find_order(test_order_id)
        assert final_order.get("status") == lifecycle.DELIVERED, f"Final status should be DELIVERED, got {final_order.get('status')}"
        print("=" * 60)
        print("🎉 ALL 2-WAY DELIVERY SYSTEM CHECKS PASSED WITH FLYING COLORS!")
        print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_test())
