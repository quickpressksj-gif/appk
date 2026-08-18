"""Customer profile + settings models — Sprint 2.6.

Mirrors the frontend contracts in `backend/src/customer/profile-api.ts` and
`backend/src/customer/settings-api.ts`, so the Profile, Address and Theme
screens render identically from the mock router and from FastAPI.

    GET  /api/profile
    PUT  /api/profile
    POST /api/profile/photo
    GET  /api/me/settings
    PUT  /api/me/settings
"""

from __future__ import annotations

import re
from typing import Literal, Optional

from pydantic import BaseModel, field_validator

Theme = Literal["light", "dark", "system"]

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$")


class ProfileResponse(BaseModel):
    """GET /api/profile — everything the Profile header renders."""

    id: str
    name: str
    initials: str
    avatarInitials: str
    avatarUrl: Optional[str] = None
    photoUrl: Optional[str] = None
    phone: str = ""
    email: str = ""
    city: str = ""
    memberSince: str = ""
    isVerified: bool = False
    isOnboarded: bool = True
    role: str = "customer"
    unreadNotifications: int = 0


class ProfileUpdatePayload(BaseModel):
    """PUT /api/profile — only editable fields; phone stays immutable."""

    name: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None

    @field_validator("name")
    @classmethod
    def _name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        cleaned = value.strip()
        if len(cleaned) < 2 or len(cleaned) > 60:
            raise ValueError("Name must be between 2 and 60 characters")
        return cleaned

    @field_validator("email")
    @classmethod
    def _email(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        cleaned = value.strip()
        if cleaned and not EMAIL_RE.match(cleaned):
            raise ValueError("Enter a valid email address")
        return cleaned

    @field_validator("city")
    @classmethod
    def _city(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        cleaned = value.strip()
        if len(cleaned) > 60:
            raise ValueError("City must be 60 characters or less")
        return cleaned


class ProfilePhotoPayload(BaseModel):
    """POST /api/profile/photo — a hosted URL or a small base64 data URL."""

    photo: str

    @field_validator("photo")
    @classmethod
    def _photo(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("A photo is required")
        if cleaned.startswith("data:image/"):
            if len(cleaned) > 5 * 1024 * 1024 * 4 // 3:
                raise ValueError("Photo must be 5 MB or smaller")
            return cleaned
        if cleaned.startswith("http://") or cleaned.startswith("https://"):
            return cleaned
        raise ValueError("Photo must be a JPG or PNG image")


class NotificationPreferences(BaseModel):
    orderUpdates: bool = True
    deliveryAlerts: bool = True
    promotions: bool = True
    email: bool = True
    sms: bool = False
    push: bool = True


class PrivacyPreferences(BaseModel):
    """Prepared only — stored and returned, not enforced yet."""

    personalizedOffers: bool = True
    shareUsageData: bool = False
    profileVisible: bool = True


class SettingsResponse(BaseModel):
    theme: Theme = "system"
    language: str = "en-IN"
    notifications: NotificationPreferences = NotificationPreferences()
    privacy: PrivacyPreferences = PrivacyPreferences()
    updatedAt: Optional[str] = None


class SettingsUpdatePayload(BaseModel):
    theme: Optional[Theme] = None
    language: Optional[str] = None
    notifications: Optional[NotificationPreferences] = None
    privacy: Optional[PrivacyPreferences] = None
