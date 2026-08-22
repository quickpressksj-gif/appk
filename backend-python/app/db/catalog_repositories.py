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
    # Sprint 2.2 — Partner Listing & Partner Details (Live MongoDB Atlas)
    # ------------------------------------------------------------------

    async def _approved_partner_profiles(self) -> List[Dict[str, Any]]:
        """Fetch all approved, verified, non-suspended partner stores from MongoDB Atlas."""
        profiles = await database.find_many("partner_profiles")
        approved = []
        for p in profiles:
            st = str(p.get("status") or "").lower()
            is_v = bool(p.get("isVerified", False))
            if st in ("pending", "rejected", "suspended", "blocked"):
                continue
            if st == "active" or is_v or not st:
                approved.append(p)
        return approved

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
        """GET /api/partners — filtered, sorted and searched live partner cards."""
        profiles = await self._approved_partner_profiles()
        cards: List[PartnerCardResponse] = []

        for p in profiles:
            pid = str(p["_id"])
            services_docs = await database.find_many("partner_services", {"partnerId": pid})
            active_services = [s for s in services_docs if s.get("isActive", True) is not False]
            settings = await database.find_one("partner_settings", {"_id": pid}) or {}

            reviews_count = int(p.get("totalOrders") or p.get("reviewsCount") or 0)
            reviews = f"{reviews_count / 1000:.1f}k" if reviews_count >= 1000 else str(reviews_count)
            pickup = int(settings.get("pickupMinutes") or 30)
            is_open = bool(p.get("isOnline", True) and settings.get("isStoreOpen", True))
            image = p.get("bannerUrl") or p.get("cover") or p.get("logoUrl") or p.get("logo") or "store-1"
            service_names = [s.get("name") for s in active_services if s.get("name")]
            min_price = min([int(s.get("price", 0)) for s in active_services if int(s.get("price", 0)) > 0] or [49])

            card = PartnerCardResponse(
                id=pid,
                name=p.get("businessName") or p.get("name") or "QuickPress Partner",
                logo=p.get("logoUrl") or p.get("logo") or image,
                image=image,
                rating=float(p.get("rating") or 5.0),
                reviews=reviews,
                reviewsCount=reviews_count,
                distanceKm=float(p.get("distanceKm") or 1.5),
                eta=f"{pickup} min pickup",
                pickupTime=f"{pickup} min",
                deliveryTime="24 hrs",
                minPrice=min_price,
                minOrderValue=int(p.get("minOrderValue") or 0),
                services=service_names,
                servicesCount=len(service_names),
                open=is_open,
                status="open" if is_open else "closed",
                city=p.get("city", ""),
                area=p.get("address") or p.get("area") or p.get("city", ""),
                cover=p.get("bannerUrl") or p.get("cover") or image,
                verified=bool(p.get("isVerified", True)),
                offerLabel=p.get("offerLabel"),
                popularity=int(p.get("totalOrders") or 0),
                joinedDaysAgo=int(p.get("joinedDaysAgo") or 30),
                pickupMinutes=pickup,
                tagline=p.get("tagline", "Professional Laundry & Dry Cleaning"),
            )
            cards.append(card)

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

    async def partners(self, *, city: Optional[str] = None, lat: Optional[float] = None, lng: Optional[float] = None, area: Optional[str] = None, limit: int = 10) -> List[PartnerCardResponse]:
        cards = await self.partner_cards(city=city, sort="distance")
        return cards[:limit] if limit > 0 else cards

    async def partner_document(self, partner_id: str) -> Optional[Dict[str, Any]]:
        return await database.find_one("partner_profiles", {"_id": partner_id})

    async def partner_profile(self, partner_id: str) -> Optional[PartnerProfileResponse]:
        detail = await self.partner_detail(partner_id)
        return detail.partner if detail else None

    async def partner_services(self, partner_id: str) -> Optional[List[PartnerServiceResponse]]:
        doc = await database.find_one("partner_profiles", {"_id": partner_id})
        if doc is None:
            return None
        services_docs = await database.find_many("partner_services", {"partnerId": partner_id})
        active_services = [s for s in services_docs if s.get("isActive", True) is not False]
        services: List[PartnerServiceResponse] = []
        for s in active_services:
            price = int(s.get("price") or 0)
            discount = int(s.get("discountPercent") or 0)
            turnaround = s.get("turnaroundHours") or 24
            services.append(
                PartnerServiceResponse(
                    id=str(s.get("_id")),
                    name=s.get("name", "Laundry Service"),
                    description=s.get("description", ""),
                    image=s.get("image", ""),
                    icon=s.get("icon", "sparkles"),
                    basePrice=price,
                    discountPercent=discount,
                    discountLabel=f"{discount}% OFF" if discount else None,
                    finalPrice=round(price * (100 - discount) / 100) if discount else price,
                    startingPrice=price,
                    unit=s.get("unit", "kg"),
                    processingTime=f"{turnaround} hrs",
                    deliveryEta=f"{turnaround} hrs",
                    available=bool(s.get("isActive", True)),
                )
            )
        return services

    async def partner_reviews(self, partner_id: str) -> List[PartnerReviewResponse]:
        docs = await database.find_many("partner_reviews", {"partnerId": partner_id})
        return [
            PartnerReviewResponse(
                id=d["_id"],
                partnerId=partner_id,
                name=d.get("name", "Customer"),
                initials=d.get("initials", "C"),
                photo=d.get("photo", ""),
                rating=float(d.get("rating") or 5.0),
                text=d.get("text", ""),
                date=d.get("date", ""),
                images=list(d.get("images") or []),
            )
            for d in docs
        ]

    async def partner_detail(self, partner_id: str) -> Optional[PartnerDetailResponse]:
        doc = await database.find_one("partner_profiles", {"_id": partner_id})
        if doc is None:
            return None
        st = str(doc.get("status") or "").lower()
        if st in ("pending", "rejected", "suspended", "blocked"):
            return None

        services = await self.partner_services(partner_id) or []
        settings = await database.find_one("partner_settings", {"_id": partner_id}) or {}
        reviews = await self.partner_reviews(partner_id)

        reviews_count = int(doc.get("totalOrders") or doc.get("reviewsCount") or len(reviews))
        reviews_str = f"{reviews_count / 1000:.1f}k" if reviews_count >= 1000 else str(reviews_count)
        is_open = bool(doc.get("isOnline", True) and settings.get("isStoreOpen", True))
        image = doc.get("bannerUrl") or doc.get("cover") or doc.get("logoUrl") or doc.get("logo") or "store-1"
        radius = int(settings.get("pickupRadiusKm") or 8)

        partner_profile = PartnerProfileResponse(
            id=str(doc["_id"]),
            name=doc.get("businessName") or doc.get("name") or "QuickPress Partner",
            cover=doc.get("bannerUrl") or doc.get("cover") or image,
            logo=doc.get("logoUrl") or doc.get("logo") or image,
            image=image,
            verified=bool(doc.get("isVerified", True)),
            rating=float(doc.get("rating") or 5.0),
            reviewCount=reviews_str,
            reviewsCount=reviews_count,
            distanceKm=1.5,
            pickupEta="30 min",
            deliveryEta="24 hrs",
            open=is_open,
            status="open" if is_open else "closed",
            ownerName=doc.get("ownerName", "Partner"),
            address=doc.get("address", ""),
            city=doc.get("city", "Bengaluru"),
            area=doc.get("address") or doc.get("area") or doc.get("city", "Bengaluru"),
            latitude=doc.get("latitude"),
            longitude=doc.get("longitude"),
            pickupRadius=f"{radius} km around {doc.get('city', 'store')}",
            deliveryRadiusKm=radius,
            workingHours=f"{settings.get('openingTime', '08:00')} – {settings.get('closingTime', '21:00')}",
            openingHours=[],
            phone=doc.get("phone", ""),
            about=doc.get("about", "Trusted QuickPress laundry partner providing professional cleaning."),
            yearsInBusiness=int(doc.get("yearsInBusiness") or 2),
            tagline=doc.get("tagline", "Professional Laundry & Dry Cleaning"),
            policies=["Hygienic processing", "Safe color care", "On-time doorstep delivery"],
            offerLabel=doc.get("offerLabel"),
            minPrice=min((s.basePrice for s in services), default=49),
            minOrderValue=int(doc.get("minOrderValue") or 0),
            servicesCount=len(services),
        )

        features = [
            PartnerFeatureResponse(id="f1", title="Doorstep Pickup & Delivery", icon="truck"),
            PartnerFeatureResponse(id="f2", title="Eco-friendly detergent", icon="leaf"),
            PartnerFeatureResponse(id="f3", title="Fabric-safe steam pressing", icon="sparkles"),
            PartnerFeatureResponse(id="f4", title="Express 24 hr turnaround", icon="zap"),
        ]

        return PartnerDetailResponse(
            partner=partner_profile,
            services=services,
            features=features,
            reviews=reviews,
            reviewSummary=review_summary(reviews, doc),
            gallery=[],
            priceList=[
                PriceRowResponse(
                    id=f"pl-{s.id}",
                    service=s.name,
                    unit=f"per {s.unit}",
                    price=s.basePrice,
                )
                for s in services
            ],
        )

    async def filter_options(self) -> FilterOptionsResponse:
        profiles = await self._approved_partner_profiles()
        cities = sorted({p.get("city", "") for p in profiles if p.get("city")})
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
