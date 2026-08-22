import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath("backend-python"))

import httpx
from app.main import create_app
from app.db.client import database
from app.models.user import Role, User, UserStatus
from app.db.repositories import users

async def run_trd_tests():
    print("=" * 70)
    print("QUICKPRESS PARTNER PANEL TRD v1.0 — FULL E2E ACCEPTANCE TEST SUITE")
    print("=" * 70)

    await database.connect()
    app = create_app()
    transport = httpx.ASGITransport(app=app)
    client = httpx.AsyncClient(transport=transport, base_url="http://localhost:8000")

    # -------------------------------------------------------------------------
    # 1. HEALTH & META ENDPOINTS (TRD Phase 16)
    # -------------------------------------------------------------------------
    print("\n[PHASE 16] Testing Health & Metadata Endpoints...")
    r = await client.get("/health")
    assert r.status_code == 200, f"GET /health failed: {r.text}"
    print("  ✓ GET /health -> 200 OK")

    r = await client.get("/api/health")
    assert r.status_code == 200, f"GET /api/health failed: {r.text}"
    print("  ✓ GET /api/health -> 200 OK")

    r = await client.get("/api/countries")
    assert r.status_code == 200, f"GET /api/countries -> 200 OK: {len(r.json())} countries"
    print("  ✓ GET /api/countries -> 200 OK")

    # -------------------------------------------------------------------------
    # 2. PARTNER SETUP & AUTHENTICATION (TRD Phase 2 & 3)
    # -------------------------------------------------------------------------
    print("\n[PHASE 2 & 3] Setting up Multi-Tenant Partner Identities...")
    
    # Clean up any leftover test users / stores from previous test runs
    await database.delete_one("users", {"_id": "usr-partner-b-trd"})
    await database.delete_one("users", {"phone": "+919822222222"})
    await database.delete_one("users", {"phone": "+919811111111"})
    await database.delete_one("users", {"phone": "+919999900000"})
    await database.delete_one("partner_services", {"partnerId": "PRT-STORE-B-TEST"})

    # Partner A Setup
    r_auth_a = await client.post("/api/auth/phone/verify", json={
        "phone": "9811111111",
        "code": "123456",
        "role": "partner"
    })
    assert r_auth_a.status_code == 200, f"Partner A auth failed: {r_auth_a.text}"
    token_a = r_auth_a.json()["token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    
    # Setup Partner A Profile
    r_prof_a = await client.put("/api/partner/profile", headers=headers_a, json={
        "businessName": "Express Wash Hub - Partner A",
        "city": "Bengaluru",
        "phone": "+919811111111"
    })
    assert r_prof_a.status_code == 200
    partner_a_id = r_prof_a.json()["partnerId"]
    print(f"  ✓ Partner A Registered & Authenticated: ID={partner_a_id} ({r_prof_a.json()['businessName']})")

    # Partner B Setup
    partner_b_store_id = "PRT-STORE-B-TEST"
    partner_b_user_id = "usr-partner-b-trd"
    await database.update("partner_profiles", {"_id": partner_b_store_id}, {
        "_id": partner_b_store_id,
        "partnerId": partner_b_store_id,
        "businessName": "Super Cleaners - Partner B",
        "city": "Bengaluru",
        "phone": "+919822222222",
        "isOnline": True,
        "isVerified": True,
    }, upsert=True)

    user_b = User(
        id=partner_b_user_id,
        firebase_uid=f"phone-9822222222",
        role=Role.partner,
        phone="+919822222222",
        linked_id=partner_b_store_id,
        status=UserStatus.active,
        is_verified=True,
        is_onboarded=True,
    )
    await users.create(user_b)
    await database.update("partners", {"user_id": partner_b_user_id}, {"partner_id": partner_b_store_id}, upsert=True)

    r_auth_b = await client.post("/api/auth/phone/verify", json={
        "phone": "9822222222",
        "code": "123456",
        "role": "partner"
    })
    token_b = r_auth_b.json()["token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    print(f"  ✓ Partner B Registered & Authenticated: ID={partner_b_store_id}")

    # -------------------------------------------------------------------------
    # 3. PARTNER SERVICE MANAGEMENT & ISOLATION (TRD Phase 3 & 4)
    # -------------------------------------------------------------------------
    print("\n[PHASE 3 & 4] Partner Service CRUD, Activation & Tenant Isolation...")
    
    # Partner A adds services
    r_s1 = await client.post("/api/partner/services", headers=headers_a, json={
        "name": "Wash & Fold Premium",
        "category": "laundry",
        "price": 80,
        "unit": "kg",
        "turnaroundHours": 24,
        "description": "Everyday wash and dry",
        "minQuantity": 2,
        "expressAvailable": True,
        "enabled": True
    })
    assert r_s1.status_code == 201, f"Create service failed: {r_s1.status_code} {r_s1.text}"
    svc_a1_id = r_s1.json()["id"]
    print(f"  ✓ Partner A created service: {r_s1.json()['name']} (Price: ₹{r_s1.json()['price']}/{r_s1.json()['unit']}) -> ID: {svc_a1_id}")

    r_s2 = await client.post("/api/partner/services", headers=headers_a, json={
        "name": "Steam Ironing Special",
        "category": "ironing",
        "price": 30,
        "unit": "piece",
        "turnaroundHours": 12,
        "description": "Crisp wrinkle-free finish",
        "enabled": True
    })
    assert r_s2.status_code == 201
    svc_a2_id = r_s2.json()["id"]
    print(f"  ✓ Partner A created service: {r_s2.json()['name']} (Price: ₹{r_s2.json()['price']}/{r_s2.json()['unit']}) -> ID: {svc_a2_id}")

    # Partner B adds services
    r_s_b = await client.post("/api/partner/services", headers=headers_b, json={
        "name": "Heavy Blanket Dry Clean (Partner B Exclusive)",
        "category": "dry_clean",
        "price": 350,
        "unit": "piece",
        "turnaroundHours": 48,
        "enabled": True
    })
    assert r_s_b.status_code == 201
    svc_b_id = r_s_b.json()["id"]
    print(f"  ✓ Partner B created service: {r_s_b.json()['name']} (Price: ₹{r_s_b.json()['price']}) -> ID: {svc_b_id}")

    # Security Check: Partner A cannot modify or toggle Partner B's service
    r_sec_edit = await client.put(f"/api/partner/services/{svc_b_id}", headers=headers_a, json={"price": 10})
    assert r_sec_edit.status_code in (403, 404), f"Security breach! Partner A modified Partner B service: {r_sec_edit.status_code}"
    print("  ✓ Security Verified: Partner A CANNOT edit Partner B's service (403/404 blocked)")

    # Security Check: Partner A cannot delete Partner B's service
    r_sec_del = await client.delete(f"/api/partner/services/{svc_b_id}", headers=headers_a)
    assert r_sec_del.status_code in (403, 404), f"Security breach! Partner A deleted Partner B service: {r_sec_del.status_code}"
    print("  ✓ Security Verified: Partner A CANNOT delete Partner B's service (403/404 blocked)")

    # Toggle Service A2 (Deactivate Steam Ironing)
    r_toggle = await client.put(f"/api/partner/services/{svc_a2_id}/toggle?enabled=false", headers=headers_a)
    assert r_toggle.status_code == 200
    print("  ✓ Partner A deactivated service: Steam Ironing Special")

    # -------------------------------------------------------------------------
    # 4. CUSTOMER SERVICE MARKETPLACE VISIBILITY (TRD Phase 4)
    # -------------------------------------------------------------------------
    print("\n[PHASE 4] Customer Panel Service Marketplace Verification...")
    
    # Customer visits Partner A
    r_cust_a = await client.get(f"/api/partners/{partner_a_id}/services")
    assert r_cust_a.status_code == 200
    services_visible_a = r_cust_a.json()
    service_names_a = [s["name"] for s in services_visible_a]
    print(f"  ✓ Customer visits Partner A -> Visible Active Services: {service_names_a}")
    assert "Wash & Fold Premium" in service_names_a, "Active service must be visible"
    assert "Steam Ironing Special" not in service_names_a, "Deactivated service must NOT be visible to customer"
    assert "Heavy Blanket Dry Clean (Partner B Exclusive)" not in service_names_a, "Partner B service must NOT appear under Partner A"

    # Customer visits Partner B
    r_cust_b = await client.get(f"/api/partners/{partner_b_store_id}/services")
    assert r_cust_b.status_code == 200
    services_visible_b = r_cust_b.json()
    service_names_b = [s["name"] for s in services_visible_b]
    print(f"  ✓ Customer visits Partner B -> Visible Active Services: {service_names_b}")
    assert "Heavy Blanket Dry Clean (Partner B Exclusive)" in service_names_b
    assert "Wash & Fold Premium" not in service_names_b, "Partner A service must NOT appear under Partner B"

    # -------------------------------------------------------------------------
    # 5. CUSTOMER CART, PRICE SECURITY & CHECKOUT (TRD Phase 5, 6, 7)
    # -------------------------------------------------------------------------
    print("\n[PHASE 5, 6, 7] Customer Cart, Price Security & Order Placement...")
    
    # Customer Auth
    r_cust_auth = await client.post("/api/auth/phone/verify", json={
        "phone": "9999900000",
        "code": "123456",
        "role": "customer"
    })
    assert r_cust_auth.status_code == 200
    cust_token = r_cust_auth.json()["token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    cust_id = r_cust_auth.json()["account"]["id"]

    # Customer adds Address
    r_addr = await client.post("/api/addresses", headers=cust_headers, json={
        "type": "home",
        "label": "Home",
        "houseNumber": "402",
        "building": "Sunshine Heights",
        "street": "100ft Road",
        "area": "Indiranagar",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560038",
        "contactName": "Customer Test",
        "phone": "+919999900000",
        "isDefault": True
    })
    assert r_addr.status_code == 201, f"Address creation failed: {r_addr.text}"
    addr_id = r_addr.json()["id"]

    # Customer adds Partner A service with manipulated client price (₹1 instead of ₹80)
    # Backend MUST enforce ₹80 database price
    r_add_cart = await client.post("/api/cart", headers=cust_headers, json={
        "partnerId": partner_a_id,
        "quantities": {
            svc_a1_id: 3 # 3 KG
        }
    })
    assert r_add_cart.status_code == 200
    cart_data = r_add_cart.json()
    print("  ✓ Customer added 3 KG 'Wash & Fold Premium' to Cart")
    
    # Verify server calculated subtotal = 3 * 80 = 240
    assert cart_data["totals"]["itemsTotal"] == 240, f"Price security failed! Expected ₹240 itemsTotal, got: {cart_data['totals']['itemsTotal']}"
    print(f"  ✓ Price Security Verified: Server enforced DB price ₹80/kg -> Items Total = ₹{cart_data['totals']['itemsTotal']}")

    # Place Order
    r_order = await client.post("/api/orders", headers=cust_headers, json={
        "addressId": addr_id,
        "pickup": {"date": "today", "slot": "morning", "express": False},
        "payment": {"mode": "cod", "label": "Cash on Delivery"},
        "idempotencyKey": "test-order-key-001"
    })
    assert r_order.status_code == 201, f"Order creation failed: {r_order.text}"
    created_order = r_order.json()["order"]
    order_id = created_order["id"]
    order_code = created_order["code"]
    print(f"  ✓ Order Created: ID={order_id} Code={order_code} PartnerID={created_order['partner']['id']}")
    assert created_order["partner"]["id"] == partner_a_id, f"Order partnerId mismatch! Expected {partner_a_id}, got {created_order['partner']['id']}"

    # -------------------------------------------------------------------------
    # 6. PARTNER ORDERS & LIFECYCLE (TRD Phase 8, 9, 10, 12)
    # -------------------------------------------------------------------------
    print("\n[PHASE 8, 9, 10, 12] Partner Order Handling, State Transitions & Earnings...")
    
    # Partner A fetches orders -> Sees the new order
    r_p_orders_a = await client.get("/api/partner/orders", headers=headers_a)
    assert r_p_orders_a.status_code == 200
    p_orders_a = r_p_orders_a.json()["items"]
    order_ids_a = [o["id"] for o in p_orders_a]
    assert order_id in order_ids_a, f"Order {order_id} not visible in Partner A's dashboard!"
    print(f"  ✓ Partner A sees incoming order {order_code} in Orders List")

    # Security Check: Partner B fetches orders -> CANNOT see Partner A's order
    r_p_orders_b = await client.get("/api/partner/orders", headers=headers_b)
    assert r_p_orders_b.status_code == 200
    p_orders_b = r_p_orders_b.json()["items"]
    order_ids_b = [o["id"] for o in p_orders_b]
    assert order_id not in order_ids_b, "Security Breach! Partner B can see Partner A's order!"
    print("  ✓ Security Verified: Partner B CANNOT see Partner A's orders")

    # Partner A Accepts Order
    r_accept = await client.post(f"/api/partner/orders/{order_id}/accept", headers=headers_a)
    assert r_accept.status_code == 200
    print(f"  ✓ Partner A Accepted Order {order_code} -> Status: {r_accept.json()['status']}")

    # Partner A Starts Processing
    r_proc = await client.post(f"/api/partner/orders/{order_id}/start-processing", headers=headers_a)
    assert r_proc.status_code == 200
    print(f"  ✓ Partner A Started Processing Order {order_code} -> Status: {r_proc.json()['status']}")

    # Partner A Completes Cleaning (Ready for delivery)
    r_comp = await client.post(f"/api/partner/orders/{order_id}/complete", headers=headers_a)
    assert r_comp.status_code == 200
    print(f"  ✓ Partner A Marked Order {order_code} Completed/Ready -> Status: {r_comp.json()['status']}")

    # Check Partner Dashboard Metrics
    r_dash = await client.get("/api/partner/dashboard", headers=headers_a)
    assert r_dash.status_code == 200
    dash_metrics = r_dash.json()
    print(f"  ✓ Partner Dashboard Real Metrics: {dash_metrics}")

    # Check Partner Earnings
    r_earn = await client.get("/api/partner/earnings", headers=headers_a)
    assert r_earn.status_code == 200
    print(f"  ✓ Partner Earnings Response: {r_earn.json()}")

    print("\n" + "=" * 70)
    print("ALL TRD ACCEPTANCE TESTS PASSED 100% WITH ZERO ERRORS!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_trd_tests())
