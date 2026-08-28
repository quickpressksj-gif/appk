"""Customer notification API — Sprint 2.7.

    GET    /api/notifications              paginated feed + search + type filter
    GET    /api/notifications/unread-count badge count for the header
    PUT    /api/notifications/{id}/read    mark one as read
    PUT    /api/notifications/read-all     mark every notification as read
    DELETE /api/notifications/{id}         remove one notification

Every route requires a bearer token and is scoped to `current_user`.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import current_user
from app.db.notification_repositories import notification_repository
from app.models.notification import (
    NotificationActionResponse,
    NotificationListResponse,
    UnreadCountResponse,
)
from app.models.user import User

router = APIRouter(tags=["notifications"])


@router.get("/notifications", response_model=NotificationListResponse)
async def list_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=50),
    search: str = Query("", max_length=120),
    type: str = Query("all", max_length=32),
    user: User = Depends(current_user),
) -> NotificationListResponse:
    return await notification_repository.list(
        user.id, page=page, limit=limit, search=search, type_filter=type
    )


@router.get("/notifications/unread-count", response_model=UnreadCountResponse)
async def unread_count(user: User = Depends(current_user)) -> UnreadCountResponse:
    return UnreadCountResponse(count=await notification_repository.unread_count(user.id))


# Declared before `/notifications/{id}/read` so the literal path always wins.
@router.put("/notifications/read-all", response_model=NotificationActionResponse)
@router.post("/notifications/read-all", response_model=NotificationActionResponse)
async def mark_all_read(user: User = Depends(current_user)) -> NotificationActionResponse:
    await notification_repository.mark_all_read(user.id)
    return NotificationActionResponse(ok=True, unread=0)


@router.put("/notifications/{notification_id}/read", response_model=NotificationActionResponse)
@router.post("/notifications/{notification_id}/read", response_model=NotificationActionResponse)
async def mark_read(
    notification_id: str, user: User = Depends(current_user)
) -> NotificationActionResponse:
    found = await notification_repository.mark_read(user.id, notification_id)
    if not found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return NotificationActionResponse(
        ok=True,
        id=notification_id,
        unread=await notification_repository.unread_count(user.id),
    )


@router.delete("/notifications/{notification_id}", response_model=NotificationActionResponse)
async def delete_notification(
    notification_id: str, user: User = Depends(current_user)
) -> NotificationActionResponse:
    removed = await notification_repository.delete(user.id, notification_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return NotificationActionResponse(
        ok=True,
        id=notification_id,
        unread=await notification_repository.unread_count(user.id),
    )


@router.post("/notifications/fcm-token")
async def save_fcm_token(
    payload: dict,
    user: User = Depends(current_user),
) -> dict:
    """Save user FCM push notification token."""
    token = str(payload.get("token") or payload.get("fcmToken") or "").strip()
    device = str(payload.get("device") or payload.get("deviceType") or "web").strip()
    if token:
        from app.core.fcm import register_fcm_token
        await register_fcm_token(user.id, token, device)
    return {"ok": True, "registered": bool(token)}

