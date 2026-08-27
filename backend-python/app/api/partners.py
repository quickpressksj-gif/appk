"""Partner Listing & Partner Details API — Sprint 2.2.

    GET /api/partners                 partner cards (search + filters + sort)
    GET /api/partners/{id}            full partner profile + services + reviews
    GET /api/partners/{id}/services   services offered by one partner
    GET /api/partners/{id}/reviews    reviews + rating breakdown
    GET /api/filter                   filter/sort options for the listing sheet
    GET /api/search                   partners, categories, services, offers

Every read is public — the listing and details screens render for guests as
well as signed-in customers. Data comes from the MongoDB collections
`catalog_partners` and `partner_reviews`.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import current_user
from app.db.catalog_repositories import catalog
from app.models.catalog import (
    FilterOptionsResponse,
    PartnerCardResponse,
    PartnerDetailResponse,
    PartnerReviewsResponse,
    PartnerServiceResponse,
    SearchResultResponse,
)
from app.models.user import User

router = APIRouter(tags=["partners"])


# ------------------------------------------------------------------
# Favourite Stores
# ------------------------------------------------------------------

@router.get("/partners/favourites")
async def get_favourite_partners(user: User = Depends(current_user)) -> list[dict]:
    """List all favourite laundry stores for the logged-in customer."""
    return await catalog.favourite_partners(user.id)


@router.post("/partners/favourites/{partner_id}")
async def toggle_favourite_partner(
    partner_id: str, user: User = Depends(current_user)
) -> dict:
    """Toggle a laundry store into or out of the customer's favourite stores."""
    return await catalog.toggle_favourite_partner(user.id, partner_id)


@router.delete("/partners/favourites/{partner_id}")
async def delete_favourite_partner(
    partner_id: str, user: User = Depends(current_user)
) -> dict:
    """Remove a laundry store from the customer's favourite stores."""
    return await catalog.remove_favourite_partner(user.id, partner_id)


@router.get("/partners", response_model=list[PartnerCardResponse])
async def list_partners(
    q: Optional[str] = Query(default=None, description="Partner, service, category or city"),
    city: Optional[str] = Query(default=None),
    area: Optional[str] = Query(default=None),
    lat: Optional[float] = Query(default=None),
    lng: Optional[float] = Query(default=None),
    minRating: float = Query(default=0, ge=0),
    maxDistance: float = Query(default=0, ge=0),
    maxPrice: int = Query(default=0, ge=0),
    maxPickupMinutes: int = Query(default=0, ge=0),
    offers: bool = Query(default=False),
    openNow: bool = Query(default=False),
    sort: str = Query(default="recommended"),
) -> list[PartnerCardResponse]:
    return await catalog.partner_cards(
        q=q,
        city=city,
        area=area,
        lat=lat,
        lng=lng,
        min_rating=minRating,
        max_distance=maxDistance,
        max_price=maxPrice,
        max_pickup_minutes=maxPickupMinutes,
        offers_only=offers,
        open_now=openNow,
        sort=sort,
    )


@router.get("/partners/{partner_id}", response_model=PartnerDetailResponse)
async def get_partner(partner_id: str) -> PartnerDetailResponse:
    detail = await catalog.partner_detail(partner_id)
    if detail is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partner not found")
    return detail


@router.get("/partners/{partner_id}/services", response_model=list[PartnerServiceResponse])
async def get_partner_services(partner_id: str) -> list[PartnerServiceResponse]:
    services = await catalog.partner_services(partner_id)
    if services is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partner not found")
    return services


@router.get("/partners/{partner_id}/reviews", response_model=PartnerReviewsResponse)
async def get_partner_reviews(partner_id: str) -> PartnerReviewsResponse:
    document = await catalog.partner_document(partner_id)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partner not found")
    from app.db.catalog_repositories import review_summary

    reviews = await catalog.partner_reviews(partner_id)
    return PartnerReviewsResponse(summary=review_summary(reviews, document), reviews=reviews)


@router.get("/filter", response_model=FilterOptionsResponse)
async def get_filter_options() -> FilterOptionsResponse:
    return await catalog.filter_options()


@router.get("/search", response_model=list[SearchResultResponse])
async def search_catalog(
    q: str = Query(default=""),
    scopes: Optional[str] = Query(default=None, description="Comma separated scopes"),
) -> list[SearchResultResponse]:
    scope_list = [scope.strip() for scope in scopes.split(",") if scope.strip()] if scopes else None
    return await catalog.search(q, scope_list)
