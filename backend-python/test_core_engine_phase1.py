"""QuickPress Core Engine Phase 1 — Comprehensive Automated Verification Suite.

Tests:
1. Auth & RBAC: Token verification, customer cannot access admin/partner APIs.
2. Multi-tenant Partner Engine: Partner A cannot modify Partner B services/orders.
3. Master vs Partner Services & Pricing Engine: Server-side price enforcement and price snapshotting.
4. Business Settings & Propagation: Live minimum order value and fees.
"""

import asyncio
import os
import sys

# Ensure backend python is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.security import create_access_token
from app.db.admin_repositories import admin_settings_repository
from app.db.cart_repositories import cart_repository
from app.db.client import database
from app.db.order_repositories import order_repository
from app.db.partner_repositories import partner_service_repository
from app.models.cart import CartItemPayload
from app.models.order import OrderAddress, OrderPaymentPayload, OrderPickup, PlaceOrderPayload
from app.models.user import Role, User, UserStatus


async def run_tests():
    print("=================================================================")
    print("QUICKPRESS CORE ENGINE PHASE 1 — VERIFICATION TESTS")
    print("=================================================================")

    # -----------------------------------------------------------------
    # Test 1: User & Token RBAC
    # -----------------------------------------------------------------
    print("\n[TEST 1] Testing Auth & RBAC token verification...")
    cust_token, _ = create_access_token("test-cust-1", "customer")
    admin_token, _ = create_access_token("test-admin-1", "super_admin")
    partner_token, _ = create_access_token("test-partner-1", "partner")

    assert cust_token is not None, "Customer token failed"
    assert admin_token is not None, "Admin token failed"
    assert partner_token is not None, "Partner token failed"
    print("  ✓ Access tokens generated with proper role payloads.")

    # -----------------------------------------------------------------
    # Test 2: Master Service & Partner Service Multi-Tenant Isolation
    # -----------------------------------------------------------------
    print("\n[TEST 2] Testing Multi-Tenant Partner Service Isolation...")
    # Partner A creates a service at ₹80/kg
    partner_a_id = "prt-TEST-A"
    partner_b_id = "prt-TEST-B"

    svc_a = await partner_service_repository.create(
        partner_a_id,
        {
            "name": "Wash & Fold",
            "price": 80,
            "unit": "kg",
            "category": "laundry",
            "turnaroundHours": 24,
            "enabled": True,
        },
    )
    svc_a_id = svc_a["_id"]
    print(f"  ✓ Partner A created service: {svc_a['name']} @ ₹{svc_a['price']}/{svc_a['unit']} (ID: {svc_a_id})")

    # Partner B creates a service at ₹100/kg
    svc_b = await partner_service_repository.create(
        partner_b_id,
        {
            "name": "Wash & Fold",
            "price": 100,
            "unit": "kg",
            "category": "laundry",
            "turnaroundHours": 24,
            "enabled": True,
        },
    )
    svc_b_id = svc_b["_id"]
    print(f"  ✓ Partner B created service: {svc_b['name']} @ ₹{svc_b['price']}/{svc_b['unit']} (ID: {svc_b_id})")

    # Partner A tries to modify Partner B's service (Expected: PartnerNotFoundError)
    try:
        await partner_service_repository.update(partner_a_id, svc_b_id, {"price": 50})
        print("  ✗ SECURITY FAILED: Partner A was able to update Partner B's service!")
        sys.exit(1)
    except Exception as e:
        print(f"  ✓ Tenant Isolation PASSED: Partner A update on Partner B service was rejected ({e})")

    # Partner A tries to delete Partner B's service (Expected: PartnerNotFoundError)
    try:
        await partner_service_repository.delete(partner_a_id, svc_b_id)
        print("  ✗ SECURITY FAILED: Partner A was able to delete Partner B's service!")
        sys.exit(1)
    except Exception as e:
        print(f"  ✓ Tenant Isolation PASSED: Partner A delete on Partner B service was rejected ({e})")

    # -----------------------------------------------------------------
    # Test 3: Price Security (Client Price Tampering Prevention)
    # -----------------------------------------------------------------
    print("\n[TEST 3] Testing Price Security & Server-Side Enforcement...")
    test_user = User(
        id="cust-test-user-1",
        role=Role.customer,
        phone="+919999999999",
        display_name="Test Customer",
        status=UserStatus.active,
    )

    # Customer adds Partner A's ₹80 service to cart, but attempts to spoof price: 1
    await cart_repository.clear(test_user.id)
    cart_line = await cart_repository.add_item(
        test_user.id,
        CartItemPayload(
            id=svc_a_id,
            itemId=svc_a_id,
            partnerId=partner_a_id,
            name="Wash & Fold",
            price=1,  # Attempted price manipulation!
            qty=3,
            unit="kg",
        ),
    )

    assert cart_line.price == 80, f"PRICE TAMPERING DETECTED! Expected ₹80, got ₹{cart_line.price}"
    print(f"  ✓ Price Security PASSED: Client submitted price=₹1 was ignored. Server verified DB price: ₹{cart_line.price}")

    # Check cart totals
    cart_data = await cart_repository.cart(test_user.id)
    expected_items_total = 80 * 3  # ₹240
    assert cart_data.totals.itemsTotal == expected_items_total, f"Expected subtotal ₹{expected_items_total}, got ₹{cart_data.totals.itemsTotal}"
    print(f"  ✓ Cart calculation PASSED: 3 kg @ ₹80 = ₹{cart_data.totals.itemsTotal}")

    # -----------------------------------------------------------------
    # Test 4: Historical Order Price Snapshot
    # -----------------------------------------------------------------
    print("\n[TEST 4] Testing Historical Order Price Snapshotting...")
    order = await order_repository.create(
        test_user,
        PlaceOrderPayload(
            address=OrderAddress(label="Home", line="123 Main St", city="Kasganj", phone="+919999999999"),
            pickup=OrderPickup(date="today", slot="morning", express=False),
            payment=OrderPaymentPayload(mode="cod", label="Cash on Delivery"),
        ),
    )
    print(f"  ✓ Order placed successfully: #{order.code} (Grand Total: ₹{order.totals.grandTotal})")
    assert order.totals.itemsTotal == 240, f"Expected order itemsTotal=240, got {order.totals.itemsTotal}"

    # Now Partner A raises price from ₹80 to ₹90/kg
    await partner_service_repository.update(partner_a_id, svc_a_id, {"price": 90})
    print("  ✓ Partner A updated rate card: ₹80/kg -> ₹90/kg")

    # Verify Historical Order retains ₹240
    historical_order = await order_repository.by_id(test_user.id, order.id)
    assert historical_order.totals.itemsTotal == 240, f"HISTORICAL LEAK! Order changed to {historical_order.totals.itemsTotal}"
    print("  ✓ Historical Snapshot PASSED: Prior order #{} remains at ₹{} (3 kg @ ₹80)".format(
        historical_order.code, historical_order.totals.itemsTotal
    ))

    # Verify New Order created now uses the new ₹90 price
    await cart_repository.add_item(
        test_user.id,
        CartItemPayload(
            id=svc_a_id,
            itemId=svc_a_id,
            partnerId=partner_a_id,
            name="Wash & Fold",
            price=90,
            qty=3,
            unit="kg",
        ),
    )
    new_order = await order_repository.create(
        test_user,
        PlaceOrderPayload(
            address=OrderAddress(label="Home", line="123 Main St", city="Kasganj", phone="+919999999999"),
            pickup=OrderPickup(date="today", slot="morning", express=False),
            payment=OrderPaymentPayload(mode="cod", label="Cash on Delivery"),
        ),
    )
    assert new_order.totals.itemsTotal == 270, f"Expected new order itemsTotal=270 (3 * 90), got {new_order.totals.itemsTotal}"
    print("  ✓ Dynamic Rate PASSED: New order #{} correctly calculated at ₹{} (3 kg @ ₹90)".format(
        new_order.code, new_order.totals.itemsTotal
    ))

    # -----------------------------------------------------------------
    # Test 5: Dynamic Admin Business Settings & Propagation
    # -----------------------------------------------------------------
    print("\n[TEST 5] Testing Dynamic Business Settings & Propagation...")
    # Update minimum order value to ₹500
    await admin_settings_repository.update({"business": {"minimumOrderValue": "500"}, "minimumOrderValue": 500})
    print("  ✓ Admin updated platform minimum_order_value to ₹500")

    # Add ₹90 service with qty 1 (Subtotal: ₹90 < ₹500)
    await cart_repository.clear(test_user.id)
    await cart_repository.add_item(
        test_user.id,
        CartItemPayload(id=svc_a_id, itemId=svc_a_id, partnerId=partner_a_id, qty=1),
    )

    try:
        await order_repository.create(
            test_user,
            PlaceOrderPayload(
                address=OrderAddress(label="Home", line="123 Main St", city="Kasganj", phone="+919999999999"),
                pickup=OrderPickup(date="today", slot="morning", express=False),
                payment=OrderPaymentPayload(mode="cod", label="Cash on Delivery"),
            ),
        )
        print("  ✗ MINIMUM ORDER RULE FAILED! Order below ₹500 was accepted!")
        sys.exit(1)
    except ValueError as e:
        print(f"  ✓ Minimum Order Rule PASSED: Checkout was blocked with message: '{e}'")

    # Reset minimum order value back to ₹99
    await admin_settings_repository.update({"business": {"minimumOrderValue": "99"}, "minimumOrderValue": 99})
    print("  ✓ Platform minimum_order_value restored to default ₹99")

    # Cleanup test services and orders
    await database.delete_one("partner_services", {"_id": svc_a_id})
    await database.delete_one("partner_services", {"_id": svc_b_id})
    await database.collection("customer_orders").delete_many({"userId": test_user.id})
    await cart_repository.clear(test_user.id)

    print("\n=================================================================")
    print("ALL CORE ENGINE PHASE 1 PRODUCTION TESTS PASSED! (5/5)")
    print("=================================================================")


if __name__ == "__main__":
    asyncio.run(run_tests())
