"""Firebase Admin — verifies the ID tokens minted by the mobile/web clients."""

from __future__ import annotations

import json
from functools import lru_cache
from typing import Any, Dict, Optional

from fastapi import HTTPException, status

from app.config import get_settings


@lru_cache
def _firebase_app() -> Optional[Any]:
    settings = get_settings()
    if not (settings.firebase_credentials_file or settings.firebase_credentials_json):
        return None
    import firebase_admin
    from firebase_admin import credentials

    if firebase_admin._apps:  # noqa: SLF001 - documented singleton registry
        return firebase_admin.get_app()

    if settings.firebase_credentials_json:
        cred = credentials.Certificate(json.loads(settings.firebase_credentials_json))
    else:
        cred = credentials.Certificate(settings.firebase_credentials_file)
    return firebase_admin.initialize_app(
        cred, {"projectId": settings.firebase_project_id} if settings.firebase_project_id else None
    )


class FirebaseIdentity(Dict[str, Any]):
    @property
    def uid(self) -> str:
        return str(self["uid"])


def verify_id_token(id_token: str) -> Dict[str, Any]:
    """Return the decoded Firebase claims, or 401 for any invalid token."""
    app = _firebase_app()
    if app is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase Admin credentials are not configured on this server",
        )
    from firebase_admin import auth as firebase_auth

    try:
        claims = firebase_auth.verify_id_token(id_token, check_revoked=True)
    except firebase_auth.ExpiredIdTokenError as exc:
        raise HTTPException(status_code=401, detail="Firebase token expired") from exc
    except firebase_auth.RevokedIdTokenError as exc:
        raise HTTPException(status_code=401, detail="Firebase token revoked") from exc
    except Exception as exc:  # invalid signature / malformed / wrong project
        raise HTTPException(status_code=401, detail="Invalid Firebase token") from exc

    return {
        "uid": claims.get("uid") or claims.get("user_id"),
        "phone": claims.get("phone_number"),
        "email": claims.get("email"),
        "display_name": claims.get("name"),
        "photo_url": claims.get("picture"),
        "provider": (claims.get("firebase") or {}).get("sign_in_provider"),
    }


def revoke_refresh_tokens(firebase_uid: str) -> None:
    if _firebase_app() is None:
        return
    from firebase_admin import auth as firebase_auth

    try:
        firebase_auth.revoke_refresh_tokens(firebase_uid)
    except Exception:  # logout must never fail the request
        pass
