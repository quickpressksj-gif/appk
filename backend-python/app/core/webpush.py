"""Native WebPush (VAPID / RFC 8292) Push Notification Service for QuickPress.

Direct, zero-third-party web push delivery to all standard browsers (Chrome, Firefox, Safari, Edge)
using standard PushSubscription (endpoint, p256dh, auth).
"""

from __future__ import annotations

import base64
import json
import logging
import os
from typing import Any, Dict, List, Optional, Union

from app.db.client import database

logger = logging.getLogger(__name__)

# Default persistent fallback VAPID keypair for QuickPress
_DEFAULT_VAPID_PUBLIC_KEY = os.getenv(
    "VAPID_PUBLIC_KEY",
    "BM7s_1AfKwj2Qi7EYQYn_hhnZQXBmlRb3wEslUzslJx_nuPn2zwYYMklw_38UU8QbcbTJPajNT4FD4sgHKb6B3A",
)
_DEFAULT_VAPID_PRIVATE_KEY = os.getenv(
    "VAPID_PRIVATE_KEY",
    "MC4CAQAwBQYDK2VwBCIEIPZ5O4n4T1x7k2c6gV8N9Kj1xP4m3r5s7t9u0v1w2x3y",
)
_DEFAULT_VAPID_CLAIM_EMAIL = os.getenv(
    "VAPID_CLAIM_EMAIL",
    "mailto:support@quickpress.com",
)


def get_vapid_public_key() -> str:
    """Return public VAPID key in base64url format for client push subscription."""
    return os.getenv("VAPID_PUBLIC_KEY", _DEFAULT_VAPID_PUBLIC_KEY).strip()


def get_vapid_private_key() -> str:
    return os.getenv("VAPID_PRIVATE_KEY", _DEFAULT_VAPID_PRIVATE_KEY).strip()


def get_vapid_claims() -> Dict[str, str]:
    sub = os.getenv("VAPID_SUB") or os.getenv("VAPID_CLAIM_EMAIL") or _DEFAULT_VAPID_CLAIM_EMAIL
    if not sub.startswith("mailto:") and not sub.startswith("https://"):
        sub = f"mailto:{sub}"
    return {"sub": sub}


async def save_webpush_subscription(
    user_id: str,
    subscription_info: Dict[str, Any],
    device_type: str = "web",
) -> bool:
    """Register or update a standard browser PushSubscription for a user."""
    if not user_id or not subscription_info:
        return False

    endpoint = subscription_info.get("endpoint")
    keys = subscription_info.get("keys") or {}
    p256dh = keys.get("p256dh")
    auth = keys.get("auth")

    if not endpoint or not p256dh or not auth:
        logger.warning("Invalid PushSubscription info for user %s", user_id)
        return False

    record = {
        "endpoint": str(endpoint),
        "keys": {
            "p256dh": str(p256dh),
            "auth": str(auth),
        },
        "device_type": device_type,
    }

    try:
        user = await database.find_one("users", {"_id": user_id})
        if not user:
            return False

        subscriptions = list(user.get("webpush_subscriptions") or [])
        # Prune existing subscription with matching endpoint
        subscriptions = [s for s in subscriptions if s.get("endpoint") != endpoint]
        subscriptions.append(record)
        # Cap at 5 active browser subscriptions per account
        subscriptions = subscriptions[-5:]

        await database.collection("users").update_one(
            {"_id": user_id},
            {
                "$set": {
                    "webpush_subscriptions": subscriptions,
                    "latest_webpush_endpoint": endpoint,
                }
            },
        )
        return True
    except Exception as err:
        logger.warning("Failed to save webpush subscription for user %s: %s", user_id, err)
        return False


async def delete_webpush_subscription(
    user_id: str,
    endpoint: Optional[str] = None,
) -> bool:
    """Unsubscribe a browser endpoint or clear all webpush subscriptions on logout."""
    if not user_id:
        return False

    try:
        if endpoint:
            user = await database.find_one("users", {"_id": user_id})
            if user:
                subs = [
                    s for s in (user.get("webpush_subscriptions") or [])
                    if s.get("endpoint") != endpoint
                ]
                await database.collection("users").update_one(
                    {"_id": user_id},
                    {"$set": {"webpush_subscriptions": subs}},
                )
        else:
            await database.collection("users").update_one(
                {"_id": user_id},
                {"$set": {"webpush_subscriptions": [], "latest_webpush_endpoint": None}},
            )
        return True
    except Exception as err:
        logger.warning("Failed to delete webpush subscription for user %s: %s", user_id, err)
        return False


async def send_native_webpush(
    user_id_or_ids: Union[str, List[str]],
    *,
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None,
    icon: Optional[str] = None,
    badge: Optional[str] = None,
) -> int:
    """Dispatch native WebPush notifications directly to browser endpoints.
    
    Returns the number of successfully delivered browser pushes.
    """
    user_ids = [user_id_or_ids] if isinstance(user_id_or_ids, str) else user_id_or_ids
    if not user_ids:
        return 0

    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        logger.warning("pywebpush is not installed; skipping native webpush.")
        return 0

    private_key = get_vapid_private_key()
    claims = get_vapid_claims()

    # Collect all subscriptions for target users
    subscriptions_with_user: List[tuple[str, Dict[str, Any]]] = []
    for uid in user_ids:
        if not uid:
            continue
        try:
            u = (
                await database.find_one("users", {"_id": uid})
                or await database.find_one("users", {"linked_id": uid})
                or await database.find_one("users", {"linked_partner_id": uid})
                or await database.find_one("users", {"firebase_uid": uid})
            )
            if u:
                u_id = str(u.get("_id") or uid)
                for sub in (u.get("webpush_subscriptions") or []):
                    if sub and sub.get("endpoint"):
                        subscriptions_with_user.append((u_id, sub))
        except Exception:
            pass

    if not subscriptions_with_user:
        return 0

    click_url = (data or {}).get("url") or "/"
    notification_icon = icon or "/favicon.png"
    notification_badge = badge or "/favicon.png"

    payload_dict = {
        "notification": {
            "title": title,
            "body": body,
            "icon": notification_icon,
            "badge": notification_badge,
            "vibrate": [200, 100, 200],
            "data": {
                "url": click_url,
                **(data or {}),
            },
        },
        "data": {
            "url": click_url,
            "title": title,
            "body": body,
            **(data or {}),
        },
    }
    payload_json = json.dumps(payload_dict)

    sent_count = 0
    stale_endpoints: List[tuple[str, str]] = []

    for u_id, sub in subscriptions_with_user:
        try:
            sub_info = {
                "endpoint": sub["endpoint"],
                "keys": sub.get("keys") or {},
            }
            webpush(
                subscription_info=sub_info,
                data=payload_json,
                vapid_private_key=private_key,
                vapid_claims=claims,
                timeout=5,
            )
            sent_count += 1
        except Exception as exc:
            # Check for HTTP 410 Gone / 404 Not Found -> stale subscription
            resp = getattr(exc, "response", None)
            status_code = getattr(resp, "status_code", 0) if resp else 0
            if status_code in (404, 410):
                stale_endpoints.append((u_id, sub["endpoint"]))
            logger.debug("WebPush delivery notice for %s: %s", sub["endpoint"][:30], exc)

    # Prune stale endpoints in background
    for u_id, stale_ep in stale_endpoints:
        try:
            await delete_webpush_subscription(u_id, stale_ep)
        except Exception:
            pass

    return sent_count
