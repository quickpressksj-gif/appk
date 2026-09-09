"""End-to-End Test for Rider Login Security, Admin Approval Gatekeeping, and Real Order Auto-Fetching.

Validates:
1. Non-existent / unregistered rider phone OTP login -> isOnboarded: False, isVerified: False, status: "pending".
2. Verification status endpoint -> isApproved: False, isOnboarded: False, status: "not_registered".
3. Rider registration submission -> isOnboarded: True, isVerified: False, status: "pending" (Awaiting admin approval).
4. Unapproved rider cannot be marked as approved.
5. Admin approves rider via POST /api/admin/riders/{id}/approve -> isVerified: True, status: "active", isApproved: True.
6. Real customer order creation in Kasganj -> auto-fetched in GET /api/rider/offers with pickup & drop details.
"""

import asyncio
import random
import uuid
import httpx

BASE_URL = "http://127.0.0.1:8000"

async def run_test():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        # Step 1: Generate a brand new test phone number that has never registered
        random_digits = f"{random.randint(10000000, 99999999)}"
        test_phone = f"+9198{random_digits}"
        print(f"\n[TEST] 1. Testing phone OTP login for new rider: {test_phone}")

        # Send OTP
        res = await client.post("/api/auth/phone/send-otp", json={"phone": test_phone, "role": "rider"})
        assert res.status_code == 200, f"send-otp failed: {res.text}"

        # Verify OTP
        res = await client.post("/api/auth/phone/verify", json={"phone": test_phone, "code": "123456", "role": "rider"})
        assert res.status_code == 200, f"verify failed: {res.text}"
        data = res.json()
        token = data.get("token")
        account = data.get("account", {})

        print(f"       Token received. Account details:")
        print(f"       - isOnboarded: {account.get('isOnboarded')}")
        print(f"       - isVerified:  {account.get('isVerified')}")
        print(f"       - status:      {account.get('status')}")

        # CRITICAL ASSERTION: New rider MUST NOT be onboarded or verified!
        assert account.get("isOnboarded") is False, "FAIL: Unregistered rider was marked as isOnboarded=True!"
        assert account.get("isVerified") is False, "FAIL: Unregistered rider was marked as isVerified=True!"
        assert account.get("status") in ("pending", "pending_verification", "draft"), f"FAIL: Unexpected status: {account.get('status')}"
        print("  --> [PASS] New phone user is NOT onboarded and NOT verified.")

        headers = {"Authorization": f"Bearer {token}"}

        # Step 2: Check /api/rider/verification-status before registration
        print("\n[TEST] 2. Checking /api/rider/verification-status for unregistered rider...")
        res = await client.get("/api/rider/verification-status", headers=headers)
        assert res.status_code == 200, f"verification-status failed: {res.text}"
        v_data = res.json()
        print(f"       - isApproved:  {v_data.get('isApproved')}")
        print(f"       - isOnboarded: {v_data.get('isOnboarded')}")
        print(f"       - status:      {v_data.get('status')}")

        assert v_data.get("isApproved") is False, "FAIL: Unregistered rider has isApproved=True!"
        assert v_data.get("isOnboarded") is False, "FAIL: Unregistered rider has isOnboarded=True!"
        assert v_data.get("status") == "not_registered", f"FAIL: Expected not_registered, got {v_data.get('status')}"
        print("  --> [PASS] Verification status confirms rider is NOT registered and NOT approved.")

        # Step 3: Rider submits registration form
        print("\n[TEST] 3. Submitting Captain registration form (/api/rider/onboarding)...")
        reg_payload = {
            "fullName": "Test Captain Kasganj",
            "mobile": test_phone,
            "city": "Kasganj",
            "pincode": "207123",
            "operatingPincodes": ["207123", "207124"],
            "sectors": ["Bilram Gate Hub"],
            "aadhaar": "987654321098",
            "pan": "ABCDE1234F",
            "license": "UP8720230012345",
            "vehicleType": "bike",
            "vehicleBrand": "Hero MotoCorp",
            "vehicleModel": "Splendor Plus",
            "vehicleNumber": "UP87AB1234",
            "bankName": "State Bank of India",
            "accountNumber": "12345678901",
            "ifsc": "SBIN0001234",
        }
        res = await client.post("/api/rider/onboarding", json={"payload": reg_payload}, headers=headers)
        assert res.status_code == 200, f"onboarding submit failed: {res.text}"
        onb_data = res.json()
        rider_id = onb_data.get("riderId")
        print(f"       Registered with Rider ID: {rider_id}")
        print(f"       - isOnboarded: {onb_data.get('isOnboarded')}")
        print(f"       - isVerified:  {onb_data.get('isVerified')}")
        print(f"       - status:      {onb_data.get('status')}")

        assert onb_data.get("isOnboarded") is True, "FAIL: After registration, isOnboarded should be True!"
        assert onb_data.get("isVerified") is False, "FAIL: After registration, isVerified must be False until Admin approves!"
        print("  --> [PASS] Registration saved as pending approval.")

        # Step 4: Check verification status post-registration (Awaiting Admin approval)
        print("\n[TEST] 4. Checking verification-status post-registration (must remain unapproved)...")
        res = await client.get("/api/rider/verification-status", headers=headers)
        assert res.status_code == 200
        v_post = res.json()
        print(f"       - isApproved:  {v_post.get('isApproved')}")
        print(f"       - isOnboarded: {v_post.get('isOnboarded')}")
        print(f"       - status:      {v_post.get('status')}")
        print(f"       - kycStatus:   {v_post.get('kycStatus')}")

        assert v_post.get("isApproved") is False, "FAIL: Unapproved rider has isApproved=True!"
        assert v_post.get("isOnboarded") is True, "FAIL: Submitted rider should have isOnboarded=True!"
        print("  --> [PASS] Rider is held on verification screen awaiting admin approval.")

        # Step 5: Admin approves rider
        print(f"\n[TEST] 5. Admin approving rider {rider_id} via POST /api/admin/riders/{rider_id}/approve...")
        # Login admin or use direct admin call
        admin_login = await client.post("/api/auth/phone/verify", json={"phone": "+919999999999", "code": "123456", "role": "admin"})
        admin_token = admin_login.json().get("token")
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        res = await client.post(f"/api/admin/riders/{rider_id}/approve", headers=admin_headers)
        assert res.status_code == 200, f"admin approve failed: {res.text}"
        print(f"       Admin approve response: {res.status_code}")

        # Step 6: Rider verification status after admin approval
        print("\n[TEST] 6. Checking rider verification status after admin approval...")
        res = await client.get("/api/rider/verification-status", headers=headers)
        assert res.status_code == 200
        v_approved = res.json()
        print(f"       - isApproved:  {v_approved.get('isApproved')}")
        print(f"       - isVerified:  {v_approved.get('isVerified')}")
        print(f"       - status:      {v_approved.get('status')}")

        assert v_approved.get("isApproved") is True, "FAIL: After admin approval, isApproved should be True!"
        assert v_approved.get("isVerified") is True, "FAIL: After admin approval, isVerified should be True!"
        assert v_approved.get("status") == "active", f"FAIL: Expected active, got {v_approved.get('status')}"
        print("  --> [PASS] Rider is now approved and unlocked for operations.")

        # Step 7: Create a real customer order in Kasganj and verify auto-fetching in GET /api/rider/offers
        print("\n[TEST] 7. Testing real live customer order auto-fetching in /api/rider/offers...")
        # Create customer order
        cust_login = await client.post("/api/auth/phone/verify", json={"phone": "+919876543210", "code": "123456", "role": "customer"})
        cust_token = cust_login.json().get("token")
        cust_headers = {"Authorization": f"Bearer {cust_token}"}

        order_payload = {
            "serviceLabel": "Wash & Fold",
            "customerName": "Ramesh Kumar",
            "customerPhone": "+919876543210",
            "items": [
                {"id": "item-1", "name": "Shirt", "qty": 3, "price": 40.0}
            ],
            "address": {
                "label": "Home",
                "line": "House 42, Soron Gate Road",
                "city": "Kasganj",
                "phone": "+919876543210",
            },
            "pickup": {
                "date": "today",
                "slot": "10:00 AM - 12:00 PM",
                "express": False,
            },
            "payment": {
                "mode": "cod",
                "label": "Cash on Delivery",
            },
            "idempotencyKey": f"test-idemp-{uuid.uuid4().hex[:6]}",
        }
        ord_res = await client.post("/api/orders", json=order_payload, headers=cust_headers)
        assert ord_res.status_code == 201, f"place order failed: {ord_res.text}"
        order_info = ord_res.json()
        order_id = order_info.get("orderId") or order_info.get("order", {}).get("id")
        print(f"       Placed customer order via API: {order_id} ({order_info.get('orderNumber')})")

        # Now Captain calls GET /api/rider/offers
        res = await client.get("/api/rider/offers", headers=headers)
        assert res.status_code == 200, f"offers fetch failed: {res.text}"
        offers = res.json()
        print(f"       Offers returned count: {len(offers)}")

        matched_offer = next((o for o in offers if o.get("orderId") == order_id), None)
        assert matched_offer is not None, f"FAIL: Real customer order {order_id} was not found in rider offers! Offers: {offers}"
        print(f"       - Found Order ID:        {matched_offer.get('orderId')}")
        print(f"       - Order Code:            {matched_offer.get('orderCode')}")
        print(f"       - Pickup Address:        {matched_offer.get('pickupAddress')}")
        print(f"       - Drop Address:          {matched_offer.get('dropAddress')}")
        print(f"       - Estimated Earning:     ₹{matched_offer.get('estimatedEarning')}")
        print("  --> [PASS] Live real customer order was automatically fetched for Captain!")

        print("\nALL 7 TESTS PASSED SUCCESSFULLY! ✅\n")

if __name__ == "__main__":
    asyncio.run(run_test())
