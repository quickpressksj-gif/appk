"""Rider API — Sprint 5.2 (Rider MongoDB integration).

Mirrors every "/api/rider/..." handler in backend/src/mock/server.ts so the
rider frontend (backend/src/rider/*.ts) works unchanged against FastAPI +
MongoDB. Reads fall back to the seeded demo rider so the preview is never
blank before a real rider account exists.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import current_user, require_roles
from app.db.rider_repositories import (
    RiderAccessError,
    rider_analytics_repository,
    rider_delivery_repository,
    rider_earnings_repository,
    rider_notification_repository,
    rider_profile_repository,
    rider_settings_repository,
    rider_wallet_repository,
)
from app.models.user import Role, User
from app.services import order_lifecycle as lifecycle

# P0: every authenticated /api/rider/* endpoint is rider-only. The guard lives
# on the router (same pattern as the admin router) so a new handler cannot ship
# with authentication but no authorization. Admin is deliberately NOT allowed
# here — admin oversight lives under /api/admin/*.
router = APIRouter(
    prefix="/rider",
    tags=["rider"],
    dependencies=[Depends(require_roles(Role.rider))],
)

# Pre-account rider onboarding endpoints: these are hit before a rider user
# exists, so they stay unauthenticated (unchanged behaviour).
public_router = APIRouter(prefix="/rider", tags=["rider"])


async def _rider_id(user: User) -> str:
    try:
        return await rider_profile_repository.resolve_rider_id(user)
    except RiderAccessError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))


def _public(document: dict) -> dict:
    return {k: v for k, v in document.items() if k != "_id"}


# --------------------------------------------------------------------------
# Auth
# --------------------------------------------------------------------------


@public_router.get("/auth/existing-numbers")
async def existing_numbers() -> list:
    from app.db.client import database

    profiles = await database.find_many("rider_profiles")
    return [p.get("phone") for p in profiles if p.get("phone")]


@public_router.post("/auth/registration")
async def submit_registration(body: dict) -> dict:
    return {"ok": True, "payload": body.get("payload", body)}



# --------------------------------------------------------------------------
# Dashboard / online / location
# --------------------------------------------------------------------------


@router.get("/dashboard")
async def dashboard(user: User = Depends(current_user)) -> dict:
    rider_id = await _rider_id(user)
    return await rider_delivery_repository.dashboard(rider_id)


@router.post("/online")
async def set_online(body: dict | None = None, user: User = Depends(current_user)) -> dict:
    rider_id = await _rider_id(user)
    is_online = (body or {}).get("isOnline")
    return await rider_profile_repository.set_online(rider_id, is_online)


@router.post("/location")
async def push_location(body: dict, user: User = Depends(current_user)) -> dict:
    return {"ok": True, "lat": body.get("lat"), "lng": body.get("lng")}


# --------------------------------------------------------------------------
# Profile / settings
# --------------------------------------------------------------------------


@router.get("/profile")
async def get_profile(user: User = Depends(current_user)) -> dict:
    rider_id = await _rider_id(user)
    profile = await rider_profile_repository.get(rider_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rider profile not found")
    return _public(profile)


@router.put("/profile")
@router.patch("/profile")
async def update_profile(body: dict, user: User = Depends(current_user)) -> dict:
    rider_id = await _rider_id(user)
    updated = await rider_profile_repository.update(rider_id, body)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rider profile not found")
    return _public(updated)


@router.get("/settings")
async def get_settings_route(user: User = Depends(current_user)) -> dict:
    rider_id = await _rider_id(user)
    return await rider_settings_repository.get(rider_id)


@router.patch("/settings")
async def update_settings(body: dict, user: User = Depends(current_user)) -> dict:
    rider_id = await _rider_id(user)
    return await rider_settings_repository.update(rider_id, body)


# --------------------------------------------------------------------------
# Orders / deliveries
# --------------------------------------------------------------------------


@router.get("/orders")
async def list_orders(
    q: Optional[str] = None,
    status_filter: Optional[str] = Query(default=None, alias="status"),
    scope: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
    user: User = Depends(current_user),
):
    rider_id = await _rider_id(user)
    if scope == "history":
        return await rider_delivery_repository.history(rider_id)
    return await rider_delivery_repository.list(
        rider_id, q=q, status=status_filter, page=page, page_size=pageSize
    )


@router.get("/orders/{order_id}")
async def get_order(order_id: str, user: User = Depends(current_user)) -> dict:
    rider_id = await _rider_id(user)
    try:
        order = await rider_delivery_repository.by_id(order_id, rider_id)
    except lifecycle.OrderAuthorizationError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


async def _rider_action(action, order_id: str, user: User, **kwargs) -> dict:
    """Every rider transition is authenticated, ownership checked and audited."""
    rider_id = await _rider_id(user)
    try:
        return await action(order_id, rider_id=rider_id, **kwargs)
    except LookupError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except lifecycle.OrderAuthorizationError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except PermissionError as error:  # OTP mismatch
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))


@router.post("/orders/{order_id}/accept")
async def accept_order(order_id: str, user: User = Depends(current_user)) -> dict:
    return await _rider_action(rider_delivery_repository.accept, order_id, user)


@router.post("/orders/{order_id}/pickup")
async def pickup_order(
    order_id: str, body: dict | None = None, user: User = Depends(current_user)
) -> dict:
    return await _rider_action(
        rider_delivery_repository.pickup, order_id, user, otp=(body or {}).get("otp")
    )


@router.post("/orders/{order_id}/drop-at-partner")
async def drop_at_partner(order_id: str, user: User = Depends(current_user)) -> dict:
    return await _rider_action(rider_delivery_repository.drop_at_partner, order_id, user)


@router.post("/orders/{order_id}/start-delivery")
async def start_delivery(order_id: str, user: User = Depends(current_user)) -> dict:
    return await _rider_action(rider_delivery_repository.start_delivery, order_id, user)


@router.post("/orders/{order_id}/deliver")
async def deliver_order(
    order_id: str, body: dict | None = None, user: User = Depends(current_user)
) -> dict:
    return await _rider_action(
        rider_delivery_repository.deliver, order_id, user, otp=(body or {}).get("otp")
    )


@router.post("/orders/{order_id}/reject")
async def reject_order(
    order_id: str, body: dict | None = None, user: User = Depends(current_user)
) -> dict:
    rider_id = await _rider_id(user)
    try:
        order = await rider_delivery_repository.by_id(order_id, rider_id)
    except lifecycle.OrderAuthorizationError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


# --------------------------------------------------------------------------
# History / earnings / wallet
# --------------------------------------------------------------------------


@router.get("/history")
async def history(user: User = Depends(current_user)) -> list:
    rider_id = await _rider_id(user)
    return await rider_delivery_repository.history(rider_id)


@router.get("/earnings")
async def earnings(user: User = Depends(current_user)) -> dict:
    rider_id = await _rider_id(user)
    return await rider_earnings_repository.summary(rider_id)


@router.get("/wallet")
async def wallet(user: User = Depends(current_user)) -> dict:
    rider_id = await _rider_id(user)
    wallet_doc = await rider_wallet_repository.get(rider_id)
    if wallet_doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wallet not found")
    return wallet_doc


@router.post("/wallet/withdraw")
async def withdraw(body: dict, user: User = Depends(current_user)) -> dict:
    rider_id = await _rider_id(user)
    try:
        return await rider_wallet_repository.withdraw(rider_id, float(body.get("amount", 0)))
    except LookupError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))


@router.get("/wallet/transactions")
async def wallet_transactions(user: User = Depends(current_user)) -> list:
    rider_id = await _rider_id(user)
    return await rider_wallet_repository.transactions(rider_id)


# --------------------------------------------------------------------------
# Notifications
# --------------------------------------------------------------------------


@router.get("/notifications")
async def notifications(user: User = Depends(current_user)) -> list:
    rider_id = await _rider_id(user)
    return await rider_notification_repository.list(rider_id)


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str) -> dict:
    updated = await rider_notification_repository.mark_read(notification_id)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return _public(updated)


@router.post("/notifications/read-all")
async def mark_all_notifications_read(user: User = Depends(current_user)) -> dict:
    rider_id = await _rider_id(user)
    count = await rider_notification_repository.mark_all_read(rider_id)
    return {"ok": True, "count": count}


# --------------------------------------------------------------------------
# Analytics
# --------------------------------------------------------------------------


@router.get("/analytics")
async def analytics(
    limit: int = Query(default=30, ge=1, le=100), user: User = Depends(current_user)
) -> list:
    rider_id = await _rider_id(user)
    return await rider_analytics_repository.list(rider_id, limit=limit)
