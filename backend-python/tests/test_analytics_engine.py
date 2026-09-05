"""Automated tests for Platform Analytics & Business Intelligence Engine."""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.user import Role, User
from app.core.security import create_access_token
from app.db.client import database


@pytest.fixture
async def admin_auth():
    admin = User(
        id="usr-analytics-admin",
        phone="+919999900088",
        name="Chief Analytics Officer",
        email="cao@quickpress.com",
        role=Role.admin,
    )
    await database.collection("users").update_one(
        {"_id": admin.id},
        {"$set": admin.model_dump()},
        upsert=True,
    )
    token, _ = create_access_token(admin.id, admin.role.value)
    return token


@pytest.mark.asyncio
async def test_analytics_summary_and_export_engine(admin_auth):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Test basic analytics summary
        res = await client.get(
            "/api/admin/analytics",
            headers={"Authorization": f"Bearer {admin_auth}"},
        )
        assert res.status_code == 200
        data = res.json()
        
        # Verify core KPI fields
        assert "totalOrders" in data
        assert "deliveredOrders" in data
        assert "revenue" in data
        assert "aov" in data
        assert "fulfillmentRate" in data
        assert "growthSeries" in data
        assert "servicesBreakdown" in data
        assert "paymentModes" in data
        assert "cities" in data
        assert "reports" in data

        # 2. Test Time-Range Filter
        res_7d = await client.get(
            "/api/admin/analytics?range=7d",
            headers={"Authorization": f"Bearer {admin_auth}"},
        )
        assert res_7d.status_code == 200
        data_7d = res_7d.json()
        assert "totalOrders" in data_7d

        # 3. Test City Filter
        res_city = await client.get(
            "/api/admin/analytics?city=Kasganj",
            headers={"Authorization": f"Bearer {admin_auth}"},
        )
        assert res_city.status_code == 200
        data_city = res_city.json()
        assert "cities" in data_city

        # 4. Test Dynamic CSV Exports
        export_types = [
            "financial_pl",
            "city_benchmarks",
            "membership_audit",
            "partner_settlements",
            "fulfillment_funnel",
        ]
        for exp_type in export_types:
            exp_res = await client.get(
                f"/api/admin/analytics/export?type={exp_type}",
                headers={"Authorization": f"Bearer {admin_auth}"},
            )
            assert exp_res.status_code == 200
            assert "text/csv" in exp_res.headers.get("content-type", "")
            assert len(exp_res.text) > 0
            assert "Content-Disposition" in exp_res.headers
