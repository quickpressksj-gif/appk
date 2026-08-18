"""Service Details repository — Sprint 2.3.

Reads live from the MongoDB collections seeded on startup:

    services          — service catalog (name, category, price, unit, timing)
    categories        — category titles used as the service category label
    catalog_partners  — partners and the `serviceItems` menu they offer
    partner_reviews   — customer reviews aggregated onto the service
    service_content   — care instructions, FAQs, inclusions per category

`GET /api/services/{id}` accepts every id the app has ever linked with: the
service document id (`s1`), the service slug (`wash-fold`, used by the partner
service menu) or a category id (`c1`).
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple

from app.db.client import database
from app.db.service_content import (
    DEFAULT_BENEFITS,
    DEFAULT_CARE_INSTRUCTIONS,
    DEFAULT_FAQ,
    DEFAULT_INCLUDED,
)
from app.models.cart import (
    RelatedServiceResponse,
    ServiceDetailResponse,
    ServiceFaqResponse,
    ServiceHeroResponse,
    ServicePartnerResponse,
)
from app.models.catalog import PartnerReviewResponse, ReviewSummaryResponse


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (value or "").lower()).strip("-")


def _reviews_label(count: int) -> str:
    return f"{count / 1000:.1f}k" if count >= 1000 else str(count)


def _orders_label(count: int) -> str:
    if count >= 1000:
        return f"{int(count / 1000)}K+"
    return f"{max(count, 0)}+"


class ServiceRepository:
    # ------------------------------------------------------------------ reads

    async def _service_documents(self) -> List[Dict[str, Any]]:
        return await database.find_many("services")

    async def resolve(self, service_id: str) -> Optional[Dict[str, Any]]:
        """Find the service document behind any id the UI may pass."""
        needle = (service_id or "").strip().lower()
        if not needle:
            return None

        documents = await self._service_documents()
        for document in documents:
            if str(document["_id"]).lower() == needle:
                return document
        for document in documents:
            if slugify(document.get("name", "")) == needle:
                return document

        # Category id → the cheapest service in that category.
        in_category = [d for d in documents if str(d.get("categoryId", "")).lower() == needle]
        if in_category:
            return sorted(in_category, key=lambda d: int(d.get("price") or 0))[0]

        # Partner menu slug (e.g. "dry-cleaning") → match on the menu item name.
        item = await self._partner_service_item(needle)
        if item:
            for document in documents:
                if slugify(document.get("name", "")) == slugify(item.get("name", "")):
                    return document
            # No catalog row: synthesise one from the partner menu item.
            return {
                "_id": needle,
                "name": item.get("name", "Service"),
                "categoryId": "",
                "unit": item.get("unit", ""),
                "price": int(item.get("price") or 0),
                "description": item.get("description", ""),
                "discountPercent": int(item.get("discountPercent") or 0),
                "processingTime": item.get("processingTime", "24 hrs"),
                "image": item.get("image", ""),
                "popular": False,
            }
        return None

    async def _partner_service_item(self, slug: str) -> Optional[Dict[str, Any]]:
        for partner in await database.find_many("catalog_partners"):
            for item in partner.get("serviceItems") or []:
                if str(item.get("id", "")).lower() == slug or slugify(item.get("name", "")) == slug:
                    return item
        return None

    async def _menu_matches(self, document: Dict[str, Any]) -> List[Tuple[Dict[str, Any], Dict[str, Any]]]:
        """Every (partner, menu item) pair that offers this service."""
        target = slugify(document.get("name", ""))
        target_id = str(document["_id"]).lower()
        pairs: List[Tuple[Dict[str, Any], Dict[str, Any]]] = []
        for partner in await database.find_many("catalog_partners"):
            for item in partner.get("serviceItems") or []:
                item_slug = slugify(item.get("name", ""))
                if item_slug == target or str(item.get("id", "")).lower() in {target, target_id}:
                    pairs.append((partner, item))
                    break
        return pairs

    async def _content(self, category_id: str) -> Dict[str, Any]:
        document = await database.collection("service_content").find_one({"_id": category_id})
        return document or {}

    # ------------------------------------------------------------- projections

    async def service_detail(self, service_id: str) -> Optional[ServiceDetailResponse]:
        document = await self.resolve(service_id)
        if document is None:
            return None

        pairs = await self._menu_matches(document)
        content = await self._content(str(document.get("categoryId") or ""))
        categories = {c["_id"]: c for c in await database.find_many("categories")}
        category = categories.get(document.get("categoryId"))

        price = int(document.get("price") or 0)
        discount = int(document.get("discountPercent") or 0)
        processing = document.get("processingTime", "24 hrs")
        image = document.get("image") or (pairs[0][1].get("image") if pairs else "") or "service-hero"

        menu_prices = [int(item.get("price") or 0) for _, item in pairs if item.get("price")]
        starting_price = min(menu_prices) if menu_prices else price
        pickup_minutes = min((int(p.get("pickupMinutes") or 30) for p, _ in pairs), default=30)
        delivery = pairs[0][1].get("processingTime", processing) if pairs else processing

        ratings = [float(p.get("rating") or 0) for p, _ in pairs if p.get("rating")]
        reviews_count = sum(int(p.get("reviewsCount") or 0) for p, _ in pairs)
        rating = round(sum(ratings) / len(ratings), 1) if ratings else 4.8

        reviews = await self.service_reviews(document, pairs)
        breakdown = {str(star): 0 for star in range(1, 6)}
        for review in reviews:
            breakdown[str(max(1, min(5, round(review.rating))))] += 1

        hero = ServiceHeroResponse(
            id=str(document["_id"]),
            name=document.get("name", "Service"),
            title=document.get("name", "Service"),
            category=category.get("title", "") if category else "",
            categoryId=str(document.get("categoryId") or ""),
            description=document.get("description", ""),
            shortDescription=document.get("description", ""),
            image=image,
            unit=document.get("unit", ""),
            basePrice=price,
            discountPercent=discount,
            discountLabel=f"{discount}% OFF" if discount else None,
            finalPrice=round(price * (100 - discount) / 100),
            startingPrice=starting_price,
            processingTime=processing,
            pickupEta=f"{pickup_minutes} min",
            deliveryEta=delivery,
            rating=rating,
            reviewsCount=reviews_count,
            reviewCount=_reviews_label(reviews_count),
            ordersCompleted=_orders_label(reviews_count * 6),
            partnerCount=len(pairs),
            about=document.get("about") or document.get("description", ""),
            included=list(content.get("included") or DEFAULT_INCLUDED),
            benefits=list(content.get("benefits") or DEFAULT_BENEFITS),
        )

        return ServiceDetailResponse(
            service=hero,
            careInstructions=list(content.get("careInstructions") or DEFAULT_CARE_INSTRUCTIONS),
            faq=[ServiceFaqResponse(**entry) for entry in (content.get("faq") or DEFAULT_FAQ)],
            related=await self.related_services(document),
            partners=await self.service_partners(document),
            reviews=reviews,
            reviewSummary=ReviewSummaryResponse(
                average=rating,
                total=reviews_count or len(reviews),
                breakdown=breakdown,
            ),
        )

    async def service_partners(self, document: Dict[str, Any]) -> List[ServicePartnerResponse]:
        """GET /api/services/{id}/partners — logo, name, rating, distance, ETA, price."""
        partners: List[ServicePartnerResponse] = []
        for partner, item in await self._menu_matches(document):
            reviews_count = int(partner.get("reviewsCount") or 0)
            pickup = int(partner.get("pickupMinutes") or 30)
            is_open = bool(partner.get("isOpen", True))
            image = partner.get("image") or partner.get("logo") or ""
            partners.append(
                ServicePartnerResponse(
                    id=partner["_id"],
                    name=partner.get("name", ""),
                    logo=partner.get("logo") or image,
                    image=image,
                    rating=float(partner.get("rating") or 0),
                    reviews=_reviews_label(reviews_count),
                    reviewsCount=reviews_count,
                    distanceKm=float(partner.get("distanceKm") or 0),
                    pickupEta=f"{pickup} min",
                    deliveryEta=item.get("processingTime")
                    or partner.get("deliveryTime", "24 hrs"),
                    startingPrice=int(item.get("price") or partner.get("minPrice") or 0),
                    open=is_open,
                    status="open" if is_open else "closed",
                    offerLabel=partner.get("offerLabel"),
                    city=partner.get("city", ""),
                    area=partner.get("area", ""),
                )
            )
        return sorted(partners, key=lambda p: (not p.open, p.distanceKm))

    async def related_services(self, document: Dict[str, Any]) -> List[RelatedServiceResponse]:
        """GET /api/services/{id}/related — same category first, then popular."""
        documents = await self._service_documents()
        category_id = document.get("categoryId")
        siblings = [
            d
            for d in documents
            if d["_id"] != document["_id"] and category_id and d.get("categoryId") == category_id
        ]
        others = [
            d
            for d in documents
            if d["_id"] != document["_id"] and d not in siblings and d.get("popular")
        ]
        rest = [d for d in documents if d["_id"] != document["_id"] and d not in siblings and d not in others]
        ordered = (siblings + others + rest)[:6]

        related: List[RelatedServiceResponse] = []
        for entry in ordered:
            slug = slugify(entry.get("name", ""))
            item = await self._partner_service_item(slug)
            related.append(
                RelatedServiceResponse(
                    id=slug or str(entry["_id"]),
                    name=entry.get("name", ""),
                    description=entry.get("description", ""),
                    image=entry.get("image") or (item.get("image", "") if item else ""),
                    price=int(entry.get("price") or 0),
                    unit=entry.get("unit", ""),
                    discountPercent=int(entry.get("discountPercent") or 0),
                    processingTime=entry.get("processingTime", ""),
                )
            )
        return related

    async def service_reviews(
        self,
        document: Dict[str, Any],
        pairs: Optional[List[Tuple[Dict[str, Any], Dict[str, Any]]]] = None,
    ) -> List[PartnerReviewResponse]:
        """Reviews of every partner offering this service, newest first."""
        pairs = pairs if pairs is not None else await self._menu_matches(document)
        partner_ids = {partner["_id"] for partner, _ in pairs}
        docs = await database.find_many("partner_reviews")
        return [
            PartnerReviewResponse(
                id=d["_id"],
                partnerId=d.get("partnerId", ""),
                name=d.get("name", "Customer"),
                initials=d.get("initials", "C"),
                photo=d.get("photo", ""),
                rating=float(d.get("rating") or 0),
                text=d.get("text", ""),
                date=d.get("date", ""),
                images=list(d.get("images") or []),
            )
            for d in docs
            if not partner_ids or d.get("partnerId") in partner_ids
        ][:8]


services_repository = ServiceRepository()
