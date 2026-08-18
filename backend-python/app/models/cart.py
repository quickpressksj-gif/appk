"""Service Details & Smart Cart response models — Sprint 2.3.

These mirror `backend/src/customer/service-api.ts` and
`backend/src/customer/cart-api.ts` exactly, so the Service Details screen and
the Smart Cart render identical data from the mock router and from FastAPI.
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel

from app.models.catalog import PartnerReviewResponse, ReviewSummaryResponse


# --------------------------------------------------------------------------
# Service Details — GET /api/services/{id}
# --------------------------------------------------------------------------


class ServiceFaqResponse(BaseModel):
    id: str
    question: str
    answer: str


class RelatedServiceResponse(BaseModel):
    """GET /api/services/{id}/related — sibling services in the same category."""

    id: str
    name: str
    description: str = ""
    image: str = ""
    price: int
    unit: str = ""
    discountPercent: int = 0
    processingTime: str = ""


class ServiceHeroResponse(BaseModel):
    """Everything the Service Details hero renders."""

    id: str
    name: str
    title: str
    category: str
    categoryId: str
    description: str
    shortDescription: str
    image: str
    unit: str
    basePrice: int
    discountPercent: int = 0
    discountLabel: Optional[str] = None
    finalPrice: int
    startingPrice: int
    processingTime: str
    pickupEta: str
    deliveryEta: str
    rating: float
    reviewsCount: int
    reviewCount: str
    ordersCompleted: str
    partnerCount: int
    about: str
    included: List[str] = []
    benefits: List[str] = []


class ServicePartnerResponse(BaseModel):
    """GET /api/services/{id}/partners — one partner offering this service."""

    id: str
    name: str
    logo: str
    image: str
    rating: float
    reviews: str
    reviewsCount: int
    distanceKm: float
    pickupEta: str
    deliveryEta: str
    startingPrice: int
    open: bool = True
    status: str = "open"
    offerLabel: Optional[str] = None
    city: str = ""
    area: str = ""


class ServiceDetailResponse(BaseModel):
    service: ServiceHeroResponse
    careInstructions: List[str] = []
    faq: List[ServiceFaqResponse] = []
    related: List[RelatedServiceResponse] = []
    partners: List[ServicePartnerResponse] = []
    reviews: List[PartnerReviewResponse] = []
    reviewSummary: ReviewSummaryResponse


# --------------------------------------------------------------------------
# Smart Cart — GET/POST/PUT/DELETE /api/cart*
# --------------------------------------------------------------------------


class CartItemPayload(BaseModel):
    """POST /api/cart/items."""

    id: Optional[str] = None
    itemId: Optional[str] = None
    serviceId: Optional[str] = None
    partnerId: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    unit: Optional[str] = None
    price: Optional[int] = None
    discountPercent: Optional[int] = None
    processingTime: Optional[str] = None
    qty: int = 1


class CartItemUpdatePayload(BaseModel):
    """PUT /api/cart/items/{id}."""

    qty: int


class CartLineResponse(BaseModel):
    id: str
    itemId: str
    serviceId: str = ""
    partnerId: str = ""
    name: str
    description: str = ""
    image: str = ""
    unit: str = ""
    price: int
    basePrice: int
    discountPercent: int = 0
    processingTime: str = ""
    qty: int
    lineTotal: int


class CartStoreResponse(BaseModel):
    id: str
    name: str
    image: str
    rating: float
    reviews: str
    pickupEta: str
    deliveryEta: str


class CartChargesResponse(BaseModel):
    pickup: int = 0
    delivery: int = 0
    handling: int = 0
    gstRate: float = 0.0
    discount: int = 0


class CartCouponResponse(BaseModel):
    id: str
    code: str
    title: str
    description: str
    discount: int
    best: bool = False


class CartTotalsResponse(BaseModel):
    """Live pricing — recomputed server side on every read and mutation."""

    count: int = 0
    itemsTotal: int = 0
    discount: int = 0
    pickup: int = 0
    delivery: int = 0
    handling: int = 0
    gst: int = 0
    couponDiscount: int = 0
    grandTotal: int = 0


class CartResponse(BaseModel):
    """GET /api/cart — line items plus live totals."""

    items: List[CartLineResponse] = []
    store: Optional[CartStoreResponse] = None
    charges: CartChargesResponse
    totals: CartTotalsResponse


class CartSummaryResponse(BaseModel):
    """GET /api/cart/summary — everything the cart screen renders."""

    store: CartStoreResponse
    items: List[CartLineResponse] = []
    coupons: List[CartCouponResponse] = []
    charges: CartChargesResponse
    totals: CartTotalsResponse
