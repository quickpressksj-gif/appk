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
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.db.client import database

ORDERS = "customer_orders"
EVENTS = "order_events"

PENDING = "pending_partner_acceptance"
PARTNER_ACCEPTED = "partner_accepted"
RIDER_ASSIGNED = "rider_assigned"
RIDER_ACCEPTED = "rider_accepted"
PICKED_UP = "picked_up"
AT_PARTNER = "at_partner"
PROCESSING = "processing"
COMPLETED = "completed"
OUT_FOR_DELIVERY = "out_for_delivery"
DELIVERED = "delivered"
CANCELLED = "cancelled"

TERMINAL = (DELIVERED, CANCELLED)

#: Documents created before the canonical lifecycle used `placed`.
LEGACY_STATUS_ALIASES = {"placed": PENDING}

TRANSITIONS: Dict[str, tuple] = {
    PENDING: (PARTNER_ACCEPTED, CANCELLED),
    PARTNER_ACCEPTED: (RIDER_ASSIGNED, AT_PARTNER, PROCESSING, CANCELLED),
    RIDER_ASSIGNED: (RIDER_ACCEPTED, CANCELLED),
    RIDER_ACCEPTED: (PICKED_UP, CANCELLED),
    PICKED_UP: (AT_PARTNER, CANCELLED),
    AT_PARTNER: (PROCESSING, CANCELLED),
    PROCESSING: (COMPLETED, CANCELLED),
    COMPLETED: (OUT_FOR_DELIVERY, CANCELLED),
    OUT_FOR_DELIVERY: (DELIVERED,),
    DELIVERED: (),
    CANCELLED: (),
}

STATUS_LABEL = {
    PENDING: "Order placed",
    PARTNER_ACCEPTED: "Accepted by store",
    RIDER_ASSIGNED: "Rider assigned",
    RIDER_ACCEPTED: "Rider accepted",
    PICKED_UP: "Picked up",
    AT_PARTNER: "Reached store",
    PROCESSING: "In cleaning",
    COMPLETED: "Laundry completed",
    OUT_FOR_DELIVERY: "Out for delivery",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
}

#: Audit-trail event name emitted for each status.
EVENT_NAME = {
    PENDING: "ORDER_CREATED",
    PARTNER_ACCEPTED: "PARTNER_ACCEPTED",
    RIDER_ASSIGNED: "RIDER_ASSIGNED",
    RIDER_ACCEPTED: "RIDER_ACCEPTED",
    PICKED_UP: "PICKED_UP",
    AT_PARTNER: "AT_PARTNER",
    PROCESSING: "PROCESSING_STARTED",
    COMPLETED: "PROCESSING_COMPLETED",
    OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
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
        raise OrderAuthorizationError("This order is assigned to another partner store")
    if order_status(order) != PENDING:
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
    document = {
        "_id": f"oevt-{order_id_of(order)}-{event}-{timestamp}",
        "orderId": order_id_of(order),
        "orderCode": order.get("code", ""),
        "event": event,
        "actorId": actor_id,
        "actorRole": actor_role,
        "timestamp": timestamp,
        "metadata": metadata or {},
    }
    await database.collection(EVENTS).update_one(
        {"_id": document["_id"]},
        {"$set": {k: v for k, v in document.items() if k != "_id"}},
        upsert=True,
    )
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
    return updated


# ---------------------------------------------------------------------------
# Projections — every role sees the same order through its own vocabulary.
# ---------------------------------------------------------------------------

#: canonical status -> partner app status
PARTNER_STATUS = {
    PENDING: "new",
    PARTNER_ACCEPTED: "accepted",
    RIDER_ASSIGNED: "accepted",
    RIDER_ACCEPTED: "accepted",
    PICKED_UP: "picked",
    AT_PARTNER: "picked",
    PROCESSING: "processing",
    COMPLETED: "ready",
    OUT_FOR_DELIVERY: "ready",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
}

#: canonical status -> rider app status
RIDER_STATUS = {
    PENDING: "assigned",
    PARTNER_ACCEPTED: "assigned",
    RIDER_ASSIGNED: "assigned",
    RIDER_ACCEPTED: "accepted",
    PICKED_UP: "picked",
    AT_PARTNER: "at-partner",
    PROCESSING: "at-partner",
    COMPLETED: "at-partner",
    OUT_FOR_DELIVERY: "ready-for-delivery",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
}

_PARTNER_STAGES = [
    ("placed", "Order placed", (PENDING,)),
    ("accepted", "Accepted", (PARTNER_ACCEPTED, RIDER_ASSIGNED, RIDER_ACCEPTED)),
    ("picked", "Picked up by rider", (PICKED_UP, AT_PARTNER)),
    ("processing", "In cleaning", (PROCESSING,)),
    ("ready", "Laundry completed", (COMPLETED, OUT_FOR_DELIVERY)),
    ("delivered", "Delivered", (DELIVERED,)),
]

_RIDER_STAGES = [
    ("assigned", "Assigned", (RIDER_ASSIGNED,)),
    ("accepted", "Accepted", (RIDER_ACCEPTED,)),
    ("picked", "Picked up from customer", (PICKED_UP,)),
    ("at-partner", "Dropped at store", (AT_PARTNER, PROCESSING, COMPLETED)),
    ("ready-for-delivery", "Out for delivery", (OUT_FOR_DELIVERY,)),
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
    
    c_name = customer.get("name") or order.get("customer_name") or order.get("customerName") or "Customer"
    c_phone = customer.get("phone") or order.get("customer_phone") or order.get("customerPhone") or (addr.get("phone") if isinstance(addr, dict) else "") or ""
    
    grand_total = totals.get("grandTotal")
    if grand_total is None or grand_total == 0:
        grand_total = order.get("pricing", {}).get("finalTotal") or order.get("total_amount") or order.get("amount") or 0
    
    address_str = _address_line(addr) if isinstance(addr, dict) else str(addr or order.get("pickup_address") or "")
    if not address_str and isinstance(addr, dict):
        address_str = addr.get("line") or addr.get("city") or "Kasganj"

    return {
        "id": order_id_of(order),
        "orderId": order_id_of(order),
        "code": order.get("code") or order.get("order_code") or order_id_of(order),
        "customerName": c_name,
        "customerPhone": c_phone,
        "status": PARTNER_STATUS.get(order_status(order), "new"),
        "canonicalStatus": order_status(order),
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
    return {
        "id": order_id_of(order),
        "orderId": order_id_of(order),
        "riderId": (order.get("rider") or {}).get("id", ""),
        "code": order.get("code", ""),
        "taskType": "delivery" if status in (OUT_FOR_DELIVERY, DELIVERED) else "pickup",
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
        "estimatedEarning": max(30, round(int(totals.get("grandTotal", 0)) * 0.1)),
        "itemCount": sum(int(item.get("qty", 0)) for item in items),
        "slot": (order.get("pickup") or {}).get("slot", ""),
        "placedAt": order.get("createdAt", ""),
        "paymentMode": payment.get("mode", "cod"),
        "amount": int(totals.get("grandTotal", 0)),
        "timeline": _timeline(order, _RIDER_STAGES),
    }
