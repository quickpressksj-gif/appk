"""Partner API — Sprint 5.2 (MongoDB integration for the PARTNER domain).

    GET  /api/partner/dashboard
    GET  /api/partner/profile
    PUT  /api/partner/profile
    GET  /api/partner/settings
    PUT  /api/partner/settings
    GET  /api/partner/orders                (pagination + search + status filter)
    GET  /api/partner/orders/{id}
    POST /api/partner/orders/{id}/accept
    POST /api/partner/orders/{id}/reject
    POST /api/partner/orders/{id}/start-processing
    POST /api/partner/orders/{id}/complete
    GET  /api/partner/history
    GET  /api/partner/services
    POST /api/partner/services
    PUT  /api/partner/services/{id}
    DELETE /api/partner/services/{id}
    PUT  /api/partner/services/{id}/toggle
    GET  /api/partner/earnings
    GET  /api/partner/wallet
    GET  /api/partner/wallet/transactions
    POST /api/partner/wallet/withdraw
    GET  /api/partner/reviews
    GET  /api/partner/notifications
    POST /api/partner/onboarding

The partner id is always derived from the authenticated user (`current_user`),
falling back to the seeded demo partner store when the account has no linked
partner profile — so the partner-frontend preview is never blank.
"""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import current_user
from app.db.notification_repositories import notification_repository
from app.db.partner_repositories import (
    InvalidTransitionError,
    PartnerAccessError,
    PartnerNotFoundError,
    partner_order_repository,
    partner_repository,
    partner_review_repository,
    partner_service_repository,
    partner_wallet_repository,
)
from app.models.partner import (
    BusinessSettingsResponse,
    BusinessSettingsUpdate,
    OnboardingPayload,
    OnboardingResponse,
    PartnerDashboardResponse,
    PartnerEarningsResponse,
    PartnerNotificationResponse,
    PartnerOrderResponse,
    PartnerProfileResponse,
    PartnerProfileUpdate,
    PartnerReviewResponse,
    PartnerServiceCreate,
    PartnerServiceResponse,
    PartnerServiceUpdate,
    PartnerWalletResponse,
    PartnerWalletTransactionResponse,
    RejectOrderPayload,
    WithdrawPayload,
)
from app.models.user import User

router = APIRouter(prefix="/partner", tags=["partner"])


async def _partner_id(user: User = Depends(current_user)) -> str:
    try:
        return await partner_repository.resolve_partner_id(user)
    except PartnerAccessError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))


def _order_response(doc: dict) -> PartnerOrderResponse:
    return PartnerOrderResponse(**{k: v for k, v in doc.items() if k in PartnerOrderResponse.model_fields})


def _service_response(doc: dict) -> PartnerServiceResponse:
    return PartnerServiceResponse(**{k: v for k, v in doc.items() if k in PartnerServiceResponse.model_fields})


# --------------------------------------------------------------------------
# Dashboard
# --------------------------------------------------------------------------


@router.get("/dashboard", response_model=PartnerDashboardResponse)
async def dashboard(partner_id: str = Depends(_partner_id)) -> PartnerDashboardResponse:
    return PartnerDashboardResponse(**await partner_order_repository.dashboard(partner_id))


# --------------------------------------------------------------------------
# Profile / settings
# --------------------------------------------------------------------------


@router.get("/profile", response_model=PartnerProfileResponse)
async def get_profile(partner_id: str = Depends(_partner_id)) -> PartnerProfileResponse:
    try:
        doc = await partner_repository.profile(partner_id)
    except PartnerAccessError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except PartnerNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    return PartnerProfileResponse(**{k: v for k, v in doc.items() if k in PartnerProfileResponse.model_fields})


@router.put("/profile", response_model=PartnerProfileResponse)
async def update_profile(
    payload: PartnerProfileUpdate, partner_id: str = Depends(_partner_id)
) -> PartnerProfileResponse:
    try:
        doc = await partner_repository.update_profile(partner_id, payload.model_dump())
    except PartnerAccessError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except PartnerNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    return PartnerProfileResponse(**{k: v for k, v in doc.items() if k in PartnerProfileResponse.model_fields})


@router.get("/settings", response_model=BusinessSettingsResponse)
async def get_settings(partner_id: str = Depends(_partner_id)) -> BusinessSettingsResponse:
    try:
        doc = await partner_repository.settings(partner_id)
    except PartnerAccessError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except PartnerNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    return BusinessSettingsResponse(**{k: v for k, v in doc.items() if k in BusinessSettingsResponse.model_fields})


@router.put("/settings", response_model=BusinessSettingsResponse)
async def update_settings(
    payload: BusinessSettingsUpdate, partner_id: str = Depends(_partner_id)
) -> BusinessSettingsResponse:
    doc = await partner_repository.update_settings(partner_id, payload.model_dump())
    return BusinessSettingsResponse(**{k: v for k, v in doc.items() if k in BusinessSettingsResponse.model_fields})


# --------------------------------------------------------------------------
# Orders
# --------------------------------------------------------------------------


@router.get("/orders")
async def list_orders(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    q: Optional[str] = Query(default=None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    partner_id: str = Depends(_partner_id),
) -> dict:
    envelope = await partner_order_repository.list(
        partner_id, status=status_filter, q=q, page=page, page_size=pageSize
    )
    envelope["items"] = [_order_response(doc) for doc in envelope["items"]]
    return envelope


@router.get("/history", response_model=List[PartnerOrderResponse])
async def order_history(partner_id: str = Depends(_partner_id)) -> List[PartnerOrderResponse]:
    docs = await partner_order_repository.history(partner_id)
    return [_order_response(doc) for doc in docs]


@router.get("/orders/{order_id}", response_model=PartnerOrderResponse)
async def get_order(order_id: str, partner_id: str = Depends(_partner_id)) -> PartnerOrderResponse:
    try:
        doc = await partner_order_repository.by_id(partner_id, order_id)
    except PartnerAccessError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except PartnerNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    return _order_response(doc)


@router.post("/orders/{order_id}/accept", response_model=PartnerOrderResponse)
async def accept_order(order_id: str, partner_id: str = Depends(_partner_id)) -> PartnerOrderResponse:
    try:
        doc = await partner_order_repository.accept(partner_id, order_id)
    except PartnerAccessError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except PartnerNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except InvalidTransitionError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    return _order_response(doc)


@router.post("/orders/{order_id}/reject", response_model=PartnerOrderResponse)
async def reject_order(
    order_id: str, payload: RejectOrderPayload | None = None, partner_id: str = Depends(_partner_id)
) -> PartnerOrderResponse:
    try:
        doc = await partner_order_repository.reject(partner_id, order_id, (payload or RejectOrderPayload()).reason)
    except PartnerAccessError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except PartnerNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except InvalidTransitionError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    return _order_response(doc)


@router.post("/orders/{order_id}/start-processing", response_model=PartnerOrderResponse)
async def start_processing(order_id: str, partner_id: str = Depends(_partner_id)) -> PartnerOrderResponse:
    try:
        doc = await partner_order_repository.start_processing(partner_id, order_id)
    except PartnerAccessError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except PartnerNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except InvalidTransitionError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    return _order_response(doc)


@router.post("/orders/{order_id}/complete", response_model=PartnerOrderResponse)
async def complete_order(order_id: str, partner_id: str = Depends(_partner_id)) -> PartnerOrderResponse:
    try:
        doc = await partner_order_repository.complete(partner_id, order_id)
    except PartnerAccessError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except PartnerNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except InvalidTransitionError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    return _order_response(doc)


# --------------------------------------------------------------------------
# Services (rate card)
# --------------------------------------------------------------------------


@router.get("/services", response_model=List[PartnerServiceResponse])
async def list_services(partner_id: str = Depends(_partner_id)) -> List[PartnerServiceResponse]:
    docs = await partner_service_repository.list(partner_id)
    return [_service_response(doc) for doc in docs]


@router.post("/services", response_model=PartnerServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_service(
    payload: PartnerServiceCreate, partner_id: str = Depends(_partner_id)
) -> PartnerServiceResponse:
    doc = await partner_service_repository.create(partner_id, payload.model_dump())
    return _service_response(doc)


@router.put("/services/{service_id}", response_model=PartnerServiceResponse)
async def update_service(
    service_id: str, payload: PartnerServiceUpdate, partner_id: str = Depends(_partner_id)
) -> PartnerServiceResponse:
    try:
        doc = await partner_service_repository.update(partner_id, service_id, payload.model_dump())
    except PartnerAccessError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except PartnerNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    return _service_response(doc)


@router.put("/services/{service_id}/toggle", response_model=PartnerServiceResponse)
async def toggle_service(
    service_id: str, enabled: bool = Query(...), partner_id: str = Depends(_partner_id)
) -> PartnerServiceResponse:
    try:
        doc = await partner_service_repository.toggle(partner_id, service_id, enabled)
    except PartnerAccessError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except PartnerNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    return _service_response(doc)


@router.delete(
    "/services/{service_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
)
async def delete_service(service_id: str, partner_id: str = Depends(_partner_id)) -> None:
    try:
        await partner_service_repository.delete(partner_id, service_id)
    except PartnerAccessError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except PartnerNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))


# --------------------------------------------------------------------------
# Earnings / wallet
# --------------------------------------------------------------------------


@router.get("/earnings", response_model=PartnerEarningsResponse)
async def earnings(partner_id: str = Depends(_partner_id)) -> PartnerEarningsResponse:
    return PartnerEarningsResponse(**await partner_order_repository.earnings(partner_id))


@router.get("/wallet", response_model=Optional[PartnerWalletResponse])
async def wallet(partner_id: str = Depends(_partner_id)) -> Optional[PartnerWalletResponse]:
    doc = await partner_wallet_repository.wallet(partner_id)
    if doc is None:
        return None
    return PartnerWalletResponse(**{k: v for k, v in doc.items() if k in PartnerWalletResponse.model_fields})


@router.get("/wallet/transactions", response_model=List[PartnerWalletTransactionResponse])
async def wallet_transactions(
    partner_id: str = Depends(_partner_id),
) -> List[PartnerWalletTransactionResponse]:
    docs = await partner_wallet_repository.transactions(partner_id)
    return [
        PartnerWalletTransactionResponse(**{k: v for k, v in doc.items() if k in PartnerWalletTransactionResponse.model_fields})
        for doc in docs
    ]


@router.post("/wallet/withdraw", response_model=PartnerWalletResponse)
async def withdraw(payload: WithdrawPayload, partner_id: str = Depends(_partner_id)) -> PartnerWalletResponse:
    try:
        doc = await partner_wallet_repository.withdraw(partner_id, payload.amount)
    except PartnerAccessError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except PartnerNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except InvalidTransitionError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    return PartnerWalletResponse(**{k: v for k, v in doc.items() if k in PartnerWalletResponse.model_fields})


# --------------------------------------------------------------------------
# Reviews / notifications / onboarding
# --------------------------------------------------------------------------


@router.get("/reviews", response_model=List[PartnerReviewResponse])
async def reviews(partner_id: str = Depends(_partner_id)) -> List[PartnerReviewResponse]:
    docs = await partner_review_repository.list(partner_id)
    return [PartnerReviewResponse(**{k: v for k, v in doc.items() if k in PartnerReviewResponse.model_fields}) for doc in docs]


@router.get("/notifications", response_model=List[PartnerNotificationResponse])
async def notifications(user: User = Depends(current_user)) -> List[PartnerNotificationResponse]:
    feed = await notification_repository.list(user.id, page=1, limit=50, search="", type_filter="all")
    items = getattr(feed, "items", None)
    if items is None and isinstance(feed, dict):
        items = feed.get("items", [])
    return [
        PartnerNotificationResponse(
            id=item.id if hasattr(item, "id") else item["id"],
            title=item.title if hasattr(item, "title") else item["title"],
            body=item.description if hasattr(item, "description") else item.get("description", ""),
            date=str(item.createdAt if hasattr(item, "createdAt") else item.get("createdAt", "")),
            read=item.read if hasattr(item, "read") else item.get("read", False),
            kind=item.kind if hasattr(item, "kind") else item.get("kind", "alert"),
        )
        for item in (items or [])
    ]


@router.post("/onboarding", response_model=OnboardingResponse)
async def onboarding(payload: OnboardingPayload, user: User = Depends(current_user)) -> OnboardingResponse:
    partner_id = await partner_repository.resolve_partner_id(user)
    changes = {
        "businessName": payload.businessName,
        "ownerName": payload.ownerName,
        "city": payload.city,
    }
    try:
        await partner_repository.update_profile(partner_id, changes)
    except PartnerNotFoundError:
        pass
    return OnboardingResponse(
        partnerId=partner_id,
        phone=user.phone or "",
        businessName=payload.businessName,
        isVerified=True,
        isOnboarded=True,
    )
