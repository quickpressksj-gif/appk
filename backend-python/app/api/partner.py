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

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import current_user
from app.db.client import database
from app.db.notification_repositories import notification_repository
from app.db.repositories import users
from app.db.partner_repositories import (
    InvalidTransitionError,
    PartnerAccessError,
    PartnerNotFoundError,
    partner_analytics_repository,
    partner_customer_repository,
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


@router.get("/services/{service_id}", response_model=PartnerServiceResponse)
async def get_service(
    service_id: str, partner_id: str = Depends(_partner_id)
) -> PartnerServiceResponse:
    try:
        doc = await partner_service_repository.by_id(partner_id, service_id)
    except PartnerAccessError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except PartnerNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    return _service_response(doc)


@router.put("/services/{service_id}", response_model=PartnerServiceResponse)
@router.patch("/services/{service_id}", response_model=PartnerServiceResponse)
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
@router.patch("/services/{service_id}/status", response_model=PartnerServiceResponse)
async def toggle_service(
    service_id: str,
    enabled: Optional[bool] = Query(default=None),
    status_param: Optional[str] = Query(default=None, alias="status"),
    body: Optional[dict] = None,
    partner_id: str = Depends(_partner_id),
) -> PartnerServiceResponse:
    is_enabled = True
    if enabled is not None:
        is_enabled = enabled
    elif status_param is not None:
        is_enabled = status_param.lower() in ("active", "true", "enabled", "1")
    elif body and ("enabled" in body or "isActive" in body or "status" in body):
        is_enabled = bool(body.get("enabled", body.get("isActive", body.get("status") == "active")))

    try:
        doc = await partner_service_repository.toggle(partner_id, service_id, is_enabled)
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


@router.get("/customers")
async def get_customers(partner_id: str = Depends(_partner_id)) -> List[dict]:
    return await partner_customer_repository.list(partner_id)


@router.get("/analytics")
async def get_analytics(
    period: str = Query("7d"), partner_id: str = Depends(_partner_id)
) -> dict:
    return await partner_analytics_repository.get(partner_id, period=period)


@router.patch("/store/status")
async def update_store_status(
    body: dict, partner_id: str = Depends(_partner_id)
) -> PartnerProfileResponse:
    is_online = bool(body.get("isOnline", body.get("isOpen", True)))
    doc = await partner_repository.toggle_status(partner_id, is_online)
    return PartnerProfileResponse(**{k: v for k, v in doc.items() if k in PartnerProfileResponse.model_fields})


@router.post("/withdraw")
async def partner_withdraw(
    payload: WithdrawPayload, partner_id: str = Depends(_partner_id)
) -> PartnerWalletResponse:
    try:
        doc = await partner_wallet_repository.withdraw(partner_id, payload.amount)
    except PartnerAccessError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except PartnerNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except InvalidTransitionError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    return PartnerWalletResponse(**{k: v for k, v in doc.items() if k in PartnerWalletResponse.model_fields})


@router.post("/onboarding", response_model=OnboardingResponse)
async def onboarding(payload: OnboardingPayload, user: User = Depends(current_user)) -> OnboardingResponse:
    account = await database.find_one("partners", {"user_id": user.id}) or {}
    partner_id = (
        account.get("partner_id")
        or account.get("partnerId")
        or getattr(user, "linked_partner_id", None)
    )
    if not partner_id:
        partner_id = f"PRT-{uuid.uuid4().hex[:8].upper()}"
        await database.update(
            "partners", {"user_id": user.id}, {"partner_id": partner_id, "user_id": user.id}, upsert=True
        )

    store_id_str = str(partner_id)
    changes = {
        "_id": store_id_str,
        "partnerId": store_id_str,
        "userId": user.id,
        "businessName": payload.businessName,
        "ownerName": payload.ownerName,
        "category": payload.category,
        "gstin": payload.gstin,
        "address": payload.address,
        "city": payload.city,
        "pincode": payload.pincode,
        "openingTime": payload.openingTime,
        "closingTime": payload.closingTime,
        "status": "active",
        "isVerified": True,
    }
    existing_profile = await database.find_one("partner_profiles", {"_id": store_id_str})
    if existing_profile is None:
        await database.insert(
            "partner_profiles",
            {
                **changes,
                "rating": 5.0,
                "totalOrders": 0,
                "joinedOn": datetime.now(timezone.utc).strftime("%B %Y"),
                "onTimeRate": 98.5,
                "tier": "Silver",
                "isOnline": True,
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "updatedAt": datetime.now(timezone.utc).isoformat(),
            },
        )
    else:
        await partner_repository.update_profile(store_id_str, changes)

    # Initialize partner store settings
    await database.update(
        "partner_settings",
        {"_id": store_id_str},
        {
            "_id": store_id_str,
            "partnerId": store_id_str,
            "isStoreOpen": True,
            "acceptingNewOrders": True,
            "autoAcceptOrders": True,
            "expressDelivery": True,
            "pickupRadiusKm": 10,
            "openingTime": payload.openingTime or "08:00",
            "closingTime": payload.closingTime or "21:00",
            "weeklyOff": "None",
            "dailyOrderCap": 50,
        },
        upsert=True,
    )

    # Ensure partner has initial rate-card services
    existing_services = await database.find_many("partner_services", {"partnerId": store_id_str})
    if not existing_services:
        sample_services = [
            {"_id": f"svc-{store_id_str[:8]}-1", "partnerId": store_id_str, "name": "Wash & Fold", "category": "laundry", "price": 79, "unit": "kg", "turnaroundHours": 24, "isActive": True, "description": "Daily wear clothes washed, dried and neatly folded."},
            {"_id": f"svc-{store_id_str[:8]}-2", "partnerId": store_id_str, "name": "Steam Press", "category": "iron", "price": 19, "unit": "pc", "turnaroundHours": 12, "isActive": True, "description": "Crisp wrinkle-free finish with temperature-controlled steam."},
            {"_id": f"svc-{store_id_str[:8]}-3", "partnerId": store_id_str, "name": "Wash & Iron", "category": "laundry", "price": 99, "unit": "kg", "turnaroundHours": 24, "isActive": True, "description": "Complete wash, fabric conditioner and steam press."},
            {"_id": f"svc-{store_id_str[:8]}-4", "partnerId": store_id_str, "name": "Dry Cleaning", "category": "dryclean", "price": 149, "unit": "pc", "turnaroundHours": 48, "isActive": True, "description": "Specialized eco-friendly dry clean for suits, blazers and silks."},
        ]
        for doc in sample_services:
            await database.insert("partner_services", doc)

    await users.update(
        user.id,
        {
            "is_onboarded": True,
            "is_verified": True,
            "status": "active",
            "display_name": payload.ownerName or payload.businessName,
            "city": payload.city,
        },
    )
    return OnboardingResponse(
        partnerId=store_id_str,
        phone=user.phone or "",
        businessName=payload.businessName,
        isVerified=True,
        isOnboarded=True,
    )
