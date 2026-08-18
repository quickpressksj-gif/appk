"""Catalog repository — Home screen reads.

Documents live in MongoDB (`banners`, `categories`, `services`,
`catalog_partners`, `offers`) and are seeded once on startup.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.db.catalog_seed import SEED
from app.db.client import database
from app.models.catalog import (
    BannerResponse,
    CategoryResponse,
    FilterGroupResponse,
    FilterOptionResponse,
    FilterOptionsResponse,
    GalleryImageResponse,
    OfferResponse,
    PartnerCardResponse,
    PartnerDetailResponse,
    PartnerFeatureResponse,
    PartnerProfileResponse,
    PartnerReviewResponse,
    PartnerServiceResponse,
    PriceRowResponse,
    ReviewSummaryResponse,
    SearchResultResponse,
    ServiceCardResponse,
    OpeningHour,
)


class CatalogRepository:
    async def ensure_seed(self) -> None:
        """Upsert the seed documents. Safe (and idempotent) on every boot."""
        for name, documents in SEED.items():
            collection = database.collection(name)
            for document in documents:
                await collection.update_one(
                    {"_id": document["_id"]},
                    {"$set": {k: v for k, v in document.items() if k != "_id"}},
                    upsert=True,
                )

    async def banners(self) -> List[BannerResponse]:
        docs = await database.find_many("banners", sort_key="priority")
        return [BannerResponse(id=d["_id"], **_without_id(d)) for d in docs]

    async def categories(self) -> List[CategoryResponse]:
        docs = await database.find_many("categories", sort_key="sortOrder")
        return [
            CategoryResponse(id=d["_id"], **_without_id(d))
            for d in docs
            if d.get("status", "active") != "inactive"
        ]

    async def services(
        self,
        *,
        category_id: Optional[str] = None,
        popular_only: bool = False,
    ) -> List[ServiceCardResponse]:
        docs = await database.find_many("services")
        partner_count = len(await database.find_many("catalog_partners"))
        cards = [_service_card(d, partner_count) for d in docs]
        if category_id:
            cards = [card for card in cards if card.categoryId == category_id]
        if popular_only:
            cards = [card for card in cards if card.popular]
        return cards

    # ------------------------------------------------------------------
    # Sprint 2.2 — Partner Listing & Partner Details
    # ------------------------------------------------------------------

    async def partner_cards(
        self,
        *,
        q: Optional[str] = None,
        city: Optional[str] = None,
        min_rating: float = 0,
        max_distance: float = 0,
        max_price: int = 0,
        max_pickup_minutes: int = 0,
        offers_only: bool = False,
        open_now: bool = False,
        sort: str = "recommended",
    ) -> List[PartnerCardResponse]:
        """GET /api/partners — filtered, sorted and searched partner cards."""
        docs = await database.find_many("catalog_partners")
        cards = [_partner_card(d) for d in docs]

        if q:
            needle = q.strip().lower()
            cards = [
                card
                for card in cards
                if needle in card.name.lower()
                or needle in card.city.lower()
                or needle in card.area.lower()
                or any(needle in service.lower() for service in card.services)
            ]
        if city:
            cards = [card for card in cards if card.city.lower() == city.lower()]
        if min_rating > 0:
            cards = [card for card in cards if card.rating >= min_rating]
        if max_distance > 0:
            cards = [card for card in cards if card.distanceKm <= max_distance]
        if max_price > 0:
            cards = [card for card in cards if card.minPrice <= max_price]
        if max_pickup_minutes > 0:
            cards = [card for card in cards if card.pickupMinutes <= max_pickup_minutes]
        if offers_only:
            cards = [card for card in cards if card.offerLabel]
        if open_now:
            cards = [card for card in cards if card.open]

        return _sort_cards(cards, sort)

    async def partners(self, *, city: Optional[str] = None) -> List[PartnerCardResponse]:
        return await self.partner_cards(city=city, sort="distance")

    async def partner_document(self, partner_id: str) -> Optional[Dict[str, Any]]:
        return await database.collection("catalog_partners").find_one({"_id": partner_id})

    async def partner_profile(self, partner_id: str) -> Optional[PartnerProfileResponse]:
        document = await self.partner_document(partner_id)
        return _partner_profile(document) if document else None

    async def partner_services(self, partner_id: str) -> Optional[List[PartnerServiceResponse]]:
        document = await self.partner_document(partner_id)
        if document is None:
            return None
        return [_partner_service(item) for item in document.get("serviceItems") or []]

    async def partner_reviews(self, partner_id: str) -> List[PartnerReviewResponse]:
        docs = await database.find_many("partner_reviews")
        return [
            PartnerReviewResponse(
                id=d["_id"],
                partnerId=d.get("partnerId", partner_id),
                name=d.get("name", "Customer"),
                initials=d.get("initials", "C"),
                photo=d.get("photo", ""),
                rating=float(d.get("rating") or 0),
                text=d.get("text", ""),
                date=d.get("date", ""),
                images=list(d.get("images") or []),
            )
            for d in docs
            if d.get("partnerId") == partner_id
        ]

    async def partner_detail(self, partner_id: str) -> Optional[PartnerDetailResponse]:
        document = await self.partner_document(partner_id)
        if document is None:
            return None

        services = [_partner_service(item) for item in document.get("serviceItems") or []]
        reviews = await self.partner_reviews(partner_id)
        return PartnerDetailResponse(
            partner=_partner_profile(document),
            services=services,
            features=[
                PartnerFeatureResponse(**feature) for feature in document.get("features") or []
            ],
            reviews=reviews,
            reviewSummary=review_summary(reviews, document),
            gallery=[
                GalleryImageResponse(**shot) for shot in document.get("gallery") or []
            ],
            priceList=[
                PriceRowResponse(
                    id=f"pl-{service.id}",
                    service=service.name,
                    unit=service.unit,
                    price=service.basePrice,
                )
                for service in services
            ],
        )

    async def filter_options(self) -> FilterOptionsResponse:
        docs = await database.find_many("catalog_partners")
        cities = sorted({d.get("city", "") for d in docs if d.get("city")})
        return FilterOptionsResponse(
            sorts=[
                FilterOptionResponse(id="recommended", label="Recommended"),
                FilterOptionResponse(id="distance", label="Nearest"),
                FilterOptionResponse(id="rating", label="Highest rated"),
                FilterOptionResponse(id="price-low", label="Lowest price"),
                FilterOptionResponse(id="pickup", label="Fastest pickup"),
                FilterOptionResponse(id="popular", label="Most popular"),
            ],
            toggles=[
                FilterOptionResponse(id="openNow", label="Open now"),
                FilterOptionResponse(id="offers", label="Offers"),
            ],
            groups=[
                FilterGroupResponse(
                    id="maxDistance",
                    label="Distance",
                    kind="single",
                    options=[
                        FilterOptionResponse(id="0", label="Any", value=0),
                        FilterOptionResponse(id="2", label="2 km", value=2),
                        FilterOptionResponse(id="5", label="5 km", value=5),
                        FilterOptionResponse(id="10", label="10 km", value=10),
                    ],
                ),
                FilterGroupResponse(
                    id="minRating",
                    label="Rating",
                    kind="single",
                    options=[
                        FilterOptionResponse(id="0", label="Any", value=0),
                        FilterOptionResponse(id="4", label="4.0+", value=4),
                        FilterOptionResponse(id="4.5", label="4.5+", value=4.5),
                    ],
                ),
                FilterGroupResponse(
                    id="maxPrice",
                    label="Starting price",
                    kind="single",
                    options=[
                        FilterOptionResponse(id="0", label="Any", value=0),
                        FilterOptionResponse(id="20", label="Under ₹20", value=20),
                        FilterOptionResponse(id="50", label="Under ₹50", value=50),
                        FilterOptionResponse(id="100", label="Under ₹100", value=100),
                    ],
                ),
                FilterGroupResponse(
                    id="maxPickupMinutes",
                    label="Pickup time",
                    kind="single",
                    options=[
                        FilterOptionResponse(id="0", label="Any", value=0),
                        FilterOptionResponse(id="20", label="Under 20 min", value=20),
                        FilterOptionResponse(id="30", label="Under 30 min", value=30),
                        FilterOptionResponse(id="45", label="Under 45 min", value=45),
                    ],
                ),
            ],
            cities=cities,
        )

    async def search(self, q: str, scopes: Optional[List[str]] = None) -> List[SearchResultResponse]:
        needle = (q or "").strip().lower()
        if not needle:
            return []
        wanted = set(scopes or ["partners", "categories", "services", "offers"])
        results: List[SearchResultResponse] = []

        if "partners" in wanted:
            for card in await self.partner_cards(q=needle):
                results.append(
                    SearchResultResponse(
                        id=card.id,
                        scope="partners",
                        title=card.name,
                        subtitle=f"{card.area}, {card.city}".strip(", "),
                        image=card.image,
                    )
                )
        if "categories" in wanted:
            for category in await self.categories():
                if needle in category.title.lower() or needle in category.description.lower():
                    results.append(
                        SearchResultResponse(
                            id=category.id,
                            scope="categories",
                            title=category.title,
                            subtitle=category.description,
                            image=category.image or None,
                        )
                    )
        if "services" in wanted:
            for service in await self.services():
                if needle in service.name.lower() or needle in service.description.lower():
                    results.append(
                        SearchResultResponse(
                            id=service.id,
                            scope="services",
                            title=service.name,
                            subtitle=f"₹{service.price} {service.unit}",
                            image=service.image,
                        )
                    )
        if "offers" in wanted:
            for offer in await self.offers():
                if needle in offer.title.lower() or needle in offer.description.lower():
                    results.append(
                        SearchResultResponse(
                            id=offer.id,
                            scope="offers",
                            title=offer.title,
                            subtitle=offer.description,
                            image=offer.banner,
                        )
                    )
        return results

    async def offers(self) -> List[OfferResponse]:
        docs = await database.find_many("offers")
        return [OfferResponse(id=d["_id"], **_without_id(d)) for d in docs]


def _without_id(document: Dict[str, Any]) -> Dict[str, Any]:
    return {key: value for key, value in document.items() if key != "_id"}


def _service_card(document: Dict[str, Any], partner_count: int) -> ServiceCardResponse:
    price = int(document["price"])
    discount = int(document.get("discountPercent") or 0)
    return ServiceCardResponse(
        id=document["_id"],
        title=document["name"],
        name=document["name"],
        description=document.get("description", ""),
        icon=_ICONS.get(document["categoryId"], "sparkles"),
        image=document.get("image"),
        categoryId=document["categoryId"],
        unit=document.get("unit", ""),
        price=price,
        basePrice=price,
        discountPercent=discount,
        discountLabel=f"{discount}% OFF" if discount else None,
        finalPrice=round(price * (100 - discount) / 100),
        processingTime=document.get("processingTime", "24 hrs"),
        partnerCount=partner_count,
        badge=document.get("badge"),
        popular=bool(document.get("popular")),
    )


def _partner_card(document: Dict[str, Any]) -> PartnerCardResponse:
    reviews_count = int(document.get("reviewsCount") or 0)
    reviews = f"{reviews_count / 1000:.1f}k" if reviews_count >= 1000 else str(reviews_count)
    pickup = int(document.get("pickupMinutes") or 30)
    is_open = bool(document.get("isOpen", True))
    image = document.get("image") or document.get("logo") or ""
    services = list(document.get("services") or [])
    return PartnerCardResponse(
        id=document["_id"],
        name=document["name"],
        logo=image,
        image=image,
        rating=float(document.get("rating") or 0),
        reviews=reviews,
        reviewsCount=reviews_count,
        distanceKm=float(document.get("distanceKm") or 0),
        eta=f"{pickup} min pickup",
        pickupTime=f"{pickup} min",
        deliveryTime=document.get("deliveryTime", "24 hrs"),
        minPrice=int(document.get("minPrice") or 0),
        minOrderValue=int(document.get("minOrderValue") or 0),
        services=services,
        servicesCount=len(services),
        open=is_open,
        status="open" if is_open else "closed",
        city=document.get("city", ""),
        area=document.get("area", ""),
        cover=document.get("cover") or image,
        verified=bool(document.get("verified", False)),
        offerLabel=document.get("offerLabel"),
        popularity=int(document.get("popularity") or 0),
        joinedDaysAgo=int(document.get("joinedDaysAgo") or 999),
        pickupMinutes=pickup,
        tagline=document.get("tagline", ""),
    )


_ICONS = {
    "c1": "washing-machine",
    "c2": "shirt",
    "c3": "flame",
    "c4": "sparkles",
    "c5": "footprints",
    "c6": "blinds",
    "c7": "bed-double",
    "c8": "layout-grid",
    "c9": "zap",
}


def _sort_cards(cards: List[PartnerCardResponse], sort: str) -> List[PartnerCardResponse]:
    """Sorting contract shared with the mock backend."""
    if sort == "distance" or sort == "nearest":
        return sorted(cards, key=lambda c: c.distanceKm)
    if sort == "rating":
        return sorted(cards, key=lambda c: -c.rating)
    if sort == "price-low":
        return sorted(cards, key=lambda c: c.minPrice)
    if sort == "price-high":
        return sorted(cards, key=lambda c: -c.minPrice)
    if sort in {"pickup", "delivery", "fastest"}:
        return sorted(cards, key=lambda c: c.pickupMinutes)
    if sort == "popular":
        return sorted(cards, key=lambda c: -c.popularity)
    return sorted(cards, key=lambda c: (not c.open, -c.rating, c.distanceKm))


def _partner_service(item: Dict[str, Any]) -> PartnerServiceResponse:
    price = int(item.get("price") or 0)
    discount = int(item.get("discountPercent") or 0)
    processing = item.get("processingTime", "24 hrs")
    return PartnerServiceResponse(
        id=item["id"],
        name=item["name"],
        description=item.get("description", ""),
        image=item.get("image", ""),
        icon=item.get("icon", "sparkles"),
        basePrice=price,
        discountPercent=discount,
        discountLabel=f"{discount}% OFF" if discount else None,
        finalPrice=round(price * (100 - discount) / 100),
        startingPrice=price,
        unit=item.get("unit", ""),
        processingTime=processing,
        deliveryEta=processing,
        available=bool(item.get("available", True)),
    )


def _partner_profile(document: Dict[str, Any]) -> PartnerProfileResponse:
    card = _partner_card(document)
    hours = [OpeningHour(**entry) for entry in document.get("openingHours") or []]
    working = " · ".join(f"{entry.day} {entry.hours}" for entry in hours) or "Mon – Sun · 8:00 AM to 9:00 PM"
    radius = int(document.get("deliveryRadiusKm") or 0)
    return PartnerProfileResponse(
        id=card.id,
        name=card.name,
        cover=card.cover or card.image,
        logo=document.get("logo") or card.image,
        image=card.image,
        verified=card.verified,
        rating=card.rating,
        reviewCount=card.reviews,
        reviewsCount=card.reviewsCount,
        distanceKm=card.distanceKm,
        pickupEta=card.pickupTime,
        deliveryEta=card.deliveryTime,
        open=card.open,
        status=card.status,
        ownerName=document.get("ownerName", ""),
        address=document.get("address", ""),
        city=card.city,
        area=card.area,
        latitude=document.get("latitude"),
        longitude=document.get("longitude"),
        pickupRadius=f"{radius} km around {card.area}" if radius else "Nearby areas",
        deliveryRadiusKm=radius,
        workingHours=working,
        openingHours=hours,
        phone=document.get("phone", ""),
        about=document.get("about", ""),
        yearsInBusiness=int(document.get("yearsInBusiness") or 0),
        tagline=document.get("tagline", ""),
        policies=list(document.get("policies") or []),
        offerLabel=card.offerLabel,
        minPrice=card.minPrice,
        minOrderValue=card.minOrderValue,
        servicesCount=len(document.get("serviceItems") or []) or card.servicesCount,
    )


def review_summary(
    reviews: List[PartnerReviewResponse], document: Dict[str, Any]
) -> ReviewSummaryResponse:
    breakdown = {str(star): 0 for star in range(1, 6)}
    for review in reviews:
        bucket = str(max(1, min(5, round(review.rating))))
        breakdown[bucket] += 1
    average = (
        round(sum(review.rating for review in reviews) / len(reviews), 1)
        if reviews
        else float(document.get("rating") or 0)
    )
    total = int(document.get("reviewsCount") or len(reviews))
    return ReviewSummaryResponse(average=average, total=total, breakdown=breakdown)


catalog = CatalogRepository()
