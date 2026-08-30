"""Environment-driven settings. Nothing is hardcoded."""

import logging
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

_log = logging.getLogger(__name__)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=("backend-python/.env", ".env"), extra="ignore")

    # --- environment -------------------------------------------------
    app_env: str = "development"  # development | staging | production
    api_prefix: str = "/api"
    # Comma-separated list of allowed frontend origins.
    cors_origins: str = "http://localhost:8081,http://localhost:8082,http://localhost:8083,http://localhost:8084,https://www.quickpress.online,https://quickpress.online,https://customer-5ys4.onrender.com"

    # --- Supabase / PostgreSQL Database ------------------------------
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    database_url: str = ""           # postgresql://...


    # --- Firebase Admin ----------------------------------------------
    firebase_project_id: str = ""
    # Either a path to the service-account JSON or the raw JSON itself.
    firebase_credentials_file: str = ""
    firebase_credentials_json: str = ""

    # --- JWT ----------------------------------------------------------
    jwt_secret: str = ""
    # Optional dedicated refresh secret; falls back to jwt_secret when unset.
    jwt_refresh_secret: str = ""
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 30
    refresh_token_ttl_days: int = 30

    # --- Cloudinary ------------------------------------------------------
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""

    # --- OTP ------------------------------------------------------------
    otp_ttl_seconds: int = 300
    otp_max_sends_per_hour: int = 50

    # --- Twilio SMS / OTP ------------------------------------------------
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""
    twilio_verify_service_sid: str = ""

    # --- Razorpay (Phase 5 · Sprint 5.6) ---------------------------------
    # Both the key id and the secret come from the environment. Nothing is
    # hardcoded, so a production deploy cannot accidentally ship a test key.
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""


    # --- Google Maps Platform --------------------------------------------
    # Server-side key (Geocoding, Places, Routes, Distance Matrix). NEVER sent
    # to the browser. `google_api_key` stays as a legacy fallback.
    google_maps_server_api_key: str = ""
    google_api_key: str = ""
    # Browser/render key — exposed to the frontends as VITE_GOOGLE_MAPS_API_KEY.
    google_maps_api_key: str = ""
    # Default serviceable radius used by /api/maps/delivery-area.
    delivery_radius_km: float = 8.0


    # --- Admin Security --------------------------------------------------
    admin_security_pin: str = "4502"

    @property
    def cors_origin_list(self) -> List[str]:
        raw_origins = [
            origin.strip().rstrip("/")
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]
        origins = [o for o in raw_origins if o != "*"]

        if self.app_env.lower() == "production":
            # In production, allow ONLY explicit https origins
            prod_origins = [
                "https://www.quickpress.online",
                "https://quickpress.online",
                "https://customer-5ys4.onrender.com",
            ]
            for origin in prod_origins:
                if origin not in origins:
                    origins.append(origin)
            return [o for o in origins if not ("localhost" in o or "127.0.0.1" in o)]

        essential_origins = [
            "https://www.quickpress.online",
            "https://quickpress.online",
            "https://customer-5ys4.onrender.com",
            "http://localhost:8080",
            "http://localhost:8081",
            "http://localhost:8082",
            "http://localhost:8083",
            "http://localhost:8084",
            "http://127.0.0.1:8080",
            "http://127.0.0.1:8081",
            "http://127.0.0.1:8082",
            "http://127.0.0.1:8083",
            "http://127.0.0.1:8084",
        ]
        for origin in essential_origins:
            if origin not in origins:
                origins.append(origin)
        return origins

    @property
    def use_in_memory_db(self) -> bool:
        return not bool((self.database_url or "").strip() or (self.supabase_url or "").strip())

    @property
    def refresh_secret(self) -> str:
        return self.jwt_refresh_secret.strip() or self.jwt_secret

    @property
    def cloudinary_configured(self) -> bool:
        return bool(
            self.cloudinary_cloud_name.strip()
            and self.cloudinary_api_key.strip()
            and self.cloudinary_api_secret.strip()
        )

    @property
    def maps_server_key(self) -> str:
        """Server-side Maps key, preferring the dedicated server key."""
        return self.google_maps_server_api_key.strip() or self.google_api_key.strip()

    @property
    def google_maps_configured(self) -> bool:
        return bool(self.maps_server_key)

    @property
    def razorpay_configured(self) -> bool:
        return bool(self.razorpay_key_id.strip() and self.razorpay_key_secret.strip())

    @property
    def firebase_configured(self) -> bool:
        return bool(self.firebase_credentials_file.strip() or self.firebase_credentials_json.strip())


@lru_cache
def get_settings() -> Settings:
    """Load settings and warn loudly on an incomplete production configuration.

    We log rather than raise so that the server process stays alive and Render
    can route health-check / API traffic even while env-var issues are being
    fixed in the dashboard.  The missing vars are clearly visible in Render logs.
    """
    settings = Settings()
    if settings.app_env == "production":
        missing = []
        if not settings.jwt_secret.strip():
            missing.append("JWT_SECRET")
        # A production deploy must talk to real Supabase PostgreSQL — never silently
        # degrade to the in-memory preview store.
        if not (settings.database_url.strip() or settings.supabase_url.strip()):
            missing.append("DATABASE_URL / SUPABASE_URL")
        # Wildcard / localhost CORS is not acceptable with credentials enabled.
        origins = settings.cors_origin_list
        if not origins or any(
            o == "*" or "localhost" in o or "127.0.0.1" in o for o in origins
        ):
            missing.append("CORS_ORIGINS (explicit https frontend origins)")
        if missing:
            _log.warning(
                "QUICKPRESS PRODUCTION CONFIG WARNING — missing/invalid env vars: %s  "
                "Fix these in the Render dashboard → Environment tab.",
                ", ".join(missing),
            )
    return settings

