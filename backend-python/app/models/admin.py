"""Admin domain models — Sprint 5.2 (MongoDB integration).

Loose, additive pydantic models for request bodies used by the admin panel.
Most list/detail responses are returned as plain dicts (mirroring the mock
TS server's untyped JSON shapes) so the admin-frontend receives byte-for-byte
compatible payloads without over-constraining fields that differ per screen.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class AssignRiderPayload(BaseModel):
    riderId: str


class CancelOrderPayload(BaseModel):
    reason: Optional[str] = None


class CouponPayload(BaseModel):
    code: Optional[str] = None
    discount: Optional[str] = None
    description: Optional[str] = None
    expiry: Optional[str] = None
    minOrder: Optional[float] = None
    status: Optional[str] = None


class StaffPayload(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    scope: Optional[str] = None
    status: Optional[str] = None


class CityPayload(BaseModel):
    city: Optional[str] = None
    state: Optional[str] = None
    areas: Optional[int] = None
    pickupRadius: Optional[str] = None
    status: Optional[str] = None


class ServicePayload(BaseModel):
    name: Optional[str] = None
    categoryId: Optional[str] = None
    unit: Optional[str] = None
    price: Optional[float] = None
    image: Optional[str] = None
    description: Optional[str] = None


class SupportReplyPayload(BaseModel):
    body: Optional[str] = None


class BroadcastPayload(BaseModel):
    audience: Optional[str] = "All"
    title: Optional[str] = None
    message: Optional[str] = None


class SettingsUpdatePayload(BaseModel):
    model_config = {"extra": "allow"}
