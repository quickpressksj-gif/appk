"""Repositories — the only place that knows about collection shapes."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from app.db.client import database
from app.models.user import ROLE_COLLECTIONS, Role, RoleProfile, User, UserStatus, utcnow


class UserRepository:
    collection_name = "users"

    @property
    def _c(self):
        return database.collection(self.collection_name)

    async def by_firebase_uid(self, firebase_uid: str) -> Optional[User]:
        doc = await self._c.find_one({"firebase_uid": firebase_uid})
        return User.from_document(doc) if doc else None

    async def by_id(self, user_id: str) -> Optional[User]:
        doc = await self._c.find_one({"_id": user_id})
        return User.from_document(doc) if doc else None

    async def by_phone(self, phone: str, role: Role) -> Optional[User]:
        doc = await self._c.find_one({"phone": phone, "role": role.value})
        return User.from_document(doc) if doc else None

    async def create(self, user: User) -> User:
        await self._c.insert_one(user.to_document())
        await self._ensure_role_profile(user)
        return user

    async def update(self, user_id: str, changes: Dict[str, Any]) -> None:
        changes = {**changes, "updated_at": utcnow().isoformat()}
        await self._c.update_one({"_id": user_id}, {"$set": changes})

    async def _ensure_role_profile(self, user: User) -> None:
        """Every authenticated user gets exactly one role profile document."""
        name = ROLE_COLLECTIONS[user.role]
        existing = await database.collection(name).find_one({"user_id": user.id})
        if existing:
            return
        profile = RoleProfile(
            id=str(uuid.uuid4()),
            user_id=user.id,
            firebase_uid=user.firebase_uid,
            status=user.status,
        )
        await database.collection(name).insert_one(profile.to_document())
        await self.update(user.id, {"linked_id": profile.id})
        user.linked_id = profile.id

    async def upsert_from_firebase(
        self,
        *,
        firebase_uid: str,
        role: Role,
        phone: Optional[str],
        email: Optional[str],
        display_name: Optional[str],
        photo_url: Optional[str],
    ) -> User:
        existing = await self.by_firebase_uid(firebase_uid)
        if existing:
            if existing.role != role:
                # Every authenticated user has exactly one role.
                raise PermissionError(
                    f"This account is registered as a {existing.role.value}, not a {role.value}."
                )
            changes: Dict[str, Any] = {"is_verified": True}
            if phone and phone != existing.phone:
                changes["phone"] = phone
            if email and email != existing.email:
                changes["email"] = email
            if display_name and display_name != existing.display_name:
                changes["display_name"] = display_name
            if photo_url and photo_url != existing.photo_url:
                changes["photo_url"] = photo_url
            await self.update(existing.id, changes)
            await self._ensure_role_profile(existing)
            refreshed = await self.by_id(existing.id)
            return refreshed or existing

        user = User(
            id=str(uuid.uuid4()),
            firebase_uid=firebase_uid,
            role=role,
            phone=phone,
            email=email,
            display_name=display_name,
            photo_url=photo_url,
            status=UserStatus.active,
            is_verified=True,
            is_onboarded=role in (Role.customer, Role.admin),
        )
        return await self.create(user)


class RefreshTokenRepository:
    collection_name = "refresh_tokens"

    @property
    def _c(self):
        return database.collection(self.collection_name)

    async def store(self, token_id: str, user_id: str, expires_at: datetime) -> None:
        await self._c.insert_one(
            {
                "_id": token_id,
                "token_id": token_id,
                "user_id": user_id,
                "expires_at": expires_at.isoformat(),
                "created_at": utcnow().isoformat(),
                "revoked": False,
            }
        )

    async def is_active(self, token_id: str) -> bool:
        doc = await self._c.find_one({"token_id": token_id})
        return bool(doc) and not doc.get("revoked", False)

    async def revoke(self, token_id: str) -> None:
        await self._c.update_one({"token_id": token_id}, {"$set": {"revoked": True}})

    async def revoke_all_for_user(self, user_id: str) -> None:
        await self._c.update_one({"user_id": user_id}, {"$set": {"revoked": True}})


class OtpAttemptRepository:
    """Server-side audit + rate limit. Firebase performs the actual SMS delivery."""

    collection_name = "otp_attempts"

    @property
    def _c(self):
        return database.collection(self.collection_name)

    async def record(self, phone: str, role: Role) -> None:
        await self._c.insert_one(
            {
                "_id": str(uuid.uuid4()),
                "phone": phone,
                "role": role.value,
                "created_at": utcnow().isoformat(),
            }
        )

    async def sends_in_last_hour(self, phone: str) -> int:
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        return await self._c.count_documents({"phone": phone, "created_at": {"$gt": cutoff}})


users = UserRepository()
refresh_tokens = RefreshTokenRepository()
otp_attempts = OtpAttemptRepository()
