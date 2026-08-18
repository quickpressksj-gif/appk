"""Customer profile + settings repositories — Sprint 2.6.

Collections
-----------
`users`               the authenticated identity (name, phone, email, city,
                      photo_url, created_at) — already created at sign-up.
`customers`           the customer role profile document.
`customer_settings`   one document per customer: theme, language,
                      notification preferences and privacy preferences.

    {_id: <userId>, theme, language, notifications: {...}, privacy: {...},
     updatedAt}
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from app.db.client import database
from app.db.repositories import users
from app.models.profile import (
    ProfileResponse,
    ProfileUpdatePayload,
    SettingsResponse,
    SettingsUpdatePayload,
)
from app.models.user import User, utcnow

SETTINGS_COLLECTION = "customer_settings"


def initials_for(name: str) -> str:
    parts = [part for part in str(name or "").split() if part]
    if not parts:
        return "QP"
    first = parts[0][0]
    last = parts[-1][0] if len(parts) > 1 else ""
    return (first + last).upper()


def _member_since(value: Any) -> str:
    if isinstance(value, datetime):
        return value.strftime("%B %Y")
    if isinstance(value, str) and value:
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).strftime("%B %Y")
        except ValueError:
            return ""
    return ""


def to_profile(user: User, unread: int = 0) -> ProfileResponse:
    name = user.display_name or "Customer"
    return ProfileResponse(
        id=user.id,
        name=name,
        initials=initials_for(name),
        avatarInitials=initials_for(name),
        avatarUrl=user.photo_url,
        photoUrl=user.photo_url,
        phone=user.phone or "",
        email=user.email or "",
        city=user.city or "",
        memberSince=_member_since(user.created_at),
        isVerified=user.is_verified,
        isOnboarded=user.is_onboarded,
        role=user.role.value,
        unreadNotifications=unread,
    )


class ProfileRepository:
    async def get(self, user: User) -> ProfileResponse:
        return to_profile(user)

    async def update(self, user: User, payload: ProfileUpdatePayload) -> ProfileResponse:
        changes: Dict[str, Any] = {}
        if payload.name is not None:
            changes["display_name"] = payload.name
        if payload.email is not None:
            changes["email"] = payload.email
        if payload.city is not None:
            changes["city"] = payload.city
        if changes:
            await users.update(user.id, changes)
        refreshed = await users.by_id(user.id)
        return to_profile(refreshed or user)

    async def set_photo(self, user: User, photo: str) -> ProfileResponse:
        # Cloudinary owns the bytes; MongoDB stores only the secure URL.
        from app.core.cloudinary import upload_image

        url = await upload_image(photo, kind="customer_photo", public_id=user.id)
        await users.update(user.id, {"photo_url": url})
        refreshed = await users.by_id(user.id)
        return to_profile(refreshed or user)


class SettingsRepository:
    @property
    def _c(self):
        return database.collection(SETTINGS_COLLECTION)

    async def get(self, user_id: str) -> SettingsResponse:
        document: Optional[Dict[str, Any]] = await self._c.find_one({"_id": user_id})
        if not document:
            return SettingsResponse()
        data = {k: v for k, v in document.items() if k != "_id"}
        return SettingsResponse(**data)

    async def update(self, user_id: str, payload: SettingsUpdatePayload) -> SettingsResponse:
        current = await self.get(user_id)
        patch = payload.model_dump(exclude_unset=True, exclude_none=True)
        merged = {**current.model_dump(), **patch, "updatedAt": utcnow().isoformat()}
        await self._c.update_one({"_id": user_id}, {"$set": merged}, upsert=True)
        return SettingsResponse(**merged)


profile_repository = ProfileRepository()
settings_repository = SettingsRepository()
