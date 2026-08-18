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
async def get_nearby_partners(city: Optional[str] = Query(default=None)) -> list[PartnerCardResponse]:
    return await catalog.partners(city=city)


@router.get("/offers", response_model=list[OfferResponse])
async def get_offers() -> list[OfferResponse]:
    return await catalog.offers()


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
