"""Partner Activity Tracking Engine — QuickPress Supabase Telemetry.

Persists every operational, store status, order processing, catalog, financial,
and compliance event of a partner store into the Supabase PostgreSQL database
(`partner_activity_logs`).
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.db.client import database

logger = logging.getLogger(__name__)

PARTNER_ACTIVITY_COLLECTION = "partner_activity_logs"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def log_partner_activity(
    partner_id: str,
    category: str,
    event: str,
    title: str,
    description: str,
    actor: str = "Partner",
    actor_id: Optional[str] = None,
    order_id: Optional[str] = None,
    order_code: Optional[str] = None,
    tone: str = "default",
    metadata: Optional[Dict[str, Any]] = None,
    ip: Optional[str] = None,
    device: Optional[str] = None,
) -> Dict[str, Any]:
    """Persist a discrete partner activity into `partner_activity_logs` in Supabase."""
    try:
        activity_id = f"pact-{uuid.uuid4().hex[:12]}"
        now = _now_iso()

        activity_doc = {
            "_id": activity_id,
            "id": activity_id,
            "partnerId": partner_id,
            "category": category,  # orders, store_status, finance, catalog, kyc, security
            "event": event,
            "title": title,
            "description": description,
            "actor": actor,
            "actorId": actor_id or partner_id,
            "orderId": order_id,
            "orderCode": order_code,
            "tone": tone,  # success, warning, danger, info, default
            "metadata": metadata or {},
            "ip": ip or "127.0.0.1",
            "device": device or "Partner App",
            "createdAt": now,
            "timestamp": now,
        }

        await database.insert(PARTNER_ACTIVITY_COLLECTION, activity_doc)
        return activity_doc
    except Exception as exc:
        logger.error(f"[PartnerActivityLogger] Failed to log activity for {partner_id}: {exc}")
        return {}
