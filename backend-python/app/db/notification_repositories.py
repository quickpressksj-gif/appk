"""Notification repository — Sprint 2.7.

Collection
----------
`notifications`  one document per notification, per user.

    {
      "_id":        "ntf-<uuid>",
      "user_id":    "<users._id>",
      "role":       "customer",
      "kind":       "out-for-delivery",
      "category":   "order",
      "title":      "Out for delivery",
      "description":"Your order is on its way.",
      "created_at": "2026-08-05T09:10:00+00:00",
      "read":       false,
      "read_at":    null,
      "order_id":   "ord-1029" | null,
      "order_code": "QP-1029" | null
    }

Reads are always scoped to the signed-in user, support search + type filter and
are paginated. Nothing is ever returned across users.
"""

from __future__ import annotations

import uuid
from datetime import timedelta
from typing import Any, Dict, List, Optional

from app.db.client import database
from app.models.notification import (
    CATEGORY_BY_KIND,
    NotificationItem,
    NotificationListResponse,
)
from app.models.user import utcnow

COLLECTION = "notifications"

# Seeded once per customer so the feed is never empty on a fresh account.
WELCOME_SEED: List[Dict[str, Any]] = [
    {
        "kind": "system",
        "title": "Welcome to QuickPress",
        "description": "Schedule a pickup and we will handle the rest.",
        "hours_ago": 1,
    },
    {
        "kind": "offer",
        "title": "Your first order is 20% off",
        "description": "Use code FRESH20 at checkout on your first pickup.",
        "hours_ago": 5,
    },
    {
        "kind": "membership",
        "title": "Try QuickPress Plus",
        "description": "Free delivery and priority slots on every order.",
        "hours_ago": 30,
    },
]


def category_for(kind: str) -> str:
    return CATEGORY_BY_KIND.get(kind, "system")


def _iso(value: Any) -> str:
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value or utcnow().isoformat())


def to_item(document: Dict[str, Any]) -> NotificationItem:
    kind = document.get("kind") or "system"
    return NotificationItem(
        id=str(document.get("_id")),
        accountId=str(document.get("user_id") or ""),
        role=str(document.get("role") or "customer"),
        kind=kind if kind in CATEGORY_BY_KIND else "system",
        category=document.get("category") or category_for(kind),
        title=str(document.get("title") or ""),
        description=str(document.get("description") or ""),
        createdAt=_iso(document.get("created_at")),
        read=bool(document.get("read")),
        orderId=document.get("order_id"),
        orderCode=document.get("order_code"),
    )


class NotificationRepository:
    @property
    def _c(self):
        return database.collection(COLLECTION)

    async def _all_for(self, user_id: str) -> List[Dict[str, Any]]:
        documents = await database.find_many(COLLECTION, {"user_id": user_id})
        documents.sort(key=lambda doc: _iso(doc.get("created_at")), reverse=True)
        return documents

    async def ensure_seed(self, user_id: str, role: str = "customer") -> None:
        """Create the welcome notifications the first time a user opens the feed."""
        existing = await self._c.count_documents({"user_id": user_id})
        if existing:
            return
        now = utcnow()
        for index, template in enumerate(WELCOME_SEED):
            kind = str(template["kind"])
            await self._c.insert_one(
                {
                    "_id": f"ntf-{user_id}-seed-{index}",
                    "user_id": user_id,
                    "role": role,
                    "kind": kind,
                    "category": category_for(kind),
                    "title": template["title"],
                    "description": template["description"],
                    "created_at": (
                        now - timedelta(hours=int(template["hours_ago"]))
                    ).isoformat(),
                    "read": False,
                    "read_at": None,
                    "order_id": None,
                    "order_code": None,
                }
            )

    async def create(
        self,
        user_id: str,
        *,
        kind: str,
        title: str,
        description: str = "",
        role: str = "customer",
        order_id: Optional[str] = None,
        order_code: Optional[str] = None,
    ) -> NotificationItem:
        document = {
            "_id": f"ntf-{uuid.uuid4().hex[:16]}",
            "user_id": user_id,
            "role": role,
            "kind": kind,
            "category": category_for(kind),
            "title": title,
            "description": description,
            "created_at": utcnow().isoformat(),
            "read": False,
            "read_at": None,
            "order_id": order_id,
            "order_code": order_code,
        }
        await self._c.insert_one(document)
        return to_item(document)

    async def list(
        self,
        user_id: str,
        *,
        page: int = 1,
        limit: int = 15,
        search: str = "",
        type_filter: str = "all",
    ) -> NotificationListResponse:
        await self.ensure_seed(user_id)
        documents = await self._all_for(user_id)
        unread = sum(1 for doc in documents if not doc.get("read"))

        needle = (search or "").strip().lower()
        wanted = (type_filter or "all").strip().lower()

        def matches(doc: Dict[str, Any]) -> bool:
            category = doc.get("category") or category_for(str(doc.get("kind")))
            if wanted and wanted != "all" and category != wanted:
                return False
            if not needle:
                return True
            haystack = " ".join(
                str(doc.get(key) or "") for key in ("title", "description", "order_code")
            ).lower()
            return needle in haystack

        matching = [doc for doc in documents if matches(doc)]
        page = max(1, page)
        limit = max(1, min(limit, 50))
        window = matching[(page - 1) * limit : page * limit]

        return NotificationListResponse(
            items=[to_item(doc) for doc in window],
            page=page,
            limit=limit,
            total=len(matching),
            hasMore=page * limit < len(matching),
            unread=unread,
        )

    async def unread_count(self, user_id: str) -> int:
        return await self._c.count_documents({"user_id": user_id, "read": False})

    async def mark_read(self, user_id: str, notification_id: str) -> bool:
        document = await self._c.find_one({"_id": notification_id, "user_id": user_id})
        if not document:
            return False
        await self._c.update_one(
            {"_id": notification_id, "user_id": user_id},
            {"$set": {"read": True, "read_at": utcnow().isoformat()}},
        )
        return True

    async def mark_all_read(self, user_id: str) -> int:
        documents = await self._all_for(user_id)
        changed = 0
        for document in documents:
            if document.get("read"):
                continue
            await self._c.update_one(
                {"_id": document.get("_id"), "user_id": user_id},
                {"$set": {"read": True, "read_at": utcnow().isoformat()}},
            )
            changed += 1
        return changed

    async def delete(self, user_id: str, notification_id: str) -> bool:
        removed = await self._c.delete_many({"_id": notification_id, "user_id": user_id})
        return bool(removed)


notification_repository = NotificationRepository()
