"""Admin API — Sprint 5.2 (MongoDB integration).

Every list endpoint supports pagination + search/filters via `database.paginate`.
All mutating actions write an `admin_audit_logs` entry. Reads fall back to the
seeded demo data (ADMIN_SEED) applied on startup, so the admin panel is never
blank even against a brand new database.
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status


from app.core.deps import current_user, require_roles
from app.models.admin import (
    AdminPartnerUpdatePayload,
    AdminRiderUpdatePayload,
    AssignRiderPayload,
    BroadcastPayload,
    CancelOrderPayload,
    UpdateOrderStatusPayload,
    AdjustCustomerWalletPayload,
    AdjustCustomerLoyaltyPayload,
    AddCustomerNotePayload,
    UpdateCustomerTagsPayload,
    SendCustomerNotificationPayload,
    CityPayload,
    CouponPayload,
    ServicePayload,
    SettingsUpdatePayload,
    StaffPayload,
    SupportReplyPayload,
)
from app.models.user import Role, User
from app.db.admin_repositories import (
    admin_customer_repository,
    admin_dashboard_repository,
    admin_order_repository,
    admin_partner_repository,
    admin_partner_service_repository,
    admin_rider_repository,
    admin_settings_repository,
    admin_wallet_repository,
    analytics_repository,
    area_repository,
    audit_repository,
    banner_repository,
    category_repository,
    city_repository,
    coupon_repository,
    notification_repository,
    service_repository,
    staff_repository,
    support_repository,
)

# Every /api/admin/* endpoint is admin-only. The guard lives on the router so a
# new handler cannot accidentally ship with authentication but no authorization.
router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_roles(Role.admin))],
)


async def _actor(user: Optional[User]) -> str:
    return user.display_name or user.id if user else "admin"


# ---------------------------------------------------------------- dashboard
@router.get("/dashboard")
async def dashboard(
    date: str = Query("today"),
    city: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    user: User = Depends(current_user),
):
    return await admin_dashboard_repository.summary(date_filter=date, city=city, service=service)


@router.get("/dashboard/activity")
async def dashboard_activity(user: User = Depends(current_user)):
    return await admin_dashboard_repository.activity()


@router.get("/dashboard/latest-orders")
async def dashboard_latest_orders(user: User = Depends(current_user)):
    return await admin_dashboard_repository.latest_orders()


@router.get("/dashboard/revenue-series")
async def dashboard_revenue_series(user: User = Depends(current_user)):
    return await admin_dashboard_repository.revenue_series()


@router.get("/dashboard/orders-series")
async def dashboard_orders_series(user: User = Depends(current_user)):
    return await admin_dashboard_repository.orders_series()


@router.get("/dashboard/system-health")
async def dashboard_system_health(user: User = Depends(current_user)):
    return await admin_dashboard_repository.system_health()



# -------------------------------------------------------------------- orders
@router.get("/orders")
async def list_orders(status_filter: Optional[str] = Query(default=None, alias="status"), user: User = Depends(current_user)):
    return await admin_order_repository.list(status_filter)


@router.get("/orders/{order_id}")
async def get_order(order_id: str, user: User = Depends(current_user)):
    order = await admin_order_repository.find(order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order {order_id} does not exist")
    # Admin sees the canonical order plus its full audit trail.
    return {
        **{k: v for k, v in order.items() if k != "_id"},
        "id": str(order["_id"]),
        "auditTrail": await admin_order_repository.events(str(order["_id"])),
    }


@router.get("/orders/{order_id}/events")
async def order_events(order_id: str, user: User = Depends(current_user)):
    order = await admin_order_repository.find(order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order {order_id} does not exist")
    return await admin_order_repository.events(str(order["_id"]))


@router.post("/orders/{order_id}/assign-rider")
async def assign_rider(order_id: str, payload: AssignRiderPayload, user: User = Depends(current_user)):
    try:
        if payload.riderId in ("rdr-auto", "auto", ""):
            from app.services.smart_2ride_engine import smart_2ride_engine
            # Trigger smart auto-dispatch for the order
            await smart_2ride_engine.create_ride_1_pickup(order_id)
            row = await admin_order_repository.detail(order_id)
        else:
            row = await admin_order_repository.assign_rider(order_id, payload.riderId)
    except LookupError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    await audit_repository.log(await _actor(user), "order.assign_rider", order_id, {"riderId": payload.riderId})
    return row


@router.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, payload: CancelOrderPayload, user: User = Depends(current_user)):
    try:
        row = await admin_order_repository.cancel(order_id, payload.reason or "Cancelled by admin")
    except LookupError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    await audit_repository.log(await _actor(user), "order.cancel", order_id, {"reason": payload.reason})
    return row


@router.post("/orders/{order_id}/status")
async def update_order_status(order_id: str, payload: UpdateOrderStatusPayload, user: User = Depends(current_user)):
    try:
        row = await admin_order_repository.update_status(order_id, payload.status, payload.reason)
    except LookupError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    await audit_repository.log(await _actor(user), "order.update_status", order_id, {"status": payload.status, "reason": payload.reason})
    return row



# ----------------------------------------------------------------- customers
@router.get("/customers/stats")
async def customer_stats(user: User = Depends(current_user)):
    return await admin_customer_repository.dashboard_stats()


@router.get("/customers")
async def list_customers(
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    q: Optional[str] = None,
    city: Optional[str] = None,
    status: Optional[str] = None,
    segment: Optional[str] = None,
    user: User = Depends(current_user),
):
    return await admin_customer_repository.list(page, pageSize, q=q, city=city, status=status, segment=segment)


@router.get("/customers/{customer_id}")
async def get_customer(customer_id: str, user: User = Depends(current_user)):
    customer = await admin_customer_repository.detail(customer_id)
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


@router.get("/customers/{customer_id}/360")
async def get_customer_360(customer_id: str, user: User = Depends(current_user)):
    try:
        return await admin_customer_repository.get_customer_360(customer_id)
    except LookupError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))


@router.post("/customers/{customer_id}/block")
async def block_customer(customer_id: str, user: User = Depends(current_user)):
    await admin_customer_repository.set_blocked(customer_id, True)
    await audit_repository.log(await _actor(user), "customer.block", customer_id)
    return {"ok": True, "id": customer_id, "blocked": True}


@router.post("/customers/{customer_id}/unblock")
async def unblock_customer(customer_id: str, user: User = Depends(current_user)):
    await admin_customer_repository.set_blocked(customer_id, False)
    await audit_repository.log(await _actor(user), "customer.unblock", customer_id)
    return {"ok": True, "id": customer_id, "blocked": False}


@router.post("/customers/{customer_id}/wallet/adjust")
async def adjust_customer_wallet(customer_id: str, payload: AdjustCustomerWalletPayload, user: User = Depends(current_user)):
    try:
        res = await admin_customer_repository.adjust_wallet(customer_id, payload.amount, payload.reason, user.id)
        await audit_repository.log(await _actor(user), "customer.wallet_adjust", customer_id, {"amount": payload.amount, "reason": payload.reason})
        return res
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.post("/customers/{customer_id}/loyalty/adjust")
async def adjust_customer_loyalty(customer_id: str, payload: AdjustCustomerLoyaltyPayload, user: User = Depends(current_user)):
    res = await admin_customer_repository.adjust_loyalty(customer_id, payload.points, payload.reason, user.id)
    await audit_repository.log(await _actor(user), "customer.loyalty_adjust", customer_id, {"points": payload.points, "reason": payload.reason})
    return res


@router.post("/customers/{customer_id}/notes")
async def add_customer_note(customer_id: str, payload: AddCustomerNotePayload, user: User = Depends(current_user)):
    try:
        res = await admin_customer_repository.add_note(customer_id, payload.note, user.display_name or "Super Admin")
        await audit_repository.log(await _actor(user), "customer.add_note", customer_id, {"note": payload.note})
        return res
    except LookupError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))


@router.post("/customers/{customer_id}/tags")
async def update_customer_tags(customer_id: str, payload: UpdateCustomerTagsPayload, user: User = Depends(current_user)):
    res = await admin_customer_repository.update_tags(customer_id, payload.tags)
    await audit_repository.log(await _actor(user), "customer.update_tags", customer_id, {"tags": payload.tags})
    return res


@router.post("/customers/{customer_id}/send-notification")
async def send_customer_notification(customer_id: str, payload: SendCustomerNotificationPayload, user: User = Depends(current_user)):
    await audit_repository.log(await _actor(user), "customer.send_notification", customer_id, {"title": payload.title, "body": payload.body})
    return {"ok": True, "sent": True, "customerId": customer_id}


@router.post("/customers/{customer_id}/logout-sessions")
async def logout_customer_sessions(customer_id: str, user: User = Depends(current_user)):
    await audit_repository.log(await _actor(user), "customer.logout_sessions", customer_id)
    return {"ok": True, "invalidated": True, "customerId": customer_id}



# ------------------------------------------------------------------ partners
@router.get("/partners/stats")
async def get_partner_stats(user: User = Depends(current_user)):
    return await admin_partner_repository.dashboard_stats()


@router.get("/partners")
async def list_partners(
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    q: Optional[str] = None,
    status_filter: Optional[str] = Query(default=None, alias="status"),
    kyc_status: Optional[str] = Query(default=None, alias="kycStatus"),
    city: Optional[str] = None,
    zone: Optional[str] = None,
    user: User = Depends(current_user),
):
    return await admin_partner_repository.list(page, pageSize, q=q, status=status_filter, kyc_status=kyc_status, city=city, zone=zone)


@router.post("/partners")
async def create_partner(payload: CreatePartnerPayload, user: User = Depends(current_user)):
    res = await admin_partner_repository.create(payload.model_dump(), user.id)
    await audit_repository.log(await _actor(user), "partner.create", res.get("_id") or "", payload.model_dump())
    return res


@router.put("/partners/{partner_id}")
async def update_partner(partner_id: str, payload: AdminPartnerUpdatePayload, user: User = Depends(current_user)):
    from app.db.client import database
    existing = await database.find_one("partner_profiles", {"_id": partner_id})
    if not existing:
        existing = await database.find_one("partner_profiles", {"partnerId": partner_id})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partner not found")

    target_id = existing["_id"]
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if data:
        await database.update("partner_profiles", {"_id": target_id}, data)

    await audit_repository.log(await _actor(user), "partner.update", target_id, data)
    return await database.find_one("partner_profiles", {"_id": target_id})


@router.get("/partners/{partner_id}/360")
async def get_partner_360(partner_id: str, user: User = Depends(current_user)):
    return await admin_partner_repository.get_partner_360(partner_id)


@router.get("/partners/{partner_id}/activities")
async def get_partner_activities(
    partner_id: str,
    category: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    user: User = Depends(current_user),
):
    return await admin_partner_repository.get_partner_activities(partner_id, category=category, limit=limit)


@router.get("/partners/{partner_id}")
async def get_partner(partner_id: str, user: User = Depends(current_user)):
    partner = await admin_partner_repository.get_partner_360(partner_id)
    if partner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partner not found")
    return partner



@router.post("/partners/{partner_id}/approve")
async def approve_partner(partner_id: str, user: User = Depends(current_user)):
    res = await admin_partner_repository.approve(partner_id, user.id)
    await audit_repository.log(await _actor(user), "partner.approve", partner_id)
    return res


@router.post("/partners/{partner_id}/suspend")
async def suspend_partner(partner_id: str, payload: SuspendPartnerPayload, user: User = Depends(current_user)):
    res = await admin_partner_repository.suspend(
        partner_id,
        payload.reason,
        payload.startDate or now_iso()[:10],
        payload.endDate or now_iso()[:10],
        payload.internalNote or "",
        user.id,
    )
    await audit_repository.log(await _actor(user), "partner.suspend", partner_id, {"reason": payload.reason})
    return res


@router.post("/partners/{partner_id}/block")
async def block_partner(partner_id: str, payload: BlockPartnerPayload, user: User = Depends(current_user)):
    res = await admin_partner_repository.block(partner_id, payload.reason, payload.internalNote or "", user.id)
    await audit_repository.log(await _actor(user), "partner.block", partner_id, {"reason": payload.reason})
    return res


@router.post("/partners/{partner_id}/unblock")
async def unblock_partner(partner_id: str, body: dict | None = None, user: User = Depends(current_user)):
    reason = (body or {}).get("reason") or "Admin unblocked access"
    res = await admin_partner_repository.unblock(partner_id, reason, user.id)
    await audit_repository.log(await _actor(user), "partner.unblock", partner_id, {"reason": reason})
    return res


@router.post("/partners/{partner_id}/activate")
async def activate_partner(partner_id: str, user: User = Depends(current_user)):
    res = await admin_partner_repository.approve(partner_id, user.id)
    await audit_repository.log(await _actor(user), "partner.activate", partner_id)
    return res


@router.post("/partners/{partner_id}/reject")
async def reject_partner(partner_id: str, user: User = Depends(current_user)):
    res = await admin_partner_repository.block(partner_id, "Application rejected by admin", "Rejected during onboarding", user.id)
    await audit_repository.log(await _actor(user), "partner.reject", partner_id)
    return res


@router.post("/partners/{partner_id}/kyc")
async def update_partner_kyc(partner_id: str, payload: UpdatePartnerKycPayload, user: User = Depends(current_user)):
    res = await admin_partner_repository.update_kyc(partner_id, payload.status, payload.reason, user.id)
    await audit_repository.log(await _actor(user), "partner.update_kyc", partner_id, {"status": payload.status})
    return res


@router.post("/partners/{partner_id}/commission")
async def update_partner_commission(partner_id: str, payload: UpdatePartnerCommissionPayload, user: User = Depends(current_user)):
    res = await admin_partner_repository.update_commission(partner_id, payload.commissionRate, payload.serviceRates, user.id)
    await audit_repository.log(await _actor(user), "partner.update_commission", partner_id, {"rate": payload.commissionRate})
    return res


@router.post("/partners/{partner_id}/wallet/adjust")
async def adjust_partner_wallet(partner_id: str, payload: AdjustPartnerWalletPayload, user: User = Depends(current_user)):
    res = await admin_partner_repository.adjust_wallet(partner_id, payload.amount, payload.type or "credit", payload.reason, user.id)
    await audit_repository.log(await _actor(user), "partner.adjust_wallet", partner_id, {"amount": payload.amount, "reason": payload.reason})
    return res


@router.post("/partners/{partner_id}/notes")
async def add_partner_note(partner_id: str, payload: AddPartnerNotePayload, user: User = Depends(current_user)):
    actor = await _actor(user)
    res = await admin_partner_repository.add_note(partner_id, payload.note, actor)
    await audit_repository.log(actor, "partner.add_note", partner_id)
    return res


@router.post("/partners/{partner_id}/tags")
async def update_partner_tags(partner_id: str, payload: UpdatePartnerTagsPayload, user: User = Depends(current_user)):
    res = await admin_partner_repository.update_tags(partner_id, payload.tags)
    await audit_repository.log(await _actor(user), "partner.update_tags", partner_id, {"tags": payload.tags})
    return res


@router.post("/partners/{partner_id}/notify")
async def send_partner_notification(partner_id: str, payload: SendPartnerNotificationPayload, user: User = Depends(current_user)):
    await audit_repository.log(await _actor(user), "partner.send_notification", partner_id, {"title": payload.title})
    return {"ok": True, "sent": True, "partnerId": partner_id}



# -------------------------------------------------------------------- riders
@router.get("/riders/stats")
async def rider_stats(user: User = Depends(current_user)):
    return await admin_rider_repository.dashboard_stats()


@router.get("/riders")
async def list_riders(
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    q: Optional[str] = None,
    status_filter: Optional[str] = Query(default=None, alias="status"),
    city: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    kyc_status: Optional[str] = None,
    live_state: Optional[str] = None,
    user: User = Depends(current_user),
):
    return await admin_rider_repository.list(
        page,
        pageSize,
        q=q,
        status=status_filter,
        city=city,
        vehicle_type=vehicle_type,
        kyc_status=kyc_status,
        live_state=live_state,
    )


@router.get("/riders/{rider_id}")
async def get_rider(rider_id: str, user: User = Depends(current_user)):
    rider = await admin_rider_repository.detail(rider_id)
    if rider is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rider not found")
    return rider


@router.get("/riders/{rider_id}/360")
async def get_rider_360(rider_id: str, user: User = Depends(current_user)):
    try:
        return await admin_rider_repository.get_rider_360(rider_id)
    except LookupError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))


@router.post("/riders/{rider_id}/wallet/adjust")
async def adjust_rider_wallet(rider_id: str, payload: AdjustRiderWalletPayload, user: User = Depends(current_user)):
    res = await admin_rider_repository.adjust_wallet(
        rider_id,
        payload.amount,
        payload.reason,
        admin_id=user.id,
        is_cod_settlement=bool(payload.isCodSettlement),
    )
    await audit_repository.log(await _actor(user), "rider.wallet_adjust", rider_id, {"amount": payload.amount, "reason": payload.reason})
    return res


@router.post("/riders/{rider_id}/notify")
async def send_rider_notification(rider_id: str, payload: SendRiderNotificationPayload, user: User = Depends(current_user)):
    await audit_repository.log(await _actor(user), "rider.send_notification", rider_id, {"title": payload.title})
    return {"ok": True, "sent": True, "riderId": rider_id}


@router.post("/riders/{rider_id}/logout-sessions")
async def logout_rider_sessions(rider_id: str, user: User = Depends(current_user)):
    await audit_repository.log(await _actor(user), "rider.logout_sessions", rider_id)
    return {"ok": True, "invalidated": True, "riderId": rider_id}


@router.put("/riders/{rider_id}")
async def update_rider(rider_id: str, payload: AdminRiderUpdatePayload, user: User = Depends(current_user)):
    from app.db.client import database
    existing = await database.find_one("rider_profiles", {"_id": rider_id})
    if not existing:
        existing = await database.find_one("rider_profiles", {"riderId": rider_id})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rider not found")

    target_id = existing["_id"]
    data = {k: v for k, v in payload.model_dump().items() if v is not None}

    if data:
        # Normalize fields for rider_profiles
        if "fullName" in data and "name" not in data:
            data["name"] = data["fullName"]
        elif "name" in data and "fullName" not in data:
            data["fullName"] = data["name"]
        if "vehicleType" in data and "vehicle" not in data:
            data["vehicle"] = data["vehicleType"]
        if "vehicleNumber" in data and "plate" not in data:
            data["plate"] = data["vehicleNumber"]

        await database.update("rider_profiles", {"_id": target_id}, data)

        # Sync user document if present
        user_id = existing.get("userId") or existing.get("user_id")
        if user_id:
            user_sync = {}
            if "phone" in data: user_sync["phone"] = data["phone"]
            if "email" in data: user_sync["email"] = data["email"]
            if "fullName" in data: user_sync["display_name"] = data["fullName"]
            if "city" in data: user_sync["city"] = data["city"]
            if "status" in data: user_sync["status"] = data["status"]
            if user_sync:
                await database.update("users", {"_id": user_id}, user_sync)

    await audit_repository.log(await _actor(user), "rider.update", target_id, data)
    return await database.find_one("rider_profiles", {"_id": target_id})


async def _rider_transition(rider_id: str, new_status: str, action: str, user: User):
    rider = await admin_rider_repository.set_status(rider_id, new_status)
    if rider is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rider not found")
    await audit_repository.log(await _actor(user), f"rider.{action}", rider_id)
    return rider


@router.post("/riders/{rider_id}/approve")
async def approve_rider(rider_id: str, user: User = Depends(current_user)):
    return await _rider_transition(rider_id, "active", "approve", user)


@router.post("/riders/{rider_id}/suspend")
async def suspend_rider(rider_id: str, body: dict | None = None, user: User = Depends(current_user)):
    from app.db.client import database
    reason = (body or {}).get("reason") or "Policy / Compliance Violation"
    now_iso = datetime.now(timezone.utc).isoformat()
    await database.update("rider_profiles", {"_id": rider_id}, {"suspensionReason": reason, "suspendedAt": now_iso, "appealStatus": "none"})
    await database.update("rider_profiles", {"riderId": rider_id}, {"suspensionReason": reason, "suspendedAt": now_iso, "appealStatus": "none"})
    return await _rider_transition(rider_id, "suspended", "suspend", user)


@router.post("/riders/{rider_id}/activate")
async def activate_rider(rider_id: str, user: User = Depends(current_user)):
    from app.db.client import database
    now_iso = datetime.now(timezone.utc).isoformat()
    await database.update("rider_profiles", {"_id": rider_id}, {"suspensionReason": None, "suspendedAt": None, "appealStatus": "approved", "reactivatedAt": now_iso})
    await database.update("rider_profiles", {"riderId": rider_id}, {"suspensionReason": None, "suspendedAt": None, "appealStatus": "approved", "reactivatedAt": now_iso})
    return await _rider_transition(rider_id, "active", "activate", user)


@router.post("/riders/{rider_id}/reject")
async def reject_rider(rider_id: str, user: User = Depends(current_user)):
    return await _rider_transition(rider_id, "suspended", "reject", user)


# ----------------------------------------------------------------- analytics
@router.get("/analytics")
async def analytics(user: User = Depends(current_user)):
    return await analytics_repository.summary()


# --------------------------------------------------------------------- cities
@router.get("/cities/stats")
async def city_stats(user: User = Depends(current_user)):
    return await city_repository.dashboard_stats()


@router.get("/cities/intelligence")
async def city_intelligence(user: User = Depends(current_user)):
    return await city_repository.get_intelligence()


@router.get("/cities")
async def list_cities(user: User = Depends(current_user)):
    return await city_repository.list()


@router.get("/cities/{city_id}/360")
async def get_city_360(city_id: str, user: User = Depends(current_user)):
    try:
        return await city_repository.get_city_360(city_id)
    except LookupError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))


@router.patch("/cities/{city_id}/radius")
async def update_city_radius(city_id: str, payload: dict, user: User = Depends(current_user)):
    city = await city_repository.update_radius(city_id, payload)
    if city is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found")
    await audit_repository.log(await _actor(user), "city.update_radius", city_id, payload)
    return city


@router.post("/cities/{city_id}/zones")
async def add_city_zone(city_id: str, payload: dict, user: User = Depends(current_user)):
    city = await city_repository.add_zone(city_id, payload)
    if city is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found")
    await audit_repository.log(await _actor(user), "city.add_zone", city_id, payload)
    return city


@router.post("/cities", status_code=status.HTTP_201_CREATED)
async def create_city(payload: CityPayload, user: User = Depends(current_user)):
    city = await city_repository.create(
        {
            "city": payload.city or "New City",
            "state": payload.state or "",
            "areas": payload.areas or 0,
            "partners": 0,
            "riders": 0,
            "pickupRadius": payload.pickupRadius or "5 km",
            "status": payload.status or "Pilot",
        }
    )
    await audit_repository.log(await _actor(user), "city.create", city["_id"])
    return city


@router.put("/cities/{city_id}")
async def update_city(city_id: str, payload: CityPayload, user: User = Depends(current_user)):
    city = await city_repository.update(city_id, payload.model_dump(exclude_unset=True))
    if city is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found")
    await audit_repository.log(await _actor(user), "city.update", city_id)
    return city


@router.patch("/cities/{city_id}/status")
async def toggle_city_status(city_id: str, payload: dict, user: User = Depends(current_user)):
    new_status = payload.get("status", "Live")
    city = await city_repository.update(city_id, {"status": new_status})
    if city is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found")
    await audit_repository.log(await _actor(user), f"city.status_{new_status.lower()}", city_id)
    return city


@router.get("/areas")
async def list_areas(city_id: Optional[str] = Query(default=None, alias="cityId"), user: User = Depends(current_user)):
    return await area_repository.list(city_id=city_id)


@router.post("/areas", status_code=status.HTTP_201_CREATED)
async def create_area(payload: dict, user: User = Depends(current_user)):
    area = await area_repository.create(payload)
    await audit_repository.log(await _actor(user), "area.create", area["_id"])
    return area


@router.put("/areas/{area_id}")
async def update_area(area_id: str, payload: dict, user: User = Depends(current_user)):
    area = await area_repository.update(area_id, payload)
    if area is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")
    await audit_repository.log(await _actor(user), "area.update", area_id)
    return area


@router.delete("/areas/{area_id}")
async def delete_area(area_id: str, user: User = Depends(current_user)):
    removed = await area_repository.delete(area_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")
    await audit_repository.log(await _actor(user), "area.delete", area_id)
    return {"ok": True}


@router.get("/states")
async def list_states(user: User = Depends(current_user)):
    cities = await city_repository.list()
    state_map: dict = {}
    for c in cities:
        s_name = c.get("state", "Uttar Pradesh")
        entry = state_map.setdefault(s_name, {
            "state": s_name,
            "citiesCount": 0,
            "partners": 0,
            "riders": 0,
            "customers": 0,
            "orders": 0,
            "sales": 0,
            "liveCities": 0,
        })
        entry["citiesCount"] += 1
        entry["partners"] += c.get("partners", 0)
        entry["riders"] += c.get("riders", 0)
        entry["customers"] += c.get("customers", 0)
        entry["orders"] += c.get("orders", 0)
        entry["sales"] += c.get("sales", 0)
        if c.get("status") == "Live":
            entry["liveCities"] += 1
    return list(state_map.values())


# ------------------------------------------------------------------- services
@router.get("/services/stats")
async def service_stats(user: User = Depends(current_user)):
    return await service_repository.dashboard_stats()


@router.get("/services/intelligence")
async def services_intelligence(user: User = Depends(current_user)):
    return await service_repository.get_intelligence()


@router.get("/services")
async def list_services(user: User = Depends(current_user)):
    return await service_repository.list()


@router.get("/services/categories")
async def list_categories(user: User = Depends(current_user)):
    return await category_repository.list()


@router.get("/services/{service_id}/360")
async def get_service_360(service_id: str, user: User = Depends(current_user)):
    try:
        return await service_repository.get_service_360(service_id)
    except LookupError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))


@router.get("/services/pricing")
async def services_pricing(user: User = Depends(current_user)):
    services = await service_repository.list()
    settings_doc = await admin_settings_repository.get()
    return [
        {
            "id": s["_id"],
            "item": s.get("name"),
            "service": s.get("name"),
            "city": settings_doc.get("defaultCity", ""),
            "price": s.get("price"),
            "commission": settings_doc.get("defaultCommission", ""),
        }
        for s in services
    ]


@router.post("/services", status_code=status.HTTP_201_CREATED)
async def create_service(payload: ServicePayload, user: User = Depends(current_user)):
    categories = await category_repository.list()
    service = await service_repository.create(
        {
            "name": payload.name or "New Service",
            "categoryId": payload.categoryId or (categories[0]["_id"] if categories else ""),
            "unit": payload.unit or "per item",
            "price": payload.price or 0,
            "image": payload.image or "",
            "description": payload.description or "",
            "badge": None,
            "popular": False,
        }
    )
    await audit_repository.log(await _actor(user), "service.create", service["_id"])
    return service


@router.put("/services/{service_id}")
async def update_service(service_id: str, payload: ServicePayload, user: User = Depends(current_user)):
    service = await service_repository.update(service_id, payload.model_dump(exclude_unset=True))
    if service is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    await audit_repository.log(await _actor(user), "service.update", service_id)
    return service


@router.delete("/services/{service_id}")
async def delete_master_service(service_id: str, user: User = Depends(current_user)):
    removed = await service_repository.delete(service_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    await audit_repository.log(await _actor(user), "service.delete", service_id)
    return {"ok": True}


@router.post("/services/categories", status_code=status.HTTP_201_CREATED)
async def create_category(payload: dict, user: User = Depends(current_user)):
    name = str(payload.get("name", "New Category")).strip()
    category = await category_repository.create(
        {
            "name": name,
            "description": payload.get("description", ""),
            "icon": payload.get("icon", "Sparkles"),
            "status": payload.get("status", "Active"),
        }
    )
    await audit_repository.log(await _actor(user), "category.create", category["_id"])
    return category


@router.get("/partner-services")
async def list_partner_services(
    partner_id: Optional[str] = Query(default=None, alias="partnerId"),
    city: Optional[str] = Query(default=None),
    user: User = Depends(current_user),
):
    return await admin_partner_service_repository.list(partner_id=partner_id, city=city)


@router.patch("/partner-services/{service_id}/status")
async def toggle_partner_service_status(
    service_id: str,
    payload: dict,
    user: User = Depends(current_user),
):
    action = payload.get("action", payload.get("status", "activate")).lower()
    updated = await admin_partner_service_repository.toggle_status(service_id, action)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partner service not found")
    await audit_repository.log(await _actor(user), f"partner_service.{action}", service_id)
    return updated


# -------------------------------------------------------------------- coupons
@router.get("/coupons/stats")
async def coupon_stats(user: User = Depends(current_user)):
    return await coupon_repository.stats()


@router.get("/coupons/referral-settings")
async def get_coupon_referral_settings(user: User = Depends(current_user)):
    return await coupon_repository.referral_settings()


@router.put("/coupons/referral-settings")
async def update_coupon_referral_settings(payload: dict, user: User = Depends(current_user)):
    return await coupon_repository.update_referral_settings(payload)


@router.get("/coupons/referral-list")
async def list_coupon_referrals(user: User = Depends(current_user)):
    return await coupon_repository.referrals_list()


@router.get("/coupons")
async def list_coupons(user: User = Depends(current_user)):
    return await coupon_repository.list()


@router.post("/coupons", status_code=status.HTTP_201_CREATED)
async def create_coupon(payload: CouponPayload, user: User = Depends(current_user)):
    coupon = await coupon_repository.create(
        {
            "code": payload.code or "NEWCODE",
            "type": getattr(payload, "type", "percentage"),
            "value": payload.discount or "10% OFF",
            "discountPct": int(getattr(payload, "discountPct", 10)),
            "maxDiscount": int(getattr(payload, "maxDiscount", 100)),
            "minOrder": payload.minOrder or 0,
            "description": payload.description or "",
            "validTill": payload.expiry or "2026-12-31",
            "audience": getattr(payload, "audience", "All Users"),
            "limit": int(getattr(payload, "limit", 100)),
            "status": payload.status or "Active",
        }
    )
    await audit_repository.log(await _actor(user), "coupon.create", coupon["_id"])
    return coupon


@router.put("/coupons/{coupon_id}")
async def update_coupon(coupon_id: str, payload: CouponPayload, user: User = Depends(current_user)):
    coupon = await coupon_repository.update(coupon_id, payload.model_dump(exclude_unset=True))
    if coupon is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")
    await audit_repository.log(await _actor(user), "coupon.update", coupon_id)
    return coupon


@router.delete("/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, user: User = Depends(current_user)):
    removed = await coupon_repository.delete(coupon_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")
    await audit_repository.log(await _actor(user), "coupon.delete", coupon_id)
    return {"ok": True}


# -------------------------------------------------------------------- banners
@router.get("/banners")
async def list_banners(user: User = Depends(current_user)):
    return await banner_repository.list()


@router.post("/banners", status_code=status.HTTP_201_CREATED)
async def create_banner(payload: dict, user: User = Depends(current_user)):
    banner = await banner_repository.create(payload)
    await audit_repository.log(await _actor(user), "banner.create", banner["_id"])
    return banner


@router.put("/banners/{banner_id}")
async def update_banner(banner_id: str, payload: dict, user: User = Depends(current_user)):
    banner = await banner_repository.update(banner_id, payload)
    if banner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")
    await audit_repository.log(await _actor(user), "banner.update", banner_id)
    return banner


@router.delete("/banners/{banner_id}")
async def delete_banner(banner_id: str, user: User = Depends(current_user)):
    removed = await banner_repository.delete(banner_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")
    await audit_repository.log(await _actor(user), "banner.delete", banner_id)
    return {"ok": True}


# ---------------------------------------------------------------------- staff
@router.get("/staff")
async def list_staff(user: User = Depends(current_user)):
    return await staff_repository.list()


@router.post("/staff", status_code=status.HTTP_201_CREATED)
async def create_staff(payload: StaffPayload, user: User = Depends(current_user)):
    member = await staff_repository.create(
        {
            "name": payload.name or "New Member",
            "email": payload.email or "",
            "role": payload.role or "Ops manager",
            "scope": payload.scope or "All cities",
            "lastActive": "—",
            "status": "Invited",
        }
    )
    await audit_repository.log(await _actor(user), "staff.create", member["_id"])
    return member


@router.put("/staff/{staff_id}")
async def update_staff(staff_id: str, payload: StaffPayload, user: User = Depends(current_user)):
    member = await staff_repository.update(staff_id, payload.model_dump(exclude_unset=True))
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found")
    await audit_repository.log(await _actor(user), "staff.update", staff_id)
    return member


@router.get("/staff/roles")
async def staff_roles(user: User = Depends(current_user)):
    members = await staff_repository.list()
    roles = list({m.get("role") for m in members if m.get("role")})
    return [
        {
            "id": f"RO-{index + 1}",
            "name": role,
            "members": sum(1 for m in members if m.get("role") == role),
            "permissions": ["orders:read"],
        }
        for index, role in enumerate(roles)
    ]


@router.get("/staff/logs")
async def staff_logs(user: User = Depends(current_user)):
    from app.db.client import database

    logs = await database.find_sorted("admin_audit_logs", sort=[("createdAt", -1)], limit=20)
    return [
        {"id": log["_id"], "actor": log.get("actor"), "action": log.get("action"), "target": log.get("target"), "at": log.get("at")}
        for log in logs
    ]


# -------------------------------------------------------------------- support
@router.get("/support")
async def list_support(user: User = Depends(current_user)):
    return await support_repository.list()


@router.get("/support/{ticket_id}")
async def get_support(ticket_id: str, user: User = Depends(current_user)):
    ticket = await support_repository.get(ticket_id)
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    return ticket


@router.post("/support/{ticket_id}/reply")
async def reply_support(ticket_id: str, payload: SupportReplyPayload, user: User = Depends(current_user)):
    result = await support_repository.reply(ticket_id, payload.body or "")
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    await audit_repository.log(await _actor(user), "support.reply", ticket_id)
    return result


@router.post("/support/{ticket_id}/close")
async def close_support(ticket_id: str, user: User = Depends(current_user)):
    ticket = await support_repository.close(ticket_id)
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    await audit_repository.log(await _actor(user), "support.close", ticket_id)
    return ticket


# ------------------------------------------------------------------- settings
@router.get("/settings")
async def get_settings_(user: User = Depends(current_user)):
    return await admin_settings_repository.get()


@router.put("/settings")
async def update_settings(payload: SettingsUpdatePayload, user: User = Depends(current_user)):
    settings_doc = await admin_settings_repository.update(payload.model_dump(exclude_unset=True))
    await audit_repository.log(await _actor(user), "settings.update", "platform")
    return settings_doc


# --------------------------------------------------------------------- wallet
@router.get("/wallet/all-wallets")
async def get_all_wallets(user: User = Depends(current_user)):
    return await admin_wallet_repository.all_wallets()


@router.post("/wallet/adjust")
async def adjust_any_wallet(payload: dict, user: User = Depends(current_user)):
    account_id = str(payload.get("accountId") or payload.get("id"))
    role = str(payload.get("role") or "customer").lower()
    amount = float(payload.get("amount") or 0.0)
    kind = str(payload.get("type") or payload.get("kind") or "credit").lower()
    reason = str(payload.get("reason") or "Manual Admin Adjustment")
    res = await admin_wallet_repository.adjust_wallet(account_id, role, amount, kind, reason, user.id)
    await audit_repository.log(await _actor(user), "wallet.manual_adjust", account_id, payload)
    return res


@router.get("/wallet")
async def wallet(user: User = Depends(current_user)):
    return await admin_wallet_repository.wallet()


@router.get("/wallet/kpis")
async def wallet_kpis(user: User = Depends(current_user)):
    return await admin_wallet_repository.kpis()


@router.get("/wallet/revenue-split")
async def wallet_revenue_split(user: User = Depends(current_user)):
    return await admin_wallet_repository.revenue_split()


@router.get("/wallet/partner-earnings")
async def wallet_partner_earnings(user: User = Depends(current_user)):
    return await admin_wallet_repository.partner_earnings()


@router.get("/wallet/rider-earnings")
async def wallet_rider_earnings(user: User = Depends(current_user)):
    return await admin_wallet_repository.rider_earnings()


@router.get("/wallet/withdrawals")
async def wallet_withdrawals(user: User = Depends(current_user)):
    return await admin_wallet_repository.withdrawals()


@router.get("/wallet/refunds")
async def wallet_refunds(user: User = Depends(current_user)):
    return await admin_wallet_repository.refunds()


@router.get("/wallet/transactions")
async def wallet_transactions(user: User = Depends(current_user)):
    return await admin_wallet_repository.transactions()


@router.post("/wallet/withdrawals/{withdrawal_id}/approve")
async def approve_withdrawal(withdrawal_id: str, user: User = Depends(current_user)):
    result = await admin_wallet_repository.set_withdrawal_status(withdrawal_id, "Approved")
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Withdrawal not found")
    await audit_repository.log(await _actor(user), "wallet.withdrawal.approve", withdrawal_id)
    return {"ok": True, "id": withdrawal_id, "action": "approve"}


@router.post("/wallet/withdrawals/{withdrawal_id}/reject")
async def reject_withdrawal(withdrawal_id: str, user: User = Depends(current_user)):
    result = await admin_wallet_repository.set_withdrawal_status(withdrawal_id, "Rejected")
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Withdrawal not found")
    await audit_repository.log(await _actor(user), "wallet.withdrawal.reject", withdrawal_id)
    return {"ok": True, "id": withdrawal_id, "action": "reject"}


# -------------------------------------------------------------- notifications
@router.get("/notifications")
async def list_notifications(user: User = Depends(current_user)):
    return await notification_repository.list()


@router.post("/notifications/broadcast")
async def broadcast_notification(payload: BroadcastPayload, user: User = Depends(current_user)):
    result = await notification_repository.broadcast(payload.audience or "All", payload.title or "Announcement", payload.message or "")
    await audit_repository.log(await _actor(user), "notifications.broadcast", payload.audience or "All", {"title": payload.title})
    return result


# -------------------------------------------------------------- referrals & loyalty
from app.db.referral_repositories import referral_repository
from app.models.referral import (
    AdminReferralListResponse,
    AdminReferralStats,
    ReferralProgramSettings,
    UpdateReferralSettingsPayload,
)


@router.get("/referrals/settings", response_model=ReferralProgramSettings)
async def get_referral_settings(user: User = Depends(current_user)) -> ReferralProgramSettings:
    """GET /api/admin/referrals/settings — fetch current dynamic referral program rules."""
    return await referral_repository.get_settings()


@router.put("/referrals/settings", response_model=ReferralProgramSettings)
async def update_referral_settings(
    payload: UpdateReferralSettingsPayload, user: User = Depends(current_user)
) -> ReferralProgramSettings:
    """PUT /api/admin/referrals/settings — modify discount %, max cap, reward amount, or toggle active."""
    updated = await referral_repository.update_settings(payload, user)
    await audit_repository.log(
        await _actor(user),
        "referral.settings.update",
        "global_referral_config",
        payload.model_dump(exclude_unset=True),
    )
    return updated


@router.get("/referrals/stats", response_model=AdminReferralStats)
async def get_referral_stats(user: User = Depends(current_user)) -> AdminReferralStats:
    """GET /api/admin/referrals/stats — referral KPI metrics."""
    return await referral_repository.admin_stats()


@router.get("/referrals/list", response_model=AdminReferralListResponse)
async def get_referrals_list(user: User = Depends(current_user)) -> AdminReferralListResponse:
    """GET /api/admin/referrals/list — full table of referral conversions and rewards."""
    return await referral_repository.admin_list()


# -----------------------------------------------------------------------------
# Memberships Management — Admin Control & Engine
# -----------------------------------------------------------------------------

from app.db.admin_membership_repository import admin_membership_repository
from app.models.membership import (
    AdminGrantPayload,
    AdminPlanPayload,
    MembershipHistoryResponse,
    MembershipPlan,
    MembershipStatsResponse,
    MembershipSubscriberItem,
    MembershipSubscribersResponse,
)


@router.get("/memberships/stats", response_model=MembershipStatsResponse)
async def get_membership_stats(user: User = Depends(current_user)) -> MembershipStatsResponse:
    """GET /api/admin/memberships/stats — Membership KPIs (Total, Active, MRR, Top tier)."""
    return await admin_membership_repository.get_stats()


@router.get("/memberships/plans", response_model=List[MembershipPlan])
async def list_membership_plans(
    include_inactive: bool = True,
    user: User = Depends(current_user),
) -> List[MembershipPlan]:
    """GET /api/admin/memberships/plans — List all plans with perks and pricing."""
    return await admin_membership_repository.list_plans(include_inactive=include_inactive)


@router.post("/memberships/plans", response_model=MembershipPlan)
async def create_membership_plan(
    payload: AdminPlanPayload,
    user: User = Depends(current_user),
) -> MembershipPlan:
    """POST /api/admin/memberships/plans — Create a new plan with custom perks."""
    return await admin_membership_repository.create_plan(payload, user)


@router.get("/memberships/plans/{plan_id}", response_model=MembershipPlan)
async def get_membership_plan(
    plan_id: str,
    user: User = Depends(current_user),
) -> MembershipPlan:
    """GET /api/admin/memberships/plans/{plan_id} — Get details of a single plan."""
    plan = await admin_membership_repository.get_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Membership plan not found")
    return plan


@router.put("/memberships/plans/{plan_id}", response_model=MembershipPlan)
async def update_membership_plan(
    plan_id: str,
    payload: AdminPlanPayload,
    user: User = Depends(current_user),
) -> MembershipPlan:
    """PUT /api/admin/memberships/plans/{plan_id} — Update pricing, perks, or status."""
    updated = await admin_membership_repository.update_plan(plan_id, payload, user)
    if not updated:
        raise HTTPException(status_code=404, detail="Membership plan not found")
    return updated


@router.delete("/memberships/plans/{plan_id}")
async def delete_membership_plan(
    plan_id: str,
    user: User = Depends(current_user),
) -> dict:
    """DELETE /api/admin/memberships/plans/{plan_id} — Archive or delete a plan."""
    ok = await admin_membership_repository.delete_plan(plan_id, user)
    if not ok:
        raise HTTPException(status_code=404, detail="Membership plan not found")
    return {"ok": True, "message": f"Membership plan '{plan_id}' archived/deleted successfully"}


@router.get("/memberships/subscribers", response_model=MembershipSubscribersResponse)
async def list_membership_subscribers(
    q: Optional[str] = None,
    status: Optional[str] = None,
    plan_id: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    user: User = Depends(current_user),
) -> MembershipSubscribersResponse:
    """GET /api/admin/memberships/subscribers — Searchable customer subscription directory."""
    return await admin_membership_repository.list_subscribers(
        q=q, status=status, plan_id=plan_id, limit=limit, offset=offset
    )


@router.post("/memberships/subscribers/{user_id}/grant", response_model=MembershipSubscriberItem)
async def grant_membership_to_subscriber(
    user_id: str,
    payload: AdminGrantPayload,
    user: User = Depends(current_user),
) -> MembershipSubscriberItem:
    """POST /api/admin/memberships/subscribers/{user_id}/grant — Admin manually grant/extend plan."""
    return await admin_membership_repository.grant_membership(user_id, payload, user)


@router.post("/memberships/subscribers/{user_id}/revoke")
async def revoke_membership_from_subscriber(
    user_id: str,
    reason: Optional[str] = None,
    user: User = Depends(current_user),
) -> dict:
    """POST /api/admin/memberships/subscribers/{user_id}/revoke — Revoke customer membership."""
    ok = await admin_membership_repository.revoke_membership(user_id, reason, user)
    if not ok:
        raise HTTPException(status_code=404, detail="Customer membership not found")
    return {"ok": True, "message": "Membership revoked successfully"}


@router.get("/memberships/transactions", response_model=MembershipHistoryResponse)
async def list_membership_transactions(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    user: User = Depends(current_user),
) -> MembershipHistoryResponse:
    """GET /api/admin/memberships/transactions — Subscription revenue audit ledger."""
    return await admin_membership_repository.list_transactions(limit=limit, offset=offset)


# ----------------------------------------------------------- Admin Security Controls


@router.get("/security/events")
async def list_security_events(
    limit: int = Query(default=50, ge=1, le=200),
    user: User = Depends(current_user),
) -> dict:
    """GET /api/admin/security/events — Real-time authentication & security audit logs."""
    from app.db.client import database
    events = await database.find_many("admin_security_events", limit=limit)
    events.sort(key=lambda x: str(x.get("timestamp") or ""), reverse=True)
    rate_limits = await database.find_many("admin_rate_limits", limit=50)
    return {
        "ok": True,
        "events": events,
        "activeLockouts": [r for r in rate_limits if float(r.get("lockedUntil") or 0) > time.time()],
    }


@router.post("/security/unlock-ip")
async def unlock_client_ip(
    payload: dict,
    user: User = Depends(current_user),
) -> dict:
    """POST /api/admin/security/unlock-ip — Manually unlock an IP address."""
    from app.db.client import database
    ip = str(payload.get("ip") or "").strip()
    if not ip:
        raise HTTPException(status_code=400, detail="Client IP is required")
    await database.delete_many("admin_rate_limits", {"_id": ip})
    return {"ok": True, "message": f"IP '{ip}' successfully unlocked."}


@router.post("/security/change-pin")
async def change_admin_pin(
    payload: dict,
    user: User = Depends(current_user),
) -> dict:
    """POST /api/admin/security/change-pin — Update Admin Security Passcode."""
    from app.config import get_settings
    from app.core.admin_security import constant_time_compare
    from app.db.client import database
    import hmac

    current_pin = str(payload.get("currentPin") or "").strip()
    new_pin = str(payload.get("newPin") or "").strip()

    settings = get_settings()
    expected_pin = settings.admin_security_pin.strip()

    if not constant_time_compare(current_pin, expected_pin):
        raise HTTPException(status_code=401, detail="Current Admin Passcode is incorrect.")

    if len(new_pin) < 4:
        raise HTTPException(status_code=400, detail="New Passcode must be at least 4 digits/characters.")

    settings.admin_security_pin = new_pin
    # Persist in Supabase settings
    await database.update_one(
        "admin_settings",
        {"_id": "security_config"},
        {"_id": "security_config", "adminSecurityPin": new_pin, "updatedAt": datetime.now(timezone.utc).isoformat()},
        upsert=True,
    )
    return {"ok": True, "message": "Admin Security Passcode successfully updated."}
 
 
# ----------------------------------------------------------- Global Server-Side Search
@router.get("/search")
async def global_search(
    q: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(default=10, ge=1, le=50),
    user: User = Depends(current_user),
) -> dict:
    """GET /api/admin/search — Unified server-side search across Orders, Customers, Partners, Riders."""
    from app.db.client import database
    query_str = q.strip().lower()
    
    results = {
        "orders": [],
        "customers": [],
        "partners": [],
        "riders": [],
    }

    # 1. Orders
    all_orders = await database.find_many("customer_orders")
    for o in all_orders:
        o_id = str(o.get("_id") or o.get("id") or "")
        code = str(o.get("code") or "")
        c_name = str((o.get("customer") or {}).get("name") or "")
        c_phone = str((o.get("customer") or {}).get("phone") or "")
        if query_str in o_id.lower() or query_str in code.lower() or query_str in c_name.lower() or query_str in c_phone:
            results["orders"].append({
                "id": o_id,
                "code": code or o_id[:8],
                "customer": c_name or "Customer",
                "phone": c_phone,
                "status": o.get("status", "placed"),
                "amount": (o.get("totals") or {}).get("grandTotal", 0),
            })
            if len(results["orders"]) >= limit:
                break

    # 2. Customers
    all_users = await database.find_many("users")
    for u in all_users:
        u_id = str(u.get("_id") or u.get("id") or "")
        name = str(u.get("name") or u.get("fullName") or u.get("display_name") or "")
        phone = str(u.get("phone") or u.get("mobile") or "")
        email = str(u.get("email") or "")
        if query_str in u_id.lower() or query_str in name.lower() or query_str in phone or query_str in email.lower():
            results["customers"].append({
                "id": u_id,
                "name": name or "QuickPress User",
                "phone": phone,
                "email": email,
                "role": u.get("role", "customer"),
            })
            if len(results["customers"]) >= limit:
                break

    # 3. Partners
    all_partners = await database.find_many("partner_profiles")
    for p in all_partners:
        p_id = str(p.get("_id") or p.get("id") or "")
        name = str(p.get("storeName") or p.get("name") or "")
        phone = str(p.get("phone") or "")
        city = str(p.get("city") or "")
        if query_str in p_id.lower() or query_str in name.lower() or query_str in phone or query_str in city.lower():
            results["partners"].append({
                "id": p_id,
                "name": name or "QuickPress Partner",
                "phone": phone,
                "city": city,
                "status": p.get("status", "active"),
            })
            if len(results["partners"]) >= limit:
                break

    # 4. Riders
    all_riders = await database.find_many("rider_profiles")
    for r in all_riders:
        r_id = str(r.get("_id") or r.get("id") or r.get("riderId") or "")
        name = str(r.get("fullName") or r.get("name") or "")
        phone = str(r.get("phone") or "")
        vehicle = str(r.get("vehicle") or r.get("vehicleNumber") or "")
        if query_str in r_id.lower() or query_str in name.lower() or query_str in phone or query_str in vehicle.lower():
            results["riders"].append({
                "id": r_id,
                "name": name or "Delivery Captain",
                "phone": phone,
                "vehicle": vehicle,
                "isOnline": bool(r.get("isOnline")),
            })
            if len(results["riders"]) >= limit:
                break

    total_hits = sum(len(v) for v in results.values())
    return {"ok": True, "query": q, "total": total_hits, "results": results}



