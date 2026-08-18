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

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.core.deps import current_user
from app.db.availability_repositories import availability_repository
from app.db.order_repositories import order_repository
from app.db.reorder_repositories import reorder_repository
from app.models.availability import (
    AvailabilityResponse,
    ReorderHistoryEntry,
    ServiceAreaResponse,
)
from app.models.user import User

router = APIRouter(tags=["availability"])


class AvailabilityCheckPayload(BaseModel):
    serviceId: Optional[str] = None
    partnerId: Optional[str] = None
    city: str = ""
    pincode: str = ""


@router.get("/service-areas", response_model=List[ServiceAreaResponse])
async def service_areas() -> List[ServiceAreaResponse]:
    return await availability_repository.service_areas()


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
