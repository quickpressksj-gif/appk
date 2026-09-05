"""Comprehensive test suite for VIP Membership Tiers (Silver, Gold, Platinum, Elite) & Tracking."""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.user import Role, User
from app.core.security import create_access_token
from app.db.client import database
from app.db.admin_membership_repository import admin_membership_repository
from app.db.membership_repositories import membership_repository


@pytest.fixture
async def admin_auth():
    admin = User(
        id="usr-super-admin-mem",
        phone="+919999900001",
        name="Chief Admin",
        email="chiefadmin@quickpress.com",
        role=Role.admin,
    )
    await database.collection("users").update_one(
        {"_id": admin.id},
        {"$set": admin.model_dump()},
        upsert=True,
    )
    token, _ = create_access_token(admin.id, admin.role.value)
    return token


@pytest.fixture
async def customer_auth():
    cust = User(
        id="usr-vip-customer-01",
        phone="+919876543299",
        name="Aman Sharma",
        email="aman.sharma@example.com",
        role=Role.customer,
    )
    await database.collection("users").update_one(
        {"_id": cust.id},
        {"$set": cust.model_dump()},
        upsert=True,
    )
    token, _ = create_access_token(cust.id, cust.role.value)
    return token


@pytest.mark.asyncio
async def test_four_vip_tiers_and_no_free(admin_auth, customer_auth):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Verify plans in admin API
        plans_res = await client.get(
            "/api/admin/memberships/plans",
            headers={"Authorization": f"Bearer {admin_auth}"},
        )
        assert plans_res.status_code == 200
        plans_data = plans_res.json()
        plan_ids = [p["id"] for p in plans_data]

        # Assert FREE is NOT present
        assert "free" not in plan_ids
        
        # Assert Silver, Gold, Platinum, Elite are present
        assert "silver" in plan_ids
        assert "gold" in plan_ids
        assert "platinum" in plan_ids
        assert "elite" in plan_ids

        # 2. Verify Customer Membership Plans API
        cust_plans_res = await client.get(
            "/api/membership/plans",
            headers={"Authorization": f"Bearer {customer_auth}"},
        )
        assert cust_plans_res.status_code == 200
        cust_plans = cust_plans_res.json()["plans"]
        cust_plan_ids = [p["id"] for p in cust_plans]
        assert "free" not in cust_plan_ids
        assert "silver" in cust_plan_ids
        assert "gold" in cust_plan_ids
        assert "platinum" in cust_plan_ids
        assert "elite" in cust_plan_ids

        # 3. Update / Customize Offer on Platinum Tier
        update_res = await client.put(
            "/api/admin/memberships/plans/platinum",
            headers={"Authorization": f"Bearer {admin_auth}"},
            json={
                "id": "platinum",
                "name": "Platinum VIP",
                "tagline": "Exclusive VIP perks, heavy discounts & zero delivery fee",
                "monthlyPrice": 349,
                "quarterlyPrice": 899,
                "yearlyPrice": 2999,
                "validityDays": 30,
                "yearlyValidityDays": 365,
                "popular": True,
                "status": "Active",
                "badge": "MOST POPULAR",
                "color": "indigo",
                "discountPercent": 22,  # custom offer discount
                "surgeWaiver": True,
                "freeExpressCount": 5,
                "monthlyOrderLimit": 20,
                "freeDeliveryMinOrder": 0,
                "freePickup": True,
                "priorityProcessing": True,
                "supportTier": "24x7 Priority Support",
                "benefits": [
                    {"id": "b-pickup", "title": "Free Doorstep Pickup", "icon": "package"},
                    {"id": "b-surge", "title": "100% Surge Waiver", "icon": "zap"},
                ],
            },
        )
        assert update_res.status_code == 200
        updated_data = update_res.json()
        assert updated_data["discountPercent"] == 22
        assert updated_data["freeExpressCount"] == 5
        assert updated_data["surgeWaiver"] is True

        # 4. Grant Elite VIP Membership to customer
        grant_res = await client.post(
            "/api/admin/memberships/subscribers/usr-vip-customer-01/grant",
            headers={"Authorization": f"Bearer {admin_auth}"},
            json={
                "planId": "elite",
                "billingCycle": "yearly",
                "validityDays": 365,
                "reason": "VIP Loyalty Invitation",
            },
        )
        assert grant_res.status_code == 200
        sub = grant_res.json()
        assert sub["userId"] == "usr-vip-customer-01"
        assert sub["planId"] == "elite"
        assert sub["status"] == "active"

        # 5. Check Membership Stats
        stats_res = await client.get(
            "/api/admin/memberships/stats",
            headers={"Authorization": f"Bearer {admin_auth}"},
        )
        assert stats_res.status_code == 200
        stats = stats_res.json()
        assert stats["activeMembers"] >= 1
        assert stats["monthlyRecurringRevenue"] >= 0
        assert stats["annualRunRate"] >= 0
        assert "totalSavingsGiven" in stats
        assert "memberOrdersCount" in stats

        # 6. Check Searchable Subscribers Directory
        search_res = await client.get(
            "/api/admin/memberships/subscribers?q=Aman",
            headers={"Authorization": f"Bearer {admin_auth}"},
        )
        assert search_res.status_code == 200
        search_items = search_res.json()["items"]
        assert len(search_items) >= 1
        subscriber = search_items[0]
        assert subscriber["userId"] == "usr-vip-customer-01"
        assert "Elite" in subscriber["planName"]
        assert subscriber["planId"] == "elite"
        assert subscriber["billingCycle"] == "yearly"
        assert "totalOrders" in subscriber
        assert "totalSaved" in subscriber

        # 7. Check Billing & Revenue Ledger
        tx_res = await client.get(
            "/api/admin/memberships/transactions",
            headers={"Authorization": f"Bearer {admin_auth}"},
        )
        assert tx_res.status_code == 200
        tx_items = tx_res.json()["items"]
        assert len(tx_items) >= 1
        assert any(t["userId"] == "usr-vip-customer-01" for t in tx_items)

        # 8. Test Revoking Membership
        revoke_res = await client.post(
            "/api/admin/memberships/subscribers/usr-vip-customer-01/revoke",
            headers={"Authorization": f"Bearer {admin_auth}"},
        )
        assert revoke_res.status_code == 200
        revoked_sub = revoke_res.json()
        assert revoked_sub["ok"] is True
