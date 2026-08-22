"""Shared user model + role-specific profile documents (MongoDB collections)."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class Role(str, Enum):
    customer = "customer"
    partner = "partner"
    rider = "rider"
    admin = "admin"


class UserStatus(str, Enum):
    pending = "pending"
    active = "active"
    suspended = "suspended"
    blocked = "blocked"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(BaseModel):
    """`users` collection — one document per authenticated identity."""

    id: str
    firebase_uid: str = ""
    role: Role
    phone: Optional[str] = None
    email: Optional[str] = None
    display_name: Optional[str] = None
    photo_url: Optional[str] = None
    status: UserStatus = UserStatus.active
    city: Optional[str] = None
    address: Optional[str] = None
    is_onboarded: bool = False
    is_verified: bool = False
    linked_id: Optional[str] = None  # customers/partners/riders/admins document id
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    def to_document(self) -> Dict[str, Any]:
        doc = self.model_dump(mode="json")
        doc["_id"] = doc.pop("id")
        return doc

    @classmethod
    def from_document(cls, doc: Dict[str, Any]) -> "User":
        data = dict(doc)
        data["id"] = str(data.pop("_id"))
        return cls(**data)


class RoleProfile(BaseModel):
    """Base document stored in customers / partners / riders / admins."""

    id: str
    user_id: str
    firebase_uid: str
    status: UserStatus = UserStatus.active
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    def to_document(self) -> Dict[str, Any]:
        doc = self.model_dump(mode="json")
        doc["_id"] = doc.pop("id")
        return doc


ROLE_COLLECTIONS: Dict[Role, str] = {
    Role.customer: "customers",
    Role.partner: "partners",
    Role.rider: "riders",
    Role.admin: "admins",
}
