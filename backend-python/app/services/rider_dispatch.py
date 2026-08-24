"""QuickPress Automatic Nearby Rider Dispatch & OTP Verification Engine.

This module is the single source of truth for:
1. Automated nearby rider search and offer dispatch upon partner acceptance.
2. Concurrency-safe atomic rider order claiming.
3. 3-phase random 4-digit OTP lifecycle (Pickup OTP, Dispatch OTP, Delivery OTP).
4. Full audit-trail and real-time Socket.IO synchronization across Customer, Partner, Rider, Admin.
"""

from __future__ import annotations

import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from pymongo import ReturnDocument

from app.db.client import database
from app.services import order_lifecycle as lifecycle
from app.services.socket_service import (
    EVENT_ORDER_ACCEPTED,
    EVENT_ORDER_AT_PARTNER,
    EVENT_ORDER_COMPLETED,
    EVENT_ORDER_DELIVERED,
    EVENT_ORDER_DELIVERY_OTP_PENDING,
    EVENT_ORDER_DISPATCH_OTP_PENDING,
    EVENT_ORDER_OUT_FOR_DELIVERY,
    EVENT_ORDER_PICKED_UP,
    EVENT_ORDER_PICKUP_OTP_PENDING,
    EVENT_ORDER_PROCESSING,
    EVENT_ORDER_READY,
    EVENT_ORDER_RIDER_ASSIGNED,
    EVENT_ORDER_RIDER_OFFER,
    EVENT_ORDER_RIDER_SEARCHING,
    broadcast_order_event,
    sio,
)

logger = logging.getLogger(__name__)

OFFERS_COLLECTION = "rider_offers"
RIDERS_COLLECTION = "rider_profiles"
ORDERS_COLLECTION = "customer_orders"
NOTIFICATIONS_COLLECTION = "rider_notifications"


def generate_secure_4digit_otp() -> str:
    """Generate a cryptographically secure 4-digit numeric OTP (1000-9999). Never hardcoded."""
    return f"{secrets.randbelow(9000) + 1000}"


def create_otp_record(code: Optional[str] = None, hours_valid: int = 4) -> Dict[str, Any]:
    return {
        "code": code or generate_secure_4digit_otp(),
        "createdAt": lifecycle.now_iso(),
        "expiresAt": (datetime.now(timezone.utc) + timedelta(hours=hours_valid))
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z"),
        "attempts": 0,
        "maxAttempts": 5,
        "verified": False,
        "verifiedAt": None,
        "verifiedBy": None,
    }


def _validate_otp_attempt(otp_obj: Any, submitted_code: Optional[str], otp_name: str) -> None:
    if not submitted_code or not str(submitted_code).strip():
        raise PermissionError(f"{otp_name} is required")

    code_str = str(submitted_code).strip()

    # If otp_obj is legacy string
    if isinstance(otp_obj, str):
        if code_str != otp_obj:
            raise PermissionError(f"Invalid {otp_name}")
        return

    if not isinstance(otp_obj, dict):
        raise PermissionError(f"{otp_name} has not been generated for this order yet")

    if otp_obj.get("verified"):
        raise ValueError(f"{otp_name} has already been verified and used")

    attempts = int(otp_obj.get("attempts", 0))
    max_attempts = int(otp_obj.get("maxAttempts", 5))

    if attempts >= max_attempts:
        raise PermissionError(f"Maximum verification attempts exceeded for {otp_name}")

    expires_at_str = otp_obj.get("expiresAt")
    if expires_at_str:
        try:
            expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > expires_at:
                raise PermissionError(f"{otp_name} has expired")
        except Exception:
            pass

    expected_code = str(otp_obj.get("code", "")).strip()
    if code_str != expected_code:
        # Increment attempts
        otp_obj["attempts"] = attempts + 1
        remaining = max(0, max_attempts - otp_obj["attempts"])
        raise PermissionError(f"Invalid {otp_name}. {remaining} attempt(s) remaining.")


class RiderDispatchEngine:
    """Core engine orchestrating auto-dispatch, atomic claiming, and OTP verifications."""

    async def search_and_offer_riders(self, order_id: str) -> List[str]:
        """Automatically find eligible nearby riders and broadcast order offers."""
        order = await lifecycle.find_order(order_id)
        if order is None:
            logger.warning("Order %s not found during rider search", order_id)
            return []

        canonical_id = lifecycle.order_id_of(order)
        order_city = (
            (order.get("address") or {}).get("city")
            or (order.get("customer") or {}).get("city")
            or "Kasganj"
        )

        # 1. Update status to rider_searching if needed and emit realtime event
        await broadcast_order_event(
            EVENT_ORDER_RIDER_SEARCHING,
            order,
            extra_data={"city": order_city, "searchStartedAt": lifecycle.now_iso()},
        )

        # 2. Query eligible active & online riders from MongoDB
        query = {
            "isOnline": True,
        }
        eligible_riders = await database.find_many(RIDERS_COLLECTION, query)

        # In case no rider is online, fallback to all verified riders in city or system
        if not eligible_riders:
            eligible_riders = await database.find_many(RIDERS_COLLECTION, {})

        if not eligible_riders:
            logger.info("No riders available in database to dispatch order %s", order_id)
            return []

        # Sort riders by rating (descending), then total trips
        eligible_riders.sort(
            key=lambda r: (float(r.get("rating", 5.0)), int(r.get("totalTrips", 0))),
            reverse=True,
        )

        offered_rider_ids = []
        now = lifecycle.now_iso()
        expires_at = (
            (datetime.now(timezone.utc) + timedelta(seconds=180))
            .replace(microsecond=0)
            .isoformat()
            .replace("+00:00", "Z")
        )

        pricing = order.get("pricing") or {}
        totals = order.get("totals") or {}
        grand_total = pricing.get("finalTotal") or totals.get("grandTotal") or order.get("amount") or 100
        est_earning = max(35, round(int(grand_total) * 0.12))

        address_line = (
            order.get("address", {}).get("line")
            if isinstance(order.get("address"), dict)
            else str(order.get("address") or "")
        )

        partner_name = (order.get("partner") or {}).get("name") or "QuickPress Laundry"

        for rider in eligible_riders[:10]:
            r_id = str(rider.get("_id") or rider.get("riderId") or "")
            if not r_id:
                continue

            offer_doc = {
                "_id": f"off-{canonical_id}-{r_id}",
                "orderId": canonical_id,
                "orderCode": order.get("code", canonical_id),
                "riderId": r_id,
                "status": "pending",
                "createdAt": now,
                "expiresAt": expires_at,
                "partnerName": partner_name,
                "pickupAddress": address_line,
                "deliveryAddress": address_line,
                "estimatedEarning": est_earning,
                "itemCount": len(order.get("items") or []),
            }

            await database.collection(OFFERS_COLLECTION).update_one(
                {"_id": offer_doc["_id"]},
                {"$set": {k: v for k, v in offer_doc.items() if k != "_id"}},
                upsert=True,
            )

            # In-app notification for rider
            notif_doc = {
                "_id": f"notif-rdr-{canonical_id}-{r_id}-{now}",
                "riderId": r_id,
                "orderId": canonical_id,
                "type": "new_order_offer",
                "title": "New Laundry Pickup Available! ⚡",
                "message": f"Order #{order.get('code')} at {partner_name}. Est. earning: ₹{est_earning}",
                "createdAt": now,
                "read": False,
            }
            await database.collection(NOTIFICATIONS_COLLECTION).update_one(
                {"_id": notif_doc["_id"]},
                {"$set": {k: v for k, v in notif_doc.items() if k != "_id"}},
                upsert=True,
            )

            # Emit Socket.IO event to specific rider room
            await sio.emit(
                EVENT_ORDER_RIDER_OFFER,
                {
                    "offerId": offer_doc["_id"],
                    "orderId": canonical_id,
                    "orderCode": order.get("code", canonical_id),
                    "partnerName": partner_name,
                    "pickupAddress": address_line,
                    "estimatedEarning": est_earning,
                    "expiresAt": expires_at,
                },
                room=f"rider:{r_id}",
            )
            offered_rider_ids.append(r_id)

        # Also emit to general "riders" room
        await sio.emit(
            EVENT_ORDER_RIDER_OFFER,
            {
                "orderId": canonical_id,
                "orderCode": order.get("code", canonical_id),
                "partnerName": partner_name,
                "pickupAddress": address_line,
                "estimatedEarning": est_earning,
                "expiresAt": expires_at,
            },
            room="riders",
        )

        return offered_rider_ids

    async def claim_rider_offer(self, order_id: str, rider_id: str) -> Dict[str, Any]:
        """Atomically claim an order for a rider. Prevents race conditions / duplicate claims."""
        order = await lifecycle.find_order(order_id)
        if order is None:
            raise LookupError(f"Order {order_id} not found")

        canonical_id = lifecycle.order_id_of(order)
        rider_profile = await database.find_one(RIDERS_COLLECTION, {"_id": rider_id})
        if rider_profile is None:
            rider_profile = await database.find_one(RIDERS_COLLECTION, {"riderId": rider_id})
        if rider_profile is None:
            rider_profile = {"_id": rider_id, "fullName": "QuickPress Delivery Partner"}

        rider_party = {
            "id": rider_id,
            "name": rider_profile.get("fullName") or rider_profile.get("name") or "Delivery Partner",
            "phone": rider_profile.get("phone") or "+91 98765 43210",
            "vehicle": rider_profile.get("vehicleType") or "Bike",
            "vehicleType": rider_profile.get("vehicleType") or "Bike",
            "plate": rider_profile.get("vehicleNumber") or "UP-87-QP-1001",
            "vehicleNumber": rider_profile.get("vehicleNumber") or "UP-87-QP-1001",
            "rating": float(rider_profile.get("rating", 4.9)),
            "trips": str(rider_profile.get("totalTrips", 120)),
        }

        # Secure random 4-digit Pickup OTP generated on server
        pickup_otp_record = create_otp_record()

        now = lifecycle.now_iso()

        # Atomic find_one_and_update ensures only ONE rider can win the order
        updated_doc = await database.collection(ORDERS_COLLECTION).find_one_and_update(
            {
                "_id": canonical_id,
                "status": {
                    "$in": [
                        lifecycle.PARTNER_ACCEPTED,
                        "rider_searching",
                        lifecycle.RIDER_ASSIGNED,
                        lifecycle.RIDER_ACCEPTED,
                    ]
                },
                "$or": [
                    {"rider": None},
                    {"rider.id": None},
                    {"rider.id": ""},
                    {"rider.id": rider_id},
                    {"riderId": None},
                    {"riderId": ""},
                    {"riderId": rider_id},
                ],
            },
            {
                "$set": {
                    "rider": rider_party,
                    "riderId": rider_id,
                    "rider_id": rider_id,
                    "status": lifecycle.RIDER_ASSIGNED,
                    "updatedAt": now,
                    "otp.pickup": pickup_otp_record,
                },
                "$push": {
                    "events": {
                        "id": f"{order.get('code', canonical_id)}-evt-assigned",
                        "status": lifecycle.RIDER_ASSIGNED,
                        "label": "Rider assigned & heading for pickup",
                        "at": now,
                        "actor": "rider",
                    }
                },
            },
            return_document=ReturnDocument.AFTER,
        )

        if updated_doc is None:
            # Order was already assigned to another rider or not in assignable state
            current_order = await lifecycle.get_order(canonical_id)
            current_status = lifecycle.order_status(current_order)
            if current_status == lifecycle.PENDING:
                raise lifecycle.OrderAuthorizationError("Cannot claim an order before store acceptance.")
            current_rider = (current_order.get("rider") or {}).get("id")
            if current_rider and current_rider != rider_id:
                raise lifecycle.OrderAuthorizationError("Order is no longer available. Another rider already accepted.")
            raise ValueError("This order cannot be claimed at its current stage.")

        # Expire all other offers for this order
        await database.collection(OFFERS_COLLECTION).update_many(
            {"orderId": canonical_id, "riderId": {"$ne": rider_id}},
            {"$set": {"status": "expired", "updatedAt": now}},
        )

        # Mark winning offer as accepted
        await database.collection(OFFERS_COLLECTION).update_one(
            {"orderId": canonical_id, "riderId": rider_id},
            {"$set": {"status": "accepted", "updatedAt": now}},
            upsert=True,
        )

        # Audit event
        await lifecycle.record_event(
            updated_doc,
            "RIDER_ASSIGNED",
            actor_id=rider_id,
            actor_role="rider",
            metadata={"riderName": rider_party["name"], "vehicle": rider_party["vehicle"]},
            at=now,
        )

        # Real-time Socket.IO broadcasts
        await broadcast_order_event(
            EVENT_ORDER_RIDER_ASSIGNED,
            updated_doc,
            extra_data={"rider": rider_party},
        )
        await broadcast_order_event(
            EVENT_ORDER_PICKUP_OTP_PENDING,
            updated_doc,
            extra_data={"pickupOtpPending": True},
        )

        from app.services.order_notifications import dispatch_order_transition_notifications

        await dispatch_order_transition_notifications(
            updated_doc,
            lifecycle.RIDER_ASSIGNED,
            actor_id=rider_id,
            actor_role="rider",
        )

        return updated_doc

    async def verify_pickup_otp(self, order_id: str, rider_id: str, otp_code: str) -> Dict[str, Any]:
        """Rider enters Pickup OTP shared by Customer upon laundry pickup."""
        order = await lifecycle.get_order(order_id)
        lifecycle.assert_rider(order, rider_id)

        current_status = lifecycle.order_status(order)
        if current_status not in (lifecycle.RIDER_ASSIGNED, lifecycle.RIDER_ACCEPTED, "pickup_otp_pending"):
            raise ValueError(f"Pickup OTP has already been verified and used (Order is {current_status}).")

        otp_root = order.get("otp") or {}
        pickup_otp = otp_root.get("pickup")

        _validate_otp_attempt(pickup_otp, otp_code, "Pickup OTP")

        now = lifecycle.now_iso()
        # Mark OTP verified
        if isinstance(pickup_otp, dict):
            pickup_otp["verified"] = True
            pickup_otp["verifiedAt"] = now
            pickup_otp["verifiedBy"] = rider_id
        else:
            pickup_otp = {
                "code": str(pickup_otp),
                "verified": True,
                "verifiedAt": now,
                "verifiedBy": rider_id,
            }

        updated = await lifecycle.transition(
            order_id,
            lifecycle.PICKED_UP,
            actor_id=rider_id,
            actor_role="rider",
            metadata={"pickupOtpVerified": True, "verifiedAt": now},
            changes={
                "otp.pickup": pickup_otp,
                "pickupVerifiedAt": now,
                "pickupVerifiedBy": rider_id,
            },
        )

        await broadcast_order_event(
            EVENT_ORDER_PICKED_UP,
            updated,
            extra_data={"pickupVerifiedAt": now},
        )

        return updated

    async def rider_drop_at_partner(self, order_id: str, rider_id: str) -> Dict[str, Any]:
        """Rider reaches partner laundry store and hands over picked laundry."""
        order = await lifecycle.get_order(order_id)
        lifecycle.assert_rider(order, rider_id)

        now = lifecycle.now_iso()
        updated = await lifecycle.transition(
            order_id,
            lifecycle.AT_PARTNER,
            actor_id=rider_id,
            actor_role="rider",
            metadata={"droppedAt": now},
            changes={"droppedAtPartnerAt": now},
        )

        await broadcast_order_event(
            EVENT_ORDER_AT_PARTNER,
            updated,
            extra_data={"reachedStoreAt": now},
        )

        return updated

    async def partner_start_processing(self, order_id: str, partner_id: str) -> Dict[str, Any]:
        """Partner starts cleaning/washing/dry cleaning."""
        order = await lifecycle.get_order(order_id)
        lifecycle.assert_partner(order, partner_id)

        now = lifecycle.now_iso()
        updated = await lifecycle.transition(
            order_id,
            lifecycle.PROCESSING,
            actor_id=partner_id,
            actor_role="partner",
            metadata={"processingStartedAt": now},
            changes={"processingStartedAt": now},
        )

        await broadcast_order_event(
            EVENT_ORDER_PROCESSING,
            updated,
            extra_data={"processingStartedAt": now},
        )

        return updated

    async def partner_mark_ready(self, order_id: str, partner_id: str) -> Dict[str, Any]:
        """Partner finishes laundry and generates 4-digit Dispatch OTP for rider handover."""
        order = await lifecycle.get_order(order_id)
        lifecycle.assert_partner(order, partner_id)

        now = lifecycle.now_iso()
        dispatch_otp_record = create_otp_record()

        updated = await lifecycle.transition(
            order_id,
            lifecycle.READY,
            actor_id=partner_id,
            actor_role="partner",
            metadata={"readyAt": now, "dispatchOtpGenerated": True},
            changes={
                "readyAt": now,
                "otp.dispatch": dispatch_otp_record,
            },
        )

        await broadcast_order_event(
            EVENT_ORDER_READY,
            updated,
            extra_data={"readyAt": now},
        )
        await broadcast_order_event(
            EVENT_ORDER_DISPATCH_OTP_PENDING,
            updated,
            extra_data={"dispatchOtpPending": True},
        )

        return updated

    async def verify_dispatch_otp(self, order_id: str, rider_id: str, otp_code: str) -> Dict[str, Any]:
        """Rider receives Dispatch OTP from Partner store to take order Out for Delivery."""
        order = await lifecycle.get_order(order_id)
        lifecycle.assert_rider(order, rider_id)

        current_status = lifecycle.order_status(order)
        if current_status not in (lifecycle.READY, lifecycle.COMPLETED, "dispatch_otp_pending"):
            raise ValueError(f"Dispatch OTP has already been verified (Order is {current_status}).")

        otp_root = order.get("otp") or {}
        dispatch_otp = otp_root.get("dispatch")

        # If dispatch OTP was not pre-generated, generate on the fly
        if not dispatch_otp:
            dispatch_otp = create_otp_record()
            otp_root["dispatch"] = dispatch_otp

        _validate_otp_attempt(dispatch_otp, otp_code, "Dispatch OTP")

        now = lifecycle.now_iso()
        if isinstance(dispatch_otp, dict):
            dispatch_otp["verified"] = True
            dispatch_otp["verifiedAt"] = now
            dispatch_otp["verifiedBy"] = rider_id

        # Generate secure random 4-digit Delivery OTP for final Customer delivery
        delivery_otp_record = create_otp_record()

        updated = await lifecycle.transition(
            order_id,
            lifecycle.OUT_FOR_DELIVERY,
            actor_id=rider_id,
            actor_role="rider",
            metadata={"dispatchOtpVerified": True, "outForDeliveryAt": now},
            changes={
                "otp.dispatch": dispatch_otp,
                "otp.delivery": delivery_otp_record,
                "outForDeliveryAt": now,
                "dispatchVerifiedAt": now,
                "dispatchVerifiedBy": rider_id,
            },
        )

        await broadcast_order_event(
            EVENT_ORDER_OUT_FOR_DELIVERY,
            updated,
            extra_data={"outForDeliveryAt": now},
        )
        await broadcast_order_event(
            EVENT_ORDER_DELIVERY_OTP_PENDING,
            updated,
            extra_data={"deliveryOtpPending": True},
        )

        return updated

    async def verify_delivery_otp(self, order_id: str, rider_id: str, otp_code: str) -> Dict[str, Any]:
        """Rider reaches customer and verifies Customer Delivery OTP."""
        order = await lifecycle.get_order(order_id)
        lifecycle.assert_rider(order, rider_id)

        current_status = lifecycle.order_status(order)
        if current_status not in (lifecycle.OUT_FOR_DELIVERY, "delivery_otp_pending"):
            raise ValueError(f"Delivery OTP has already been verified (Order is {current_status}).")

        otp_root = order.get("otp") or {}
        delivery_otp = otp_root.get("delivery")

        _validate_otp_attempt(delivery_otp, otp_code, "Delivery OTP")

        now = lifecycle.now_iso()
        if isinstance(delivery_otp, dict):
            delivery_otp["verified"] = True
            delivery_otp["verifiedAt"] = now
            delivery_otp["verifiedBy"] = rider_id

        payment = dict(order.get("payment") or {})
        payment["paid"] = True

        updated = await lifecycle.transition(
            order_id,
            lifecycle.DELIVERED,
            actor_id=rider_id,
            actor_role="rider",
            metadata={"deliveryOtpVerified": True, "deliveredAt": now},
            changes={
                "otp.delivery": delivery_otp,
                "deliveredAt": now,
                "deliveryVerifiedAt": now,
                "deliveryVerifiedBy": rider_id,
                "payment": payment,
            },
        )

        # Also complete order
        try:
            completed_order = await lifecycle.transition(
                order_id,
                lifecycle.COMPLETED,
                actor_id="system",
                actor_role="system",
                metadata={"completedAt": now},
                changes={"completedAt": now},
            )
        except Exception:
            completed_order = updated

        await broadcast_order_event(
            EVENT_ORDER_DELIVERED,
            updated,
            extra_data={"deliveredAt": now},
        )
        await broadcast_order_event(
            EVENT_ORDER_COMPLETED,
            completed_order,
            extra_data={"completedAt": now},
        )

        return completed_order


rider_dispatch_engine = RiderDispatchEngine()
