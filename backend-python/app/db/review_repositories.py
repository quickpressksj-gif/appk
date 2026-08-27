"""Review & Rating Repository for QuickPress.

Manages:
- Order-level customer reviews for partner stores and delivery riders.
- Real-time rating and review count recalculation on partner_profiles and rider_profiles.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.db.client import database
from app.models.user import User

logger = logging.getLogger(__name__)

REVIEWS_COLLECTION = "order_reviews"
PARTNER_REVIEWS_COLLECTION = "partner_reviews"
RIDER_REVIEWS_COLLECTION = "rider_reviews"
PARTNER_PROFILES_COLLECTION = "partner_profiles"
RIDER_PROFILES_COLLECTION = "rider_profiles"


class SubmitReviewPayload(BaseModel):
    # Partner rating & feedback
    storeRating: int = Field(..., ge=1, le=5)
    storeFeedback: Optional[str] = None
    storeTags: List[str] = Field(default_factory=list)

    # Rider rating & feedback
    riderRating: Optional[int] = Field(None, ge=1, le=5)
    riderFeedback: Optional[str] = None
    riderTags: List[str] = Field(default_factory=list)
    tipAmount: Optional[int] = Field(0, ge=0)


class ReviewResponse(BaseModel):
    id: str
    orderId: str
    userId: str
    customerName: str
    partnerId: str
    riderId: Optional[str] = None
    storeRating: int
    storeFeedback: Optional[str] = None
    storeTags: List[str] = Field(default_factory=list)
    riderRating: Optional[int] = None
    riderFeedback: Optional[str] = None
    riderTags: List[str] = Field(default_factory=list)
    createdAt: str


class ReviewRepository:
    """Handles reviews submission and real-time aggregate recalculation."""

    async def get_by_order(self, order_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        query: Dict[str, Any] = {"orderId": order_id}
        if user_id:
            query["userId"] = user_id
        return await database.find_one(REVIEWS_COLLECTION, query)

    async def submit_review(
        self,
        order_id: str,
        user: User,
        payload: SubmitReviewPayload,
    ) -> Dict[str, Any]:
        # 1. Fetch order to verify existence and get partnerId/riderId
        order = await database.find_one("customer_orders", {"_id": order_id})
        if not order:
            order = await database.find_one("customer_orders", {"id": order_id})
        if not order:
            raise ValueError("Order not found")

        # Verify order belongs to user
        order_user_id = str(order.get("userId") or (order.get("customer") or {}).get("id") or "")
        if order_user_id and order_user_id != user.id:
            raise PermissionError("You can only review your own orders")

        # Check for existing review
        existing = await self.get_by_order(order_id)
        if existing:
            raise ValueError("You have already reviewed this order")

        partner_id = str(order.get("partnerId") or (order.get("partner") or {}).get("id") or (order.get("store") or {}).get("id") or "")
        rider_id = str(order.get("riderId") or (order.get("rider") or {}).get("id") or "")

        now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        review_id = f"rev-{uuid.uuid4().hex[:12]}"
        customer_name = user.display_name or (user.phone[-4:] if user.phone else "QuickPress Customer")

        # 2. Insert main order review record
        review_doc = {
            "_id": review_id,
            "id": review_id,
            "orderId": order_id,
            "orderCode": order.get("code", order_id),
            "userId": user.id,
            "customerName": customer_name,
            "partnerId": partner_id,
            "riderId": rider_id if rider_id else None,
            "storeRating": payload.storeRating,
            "storeFeedback": payload.storeFeedback,
            "storeTags": payload.storeTags,
            "riderRating": payload.riderRating,
            "riderFeedback": payload.riderFeedback,
            "riderTags": payload.riderTags,
            "tipAmount": payload.tipAmount,
            "createdAt": now_iso,
        }
        await database.collection(REVIEWS_COLLECTION).insert_one(review_doc)

        # 3. Create partner review record
        if partner_id:
            partner_review_doc = {
                "_id": f"prv-{review_id}",
                "partnerId": partner_id,
                "orderId": order_id,
                "orderCode": order.get("code", order_id),
                "customerName": customer_name,
                "rating": payload.storeRating,
                "comment": payload.storeFeedback or "",
                "tags": payload.storeTags,
                "createdAt": now_iso,
                "reply": None,
            }
            await database.collection(PARTNER_REVIEWS_COLLECTION).insert_one(partner_review_doc)
            await self._recalculate_partner_rating(partner_id)

        # 4. Create rider review record
        if rider_id and payload.riderRating:
            rider_review_doc = {
                "_id": f"rrv-{review_id}",
                "riderId": rider_id,
                "orderId": order_id,
                "orderCode": order.get("code", order_id),
                "customerName": customer_name,
                "rating": payload.riderRating,
                "comment": payload.riderFeedback or "",
                "tags": payload.riderTags,
                "tipAmount": payload.tipAmount or 0,
                "createdAt": now_iso,
            }
            await database.collection(RIDER_REVIEWS_COLLECTION).insert_one(rider_review_doc)
            await self._recalculate_rider_rating(rider_id)

        # 5. Mark order as reviewed
        await database.collection("customer_orders").update_one(
            {"_id": order.get("_id")},
            {"$set": {"isReviewed": True, "storeRating": payload.storeRating, "riderRating": payload.riderRating}},
        )

        return review_doc

    async def _recalculate_partner_rating(self, partner_id: str) -> None:
        """Recalculate partner aggregate rating and reviewsCount in real time."""
        try:
            reviews = await database.find_many(PARTNER_REVIEWS_COLLECTION, {"partnerId": partner_id})
            if not reviews:
                return

            total_rating = sum(float(r.get("rating", 5)) for r in reviews)
            count = len(reviews)
            avg_rating = round(total_rating / count, 1)

            breakdown = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            for r in reviews:
                star = int(r.get("rating", 5))
                if 1 <= star <= 5:
                    breakdown[star] += 1

            await database.collection(PARTNER_PROFILES_COLLECTION).update_many(
                {"$or": [{"_id": partner_id}, {"partnerId": partner_id}]},
                {
                    "$set": {
                        "rating": avg_rating,
                        "reviewsCount": count,
                        "totalOrders": max(count, int((await database.find_one(PARTNER_PROFILES_COLLECTION, {"$or": [{"_id": partner_id}, {"partnerId": partner_id}]}) or {}).get("totalOrders", 0))),
                        "ratingBreakdown": breakdown,
                    }
                },
            )
            logger.info("Partner %s rating updated: %.1f from %d reviews", partner_id, avg_rating, count)
        except Exception as exc:
            logger.exception("Failed to recalculate partner rating for %s: %s", partner_id, exc)

    async def _recalculate_rider_rating(self, rider_id: str) -> None:
        """Recalculate rider aggregate rating in real time."""
        try:
            reviews = await database.find_many(RIDER_REVIEWS_COLLECTION, {"riderId": rider_id})
            if not reviews:
                return

            total_rating = sum(float(r.get("rating", 5)) for r in reviews)
            count = len(reviews)
            avg_rating = round(total_rating / count, 1)

            await database.collection(RIDER_PROFILES_COLLECTION).update_many(
                {"$or": [{"_id": rider_id}, {"riderId": rider_id}, {"userId": rider_id}]},
                {
                    "$set": {
                        "rating": avg_rating,
                        "ratingCount": count,
                        "totalReviews": count,
                    }
                },
            )
            logger.info("Rider %s rating updated: %.1f from %d reviews", rider_id, avg_rating, count)
        except Exception as exc:
            logger.exception("Failed to recalculate rider rating for %s: %s", rider_id, exc)

    async def list_partner_reviews(self, partner_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        docs = await database.find_many(PARTNER_REVIEWS_COLLECTION, {"partnerId": partner_id})
        docs.sort(key=lambda d: d.get("createdAt", ""), reverse=True)
        return docs[:limit]


review_repository = ReviewRepository()
