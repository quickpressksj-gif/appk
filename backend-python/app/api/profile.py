"""Customer profile, photo and settings API — Sprint 2.6.

    GET  /api/profile          the signed-in customer's profile
    PUT  /api/profile          edit name / email / city (phone is immutable)
    POST /api/profile/photo    change the profile photo
    GET  /api/me/settings         theme, language, notifications, privacy
    PUT  /api/me/settings         persist any subset of the above

Every route requires a bearer token and is scoped to `current_user`.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ValidationError

from app.core.deps import current_user
from app.db.profile_repositories import profile_repository, settings_repository
from app.models.profile import (
    ProfilePhotoPayload,
    ProfileResponse,
    ProfileUpdatePayload,
    SettingsResponse,
    SettingsUpdatePayload,
)
from app.models.user import User

router = APIRouter(tags=["profile"])


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(user: User = Depends(current_user)) -> ProfileResponse:
    return await profile_repository.get(user)


@router.put("/profile", response_model=ProfileResponse)
@router.patch("/profile", response_model=ProfileResponse)
async def update_profile(
    payload: ProfileUpdatePayload, user: User = Depends(current_user)
) -> ProfileResponse:
    try:
        return await profile_repository.update(user, payload)
    except (ValueError, ValidationError) as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)
        )


@router.post("/profile/photo", response_model=ProfileResponse)
async def update_profile_photo(
    payload: ProfilePhotoPayload, user: User = Depends(current_user)
) -> ProfileResponse:
    return await profile_repository.set_photo(user, payload.photo)


@router.get("/me/settings", response_model=SettingsResponse)
async def get_settings(user: User = Depends(current_user)) -> SettingsResponse:
    return await settings_repository.get(user.id)


@router.put("/me/settings", response_model=SettingsResponse)
@router.patch("/me/settings", response_model=SettingsResponse)
async def update_settings(
    payload: SettingsUpdatePayload, user: User = Depends(current_user)
) -> SettingsResponse:
    return await settings_repository.update(user.id, payload)


@router.delete("/profile")
async def delete_profile(user: User = Depends(current_user)) -> dict:
    """Permanently delete customer account and associated personal data."""
    return await profile_repository.delete_account(user)

