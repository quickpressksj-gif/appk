"""OneSignal Push Notification Engine — High-Priority Dispatch for QuickPress.

Dispatches targeted real-time push notifications across Android, iOS, and Web
using OneSignal REST API with custom sound, high-priority channels, and deep linking.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
import httpx

from app.config import get_settings
from app.db.client import database

_log = logging.getLogger(__name__)

ONESIGNAL_API_URL = "https://onesignal.com/api/v1/notifications"


async def register_user_onesignal_player(
    user_id: str,
    player_id: str,
    role: Optional[str] = None,
    device_type: Optional[str] = None,
) -> bool:
    """Stores or updates a user's OneSignal subscription/player ID in MongoDB."""
    if not user_id or not player_id:
        return False
    try:
        from datetime import datetime, timezone
        now_ts = datetime.now(timezone.utc).isoformat()
        await database.collection("onesignal_subscriptions").update_one(
            {"user_id": str(user_id), "player_id": str(player_id)},
            {
                "$set": {
                    "user_id": str(user_id),
                    "player_id": str(player_id),
                    "role": role or "user",
                    "device_type": device_type or "web",
                    "updated_at": now_ts,
                },
                "$setOnInsert": {"created_at": now_ts},
            },
            upsert=True,
        )
        _log.info("Registered OneSignal player_id=%s for user_id=%s", player_id, user_id)
        return True
    except Exception as exc:
        _log.warning("Failed to store OneSignal subscription for user %s: %s", user_id, exc)
        return False


async def send_onesignal_notification(
    user_id: str,
    *,
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None,
    url: Optional[str] = None,
    player_ids: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Sends a targeted high-priority push notification via OneSignal REST API.
    
    Targets by external_id (user_id) and any registered player_ids in database.
    Configures urgent Android channel, sound, vibration, and deep-link payload.
    """
    settings = get_settings()
    app_id = settings.onesignal_app_id
    api_key = settings.onesignal_rest_api_key

    if not app_id or not api_key:
        _log.warning("OneSignal credentials not configured; skipping push dispatch")
        return {"status": "skipped", "reason": "unconfigured"}

    payload_data = dict(data or {})
    if url:
        payload_data["url"] = url

    # Look up registered player IDs for this user
    target_player_ids = list(player_ids or [])
    try:
        cursor = database.collection("onesignal_subscriptions").find({"user_id": str(user_id)})
        docs = await cursor.to_list(length=20)
        for doc in docs:
            pid = doc.get("player_id")
            if pid and pid not in target_player_ids:
                target_player_ids.append(pid)
    except Exception:
        pass

    # Build OneSignal JSON body
    req_body: Dict[str, Any] = {
        "app_id": app_id,
        "headings": {"en": title},
        "contents": {"en": body},
        "data": payload_data,
        "priority": 10,  # High priority (immediate delivery)
        "android_sound": "order_alarm",
        "android_accent_color": "FF10B981",
        "ios_sound": "order_alarm.wav",
        "ttl": 3600,
    }

    if url:
        req_body["url"] = url
        req_body["web_url"] = url

    # Action buttons for interactive notifications
    is_order_alert = "ORDER" in title.upper() or "NEW" in title.upper() or payload_data.get("kind") in ("order-new", "ORDER_CREATED", "ORDER_ASSIGNED")
    if is_order_alert:
        req_body["web_buttons"] = [
            {"id": "view_order", "text": "View Order", "icon": "ic_menu_view"},
            {"id": "accept_order", "text": "Accept Now", "icon": "ic_menu_send"},
        ]

    # Target via external_id alias and/or specific player IDs
    target_aliases = [str(user_id)]
    if target_player_ids:
        req_body["include_subscription_ids"] = target_player_ids
    else:
        req_body["include_aliases"] = {"external_id": target_aliases}
        req_body["target_channel"] = "push"

    headers = {
        "Authorization": f"Basic {api_key}",
        "Content-Type": "application/json; charset=utf-8",
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(ONESIGNAL_API_URL, json=req_body, headers=headers)
            res_json = resp.json() if resp.content else {}
            if resp.status_code in (200, 201):
                _log.info(
                    "OneSignal push sent successfully to user %s (id=%s, recipients=%s)",
                    user_id,
                    res_json.get("id"),
                    res_json.get("recipients"),
                )
                return {
                    "status": "delivered",
                    "id": res_json.get("id"),
                    "recipients": res_json.get("recipients", 0),
                }
            else:
                _log.warning("OneSignal API response status=%d: %s", resp.status_code, res_json)
                return {"status": "error", "code": resp.status_code, "response": res_json}
    except Exception as exc:
        _log.error("OneSignal push dispatch exception for user %s: %s", user_id, exc)
        return {"status": "failed", "error": str(exc)}



async def send_onesignal_broadcast(
    *,
    title: str,
    body: str,
    segment: str = "Total Subscriptions",
    data: Optional[Dict[str, Any]] = None,
    url: Optional[str] = None,
) -> Dict[str, Any]:
    """Broadcasts a notification to a whole segment (e.g. All Partners, All Riders)."""
    settings = get_settings()
    app_id = settings.onesignal_app_id
    api_key = settings.onesignal_rest_api_key

    if not app_id or not api_key:
        return {"status": "skipped", "reason": "unconfigured"}

    req_body: Dict[str, Any] = {
        "app_id": app_id,
        "included_segments": [segment],
        "headings": {"en": title},
        "contents": {"en": body},
        "data": data or {},
        "priority": 10,
    }
    if url:
        req_body["url"] = url

    headers = {
        "Authorization": f"Basic {api_key}",
        "Content-Type": "application/json; charset=utf-8",
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(ONESIGNAL_API_URL, json=req_body, headers=headers)
            res_json = resp.json() if resp.content else {}
            return {"status": "delivered" if resp.status_code in (200, 201) else "error", "response": res_json}
    except Exception as exc:
        return {"status": "failed", "error": str(exc)}
