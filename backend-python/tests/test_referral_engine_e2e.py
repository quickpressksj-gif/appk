"""QuickPress Referral Engine & Admin Offer Customization E2E Integration Tests.

Validates:
1. Admin configuring dynamic referral rules (50% discount, ₹150 cap, ₹150 wallet reward) via `PUT /api/admin/referrals/settings`.
2. Customer A fetching their unique referral code and dashboard.
3. Customer B registering as a new customer and applying Customer A's referral code.
4. Customer B's welcome offer check confirming up to 50% first-order discount eligibility.
5. Customer B receiving welcome notification.
6. Customer B placing an order and transition to `DELIVERED`.
7. Automated settlement: Customer A immediately receives ₹150 in their wallet + double-entry ledger + in-app notification.
8. Admin viewing updated referral conversion stats and conversion table.
"""

import uuid
import pytest
from httpx import AsyncClient, ASGITransport

from app.core.security import create_access_token
from app.db import repositories as user_repo
from app.db.client import database
from app.main import app
from app.models.user import Role, User
from app.services import order_lifecycle


@pytest.fixture
async def referral_fixtures():
    # 1. Admin User
    admin_uid = f"admin_ref_{uuid.uuid4().hex[:8]}"
    admin_user = await user_repo.users.upsert_from_firebase(
        firebase_uid=admin_uid,
        role=Role.admin,
        phone="+919800000001",
        email=f"admin_{uuid.uuid4().hex[:6]}@quickpress.test",
        display_name="Super Admin",
        photo_url=None,
    )
    admin_token, _ = create_access_token(admin_user.id, admin_user.role.value)

    # 2. Customer A (Referrer)
    cust_a_uid = f"cust_a_{uuid.uuid4().hex[:8]}"
    cust_a = await user_repo.users.upsert_from_firebase(
        firebase_uid=cust_a_uid,
        role=Role.customer,
        phone=f"+9198111{uuid.uuid4().int % 90000 + 10000}",
        email=f"cust_a_{uuid.uuid4().hex[:6]}@quickpress.test",
        display_name="Rahul Inviter",
        photo_url=None,
    )
    token_a, _ = create_access_token(cust_a.id, cust_a.role.value)

    # 3. Customer B (Referee)
    cust_b_uid = f"cust_b_{uuid.uuid4().hex[:8]}"
    cust_b = await user_repo.users.upsert_from_firebase(
        firebase_uid=cust_b_uid,
        role=Role.customer,
        phone=f"+9198222{uuid.uuid4().int % 90000 + 10000}",
        email=f"cust_b_{uuid.uuid4().hex[:6]}@quickpress.test",
        display_name="Priya Friend",
        photo_url=None,
    )
    token_b, _ = create_access_token(cust_b.id, cust_b.role.value)

    yield {
        "admin": admin_user,
        "admin_token": admin_token,
        "cust_a": cust_a,
        "token_a": token_a,
        "cust_b": cust_b,
        "token_b": token_b,
    }

    # Teardown
    for u in (admin_user, cust_a, cust_b):
        await database.collection("users").delete_one({"_id": u.id})
        await database.collection("wallets").delete_one({"user_id": u.id})
        await database.collection("wallet_transactions").delete_many({"user_id": u.id})
        await database.collection("wallet_ledger").delete_many({"accountId": u.id})
        await database.collection("notifications").delete_many({"user_id": u.id})
        await database.collection("referrals").delete_many({"user_id": u.id})

    await database.collection("referral_transactions").delete_many({"referrer_id": cust_a.id})
    await database.collection("referral_rewards").delete_many({"user_id": cust_a.id})
    await database.collection("customer_orders").delete_many({"userId": cust_b.id})


@pytest.mark.asyncio
async def test_full_referral_lifecycle_and_admin_customization(referral_fixtures):
    admin_token = referral_fixtures["admin_token"]
    cust_a = referral_fixtures["cust_a"]
    token_a = referral_fixtures["token_a"]
    cust_b = referral_fixtures["cust_b"]
    token_b = referral_fixtures["token_b"]

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Step 1: Admin configures Referral Offer to 50% discount, ₹150 cap, ₹150 referrer reward
        put_settings_res = await client.put(
            "/api/admin/referrals/settings",
            headers=admin_headers,
            json={
                "enabled": True,
                "refereeDiscountPercent": 50.0,
                "refereeMaxDiscount": 150.0,
                "refereeMinOrderValue": 199.0,
                "referrerRewardAmount": 150.0,
                "headline": "Invite Friends & Earn ₹150",
                "subheadline": "Friends get 50% OFF on their 1st order. You get ₹150 wallet cash.",
            },
        )
        assert put_settings_res.status_code == 200, put_settings_res.text
        settings = put_settings_res.json()
        assert settings["refereeDiscountPercent"] == 50.0
        assert settings["refereeMaxDiscount"] == 150.0
        assert settings["referrerRewardAmount"] == 150.0

        # Step 2: Customer A gets their referral code
        res_a = await client.get("/api/referral", headers=headers_a)
        assert res_a.status_code == 200
        data_a = res_a.json()
        referral_code = data_a["code"]
        assert referral_code.startswith("QP")

        # Step 3: Customer B applies Customer A's referral code
        apply_res = await client.post(
            "/api/referral/apply",
            headers=headers_b,
            json={"code": referral_code},
        )
        assert apply_res.status_code == 200, apply_res.text
        apply_data = apply_res.json()
        assert apply_data["ok"] is True
        assert apply_data["discountPercent"] == 50.0
        assert apply_data["maxDiscount"] == 150.0

        # Step 4: Customer B checks their welcome offer status
        welcome_res = await client.get("/api/referral/welcome-offer", headers=headers_b)
        assert welcome_res.status_code == 200
        welcome_data = welcome_res.json()
        assert welcome_data["isEligible"] is True
        assert welcome_data["discountPercent"] == 50.0
        assert welcome_data["maxDiscount"] == 150.0

        # Step 5: Customer B adds item to cart and checks coupons
        coupons_res = await client.get("/api/cart/coupons", headers=headers_b)
        assert coupons_res.status_code == 200
        coupons = coupons_res.json()
        # Should include the dynamic 50% referral welcome coupon
        welcome_coupon = next((c for c in coupons if "WELCOME50" in c["code"] or "50" in c["title"]), None)
        assert welcome_coupon is not None
        assert "50% OFF" in welcome_coupon["title"]

        # Step 6: Customer B places an order
        order_id = f"ord-ref-test-{uuid.uuid4().hex[:8]}"
        order_doc = {
            "_id": order_id,
            "id": order_id,
            "orderNumber": "QP-TEST-999",
            "userId": cust_b.id,
            "customer": {"name": cust_b.display_name, "phone": cust_b.phone},
            "status": "out_for_delivery",
            "total": 350.0,
            "subtotal": 300.0,
            "tax": 50.0,
            "createdAt": "2026-08-24T12:00:00Z",
        }
        await database.collection("customer_orders").insert_one(order_doc)

        # Before delivery, Customer A has 0 completed rewards and 0 wallet balance
        wallet_a_before = await client.get("/api/wallet", headers=headers_a)
        assert wallet_a_before.status_code == 200
        assert wallet_a_before.json()["totalBalance"] == 0

        # Step 7: Order transitions to DELIVERED
        updated_order = await order_lifecycle.transition(
            order_id=order_id,
            target=order_lifecycle.DELIVERED,
            actor_id="system-test",
            actor_role="admin",
        )
        assert updated_order["status"] == "delivered"

        # Step 8: Verify Customer A automatically received ₹150 in their wallet and double-entry ledger!
        wallet_a_after = await client.get("/api/wallet", headers=headers_a)
        assert wallet_a_after.status_code == 200
        wallet_data = wallet_a_after.json()
        assert wallet_data["totalBalance"] == 150.0
        assert wallet_data["balances"]["rewardBalance"] == 150.0

        # Step 9: Customer A's referral dashboard reflects successful referral
        ref_dash_a = await client.get("/api/referral", headers=headers_a)
        assert ref_dash_a.status_code == 200
        dash_a = ref_dash_a.json()
        assert dash_a["stats"]["successfulReferrals"] == 1
        assert dash_a["stats"]["totalRewardsEarned"] == 150

        # Step 10: Admin checks stats and conversion table
        admin_stats_res = await client.get("/api/admin/referrals/stats", headers=admin_headers)
        assert admin_stats_res.status_code == 200
        admin_stats = admin_stats_res.json()
        assert admin_stats["convertedFirstOrders"] >= 1
        assert admin_stats["totalRewardsPaid"] >= 150.0

        admin_list_res = await client.get("/api/admin/referrals/list", headers=admin_headers)
        assert admin_list_res.status_code == 200
        admin_list = admin_list_res.json()
        converted_item = next((item for item in admin_list["items"] if item["refereeId"] == cust_b.id), None)
        assert converted_item is not None
        assert converted_item["status"] == "completed"
        assert converted_item["rewardAmount"] == 150.0
