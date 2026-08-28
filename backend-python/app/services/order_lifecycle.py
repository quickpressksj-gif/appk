"""Canonical order lifecycle — the single source of truth for order state.

Every app (customer, partner, rider, admin) reads and writes the SAME order
document in the `customer_orders` collection, identified by the SAME canonical
`orderId`. Partner and rider views are *projections* of that document; they no
longer own their own copy of an order.

Collections
-----------
customer_orders  the canonical order (identity, parties, status, totals, otp)
order_events     append-only audit trail: one row per lifecycle transition

Status machine
--------------
pending_partner_acceptance -> partner_accepted | cancelled
partner_accepted           -> rider_assigned   | cancelled
rider_assigned             -> rider_accepted   | cancelled
rider_accepted             -> picked_up        | cancelled
picked_up                  -> at_partner       | cancelled
at_partner                 -> processing       | cancelled
processing                 -> completed        | cancelled
completed                  -> out_for_delivery | cancelled
out_for_delivery           -> delivered
delivered                  -> (terminal)
cancelled                  -> (terminal)
"""

from __future__ import annotations

import random
import secrets
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from app.db.client import database

ORDERS = "customer_orders"
EVENTS = "order_events"

# Canonical QuickPress Order Lifecycle V2 Constants
PLACED = "placed"
PENDING = "pending_partner_acceptance"  # alias
PARTNER_ACCEPTED = "partner_accepted"
PICKUP_RIDER_ASSIGNED = "pickup_rider_assigned"
RIDER_ASSIGNED = "rider_assigned"  # alias
RIDER_SEARCHING = "rider_searching"  # alias
PICKUP_RIDER_ACCEPTED = "pickup_rider_accepted"
RIDER_ACCEPTED = "rider_accepted"  # alias
PICKUP_OTP_PENDING = "pickup_otp_pending"
PICKED_UP = "picked_up"
AT_PARTNER = "at_partner"
PROCESSING = "processing"
IRONING = "ironing"
READY_FOR_DELIVERY = "ready_for_delivery"
READY = "ready"  # alias
COMPLETED = "completed"  # alias
DELIVERY_RIDER_ASSIGNED = "delivery_rider_assigned"
DELIVERY_RIDER_ACCEPTED = "delivery_rider_accepted"
DISPATCH_OTP_PENDING = "dispatch_otp_pending"
OUT_FOR_DELIVERY = "out_for_delivery"
DELIVERY_OTP_PENDING = "delivery_otp_pending"
DELIVERED = "delivered"
CANCELLED = "cancelled"

TERMINAL = (DELIVERED, CANCELLED)

#: Documents created before the canonical lifecycle used aliases.
LEGACY_STATUS_ALIASES = {
    "placed": PLACED,
    "pending_partner_acceptance": PLACED,
    "ORDER_CREATED": PLACED,
    "order_created": PLACED,
    "searching": RIDER_SEARCHING,
    "rider_assigned": PICKUP_RIDER_ASSIGNED,
    "rider_accepted": PICKUP_RIDER_ACCEPTED,
    "at-partner": AT_PARTNER,
    "ready": READY_FOR_DELIVERY,
    "completed": READY_FOR_DELIVERY,
    "ready-for-delivery": READY_FOR_DELIVERY,
    "ironing": PROCESSING,
}

TRANSITIONS: Dict[str, tuple] = {
    PLACED: (PARTNER_ACCEPTED, CANCELLED),
    PENDING: (PARTNER_ACCEPTED, CANCELLED),
    PARTNER_ACCEPTED: (PICKUP_RIDER_ASSIGNED, RIDER_ASSIGNED, RIDER_SEARCHING, CANCELLED),
    RIDER_SEARCHING: (PICKUP_RIDER_ASSIGNED, RIDER_ASSIGNED, CANCELLED),
    PICKUP_RIDER_ASSIGNED: (PICKUP_RIDER_ACCEPTED, RIDER_ACCEPTED, CANCELLED),
    RIDER_ASSIGNED: (PICKUP_RIDER_ACCEPTED, RIDER_ACCEPTED, CANCELLED),
    PICKUP_RIDER_ACCEPTED: (PICKUP_OTP_PENDING, PICKED_UP, CANCELLED),
    RIDER_ACCEPTED: (PICKUP_OTP_PENDING, PICKED_UP, CANCELLED),
    PICKUP_OTP_PENDING: (PICKED_UP, CANCELLED),
    PICKED_UP: (AT_PARTNER, PROCESSING, CANCELLED),
    AT_PARTNER: (PROCESSING, CANCELLED),
    PROCESSING: (READY_FOR_DELIVERY, READY, COMPLETED, CANCELLED),
    IRONING: (READY_FOR_DELIVERY, READY, COMPLETED, CANCELLED),
    READY_FOR_DELIVERY: (DELIVERY_RIDER_ASSIGNED, RIDER_ASSIGNED, RIDER_SEARCHING, CANCELLED),
    READY: (DELIVERY_RIDER_ASSIGNED, RIDER_ASSIGNED, RIDER_SEARCHING, CANCELLED),
    COMPLETED: (DELIVERY_RIDER_ASSIGNED, RIDER_ASSIGNED, RIDER_SEARCHING, CANCELLED),
    DELIVERY_RIDER_ASSIGNED: (DELIVERY_RIDER_ACCEPTED, RIDER_ACCEPTED, CANCELLED),
    DELIVERY_RIDER_ACCEPTED: (DISPATCH_OTP_PENDING, OUT_FOR_DELIVERY, CANCELLED),
    DISPATCH_OTP_PENDING: (OUT_FOR_DELIVERY, CANCELLED),
    OUT_FOR_DELIVERY: (DELIVERY_OTP_PENDING, DELIVERED, CANCELLED),
    DELIVERY_OTP_PENDING: (DELIVERED, CANCELLED),
    DELIVERED: (),
    CANCELLED: (),
}

STATUS_LABEL = {
    PLACED: "Order placed",
    PENDING: "Order placed",
    PARTNER_ACCEPTED: "Partner accepted",
    RIDER_SEARCHING: "Searching for pickup rider",
    PICKUP_RIDER_ASSIGNED: "Pickup rider assigned",
    RIDER_ASSIGNED: "Pickup rider assigned",
    PICKUP_RIDER_ACCEPTED: "Pickup rider accepted",
    RIDER_ACCEPTED: "Pickup rider accepted",
    PICKUP_OTP_PENDING: "Pickup OTP verification",
    PICKED_UP: "Picked up",
    AT_PARTNER: "Reached store",
    PROCESSING: "In cleaning",
    IRONING: "Ironing & finishing",
    READY_FOR_DELIVERY: "Ready for delivery",
    READY: "Ready for delivery",
    COMPLETED: "Ready for delivery",
    DELIVERY_RIDER_ASSIGNED: "Delivery rider assigned",
    DELIVERY_RIDER_ACCEPTED: "Delivery rider accepted",
    DISPATCH_OTP_PENDING: "Dispatch OTP verification",
    OUT_FOR_DELIVERY: "Out for delivery",
    DELIVERY_OTP_PENDING: "Delivery OTP verification",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
}

#: Audit-trail event name emitted for each status.
EVENT_NAME = {
    PLACED: "ORDER_CREATED",
    PENDING: "ORDER_CREATED",
    PARTNER_ACCEPTED: "PARTNER_ACCEPTED",
    RIDER_SEARCHING: "PICKUP_RIDER_SEARCHING",
    PICKUP_RIDER_ASSIGNED: "PICKUP_RIDER_ASSIGNED",
    RIDER_ASSIGNED: "PICKUP_RIDER_ASSIGNED",
    PICKUP_RIDER_ACCEPTED: "PICKUP_RIDER_ACCEPTED",
    RIDER_ACCEPTED: "PICKUP_RIDER_ACCEPTED",
    PICKUP_OTP_PENDING: "PICKUP_OTP_PENDING",
    PICKED_UP: "PICKED_UP",
    AT_PARTNER: "AT_PARTNER",
    PROCESSING: "PROCESSING_STARTED",
    IRONING: "IRONING_STARTED",
    READY_FOR_DELIVERY: "READY_FOR_DELIVERY",
    READY: "READY_FOR_DELIVERY",
    COMPLETED: "READY_FOR_DELIVERY",
    DELIVERY_RIDER_ASSIGNED: "DELIVERY_RIDER_ASSIGNED",
    DELIVERY_RIDER_ACCEPTED: "DELIVERY_RIDER_ACCEPTED",
    DISPATCH_OTP_PENDING: "DISPATCH_OTP_PENDING",
    OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
    DELIVERY_OTP_PENDING: "DELIVERY_OTP_PENDING",
    DELIVERED: "DELIVERED",
    CANCELLED: "ORDER_CANCELLED",
}


class OrderNotFoundError(Exception):
    """No canonical order exists for the given id/code."""


class InvalidTransitionError(Exception):
    """The requested status is not reachable from the current status."""


class DuplicateActionError(Exception):
    """The order is already in the requested status."""


class OrderAuthorizationError(Exception):
    """The actor is not the partner/rider/customer attached to this order."""


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def new_otp() -> str:
    """Order specific OTP. Never a hardcoded universal code."""
    return f"{random.randint(1000, 9999)}"


def normalize_status(value: Any) -> str:
    status = str(value or PENDING)
    return LEGACY_STATUS_ALIASES.get(status, status)


def order_status(order: Dict[str, Any]) -> str:
    return normalize_status(order.get("status"))


def order_id_of(order: Dict[str, Any]) -> str:
    return str(order.get("_id") or order.get("id"))


async def find_order(order_id: str) -> Optional[Dict[str, Any]]:
    """Resolve an order by its canonical id or its human order code."""
    if not order_id:
        return None
    document = await database.find_one(ORDERS, {"_id": order_id})
    if document is None:
        document = await database.find_one(ORDERS, {"code": order_id})
    return document


async def get_order(order_id: str) -> Dict[str, Any]:
    document = await find_order(order_id)
    if document is None:
        raise OrderNotFoundError(f"Order {order_id} does not exist")
    return document


def assert_partner(order: Dict[str, Any], partner_id: str) -> None:
    order_partner = order.get("partner") or {}
    order_p_id = str(order_partner.get("id") or order.get("partner_id") or order.get("partnerId") or order.get("store_id") or "")
    if order_p_id:
        if order_p_id == partner_id or order_p_id.lower() == partner_id.lower():
            return
        st = order_status(order)
        if st in (PLACED, PENDING, "new"):
            return
        raise OrderAuthorizationError("This order is assigned to another partner store")
    st = order_status(order)
    if st in (PLACED, PENDING, "new"):
        return
    raise OrderAuthorizationError("This order has already been accepted by another partner")


def assert_rider(order: Dict[str, Any], rider_id: str) -> None:
    rider = order.get("rider") or {}
    if not rider.get("id"):
        raise OrderAuthorizationError("No rider is assigned to this order yet")
    if rider.get("id") != rider_id:
        raise OrderAuthorizationError("This order is assigned to another rider")


def assert_customer(order: Dict[str, Any], user_id: str) -> None:
    if order.get("userId") != user_id:
        raise OrderAuthorizationError("This order belongs to another customer")


def check_transition(current: str, target: str) -> None:
    current = normalize_status(current)
    if current == target:
        raise DuplicateActionError(f"This order is already {target.replace('_', ' ')}")
    if current in TERMINAL:
        raise InvalidTransitionError(
            f"This order is already {current} and can no longer change status"
        )
    if target not in TRANSITIONS.get(current, ()):  # unknown or illegal target
        raise InvalidTransitionError(f"Cannot move an order from {current} to {target}")


async def record_event(
    order: Dict[str, Any],
    event: str,
    *,
    actor_id: str = "",
    actor_role: str = "system",
    metadata: Optional[Dict[str, Any]] = None,
    at: Optional[str] = None,
) -> Dict[str, Any]:
    """Append one row to the `order_events` audit trail."""
    timestamp = at or now_iso()
    event_id = f"oevt-{order_id_of(order)}-{event}-{uuid.uuid4().hex[:8]}"
    document = {
        "_id": event_id,
        "orderId": order_id_of(order),
        "orderCode": order.get("code", ""),
        "event": event,
        "actorId": actor_id,
        "actorRole": actor_role,
        "timestamp": timestamp,
        "metadata": metadata or {},
    }
    await database.collection(EVENTS).insert_one(document)
    return document


async def events_for(order_id: str) -> List[Dict[str, Any]]:
    order = await find_order(order_id)
    canonical = order_id_of(order) if order else order_id
    rows = await database.find_many(EVENTS, {"orderId": canonical})
    rows.sort(key=lambda row: row.get("timestamp") or "")
    return [{k: v for k, v in row.items() if k != "_id"} for row in rows]


async def transition(
    order_id: str,
    target: str,
    *,
    actor_id: str = "",
    actor_role: str = "system",
    metadata: Optional[Dict[str, Any]] = None,
    changes: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Validate + apply a status change, and write the audit trail.

    Raises OrderNotFoundError / InvalidTransitionError / DuplicateActionError.
    """
    order = await get_order(order_id)
    check_transition(order_status(order), target)

    at = now_iso()
    embedded = list(order.get("events") or [])
    embedded.append(
        {
            "id": f"{order.get('code')}-evt-{len(embedded)}",
            "status": target,
            "label": STATUS_LABEL.get(target, target),
            "at": at,
            "actor": actor_role if actor_role in ("customer", "partner", "rider", "admin") else "system",
        }
    )
    update: Dict[str, Any] = {
        "status": target,
        "updatedAt": at,
        "events": embedded,
        **(changes or {}),
    }
    await database.collection(ORDERS).update_one({"_id": order["_id"]}, {"$set": update})
    updated = await get_order(order["_id"])
    await record_event(
        updated,
        EVENT_NAME.get(target, target.upper()),
        actor_id=actor_id,
        actor_role=actor_role,
        metadata=metadata,
        at=at,
    )
    from app.services.order_notifications import dispatch_order_transition_notifications

    await dispatch_order_transition_notifications(
        updated,
        target,
        actor_id=actor_id,
        actor_role=actor_role,
        metadata=metadata,
        changes=changes,
    )

    # Referral engine settlement hook: disburse referrer reward when first order is delivered
    if target in (DELIVERED, COMPLETED):
        try:
            from app.db.referral_repositories import referral_repository
            await referral_repository.on_order_delivered(updated)
        except Exception:
            pass

    return updated


# ---------------------------------------------------------------------------
# Projections — every role sees the same order through its own vocabulary.
# ---------------------------------------------------------------------------

#: canonical status -> partner app status
PARTNER_STATUS = {
    PLACED: "new",
    PENDING: "new",
    PARTNER_ACCEPTED: "accepted",
    RIDER_SEARCHING: "accepted",
    PICKUP_RIDER_ASSIGNED: "accepted",
    RIDER_ASSIGNED: "accepted",
    PICKUP_RIDER_ACCEPTED: "accepted",
    RIDER_ACCEPTED: "accepted",
    PICKUP_OTP_PENDING: "accepted",
    PICKED_UP: "picked",
    AT_PARTNER: "picked",
    PROCESSING: "processing",
    IRONING: "ironing",
    READY_FOR_DELIVERY: "ready",
    READY: "ready",
    COMPLETED: "ready",
    DELIVERY_RIDER_ASSIGNED: "ready",
    DELIVERY_RIDER_ACCEPTED: "ready",
    DISPATCH_OTP_PENDING: "ready",
    OUT_FOR_DELIVERY: "out_for_delivery",
    DELIVERY_OTP_PENDING: "out_for_delivery",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
}

#: canonical status -> rider app status
RIDER_STATUS = {
    PLACED: "assigned",
    PENDING: "assigned",
    PARTNER_ACCEPTED: "assigned",
    RIDER_SEARCHING: "assigned",
    PICKUP_RIDER_ASSIGNED: "accepted",
    RIDER_ASSIGNED: "accepted",
    PICKUP_RIDER_ACCEPTED: "accepted",
    RIDER_ACCEPTED: "accepted",
    PICKUP_OTP_PENDING: "accepted",
    PICKED_UP: "picked",
    AT_PARTNER: "at-partner",
    PROCESSING: "at-partner",
    IRONING: "at-partner",
    READY_FOR_DELIVERY: "at-partner",
    READY: "at-partner",
    COMPLETED: "at-partner",
    DELIVERY_RIDER_ASSIGNED: "accepted",
    DELIVERY_RIDER_ACCEPTED: "accepted",
    DISPATCH_OTP_PENDING: "accepted",
    OUT_FOR_DELIVERY: "ready-for-delivery",
    DELIVERY_OTP_PENDING: "ready-for-delivery",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
}

_PARTNER_STAGES = [
    ("pending", "Order Placed", (PLACED, PENDING)),
    ("accepted", "Accepted", (PARTNER_ACCEPTED, RIDER_SEARCHING, PICKUP_RIDER_ASSIGNED, RIDER_ASSIGNED, PICKUP_RIDER_ACCEPTED, RIDER_ACCEPTED, PICKUP_OTP_PENDING)),
    ("picked", "Picked Up", (PICKED_UP, AT_PARTNER)),
    ("processing", "Processing", (PROCESSING, IRONING, "washing", "dry_cleaning")),
    ("ready", "Ready for Delivery", (READY_FOR_DELIVERY, READY, COMPLETED, DELIVERY_RIDER_ASSIGNED, DELIVERY_RIDER_ACCEPTED, DISPATCH_OTP_PENDING)),
    ("out_for_delivery", "Out for Delivery", (OUT_FOR_DELIVERY, DELIVERY_OTP_PENDING)),
    ("delivered", "Delivered", (DELIVERED,)),
]

_RIDER_STAGES = [
    ("assigned", "Assigned", (PICKUP_RIDER_ASSIGNED, RIDER_ASSIGNED, RIDER_SEARCHING, DELIVERY_RIDER_ASSIGNED)),
    ("accepted", "Accepted", (PICKUP_RIDER_ACCEPTED, RIDER_ACCEPTED, PICKUP_OTP_PENDING, DELIVERY_RIDER_ACCEPTED, DISPATCH_OTP_PENDING)),
    ("picked", "Picked up from customer", (PICKED_UP,)),
    ("at-partner", "Dropped at store", (AT_PARTNER, PROCESSING, IRONING, READY_FOR_DELIVERY, READY, COMPLETED)),
    ("ready-for-delivery", "Out for delivery", (OUT_FOR_DELIVERY, DELIVERY_OTP_PENDING)),
    ("delivered", "Delivered", (DELIVERED,)),
]


def _event_times(order: Dict[str, Any]) -> Dict[str, str]:
    times: Dict[str, str] = {}
    for event in order.get("events") or []:
        status = normalize_status(event.get("status"))
        times.setdefault(status, event.get("at", ""))
    return times


def _timeline(order: Dict[str, Any], stages) -> List[Dict[str, Any]]:
    times = _event_times(order)
    rows = []
    for stage_id, label, statuses in stages:
        hit = next((times[s] for s in statuses if s in times), "")
        rows.append({"id": stage_id, "label": label, "time": hit or "", "done": bool(hit)})
    return rows


def _address_line(address: Dict[str, Any]) -> str:
    parts = [address.get("line", ""), address.get("city", "")]
    return ", ".join([p for p in parts if p]).strip(", ")


def to_partner_order(order: Dict[str, Any]) -> Dict[str, Any]:
    """Canonical order -> the partner app's order shape (same orderId)."""
    customer = order.get("customer") or {}
    totals = order.get("totals") or {}
    payment = order.get("payment") or {}
    items = order.get("items") or []
    addr = order.get("address") or {}
    status = order_status(order)
    
    c_name = customer.get("name") or order.get("customer_name") or order.get("customerName") or "Customer"
    c_phone = customer.get("phone") or order.get("customer_phone") or order.get("customerPhone") or (addr.get("phone") if isinstance(addr, dict) else "") or ""
    
    grand_total = totals.get("grandTotal")
    if grand_total is None or grand_total == 0:
        grand_total = order.get("pricing", {}).get("finalTotal") or order.get("total_amount") or order.get("amount") or 0
    
    address_str = _address_line(addr) if isinstance(addr, dict) else str(addr or order.get("pickup_address") or "")
    if not address_str and isinstance(addr, dict):
        address_str = addr.get("line") or addr.get("city") or "Kasganj"

    # Partner is shown Dispatch OTP only when order is ready / dispatch pending
    dispatch_otp_val = (order.get("otp") or {}).get("dispatch")
    dispatch_code = (
        dispatch_otp_val.get("code")
        if isinstance(dispatch_otp_val, dict)
        else str(dispatch_otp_val or "")
    )

    return {
        "id": order_id_of(order),
        "orderId": order_id_of(order),
        "code": order.get("code") or order.get("order_code") or order_id_of(order),
        "customerName": c_name,
        "customerPhone": c_phone,
        "status": PARTNER_STATUS.get(status, "new"),
        "canonicalStatus": status,
        "placedAt": order.get("createdAt") or order.get("placedAt") or "",
        "placedAtRaw": order.get("createdAt") or order.get("placedAt") or "",
        "slot": (order.get("pickup") or {}).get("slot", "") if isinstance(order.get("pickup"), dict) else "",
        "address": address_str,
        "itemCount": sum(int(item.get("qty", 1)) for item in items) if items else 1,
        "amount": int(grand_total),
        "paymentMode": payment.get("mode", "cod"),
        "paymentStatus": "paid" if payment.get("paid") else "pending",
        "serviceLabel": order.get("serviceLabel", "Laundry"),
        "riderName": (order.get("rider") or {}).get("name", "") if isinstance(order.get("rider"), dict) else "",
        "dispatchOtp": dispatch_code if status in (READY, READY_FOR_DELIVERY, COMPLETED, DISPATCH_OTP_PENDING) else "",
        "cancelledReason": order.get("cancelledReason"),
        "items": [
            {
                "id": str(item.get("id") or item.get("_id") or ""),
                "name": str(item.get("name") or "Laundry Service"),
                "qty": int(item.get("qty", 1)),
                "price": int(item.get("price", 0)),
            }
            for item in items
        ],
        "timeline": _timeline(order, _PARTNER_STAGES),
    }


def to_rider_delivery(order: Dict[str, Any]) -> Dict[str, Any]:
    """Canonical order -> the rider app's task shape (same orderId)."""
    customer = order.get("customer") or {}
    partner = order.get("partner") or {}
    totals = order.get("totals") or {}
    payment = order.get("payment") or {}
    items = order.get("items") or []
    status = order_status(order)
    address = _address_line(order.get("address") or {})

    otp_obj = order.get("otp") or {}
    pickup_otp = otp_obj.get("pickup") or {}
    dispatch_otp = otp_obj.get("dispatch") or {}
    delivery_otp = otp_obj.get("delivery") or {}

    pickup_verified = pickup_otp.get("verified", False) if isinstance(pickup_otp, dict) else False
    dispatch_verified = dispatch_otp.get("verified", False) if isinstance(dispatch_otp, dict) else False
    delivery_verified = delivery_otp.get("verified", False) if isinstance(delivery_otp, dict) else False

    return {
        "id": order_id_of(order),
        "orderId": order_id_of(order),
        "riderId": (order.get("rider") or {}).get("id", ""),
        "code": order.get("code", ""),
        "taskType": "delivery" if status in (OUT_FOR_DELIVERY, DELIVERY_OTP_PENDING, DELIVERED) else "pickup",
        "status": RIDER_STATUS.get(status, "assigned"),
        "canonicalStatus": status,
        "customerName": customer.get("name", ""),
        "customerPhone": customer.get("phone", ""),
        "partnerName": partner.get("name", ""),
        "partnerPhone": partner.get("phone", ""),
        "pickupAddress": address,
        "deliveryAddress": address,
        "distanceKm": 0,
        "etaMinutes": 0,
        "estimatedEarning": max(35, round(int(totals.get("grandTotal", 0)) * 0.12)),
        "itemCount": sum(int(item.get("qty", 0)) for item in items),
        "slot": (order.get("pickup") or {}).get("slot", ""),
        "placedAt": order.get("createdAt", ""),
        "paymentMode": payment.get("mode", "cod"),
        "amount": int(totals.get("grandTotal", 0)),
        "pickupOtpRequired": status in (RIDER_ASSIGNED, RIDER_ACCEPTED, PICKUP_OTP_PENDING) and not pickup_verified,
        "dispatchOtpRequired": status in (READY, COMPLETED, DISPATCH_OTP_PENDING) and not dispatch_verified,
        "deliveryOtpRequired": status in (OUT_FOR_DELIVERY, DELIVERY_OTP_PENDING) and not delivery_verified,
        "pickupOtpVerified": pickup_verified,
        "dispatchOtpVerified": dispatch_verified,
        "deliveryOtpVerified": delivery_verified,
        "timeline": _timeline(order, _RIDER_STAGES),
    }
