"""Customer Home API — Sprint 2.1.

    GET /api/home         aggregate payload for the Home screen
    GET /api/banners      slider banners, ordered by priority
    GET /api/categories   active service categories
    GET /api/services     service cards (?categoryId=, ?popular=true)
    GET /api/partners     partner cards (?city=), nearest first
    GET /api/offers       active coupons
    GET /api/profile      signed-in customer profile

Only `/api/profile` and the profile block of `/api/home` require a bearer
token; the catalog reads stay public so the Home screen renders for guests.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.deps import current_user
from app.core.security import decode_token
from app.db.catalog_repositories import catalog
from app.db.repositories import users
from app.models.catalog import (
    BannerResponse,
    CategoryResponse,
    HomeResponse,
    LocationResponse,
    OfferResponse,
    PartnerCardResponse,
    ProfileResponse,
    ServiceCardResponse,
)
from app.models.user import User

router = APIRouter(tags=["home"])
optional_bearer = HTTPBearer(auto_error=False)

GUEST_PROFILE = ProfileResponse(name="Guest", initials="G", unreadNotifications=0)
DEFAULT_LOCATION = LocationResponse(area="Koramangala 5th Block", city="Bengaluru", state="Karnataka")


def _initials(name: str) -> str:
    parts = [part for part in name.split() if part]
    return "".join(part[0].upper() for part in parts[:2]) or "G"


def _profile(user: User) -> ProfileResponse:
    name = getattr(user, "display_name", None) or getattr(user, "name", None) or "Customer"
    return ProfileResponse(
        id=user.id,
        name=name,
        initials=_initials(name),
        avatarUrl=getattr(user, "photo_url", None),
        phone=getattr(user, "phone", None),
        unreadNotifications=0,
    )


async def optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_bearer),
) -> Optional[User]:
    """Resolve the caller when a valid token is present, otherwise None."""
    if credentials is None or not credentials.credentials:
        return None
    try:
        payload = decode_token(credentials.credentials, expected_type="access")
        return await users.by_id(str(payload.get("sub")))
    except Exception:  # noqa: BLE001 — an invalid token is treated as a guest
        return None


@router.get("/banners", response_model=list[BannerResponse])
async def get_banners() -> list[BannerResponse]:
    return await catalog.banners()


@router.get("/categories", response_model=list[CategoryResponse])
async def get_categories() -> list[CategoryResponse]:
    return await catalog.categories()


@router.get("/services", response_model=list[ServiceCardResponse])
async def get_services(
    categoryId: Optional[str] = Query(default=None),
    popular: bool = Query(default=False),
) -> list[ServiceCardResponse]:
    return await catalog.services(category_id=categoryId, popular_only=popular)


@router.get("/services/popular", response_model=list[ServiceCardResponse])
async def get_popular_services() -> list[ServiceCardResponse]:
    return await catalog.services(popular_only=True)


@router.get("/partners/nearby", response_model=list[PartnerCardResponse])
async def get_nearby_partners(
    city: Optional[str] = Query(default=None),
    lat: Optional[float] = Query(default=None),
    lng: Optional[float] = Query(default=None),
    area: Optional[str] = Query(default=None),
    limit: int = Query(default=10),
) -> list[PartnerCardResponse]:
    return await catalog.partners(city=city, lat=lat, lng=lng, area=area, limit=limit)


@router.get("/offers", response_model=list[OfferResponse])
async def get_offers() -> list[OfferResponse]:
    return await catalog.offers()


@router.post("/offers/{code}/apply")
async def apply_offer(code: str) -> dict:
    offers = await catalog.offers()
    matched = next((o for o in offers if o.code.upper() == code.upper()), None)
    if matched:
        return {"ok": True, "discount": matched.discount}
    # Check default coupons list
    from app.db.cart_repositories import DEFAULT_COUPONS
    coupon = next((c for c in DEFAULT_COUPONS if c["code"].upper() == code.upper()), None)
    if coupon:
        return {"ok": True, "discount": coupon.get("discount", 50)}
    return {"ok": False, "discount": 0, "message": "Invalid coupon code"}


@router.get("/app-meta")
async def get_app_meta() -> dict:
    return {
        "appVersion": "1.0.0",
        "memberSince": "Aug 2026",
        "supportPhone": "+91 80 4000 5000",
        "supportEmail": "support@quickpress.in",
    }


@router.get("/location", response_model=LocationResponse)
async def get_location() -> LocationResponse:
    return DEFAULT_LOCATION


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(user: User = Depends(current_user)) -> ProfileResponse:
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    return _profile(user)


@router.get("/home", response_model=HomeResponse)
async def get_home(user: Optional[User] = Depends(optional_user)) -> HomeResponse:
    """Single round-trip payload behind the Customer Home screen."""
    banners = await catalog.banners()
    categories = await catalog.categories()
    services = await catalog.services()
    partners = await catalog.partners()
    offers = await catalog.offers()

    return HomeResponse(
        profile=_profile(user) if user else GUEST_PROFILE,
        location=DEFAULT_LOCATION,
        banners=banners,
        categories=categories,
        services=services,
        popularServices=[service for service in services if service.popular],
        recommendedServices=[service for service in services if not service.popular][:4],
        partners=partners,
        offers=offers,
        unreadNotifications=0,
    )


@router.get("/recommendations")
async def get_recommendations() -> list[dict]:
    return [
        {"id": "rec-1", "title": "5-Shirt Steam Iron Combo", "reason": "Based on your recent dry cleaning", "price": 199, "icon": "shirt"},
        {"id": "rec-2", "title": "Weekend Bedding Refresh", "reason": "Popular in your neighbourhood", "price": 449, "icon": "bed"},
        {"id": "rec-3", "title": "Express Shoe Spa", "reason": "Monsoon essential", "price": 299, "icon": "footprints"},
        {"id": "rec-4", "title": "Curtain Deep Clean", "reason": "Special 20% off", "price": 599, "icon": "home"},
    ]


@router.get("/orders/recent")
async def get_recent_orders(user: Optional[User] = Depends(optional_user)) -> list[dict]:
    if user:
        from app.db.order_repositories import order_repository
        orders = await order_repository.by_customer(user.id)
        if orders:
            return [
                {
                    "id": o.get("id") or o.get("_id"),
                    "reference": o.get("orderNumber") or (o.get("id") or o.get("_id"))[:8],
                    "title": (o.get("partner") or {}).get("name") or "Laundry Order",
                    "items": f"{len(o.get('items', []))} items",
                    "placed": str(o.get("createdAt") or "Recently")[:10],
                    "status": "Delivered" if o.get("status") in ("delivered", "completed") else "In progress",
                    "total": float(o.get("total") or o.get("pricing", {}).get("total") or 0),
                }
                for o in orders[:5]
            ]
    return []


DEFAULT_PLACES = [
    {"id": "loc-1", "area": "Kasganj Main Market", "city": "Kasganj", "state": "Uttar Pradesh"},
    {"id": "loc-2", "area": "Civil Lines", "city": "Aligarh", "state": "Uttar Pradesh"},
    {"id": "loc-3", "area": "Koramangala 5th Block", "city": "Bengaluru", "state": "Karnataka"},
    {"id": "loc-4", "area": "Indiranagar 100ft Road", "city": "Bengaluru", "state": "Karnataka"},
    {"id": "loc-5", "area": "HSR Layout Sector 2", "city": "Bengaluru", "state": "Karnataka"},
    {"id": "loc-6", "area": "Whitefield ITPL Main Rd", "city": "Bengaluru", "state": "Karnataka"},
]


@router.get("/locations")
async def get_locations() -> dict:
    return {
        "recent": DEFAULT_PLACES[:2],
        "saved": DEFAULT_PLACES[:1],
        "nearby": DEFAULT_PLACES[2:5],
        "popular": DEFAULT_PLACES,
    }


@router.get("/locations/search")
async def search_locations(q: str = Query(default="")) -> list[dict]:
    query = q.lower().strip()
    if not query:
        return DEFAULT_PLACES
    return [
        p for p in DEFAULT_PLACES
        if query in p["area"].lower() or query in p["city"].lower() or query in p["state"].lower()
    ]
