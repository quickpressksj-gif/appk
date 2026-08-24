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
DEFAULT_LOCATION = LocationResponse(area="Awas Vikas", city="Kasganj", state="Uttar Pradesh")


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
    code_clean = (code or "").strip().upper()
    admin_docs = await database.find_many("admin_coupons")
    matched = next(
        (c for c in admin_docs if str(c.get("code", "")).strip().upper() == code_clean),
        None,
    )
    if matched:
        if str(matched.get("status", "")).lower() in ("inactive", "disabled", "expired"):
            return {"ok": False, "discount": 0, "message": "This coupon is inactive or expired"}
        raw_discount = str(matched.get("discount") or 0)
        digits = "".join(ch for ch in raw_discount if ch.isdigit())
        discount_val = int(digits) if digits else 50
        return {
            "ok": True,
            "discount": discount_val,
            "code": code_clean,
            "message": f"Coupon {code_clean} applied successfully",
        }
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
        try:
            orders = await order_repository.list(user.id)
            if orders:
                result = []
                for o in orders[:5]:
                    if hasattr(o, "id"):
                        result.append({
                            "id": o.id,
                            "reference": getattr(o, "code", o.id[:8]),
                            "title": getattr(o.partner, "name", "Laundry Order") if hasattr(o, "partner") else "Laundry Order",
                            "items": f"{len(getattr(o, 'items', []))} items",
                            "placed": str(getattr(o, "createdAt", "Recently"))[:10],
                            "status": "Delivered" if getattr(o, "status", "") in ("delivered", "completed") else "In progress",
                            "total": float(getattr(o.totals, "grandTotal", 0) if hasattr(o, "totals") else 0),
                        })
                    elif isinstance(o, dict):
                        result.append({
                            "id": o.get("id") or o.get("_id"),
                            "reference": o.get("code") or (o.get("id") or o.get("_id"))[:8],
                            "title": (o.get("partner") or {}).get("name") or "Laundry Order",
                            "items": f"{len(o.get('items', []))} items",
                            "placed": str(o.get("createdAt") or "Recently")[:10],
                            "status": "Delivered" if o.get("status") in ("delivered", "completed") else "In progress",
                            "total": float(o.get("totals", {}).get("grandTotal") or o.get("total") or 0),
                        })
                return result
        except Exception:
            return []
    return []


@router.get("/locations")
async def get_locations(creds: Optional[HTTPAuthorizationCredentials] = Depends(optional_bearer)) -> dict:
    from app.db.client import database
    saved_places = []
    if creds and creds.credentials:
        try:
            payload = decode_token(creds.credentials)
            user_id = payload.get("sub")
            if user_id:
                user_addresses = await database.find_many("customer_addresses", {"userId": user_id})
                for addr in user_addresses:
                    saved_places.append({
                        "id": str(addr.get("_id")),
                        "area": addr.get("area") or addr.get("street") or "Home",
                        "city": addr.get("city") or "Kasganj",
                        "state": addr.get("state") or "Uttar Pradesh",
                        "label": addr.get("label") or "Saved Address",
                        "type": addr.get("type") or "home",
                    })
        except Exception:
            pass

    admin_cities = await database.find_many("admin_cities")
    approved_live_cities = [
        c for c in admin_cities
        if str(c.get("status") or "").strip().lower() in ("live", "active", "approved")
    ]

    popular_places = [
        {
            "id": str(c.get("_id") or c.get("id")),
            "area": c.get("city") or "Kasganj",
            "city": c.get("city") or "Kasganj",
            "state": c.get("state") or "Uttar Pradesh",
        }
        for c in approved_live_cities
    ]

    all_active_profiles = await catalog._approved_partner_profiles()
    nearby_places = []
    for p in all_active_profiles:
        c = (p.get("city") or "").strip()
        a = (p.get("area") or "").strip()
        if c or a:
            nearby_places.append({
                "id": str(p.get("_id")),
                "area": a.split(",")[0].strip() if a else c,
                "city": c,
                "state": "Uttar Pradesh",
            })

    return {
        "recent": saved_places[:2],
        "saved": saved_places,
        "nearby": nearby_places if nearby_places else popular_places,
        "popular": popular_places,
    }


@router.get("/locations/search")
async def search_locations(q: str = Query(default="")) -> list[dict]:
    from app.db.client import database
    query = q.lower().strip()
    admin_cities = await database.find_many("admin_cities")
    approved_live_cities = [
        c for c in admin_cities
        if str(c.get("status") or "").strip().lower() in ("live", "active", "approved")
    ]

    popular_places = [
        {
            "id": str(c.get("_id") or c.get("id")),
            "area": c.get("city") or "Kasganj",
            "city": c.get("city") or "Kasganj",
            "state": c.get("state") or "Uttar Pradesh",
        }
        for c in approved_live_cities
    ]

    if not query:
        return popular_places

    return [
        p for p in popular_places
        if query in p["area"].lower() or query in p["city"].lower() or query in p["state"].lower()
    ]
