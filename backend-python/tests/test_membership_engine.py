"""Test complete Membership Engine and Admin Control."""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.user import Role, User
from app.core.security import create_access_token
from app.db.client import database
from app.db.admin_membership_repository import admin_membership_repository
from app.db.membership_repositories import membership_repository
from app.models.membership import AdminPlanPayload, AdminGrantPayload


@pytest.fixture
async def admin_token():
    user = User(
        id="usr-admin-test",
        phone="+919999988888",
        name="Super Admin",
        email="admin@quickpress.com",
        role=Role.admin,
    )
    await database.collection("users").update_one(
        {"_id": user.id},
        {"$set": user.model_dump()},
        upsert=True,
    )
    token, _ = create_access_token(user.id, user.role.value)
    return token


@pytest.fixture
async def customer_token():
    user = User(
        id="usr-cust-mem-test",
        phone="+919876543210",
        name="Test Member Customer",
        email="member@test.com",
        role=Role.customer,
    )
    await database.collection("users").update_one(
        {"_id": user.id},
        {"$set": user.model_dump()},
        upsert=True,
    )
    token, _ = create_access_token(user.id, user.role.value)
    return token


@pytest.mark.asyncio
async def test_admin_membership_plan_crud_and_engine(admin_token, customer_token):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Admin creates a new custom plan
        create_res = await client.post(
            "/api/admin/memberships/plans",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "id": "vip-platinum",
                "name": "VIP Platinum",
                "tagline": "Unlimited express care with free delivery",
                "monthlyPrice": 499,
                "yearlyPrice": 4990,
                "validityDays": 30,
                "yearlyValidityDays": 365,
                "popular": True,
                "status": "Active",
                "badge": "BEST VALUE",
                "color": "amber",
                "discountPercent": 15,
                "freeDeliveryMinOrder": 0,
                "freePickup": True,
                "priorityProcessing": True,
                "supportTier": "24x7 Dedicated VIP",
                "benefits": [
                    {"id": "vip-del", "title": "Zero Minimum Free Delivery", "icon": "truck"},
                    {"id": "vip-pickup", "title": "Priority Doorstep Pickup", "icon": "package"},
                ],
            },
        )
        assert create_res.status_code == 200
        data = create_res.json()
        assert data["id"] == "vip-platinum"
        assert data["monthlyPrice"] == 499
        assert data["discountPercent"] == 15

        # 2. Customer views available plans and sees new plan
        cust_plans_res = await client.get(
            "/api/membership/plans",
            headers={"Authorization": f"Bearer {customer_token}"},
        )
        assert cust_plans_res.status_code == 200
        plans = cust_plans_res.json()["plans"]
        assert any(p["id"] == "vip-platinum" for p in plans)

        # 3. Admin grants membership to customer
        grant_res = await client.post(
            "/api/admin/memberships/subscribers/usr-cust-mem-test/grant",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "planId": "vip-platinum",
                "billingCycle": "monthly",
                "validityDays": 30,
                "reason": "Promotional VIP grant",
            },
        )
        assert grant_res.status_code == 200
        sub_item = grant_res.json()
        assert sub_item["planId"] == "vip-platinum"
        assert sub_item["status"] == "active"

        # 4. Customer dashboard reflects active VIP plan
        cust_mbs_res = await client.get(
            "/api/membership",
            headers={"Authorization": f"Bearer {customer_token}"},
        )
        assert cust_mbs_res.status_code == 200
        cust_mbs = cust_mbs_res.json()
        assert cust_mbs["planId"] == "vip-platinum"
        assert cust_mbs["active"] is True

        # 5. Check membership stats
        stats_res = await client.get(
            "/api/admin/memberships/stats",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert stats_res.status_code == 200
        stats = stats_res.json()
        assert stats["activeMembers"] >= 1

        # 6. Check subscribers list
        subs_res = await client.get(
            "/api/admin/memberships/subscribers?q=usr-cust-mem-test",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert subs_res.status_code == 200
        subs = subs_res.json()["items"]
        assert len(subs) >= 1
        assert subs[0]["userId"] == "usr-cust-mem-test"

        # 7. Perks evaluation
        perks = await membership_repository.get_user_membership_perks("usr-cust-mem-test")
        assert perks["active"] is True
        assert perks["free_pickup"] is True
        assert perks["discount_percent"] == 15
