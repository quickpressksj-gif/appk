"""Rider API — Sprint 5.2 (Rider MongoDB integration).

Mirrors every "/api/rider/..." handler in backend/src/mock/server.ts so the
rider frontend (backend/src/rider/*.ts) works unchanged against FastAPI +
MongoDB. Reads fall back to the seeded demo rider so the preview is never
blank before a real rider account exists.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import current_user, require_roles
from app.core.identifiers import generate_rider_id
from app.db.client import database
from app.db.repositories import users
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
# Auth & Onboarding
# --------------------------------------------------------------------------


@public_router.get("/auth/existing-numbers")
async def existing_numbers() -> list:
    profiles = await database.find_many("rider_profiles")
    return [p.get("phone") for p in profiles if p.get("phone")]


@router.post("/onboarding")
async def rider_onboarding(body: dict, user: User = Depends(current_user)) -> dict:
    payload = body.get("payload", body)

    # 1. Resolve or generate rider_id
    account = await database.find_one("riders", {"user_id": user.id}) or {}
    rider_id = account.get("rider_id") or account.get("riderId") or getattr(user, "linked_id", None)
    if not rider_id:
        existing_profile = await database.find_one("rider_profiles", {"userId": user.id})
        if existing_profile:
            rider_id = existing_profile.get("_id")
    if not rider_id:
        rider_id = await generate_rider_id()

    rider_id_str = str(rider_id)
    await database.update("riders", {"user_id": user.id}, {"rider_id": rider_id_str, "user_id": user.id}, upsert=True)

    # 2. Extract profile fields
    full_name = payload.get("fullName") or user.display_name or "Delivery Partner"
    phone = payload.get("mobile") or user.phone or ""
    email = payload.get("email") or user.email or ""
    city = payload.get("city") or payload.get("preferredCity") or "Kasganj"

    profile_data = {
        "_id": rider_id_str,
        "riderId": rider_id_str,
        "userId": user.id,
        "fullName": full_name,
        "name": full_name,
        "phone": phone,
        "email": email,
        "dob": payload.get("dob", ""),
        "gender": payload.get("gender", "male"),
        "address": payload.get("address", ""),
        "city": city,
        "state": payload.get("state", ""),
        "pincode": payload.get("pincode", ""),
        "aadhaar": payload.get("aadhaar", ""),
        "pan": payload.get("pan", ""),
        "license": payload.get("license", ""),
        "vehicleType": payload.get("vehicleType", "bike"),
        "vehicleNumber": payload.get("vehicleNumber", ""),
        "rcNumber": payload.get("rcNumber", ""),
        "insuranceNumber": payload.get("insuranceNumber", ""),
        "accountHolder": payload.get("accountHolder", ""),
        "bankName": payload.get("bankName", ""),
        "accountNumber": payload.get("accountNumber", ""),
        "ifsc": payload.get("ifsc", ""),
        "preferredCity": payload.get("preferredCity", city),
        "preferredArea": payload.get("preferredArea", ""),
        "shift": payload.get("shift", "full_time"),
        "employmentType": payload.get("employmentType", "contract"),
        "status": "pending",
        "isVerified": False,
        "isOnline": False,
        "rating": 5.0,
        "totalDeliveries": 0,
        "joinedOn": datetime.now(timezone.utc).strftime("%B %Y"),
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }

    existing = await database.find_one("rider_profiles", {"_id": rider_id_str})
    if existing is None:
        await database.insert("rider_profiles", profile_data)
    else:
        await database.update("rider_profiles", {"_id": rider_id_str}, profile_data)

    # 3. Initialize wallet if not present
    existing_wallet = await database.find_one("rider_wallets", {"_id": rider_id_str})
    if existing_wallet is None:
        await database.insert(
            "rider_wallets",
            {
                "_id": rider_id_str,
                "riderId": rider_id_str,
                "balance": 0.0,
                "todayEarned": 0.0,
                "thisWeekEarned": 0.0,
                "cashInHand": 0.0,
                "lifetimeEarned": 0.0,
            },
        )

    # 4. Initialize settings if not present
    existing_settings = await database.find_one("rider_settings", {"_id": rider_id_str})
    if existing_settings is None:
        await database.insert(
            "rider_settings",
            {
                "_id": rider_id_str,
                "riderId": rider_id_str,
                "autoAccept": False,
                "voiceNavigation": True,
                "notificationsEnabled": True,
                "maxActiveDeliveries": 2,
            },
        )

    # 5. Update user state
    await users.update(
        user.id,
        {
            "is_onboarded": True,
            "is_verified": False,
            "display_name": full_name,
            "city": city,
            "linked_id": rider_id_str,
        },
    )

    return {
        "ok": True,
        "riderId": rider_id_str,
        "phone": phone,
        "fullName": full_name,
        "isVerified": False,
        "isOnboarded": True,
    }


@public_router.post("/auth/registration")
async def submit_registration(body: dict) -> dict:
    payload = body.get("payload", body)
    rider_id = await generate_rider_id()
    full_name = payload.get("fullName", "Delivery Partner")
    phone = payload.get("mobile", "")
    city = payload.get("city") or payload.get("preferredCity") or "Kasganj"

    profile_data = {
        "_id": rider_id,
        "riderId": rider_id,
        "fullName": full_name,
        "name": full_name,
        "phone": phone,
        "email": payload.get("email", ""),
        "dob": payload.get("dob", ""),
        "gender": payload.get("gender", "male"),
        "address": payload.get("address", ""),
        "city": city,
        "state": payload.get("state", ""),
        "pincode": payload.get("pincode", ""),
        "aadhaar": payload.get("aadhaar", ""),
        "pan": payload.get("pan", ""),
        "license": payload.get("license", ""),
        "vehicleType": payload.get("vehicleType", "bike"),
        "vehicleNumber": payload.get("vehicleNumber", ""),
        "rcNumber": payload.get("rcNumber", ""),
        "insuranceNumber": payload.get("insuranceNumber", ""),
        "accountHolder": payload.get("accountHolder", ""),
        "bankName": payload.get("bankName", ""),
        "accountNumber": payload.get("accountNumber", ""),
        "ifsc": payload.get("ifsc", ""),
        "preferredCity": payload.get("preferredCity", city),
        "preferredArea": payload.get("preferredArea", ""),
        "shift": payload.get("shift", "full_time"),
        "employmentType": payload.get("employmentType", "contract"),
        "status": "pending",
        "isVerified": False,
        "isOnline": False,
        "rating": 5.0,
        "totalDeliveries": 0,
        "joinedOn": datetime.now(timezone.utc).strftime("%B %Y"),
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }
    await database.insert("rider_profiles", profile_data)
    await database.insert(
        "rider_wallets",
        {
            "_id": rider_id,
            "riderId": rider_id,
            "balance": 0.0,
            "todayEarned": 0.0,
            "thisWeekEarned": 0.0,
            "cashInHand": 0.0,
            "lifetimeEarned": 0.0,
        },
    )
    return {
        "ok": True,
        "riderId": rider_id,
        "phone": phone,
        "fullName": full_name,
        "isVerified": False,
        "isOnboarded": True,
    }



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
    rider_id = await _rider_id(user)
    lat = body.get("lat") if body.get("lat") is not None else body.get("latitude")
    lng = body.get("lng") if body.get("lng") is not None else body.get("longitude")
    heading = body.get("heading")
    speed = body.get("speed")
    accuracy = body.get("accuracy")
    now_iso = datetime.now(timezone.utc).isoformat()
    if lat is not None and lng is not None:
        await database.update(
            "rider_profiles",
            {"_id": rider_id},
            {
                "lat": float(lat),
                "lng": float(lng),
                "heading": heading,
                "speed": speed,
                "accuracy": accuracy,
                "lastLocationAt": now_iso,
                "updatedAt": now_iso,
            },
            upsert=True,
        )
    return {"ok": True, "lat": lat, "lng": lng, "updatedAt": now_iso}


# --------------------------------------------------------------------------
# Profile / settings
# --------------------------------------------------------------------------


@router.get("/profile")
async def get_profile(user: User = Depends(current_user)) -> dict:
    rider_id = await _rider_id(user)
    profile = await rider_profile_repository.get(rider_id)
    if profile is None:
        profile = {
            "_id": rider_id,
            "riderId": rider_id,
            "fullName": getattr(user, "name", "") or getattr(user, "display_name", "") or "Delivery Partner",
            "phone": getattr(user, "phone", ""),
            "email": getattr(user, "email", ""),
            "city": "Kasganj",
            "rating": 5.0,
            "totalTrips": 0,
            "joinedOn": "August 2026",
            "vehicleType": "Bike",
            "vehicleNumber": "—",
            "bankName": "State Bank of India",
            "accountLast4": "4821",
            "ifsc": "SBIN0001234",
            "kycStatus": "verified" if getattr(user, "is_verified", False) else "pending",
            "isVerified": getattr(user, "is_verified", False),
            "isOnline": False,
            "onlineMinutes": 0,
            "documents": [],
        }
    pub = _public(profile)
    pub.setdefault("id", rider_id)
    pub.setdefault("riderId", rider_id)
    pub.setdefault("fullName", pub.get("name") or "Delivery Partner")
    pub.setdefault("phone", getattr(user, "phone", ""))
    pub.setdefault("email", getattr(user, "email", ""))
    pub.setdefault("city", "Kasganj")
    pub.setdefault("rating", 5.0)
    pub.setdefault("totalTrips", pub.get("trips") or 0)
    pub.setdefault("joinedOn", "August 2026")
    pub.setdefault("vehicleType", "Bike")
    pub.setdefault("vehicleNumber", "—")
    pub.setdefault("bankName", "State Bank of India")
    pub.setdefault("accountLast4", "4821")
    pub.setdefault("ifsc", "SBIN0001234")
    pub.setdefault("kycStatus", "verified" if getattr(user, "is_verified", False) else "pending")
    pub.setdefault("isOnline", False)
    pub.setdefault("onlineMinutes", 0)
    pub.setdefault("documents", [])
    return pub


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
@router.post("/orders/{order_id}/verify-pickup-otp")
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
@router.post("/orders/{order_id}/verify-dispatch-otp")
async def start_delivery(
    order_id: str, body: dict | None = None, user: User = Depends(current_user)
) -> dict:
    return await _rider_action(
        rider_delivery_repository.start_delivery, order_id, user, otp=(body or {}).get("otp")
    )


@router.post("/orders/{order_id}/deliver")
@router.post("/orders/{order_id}/verify-delivery-otp")
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


# --------------------------------------------------------------------------
# Bank & Direct Payout Settings
# --------------------------------------------------------------------------


@router.get("/bank")
async def get_rider_bank(user: User = Depends(current_user)) -> dict:
    rider_id = await _rider_id(user)
    doc = await database.find_one("rider_bank_accounts", {"_id": rider_id})
    profile = await database.find_one("rider_profiles", {"_id": rider_id}) or {}
    if not doc:
        doc = {
            "_id": rider_id,
            "riderId": rider_id,
            "bankName": profile.get("bankName", "State Bank of India"),
            "accountNumber": profile.get("accountNumber", "••••••••4821"),
            "ifsc": profile.get("ifsc", "SBIN0001234"),
            "accountHolder": profile.get("accountHolder", profile.get("fullName", "Delivery Partner")),
            "upiId": profile.get("upiId", f"{rider_id.lower()}@okhdfcbank"),
            "isVerified": True,
        }
        await database.insert("rider_bank_accounts", doc)
    return _public(doc)


@router.patch("/bank")
async def update_rider_bank(body: dict, user: User = Depends(current_user)) -> dict:
    rider_id = await _rider_id(user)
    update_data = {
        "bankName": body.get("bankName", ""),
        "accountNumber": body.get("accountNumber", ""),
        "ifsc": body.get("ifsc", ""),
        "accountHolder": body.get("accountHolder", ""),
        "upiId": body.get("upiId", ""),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }
    await database.update("rider_bank_accounts", {"_id": rider_id}, update_data, upsert=True)
    await database.update(
        "rider_profiles",
        {"_id": rider_id},
        {
            "bankName": update_data["bankName"],
            "accountNumber": update_data["accountNumber"],
            "ifsc": update_data["ifsc"],
            "accountHolder": update_data["accountHolder"],
            "upiId": update_data["upiId"],
        },
    )
    return {"ok": True, "bank": update_data}


# --------------------------------------------------------------------------
# Shift & Operational Zone Settings
# --------------------------------------------------------------------------


@router.get("/work-settings")
async def get_work_settings(user: User = Depends(current_user)) -> dict:
    rider_id = await _rider_id(user)
    profile = await database.find_one("rider_profiles", {"_id": rider_id}) or {}
    settings_doc = await database.find_one("rider_settings", {"_id": rider_id}) or {}
    return {
        "riderId": rider_id,
        "shift": profile.get("shift", "full_time"),
        "preferredCity": profile.get("preferredCity", profile.get("city", "Kasganj")),
        "preferredArea": profile.get("preferredArea", "Kasganj Hub & Market"),
        "maxActiveDeliveries": settings_doc.get("maxActiveDeliveries", 2),
        "autoAccept": settings_doc.get("autoAccept", False),
        "voiceNavigation": settings_doc.get("voiceNavigation", True),
    }


@router.patch("/work-settings")
async def update_work_settings(body: dict, user: User = Depends(current_user)) -> dict:
    rider_id = await _rider_id(user)
    profile_updates = {}
    if "shift" in body:
        profile_updates["shift"] = body["shift"]
    if "preferredCity" in body:
        profile_updates["preferredCity"] = body["preferredCity"]
    if "preferredArea" in body:
        profile_updates["preferredArea"] = body["preferredArea"]
    if profile_updates:
        await database.update("rider_profiles", {"_id": rider_id}, profile_updates)

    settings_updates = {}
    if "maxActiveDeliveries" in body:
        settings_updates["maxActiveDeliveries"] = int(body["maxActiveDeliveries"])
    if "autoAccept" in body:
        settings_updates["autoAccept"] = bool(body["autoAccept"])
    if "voiceNavigation" in body:
        settings_updates["voiceNavigation"] = bool(body["voiceNavigation"])
    if settings_updates:
        await database.update("rider_settings", {"_id": rider_id}, settings_updates, upsert=True)

    return {"ok": True, "message": "Work settings updated successfully"}

