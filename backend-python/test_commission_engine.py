"""Test suite for QuickPress Commission Engine with Supabase Integration."""

import asyncio
import pytest
from app.services.commission_engine import commission_engine
from app.db.client import database
from fastapi.testclient import TestClient
from app.main import create_app


def test_partner_tiers():
    """Verify tier thresholds: Standard (18%), Silver (15%), Gold (12%)."""
    # 25 monthly orders -> Standard 18%
    standard = commission_engine.calculate_partner_tier(25)
    assert standard["tier"] == "Standard"
    assert standard["commissionRatePct"] == 18.0
    assert standard["commissionRate"] == 0.18
    assert standard["nextTier"] == "Silver"
    assert standard["ordersNeeded"] == 75

    # 150 monthly orders -> Silver 15%
    silver = commission_engine.calculate_partner_tier(150)
    assert silver["tier"] == "Silver"
    assert silver["commissionRatePct"] == 15.0
    assert silver["commissionRate"] == 0.15
    assert silver["nextTier"] == "Gold"
    assert silver["ordersNeeded"] == 150

    # 350 monthly orders -> Gold 12%
    gold = commission_engine.calculate_partner_tier(350)
    assert gold["tier"] == "Gold"
    assert gold["commissionRatePct"] == 12.0
    assert gold["commissionRate"] == 0.12
    assert gold["nextTier"] is None
    assert gold["ordersNeeded"] == 0


@pytest.mark.asyncio
async def test_compute_order_commission():
    """Verify order commission calculation, TCS, zero-commission captain, and customer transparent bill."""
    mock_order = {
        "_id": "test-ord-comm-101",
        "code": "QP-TEST-101",
        "status": "delivered",
        "totals": {
            "itemsTotal": 200.0,
            "delivery": 40.0,
            "handling": 15.0,
            "laundryGst": 10.0,
            "serviceGst": 9.90,
            "grandTotal": 274.90,
        },
        "pickupLegPayout": 35.0,
        "deliveryLegPayout": 30.0,
        "tip": 10.0,
        "partner": {"id": "test-partner-1", "name": "Super Cleaners"},
        "rider": {"id": "test-rider-1", "name": "Ravi Kumar"},
    }

    result = await commission_engine.compute_order_commission(mock_order)

    assert result["orderId"] == "test-ord-comm-101"
    
    # Partner checks
    partner = result["partner"]
    assert partner["itemsGrossSubtotal"] == 200.0
    # Expected commission = 18% of 200 = 36.0 (Standard tier)
    assert partner["platformCommissionAmount"] == 36.0
    # 1% Section 194-O TCS = 2.0
    assert partner["tcsDeduction1Pct"] == 2.0
    # Net store earning = 200 - 36 - 2 = 162.0
    assert partner["netStoreEarning"] == 162.0
    assert partner["settlementStatus"] == "SETTLED"

    # Captain checks (Zero Commission Guarantee)
    captain = result["captain"]
    assert captain["grossTripFare"] == 65.0
    assert captain["tips"] == 10.0
    assert captain["platformCommissionRatePct"] == 0.0
    assert captain["platformCommissionDeduction"] == 0.0
    assert captain["netCaptainPayout"] == 75.0  # 65 + 10
    assert "Zero Platform Cut" in captain["guarantee"]

    # Customer bill transparent split
    bill = result["customerBill"]
    assert bill["itemsSubtotal"] == 200.0
    assert bill["grandTotal"] == 274.90
    split = bill["rupeeSplit"]
    assert split["partnerCleaningShare"] == 162.0
    assert split["captainDeliveryShare"] == 75.0


@pytest.mark.asyncio
async def test_supabase_commission_persistence():
    """Verify storing commission doc in Supabase collection platform_commissions."""
    test_order_id = "test-ord-supabase-comm-999"
    test_order = {
        "_id": test_order_id,
        "code": "QP-SUPA-999",
        "status": "delivered",
        "total": 300.0,
        "totals": {
            "itemsTotal": 300.0,
            "grandTotal": 350.0,
        },
        "pickupLegPayout": 30.0,
        "deliveryLegPayout": 30.0,
        "partner": {"id": "store-supa-1", "name": "Supa Wash"},
        "rider": {"id": "rider-supa-1", "name": "Captain Anand"},
    }

    # Insert into customer_orders first
    await database.collection("customer_orders").update_one(
        {"_id": test_order_id},
        {"$set": test_order},
        upsert=True,
    )

    # Record commission
    recorded = await commission_engine.record_order_commission(test_order_id)
    assert recorded["orderId"] == test_order_id

    # Verify directly from Supabase platform_commissions collection
    saved_doc = await database.find_one("platform_commissions", {"orderId": test_order_id})
    assert saved_doc is not None
    assert saved_doc["orderCode"] == "QP-SUPA-999"
    assert saved_doc["itemsSubtotal"] == 300.0
    assert saved_doc["partnerCommissionAmount"] > 0
    assert saved_doc["riderCommissionDeduction"] == 0.0
    assert saved_doc["riderPayout"] == 60.0

    # Clean up test doc
    await database.collection("customer_orders").delete_one({"_id": test_order_id})
    await database.collection("platform_commissions").delete_one({"orderId": test_order_id})


def test_api_endpoints():
    """Verify HTTP API endpoints for Commission Engine."""
    app = create_app()
    client = TestClient(app)

    # 1. Captain Commission Guarantee
    res_guarantee = client.get("/api/rider/commission/guarantee")
    assert res_guarantee.status_code == 200
    g_data = res_guarantee.json()
    assert g_data["commissionRatePct"] == 0.0
    assert "Zero Commission" in g_data["headline"]

    # 2. Partner Tier
    res_tier = client.get("/api/partner/commission/tier?partner_id=test-p1")
    assert res_tier.status_code == 200
    t_data = res_tier.json()
    assert "tier" in t_data
    assert "commissionRatePct" in t_data
    assert "financialSummary" in t_data

    # 3. Admin Analytics
    res_admin = client.get("/api/admin/commission/analytics")
    assert res_admin.status_code == 200
    a_data = res_admin.json()
    assert "summary" in a_data
    assert a_data["summary"]["captainCommissionRatePct"] == 0.0

    # 4. Captain Order Slip
    res_rider_slip = client.get("/api/rider/commission/orders/demo-order-1")
    assert res_rider_slip.status_code == 200
    r_data = res_rider_slip.json()
    assert r_data["platformCommissionDeduction"] == 0.0


if __name__ == "__main__":
    test_partner_tiers()
    asyncio.run(test_compute_order_commission())
    asyncio.run(test_supabase_commission_persistence())
    test_api_endpoints()
    print("✅ All Commission Engine tests passed successfully!")
