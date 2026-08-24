"""Admin API — Sprint 5.2 (MongoDB integration).

Every list endpoint supports pagination + search/filters via `database.paginate`.
All mutating actions write an `admin_audit_logs` entry. Reads fall back to the
seeded demo data (ADMIN_SEED) applied on startup, so the admin panel is never
blank even against a brand new database.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import current_user, require_roles
from app.models.admin import (
    AdminPartnerUpdatePayload,
    AdminRiderUpdatePayload,
    AssignRiderPayload,
    BroadcastPayload,
    CancelOrderPayload,
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
async def dashboard(user: User = Depends(current_user)):
    return await admin_dashboard_repository.summary()


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


# ----------------------------------------------------------------- customers
@router.get("/customers")
async def list_customers(
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    q: Optional[str] = None,
    city: Optional[str] = None,
    user: User = Depends(current_user),
):
    return await admin_customer_repository.list(page, pageSize, q=q, city=city)


@router.get("/customers/{customer_id}")
async def get_customer(customer_id: str, user: User = Depends(current_user)):
    customer = await admin_customer_repository.detail(customer_id)
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


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


# ------------------------------------------------------------------ partners
@router.get("/partners")
async def list_partners(
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    q: Optional[str] = None,
    status_filter: Optional[str] = Query(default=None, alias="status"),
    city: Optional[str] = None,
    user: User = Depends(current_user),
):
    return await admin_partner_repository.list(page, pageSize, q=q, status=status_filter, city=city)


@router.get("/partners/{partner_id}")
async def get_partner(partner_id: str, user: User = Depends(current_user)):
    partner = await admin_partner_repository.detail(partner_id)
    if partner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partner not found")
    return partner


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
        # Sync partner settings if timing or radius changed
        settings_sync = {}
        if "openingTime" in data: settings_sync["openingTime"] = data["openingTime"]
        if "closingTime" in data: settings_sync["closingTime"] = data["closingTime"]
        if "weeklyOff" in data: settings_sync["weeklyOff"] = data["weeklyOff"]
        if "pickupRadiusKm" in data: settings_sync["pickupRadiusKm"] = data["pickupRadiusKm"]
        if "deliveryRadiusKm" in data: settings_sync["deliveryRadiusKm"] = data["deliveryRadiusKm"]
        if settings_sync:
            await database.update("partner_settings", {"_id": target_id}, settings_sync)

        # Sync user document
        user_id = existing.get("userId") or existing.get("user_id")
        if user_id:
            user_sync = {}
            if "phone" in data: user_sync["phone"] = data["phone"]
            if "email" in data: user_sync["email"] = data["email"]
            if "businessName" in data: user_sync["display_name"] = data["businessName"]
            if "city" in data: user_sync["city"] = data["city"]
            if "isVerified" in data: user_sync["is_verified"] = data["isVerified"]
            if "status" in data: user_sync["status"] = data["status"]
            if user_sync:
                await database.update("users", {"_id": user_id}, user_sync)

    await audit_repository.log(await _actor(user), "partner.update", target_id, data)
    return await database.find_one("partner_profiles", {"_id": target_id})


async def _partner_transition(partner_id: str, new_status: str, action: str, user: User):
    partner = await admin_partner_repository.set_status(partner_id, new_status)
    if partner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partner not found")
    await audit_repository.log(await _actor(user), f"partner.{action}", partner_id)
    return partner


@router.post("/partners/{partner_id}/approve")
async def approve_partner(partner_id: str, user: User = Depends(current_user)):
    return await _partner_transition(partner_id, "active", "approve", user)


@router.post("/partners/{partner_id}/suspend")
async def suspend_partner(partner_id: str, user: User = Depends(current_user)):
    return await _partner_transition(partner_id, "suspended", "suspend", user)


@router.post("/partners/{partner_id}/activate")
async def activate_partner(partner_id: str, user: User = Depends(current_user)):
    return await _partner_transition(partner_id, "active", "activate", user)


@router.post("/partners/{partner_id}/reject")
async def reject_partner(partner_id: str, user: User = Depends(current_user)):
    return await _partner_transition(partner_id, "suspended", "reject", user)


# -------------------------------------------------------------------- riders
@router.get("/riders")
async def list_riders(
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    q: Optional[str] = None,
    status_filter: Optional[str] = Query(default=None, alias="status"),
    city: Optional[str] = None,
    user: User = Depends(current_user),
):
    return await admin_rider_repository.list(page, pageSize, q=q, status=status_filter, city=city)


@router.get("/riders/{rider_id}")
async def get_rider(rider_id: str, user: User = Depends(current_user)):
    rider = await admin_rider_repository.detail(rider_id)
    if rider is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rider not found")
    return rider


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
async def suspend_rider(rider_id: str, user: User = Depends(current_user)):
    return await _rider_transition(rider_id, "suspended", "suspend", user)


@router.post("/riders/{rider_id}/activate")
async def activate_rider(rider_id: str, user: User = Depends(current_user)):
    return await _rider_transition(rider_id, "active", "activate", user)


@router.post("/riders/{rider_id}/reject")
async def reject_rider(rider_id: str, user: User = Depends(current_user)):
    return await _rider_transition(rider_id, "suspended", "reject", user)


# ----------------------------------------------------------------- analytics
@router.get("/analytics")
async def analytics(user: User = Depends(current_user)):
    return await analytics_repository.summary()


# --------------------------------------------------------------------- cities
@router.get("/cities")
async def list_cities(user: User = Depends(current_user)):
    return await city_repository.list()


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
@router.get("/services")
async def list_services(user: User = Depends(current_user)):
    return await service_repository.list()


@router.get("/services/categories")
async def list_categories(user: User = Depends(current_user)):
    return await category_repository.list()


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
@router.get("/coupons")
async def list_coupons(user: User = Depends(current_user)):
    return await coupon_repository.list()


@router.post("/coupons", status_code=status.HTTP_201_CREATED)
async def create_coupon(payload: CouponPayload, user: User = Depends(current_user)):
    coupon = await coupon_repository.create(
        {
            "code": payload.code or "NEWCODE",
            "discount": payload.discount or "10% OFF",
            "description": payload.description or "",
            "expiry": payload.expiry or "",
            "minOrder": payload.minOrder or 0,
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

