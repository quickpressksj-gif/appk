"""Shared FastAPI dependencies — bearer auth and role guards."""

from __future__ import annotations

from typing import Callable, Iterable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import decode_token
from app.db.repositories import users
from app.models.user import Role, User, UserStatus

bearer_scheme = HTTPBearer(auto_error=False)


async def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> User:
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    payload = decode_token(credentials.credentials, expected_type="access")
    user = await users.by_id(str(payload.get("sub")))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    if user.status in (UserStatus.suspended, UserStatus.blocked):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account suspended")
    return user


def require_roles(*allowed: Role) -> Callable[[User], User]:
    allowed_set: Iterable[Role] = allowed

    def guard(user: User = Depends(current_user)) -> User:
        if user.role not in allowed_set:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return user

    return guard
