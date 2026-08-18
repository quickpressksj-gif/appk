"""Notification models — Sprint 2.7."""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field

NotificationKind = Literal[
    "partner-accepted",
    "pickup-scheduled",
    "pickup-completed",
    "processing",
    "out-for-delivery",
    "delivered",
    "wallet",
    "cashback",
    "offer",
    "coupon",
    "system",
    "order-new",
    "order-cancelled",
    "rider-assigned",
    "membership",
    "referral",
]

NotificationCategory = Literal[
    "order",
    "offer",
    "wallet",
    "membership",
    "referral",
    "system",
]

CATEGORY_BY_KIND: dict[str, str] = {
    "partner-accepted": "order",
    "pickup-scheduled": "order",
    "pickup-completed": "order",
    "processing": "order",
    "out-for-delivery": "order",
    "delivered": "order",
    "order-new": "order",
    "order-cancelled": "order",
    "rider-assigned": "order",
    "wallet": "wallet",
    "cashback": "wallet",
    "offer": "offer",
    "coupon": "offer",
    "membership": "membership",
    "referral": "referral",
    "system": "system",
}


class NotificationItem(BaseModel):
    id: str
    accountId: str = ""
    role: str = "customer"
    kind: NotificationKind = "system"
    category: NotificationCategory = "system"
    title: str
    description: str = ""
    createdAt: str
    read: bool = False
    orderId: Optional[str] = None
    orderCode: Optional[str] = None


class NotificationListResponse(BaseModel):
    items: List[NotificationItem] = Field(default_factory=list)
    page: int = 1
    limit: int = 15
    total: int = 0
    hasMore: bool = False
    unread: int = 0


class UnreadCountResponse(BaseModel):
    count: int = 0


class NotificationActionResponse(BaseModel):
    ok: bool = True
    id: Optional[str] = None
    unread: int = 0
