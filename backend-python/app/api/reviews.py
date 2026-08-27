"""Reviews and Ratings API for QuickPress."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import current_user
from app.db.review_repositories import (
    ReviewResponse,
    SubmitReviewPayload,
    review_repository,
)
from app.models.user import User

router = APIRouter(tags=["reviews"])


@router.post("/orders/{order_id}/review", response_model=ReviewResponse)
async def submit_order_review(
    order_id: str,
    payload: SubmitReviewPayload,
    user: User = Depends(current_user),
) -> ReviewResponse:
    """Submit a rating and review for an order (both store and rider)."""
    try:
        doc = await review_repository.submit_review(order_id, user, payload)
        return ReviewResponse(**doc)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc


@router.get("/orders/{order_id}/review")
async def get_order_review(
    order_id: str,
    user: User = Depends(current_user),
) -> Optional[Dict[str, Any]]:
    """Check if the user has already reviewed the order."""
    review = await review_repository.get_by_order(order_id, user.id)
    return review


@router.get("/partners/{partner_id}/reviews")
async def get_partner_reviews(partner_id: str) -> List[Dict[str, Any]]:
    """Get all reviews for a partner store."""
    return await review_repository.list_partner_reviews(partner_id)
