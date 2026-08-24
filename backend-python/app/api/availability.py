"""Service Availability & Smart Reorder API — Sprint 2.12.

    GET  /api/service-areas                      supported cities / areas / PINs
    GET  /api/services/{service_id}/availability  can this service be ordered now
    GET  /api/partners/{partner_id}/availability  is this partner taking orders
    POST /api/availability/check                  full check before checkout
    GET  /api/reorder/history                     completed orders to reorder

Every endpoint returns the same `AvailabilityResponse` shape so the checkout
banner, the service card and the reorder sheet share one renderer.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.core.deps import current_user
from app.db.client import database
from app.db.availability_repositories import availability_repository
from app.db.catalog_repositories import catalog
from app.db.order_repositories import order_repository
from app.db.reorder_repositories import reorder_repository
from app.models.availability import (
    AvailabilityResponse,
    ReorderHistoryEntry,
    ServiceAreaResponse,
)
from app.models.user import User

router = APIRouter(tags=["availability"])


class WaitlistPayload(BaseModel):
    area: str = ""
    city: str = ""
    state: str = ""
    pincode: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    email: Optional[str] = None


@router.post("/customer/waitlist")
async def register_waitlist(payload: WaitlistPayload):
    """Save real customer waitlist notification request."""
    entry = {
        "area": payload.area.strip(),
        "city": payload.city.strip(),
        "state": payload.state.strip(),
        "pincode": payload.pincode.strip(),
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "phone": (payload.phone or "").strip(),
        "email": (payload.email or "").strip(),
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "status": "pending",
    }
    result = await database.insert("service_waitlist", entry)
    return {
        "ok": True,
        "message": f"We will notify you as soon as QuickPress is available in {payload.area or payload.city or 'your area'}!",
        "id": str(result.get("_id") or result.get("id") or "saved"),
    }


@router.get("/customer/availability/check-location")
async def check_location_availability(
    city: Optional[str] = Query(default=None),
    area: Optional[str] = Query(default=None),
    pincode: Optional[str] = Query(default=None),
    lat: Optional[float] = Query(default=None),
    lng: Optional[float] = Query(default=None),
):
    """Strictly evaluates real partner & service availability based on Admin-approved cities."""
    clean_city = (city or "").strip()
    clean_area = (area or "").strip()

    # 1. Fetch admin-approved live cities from MongoDB
    admin_cities = await database.find_many("admin_cities")
    approved_live_cities = [
        str(c.get("city") or c.get("name") or "").strip().lower()
        for c in admin_cities
        if str(c.get("status") or "").strip().lower() in ("live", "active", "approved")
    ]

    # 2. Check if requested city / area is admin-approved
    is_city_approved = False
    if clean_city:
        is_city_approved = any(
            ac in clean_city.lower() or clean_city.lower() in ac for ac in approved_live_cities
        )
    elif clean_area:
        is_city_approved = any(
            ac in clean_area.lower() for ac in approved_live_cities
        )
    else:
        is_city_approved = False

    matched_partners = []
    if is_city_approved:
        partners = await catalog.partners(
            city=clean_city if clean_city else None,
            area=clean_area if clean_area else None,
            lat=lat,
            lng=lng,
            limit=20,
        )

        if clean_city:
            matched_partners = [
                p
                for p in partners
                if clean_city.lower() in p.city.lower()
                or clean_city.lower() in p.area.lower()
                or (clean_area and clean_area.lower() in p.area.lower())
            ]
            if not matched_partners and clean_area:
                matched_partners = [p for p in partners if clean_area.lower() in p.area.lower()]
        else:
            matched_partners = partners

        if not matched_partners:
            all_approved = await catalog.partners(limit=10)
            if all_approved:
                matched_partners = all_approved[:3]

    # 3. Real nearby serviceable areas ONLY from approved Live cities in Admin Panel
    live_city_names = [
        str(c.get("city") or c.get("name") or "").strip()
        for c in admin_cities
        if str(c.get("status") or "").strip().lower() in ("live", "active")
        and str(c.get("city") or c.get("name") or "").strip()
    ]
    nearby_areas = sorted(list(set(live_city_names)))
    is_available = is_city_approved

    return {
        "success": True,
        "available": is_available,
        "partnerCount": len(matched_partners),
        "partners": matched_partners if is_available else [],
        "nearbyAreas": nearby_areas,
        "location": {
            "area": clean_area,
            "city": clean_city,
            "state": "Uttar Pradesh",
            "pincode": pincode or "",
            "lat": lat,
            "lng": lng,
        },
    }


class AvailabilityCheckPayload(BaseModel):
    serviceId: Optional[str] = None
    partnerId: Optional[str] = None
    city: str = ""
    pincode: str = ""


@router.get("/service-areas", response_model=List[ServiceAreaResponse])
async def service_areas() -> List[ServiceAreaResponse]:
    return await availability_repository.service_areas()


@router.get("/cities")
async def allowed_cities():
    """Returns only Admin-approved Live / Active cities."""
    cities = await database.find_sorted("admin_cities", sort=[("city", 1)])
    allowed = []
    for c in cities:
        status_val = str(c.get("status", "Coming Soon")).strip().lower()
        if status_val in ["live", "active", "approved"]:
            allowed.append({
                "id": str(c.get("_id") or c.get("id")),
                "name": c.get("city") or c.get("name"),
                "city": c.get("city") or c.get("name"),
                "state": c.get("state", "Uttar Pradesh"),
                "status": c.get("status", "Live"),
                "pickupRadius": c.get("pickupRadius", "8 km"),
            })
    return allowed


@router.get("/services/{service_id}/availability", response_model=AvailabilityResponse)
async def service_availability(
    service_id: str,
    partnerId: str = Query(default=""),
    city: str = Query(default=""),
    pincode: str = Query(default=""),
) -> AvailabilityResponse:
    return await availability_repository.evaluate(
        service_id=service_id, partner_id=partnerId or None, city=city, pincode=pincode
    )


@router.get("/partners/{partner_id}/availability", response_model=AvailabilityResponse)
async def partner_availability(
    partner_id: str,
    serviceId: str = Query(default=""),
    city: str = Query(default=""),
    pincode: str = Query(default=""),
) -> AvailabilityResponse:
    return await availability_repository.evaluate(
        service_id=serviceId or None, partner_id=partner_id, city=city, pincode=pincode
    )


@router.post("/availability/check", response_model=AvailabilityResponse)
async def availability_check(payload: AvailabilityCheckPayload) -> AvailabilityResponse:
    """Checkout calls this before placing the order."""
    return await availability_repository.evaluate(
        service_id=payload.serviceId or None,
        partner_id=payload.partnerId or None,
        city=payload.city,
        pincode=payload.pincode,
    )


@router.get("/reorder/history", response_model=List[ReorderHistoryEntry])
async def reorder_history(user: User = Depends(current_user)) -> List[ReorderHistoryEntry]:
    orders = await order_repository.list(user.id)
    return await reorder_repository.history(user, orders)
