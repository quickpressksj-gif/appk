"""Health-check and meta endpoints — production-safe, no secrets exposed."""

from __future__ import annotations

from fastapi import APIRouter

from app.db.client import database

router = APIRouter(tags=["health"])

# ---------------------------------------------------------------------------
# GET /health  (also mounted at /api/health via api_prefix in main.py)
# ---------------------------------------------------------------------------

@router.get("/health", summary="Health check")
async def health() -> dict:
    """
    Returns a lightweight health status.

    - ``status``: always ``"ok"`` if the process is alive.
    - ``database``: ``"mongodb-atlas"`` | ``"in-memory"`` — no URI exposed.
    - ``firebase``: whether Firebase Admin credentials are configured.
    """
    from app.config import get_settings  # noqa: PLC0415 — lazy to avoid startup crash
    from app.core.firebase import _firebase_app  # noqa: PLC0415

    try:
        settings = get_settings()
        db_status = "in-memory" if database.in_memory else "mongodb-atlas"
        env = settings.app_env
        firebase_ok = _firebase_app() is not None
    except Exception:  # pragma: no cover — defensive; must never kill the route
        db_status = "unknown"
        env = "unknown"
        firebase_ok = False

    return {
        "status": "ok",
        "service": "quickpress-backend",
        "env": env,
        "database": db_status,
        "firebase": firebase_ok,
    }


# ---------------------------------------------------------------------------
# GET /countries  (mounted at /api/countries)
# India is the only supported market for Phase 1. The list is static data —
# no database query, no auth required, fast and cacheable.
# ---------------------------------------------------------------------------

_COUNTRIES = [
    {
        "code": "IN",
        "name": "India",
        "dialCode": "+91",
        "flag": "🇮🇳",
        "phoneLengths": [10],
    }
]


@router.get("/countries", summary="Supported countries / dial codes")
async def list_countries() -> list:
    """
    Returns the list of countries supported by QuickPress.

    Used by the login screen to populate the country-code picker.
    No authentication required.
    """
    return _COUNTRIES
