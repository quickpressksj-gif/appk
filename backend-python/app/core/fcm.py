"""Firebase Cloud Messaging (FCM) — Real push notification dispatcher for QuickPress.

Sends real push notifications to Android / iOS / Web clients with deep linking.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Union

from app.core.firebase import _firebase_app
from app.db.client import database

logger = logging.getLogger(__name__)


async def register_fcm_token(user_id: str, fcm_token: str, device_type: str = "android") -> None:
    """Register or update an FCM token for a user."""
    if not user_id or not fcm_token:
        return
    try:
        user = await database.find_one("users", {"_id": user_id})
        if not user:
            return
        tokens = list(user.get("fcm_tokens") or [])
        if fcm_token not in tokens:
            tokens.append(fcm_token)
            # Keep at most last 5 active device tokens per user
            tokens = tokens[-5:]
            await database.collection("users").update_one(
                {"_id": user_id},
                {"$set": {"fcm_tokens": tokens, "fcm_token": fcm_token, "device_type": device_type}}
            )
    except Exception as e:
        logger.warning("Failed to register FCM token for user %s: %s", user_id, e)


async def send_fcm_push(
    user_id_or_ids: Union[str, List[str]],
    *,
    title: str,
    body: str,
    data: Optional[Dict[str, str]] = None,
    badge: Optional[int] = None,
) -> int:
    """Send FCM push notification to one or multiple users.
    
    Returns the number of successfully delivered messages.
    """
    app = _firebase_app()
    if not app:
        logger.debug("Firebase App not initialized; skipping FCM push.")
        return 0

    try:
        from firebase_admin import messaging
    except ImportError:
        logger.warning("firebase_admin.messaging not available.")
        return 0

    user_ids = [user_id_or_ids] if isinstance(user_id_or_ids, str) else user_id_or_ids
    if not user_ids:
        return 0

    # Collect all FCM tokens for these users
    tokens: List[str] = []
    for uid in user_ids:
        try:
            u = await database.find_one("users", {"_id": uid})
            if u:
                for t in (u.get("fcm_tokens") or []):
                    if t and t not in tokens:
                        tokens.append(t)
                single = u.get("fcm_token")
                if single and single not in tokens:
                    tokens.append(single)
        except Exception:
            pass

    if not tokens:
        return 0

    # Clean data payload (FCM only accepts string values in data dict)
    clean_data: Dict[str, str] = {}
    if data:
        for k, v in data.items():
            if v is not None:
                clean_data[str(k)] = str(v)

    # Ensure click_action / deep link URL is present
    if "url" in clean_data and "click_action" not in clean_data:
        clean_data["click_action"] = clean_data["url"]

    notification = messaging.Notification(title=title, body=body)
    android_config = messaging.AndroidConfig(
        priority="high",
        notification=messaging.AndroidNotification(
            channel_id="quickpress_orders",
            sound="default",
            click_action=clean_data.get("url") or "FLUTTER_NOTIFICATION_CLICK",
        ),
    )
    apns_config = messaging.APNSConfig(
        payload=messaging.APNSPayload(
            aps=messaging.Aps(
                sound="default",
                badge=badge,
                category=clean_data.get("category", "order"),
            )
        )
    )

    sent_count = 0
    # Send individually or multicast
    if len(tokens) == 1:
        try:
            msg = messaging.Message(
                token=tokens[0],
                notification=notification,
                data=clean_data,
                android=android_config,
                apns=apns_config,
            )
            messaging.send(msg)
            sent_count += 1
        except Exception as err:
            logger.debug("Failed sending FCM to single token: %s", err)
    else:
        try:
            multicast = messaging.MulticastMessage(
                tokens=tokens[:500],
                notification=notification,
                data=clean_data,
                android=android_config,
                apns=apns_config,
            )
            response = messaging.send_each_for_multicast(multicast)
            sent_count = response.success_count
        except Exception as err:
            logger.debug("Failed sending multicast FCM: %s", err)

    return sent_count
