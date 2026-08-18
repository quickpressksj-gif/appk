"""Media upload API — Cloudinary.

    POST /api/uploads/customer/photo    customer profile photo
    POST /api/uploads/partner/logo      partner shop logo
    POST /api/uploads/partner/banner    partner shop banner
    POST /api/uploads/rider/photo       rider profile photo

Every route requires a bearer token, uploads through Cloudinary and stores
only the returned `secure_url` in MongoDB (`users` + the role collection).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.cloudinary import upload_image
from app.core.deps import current_user, require_roles
from app.db.client import database
from app.db.repositories import users
from app.models.media import ImageUploadPayload, MediaResponse
from app.models.user import ROLE_COLLECTIONS, Role, User, utcnow

router = APIRouter(prefix="/uploads", tags=["uploads"])


async def _store_on_role_profile(user: User, field: str, url: str) -> None:
    collection = database.collection(ROLE_COLLECTIONS[user.role])
    await collection.update_one(
        {"user_id": user.id},
        {"$set": {field: url, "updated_at": utcnow().isoformat()}},
        upsert=True,
    )


async def _upload_avatar(user: User, payload: ImageUploadPayload, kind: str) -> MediaResponse:
    url = await upload_image(payload.image, kind=kind, public_id=user.id)
    await users.update(user.id, {"photo_url": url})
    await _store_on_role_profile(user, "photo_url", url)
    return MediaResponse(url=url, field="photoUrl")


@router.post("/customer/photo", response_model=MediaResponse)
async def upload_customer_photo(
    payload: ImageUploadPayload, user: User = Depends(require_roles(Role.customer))
) -> MediaResponse:
    return await _upload_avatar(user, payload, "customer_photo")


@router.post("/rider/photo", response_model=MediaResponse)
async def upload_rider_photo(
    payload: ImageUploadPayload, user: User = Depends(require_roles(Role.rider))
) -> MediaResponse:
    return await _upload_avatar(user, payload, "rider_photo")


@router.post("/partner/logo", response_model=MediaResponse)
async def upload_partner_logo(
    payload: ImageUploadPayload, user: User = Depends(require_roles(Role.partner))
) -> MediaResponse:
    url = await upload_image(payload.image, kind="partner_logo", public_id=f"{user.id}-logo")
    await _store_on_role_profile(user, "logo_url", url)
    await users.update(user.id, {"photo_url": url})
    return MediaResponse(url=url, field="logoUrl")


@router.post("/partner/banner", response_model=MediaResponse)
async def upload_partner_banner(
    payload: ImageUploadPayload, user: User = Depends(require_roles(Role.partner))
) -> MediaResponse:
    url = await upload_image(payload.image, kind="partner_banner", public_id=f"{user.id}-banner")
    await _store_on_role_profile(user, "banner_url", url)
    return MediaResponse(url=url, field="bannerUrl")


@router.get("/health")
async def uploads_health(user: User = Depends(current_user)) -> dict:
    from app.core.cloudinary import is_cloudinary_configured

    return {"cloudinary": is_cloudinary_configured(), "role": user.role.value}


# --- Deletion (replace = re-upload, which overwrites the same public_id) -----


async def _remove(user: User, *, kind: str, public_id: str, field: str, db_field: str) -> MediaResponse:
    from app.core.cloudinary import delete_image

    await delete_image(kind=kind, public_id=public_id)
    if db_field == "photo_url":
        await users.update(user.id, {"photo_url": ""})
    await _store_on_role_profile(user, db_field, "")
    return MediaResponse(url="", field=field)


@router.delete("/customer/photo", response_model=MediaResponse)
async def delete_customer_photo(user: User = Depends(require_roles(Role.customer))) -> MediaResponse:
    return await _remove(user, kind="customer_photo", public_id=user.id, field="photoUrl", db_field="photo_url")


@router.delete("/rider/photo", response_model=MediaResponse)
async def delete_rider_photo(user: User = Depends(require_roles(Role.rider))) -> MediaResponse:
    return await _remove(user, kind="rider_photo", public_id=user.id, field="photoUrl", db_field="photo_url")


@router.delete("/partner/logo", response_model=MediaResponse)
async def delete_partner_logo(user: User = Depends(require_roles(Role.partner))) -> MediaResponse:
    return await _remove(user, kind="partner_logo", public_id=f"{user.id}-logo", field="logoUrl", db_field="logo_url")


@router.delete("/partner/banner", response_model=MediaResponse)
async def delete_partner_banner(user: User = Depends(require_roles(Role.partner))) -> MediaResponse:
    return await _remove(user, kind="partner_banner", public_id=f"{user.id}-banner", field="bannerUrl", db_field="banner_url")
