"""Availability & Reorder models — Sprint 2.12.

Mirrors `backend/src/customer/availability-api.ts` and
`backend/src/customer/reorder-api.ts` so the customer screens render the same
contract from FastAPI as they type against.
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class AvailabilityCheck(BaseModel):
    """One rule of the availability engine."""

    id: str
    label: str
    ok: bool
    detail: str = ""


class AvailabilityCapacity(BaseModel):
    limit: int = 0
    used: int = 0
    remaining: int = 0


class AvailabilityAlternative(BaseModel):
    kind: str  # "partner" | "service"
    id: str
    name: str
    subtitle: str = ""
    image: str = ""
    rating: float = 0
    price: int = 0


class AvailabilityResponse(BaseModel):
    """GET /api/services/{id}/availability and /api/partners/{id}/availability."""

    available: bool
    # available | service_unavailable | maintenance | partner_closed |
    # partner_inactive | out_of_service_area | delivery_unavailable |
    # pickup_unavailable | capacity_reached
    state: str
    title: str
    message: str
    serviceId: Optional[str] = None
    partnerId: Optional[str] = None
    city: str = ""
    pincode: str = ""
    checks: List[AvailabilityCheck] = []
    capacity: AvailabilityCapacity = AvailabilityCapacity()
    nextOpenLabel: str = ""
    alternatives: List[AvailabilityAlternative] = []


class ServiceAreaResponse(BaseModel):
    """GET /api/service-areas."""

    id: str
    city: str
    area: str
    pincodes: List[str] = []
    pickupAvailable: bool = True
    deliveryAvailable: bool = True
    partnerIds: List[str] = []
    etaMinutes: int = 0


# --------------------------------------------------------------------------
# Smart Reorder
# --------------------------------------------------------------------------


class ReorderLine(BaseModel):
    id: str
    serviceId: str
    name: str
    qty: int
    previousPrice: int
    currentPrice: int
    priceChanged: bool = False
    available: bool = True
    unavailableReason: str = ""


class ReorderHistoryEntry(BaseModel):
    """GET /api/reorder/history."""

    orderId: str
    orderCode: str
    partnerId: str
    partnerName: str
    partnerImage: str = ""
    serviceLabel: str = ""
    placedAt: str
    deliveredAt: str = ""
    itemCount: int = 0
    previousTotal: int = 0
    estimatedTotal: int = 0
    priceChanged: bool = False
    reorderable: bool = True
    availability: AvailabilityResponse
    items: List[ReorderLine] = []
    lastReorderedAt: Optional[str] = None
    reorderCount: int = 0


class ReorderResponse(BaseModel):
    """POST /api/orders/{id}/reorder."""

    ok: bool
    orderId: str
    orderCode: str = ""
    redirectTo: str = "/cart"
    restoredItems: int = 0
    previousTotal: int = 0
    estimatedTotal: int = 0
    priceChanged: bool = False
    skipped: List[ReorderLine] = []
    items: List[ReorderLine] = []
    availability: AvailabilityResponse
