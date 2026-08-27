"""QuickPress Realtime Socket.IO Service — Unified event dispatcher across roles."""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import socketio

logger = logging.getLogger(__name__)

# Single AsyncServer instance shared across backend-python
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)

# Standard QuickPress Socket.IO event names
EVENT_ORDER_CREATED = "order.created"
EVENT_ORDER_ACCEPTED = "order.partner_accepted"
EVENT_ORDER_RIDER_SEARCHING = "order.rider_searching"
EVENT_ORDER_RIDER_OFFER = "order.rider_offer"
EVENT_ORDER_RIDER_ASSIGNED = "order.rider_assigned"
EVENT_ORDER_PICKUP_OTP_PENDING = "order.pickup_otp_pending"
EVENT_ORDER_PICKED_UP = "order.picked_up"
EVENT_ORDER_AT_PARTNER = "order.at_partner"
EVENT_ORDER_PROCESSING = "order.processing"
EVENT_ORDER_READY = "order.ready"
EVENT_ORDER_DISPATCH_OTP_PENDING = "order.dispatch_otp_pending"
EVENT_ORDER_OUT_FOR_DELIVERY = "order.out_for_delivery"
EVENT_ORDER_DELIVERY_OTP_PENDING = "order.delivery_otp_pending"
EVENT_ORDER_DELIVERED = "order.delivered"
EVENT_ORDER_COMPLETED = "order.completed"
EVENT_ORDER_CANCELLED = "order.cancelled"
EVENT_LOCATION_UPDATED = "location.updated"


@sio.event
async def connect(sid: str, environ: dict, auth: Optional[dict] = None) -> None:
    logger.info("Socket.IO client connected: sid=%s", sid)
    if auth:
        user_id = auth.get("userId") or auth.get("id")
        role = auth.get("role", "customer")
        partner_id = auth.get("partnerId")
        rider_id = auth.get("riderId")
        
        if user_id:
            await sio.enter_room(sid, f"user:{user_id}")
            await sio.enter_room(sid, f"customer:{user_id}")
        if role:
            await sio.enter_room(sid, f"role:{role}")
            if role == "admin":
                await sio.enter_room(sid, "admins")
            elif role == "partner":
                await sio.enter_room(sid, "partners")
            elif role == "rider":
                await sio.enter_room(sid, "riders")
        if partner_id:
            await sio.enter_room(sid, f"partner:{partner_id}")
        if rider_id:
            await sio.enter_room(sid, f"rider:{rider_id}")


@sio.event
async def disconnect(sid: str) -> None:
    logger.info("Socket.IO client disconnected: sid=%s", sid)


@sio.event
async def join_order(sid: str, data: dict) -> None:
    order_id = (data or {}).get("orderId") or (data or {}).get("id")
    if order_id:
        await sio.enter_room(sid, f"order:{order_id}")


@sio.event
async def leave_order(sid: str, data: dict) -> None:
    order_id = (data or {}).get("orderId") or (data or {}).get("id")
    if order_id:
        await sio.leave_room(sid, f"order:{order_id}")


@sio.event
async def update_location(sid: str, data: dict) -> None:
    rider_id = (data or {}).get("riderId")
    order_id = (data or {}).get("orderId")
    coords = (data or {}).get("coords")
    if order_id and coords:
        await sio.emit(
            EVENT_LOCATION_UPDATED,
            {"riderId": rider_id, "orderId": order_id, "coords": coords},
            room=f"order:{order_id}",
        )


async def broadcast_order_event(
    event_name: str,
    order: Dict[str, Any],
    *,
    extra_data: Optional[Dict[str, Any]] = None,
) -> None:
    """Broadcast an order transition to the canonical order room and interested roles."""
    order_id = str(order.get("_id") or order.get("id") or "")
    customer_id = str(order.get("userId") or (order.get("customer") or {}).get("id") or "")
    partner_id = str((order.get("partner") or {}).get("id") or order.get("partnerId") or "")
    rider_id = str((order.get("rider") or {}).get("id") or order.get("riderId") or "")

    payload = {
        "orderId": order_id,
        "code": order.get("code") or order.get("order_code") or order_id,
        "status": order.get("status"),
        "timestamp": order.get("updatedAt"),
        **(extra_data or {}),
    }

    # 1. Emit to order specific room
    if order_id:
        await sio.emit(event_name, payload, room=f"order:{order_id}")

    # 2. Emit to customer room
    if customer_id:
        await sio.emit(event_name, payload, room=f"user:{customer_id}")
        await sio.emit(event_name, payload, room=f"customer:{customer_id}")

    # 3. Emit to partner room
    if partner_id:
        await sio.emit(event_name, payload, room=f"partner:{partner_id}")

    # 4. Emit to assigned rider room
    if rider_id:
        await sio.emit(event_name, payload, room=f"rider:{rider_id}")

    # 5. Emit to admin room
    await sio.emit(event_name, payload, room="admins")


EVENT_WALLET_UPDATED = "wallet.updated"


async def broadcast_wallet_event(
    user_id: str,
    wallet_data: Dict[str, Any],
) -> None:
    """Notify the user's connected clients about their new wallet balance in real-time."""
    if not user_id:
        return
    try:
        await sio.emit(
            EVENT_WALLET_UPDATED,
            wallet_data,
            room=f"user:{user_id}",
        )
        await sio.emit(
            EVENT_WALLET_UPDATED,
            wallet_data,
            room=f"customer:{user_id}",
        )
    except Exception as exc:
        logger.warning("Failed to broadcast wallet event to user %s: %s", user_id, exc)


EVENT_ADMIN_BROADCAST = "admin_broadcast"
EVENT_NOTIFICATION_CREATED = "notification_created"


async def broadcast_admin_notification_event(
    title: str,
    message: str,
    audience: str = "All",
    action_url: Optional[str] = None,
    image_url: Optional[str] = None,
) -> None:
    """Broadcast an administrative or promotional notification to all connected clients."""
    from datetime import datetime, timezone

    payload = {
        "title": title,
        "message": message,
        "description": message,
        "audience": audience,
        "actionUrl": action_url,
        "imageUrl": image_url,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    try:
        await sio.emit(EVENT_ADMIN_BROADCAST, payload)
        await sio.emit(EVENT_NOTIFICATION_CREATED, payload)
        logger.info("Admin notification broadcasted to all active sockets: %s", title)
    except Exception as exc:
        logger.warning("Failed to broadcast admin notification event: %s", exc)


