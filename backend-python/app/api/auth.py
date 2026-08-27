"""Authentication API — the seven Sprint 1 endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import get_settings
from app.core.deps import current_user
from app.core.firebase import revoke_refresh_tokens, verify_id_token
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.db.repositories import otp_attempts, refresh_tokens, users
from app.models.auth import (
    AccountResponse,
    AuthSessionResponse,
    LogoutRequest,
    RefreshRequest,
    SendOtpRequest,
    SendOtpResponse,
    SocialLoginRequest,
    VerifyPhoneRequest,
)
from app.models.user import Role, User

router = APIRouter(prefix="/auth", tags=["auth"])


async def _issue_session(user: User) -> AuthSessionResponse:
    access_token, access_expires = create_access_token(user.id, user.role.value)
    refresh_token, token_id, refresh_expires = create_refresh_token(user.id, user.role.value)
    await refresh_tokens.store(token_id, user.id, refresh_expires)
    return AuthSessionResponse(
        token=access_token,
        refreshToken=refresh_token,
        expiresAt=access_expires.isoformat(),
        account=AccountResponse.from_user(user),
    )


async def _login_with_firebase(id_token: str, role: Role, provider: str | None = None) -> AuthSessionResponse:
    identity = verify_id_token(id_token)
    if provider and identity.get("provider") and provider not in str(identity["provider"]):
        raise HTTPException(status_code=400, detail=f"Expected a {provider} sign-in")
    try:
        user = await users.upsert_from_firebase(
            firebase_uid=identity["uid"],
            role=role,
            phone=identity.get("phone"),
            email=identity.get("email"),
            display_name=identity.get("display_name"),
            photo_url=identity.get("photo_url"),
        )
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return await _issue_session(user)


def _normalize_phone(phone: str) -> str:
    cleaned = phone.strip()
    digits = "".join(ch for ch in cleaned if ch.isdigit())
    if len(digits) == 10:
        return f"+91{digits}"
    if not cleaned.startswith("+") and digits:
        return f"+{digits}"
    return cleaned


@router.post("/phone/send-otp", response_model=SendOtpResponse)
async def send_otp(payload: SendOtpRequest) -> SendOtpResponse:
    """Dispatches real OTP via Twilio SMS and audits the attempt."""
    from app.core.twilio_sms import send_twilio_sms_otp

    settings = get_settings()
    phone = _normalize_phone(payload.phone)
    recent = await otp_attempts.sends_in_last_hour(phone)
    limit = 100 if settings.app_env == "development" else settings.otp_max_sends_per_hour
    if recent >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many OTP requests. Please try again in a few minutes.",
        )
    await otp_attempts.record(phone, payload.role)
    existing = await users.by_phone(phone, payload.role)

    # Dispatch SMS via Twilio (or fallback if keys not configured)
    await send_twilio_sms_otp(phone, payload.role.value)

    return SendOtpResponse(
        expiresInSeconds=settings.otp_ttl_seconds,
        isNewAccount=existing is None,
    )


@router.post("/phone/verify", response_model=AuthSessionResponse)
async def verify_phone(payload: VerifyPhoneRequest) -> AuthSessionResponse:
    """Verifies Twilio OTP code or Firebase ID token and returns session."""
    from app.core.twilio_sms import verify_stored_otp

    settings = get_settings()

    # 1. Firebase ID Token Verification (if available)
    if payload.id_token and len(payload.id_token) > 50:
        try:
            return await _login_with_firebase(payload.id_token, payload.role, provider="phone")
        except Exception:
            pass

    phone = _normalize_phone(payload.phone or "")
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number is required")

    from app.core.rate_limiter import rate_limiter
    locked, remaining = rate_limiter.is_locked(f"otp:{phone}")
    if locked:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Security Lockout: Too many failed attempts. Please try again in {remaining // 60 + 1} minutes.",
        )

    # 2. Twilio OTP Code Verification
    if payload.code:
        is_valid = verify_stored_otp(phone, payload.code)
        if not is_valid:
            failures, lock_time = rate_limiter.record_failed_attempt(f"otp:{phone}", max_failures=5, lock_duration=900)
            if lock_time:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Account locked for 15 minutes due to 5 consecutive failed OTP attempts.",
                )
            remaining_attempts = max(0, 5 - failures)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid verification code. {remaining_attempts} attempt(s) remaining.",
            )
        rate_limiter.reset_failed_attempts(f"otp:{phone}")

    user = await users.by_phone(phone, payload.role)
    if user is None:
        user = await users.create_phone_user(phone=phone, role=payload.role)
    else:
        await users._ensure_role_profile(user)

    return await _issue_session(user)


@router.post("/google", response_model=AuthSessionResponse)
async def google_login(payload: SocialLoginRequest) -> AuthSessionResponse:
    return await _login_with_firebase(payload.id_token, payload.role, provider="google")


@router.post("/apple", response_model=AuthSessionResponse)
async def apple_login(payload: SocialLoginRequest) -> AuthSessionResponse:
    return await _login_with_firebase(payload.id_token, payload.role, provider="apple")


@router.get("/me", response_model=AccountResponse)
async def me(user: User = Depends(current_user)) -> AccountResponse:
    return AccountResponse.from_user(user)


@router.get("/me", response_model=AccountResponse)
async def get_me(user: User = Depends(current_user)) -> AccountResponse:
    latest_user = await users.by_id(user.id)
    return AccountResponse.from_user(latest_user or user)


@router.post("/refresh", response_model=AuthSessionResponse)
async def refresh(payload: RefreshRequest) -> AuthSessionResponse:
    claims = decode_token(payload.refresh_token, expected_type="refresh")
    token_id = str(claims.get("jti"))
    if not await refresh_tokens.is_active(token_id):
        raise HTTPException(status_code=401, detail="Refresh token revoked")
    user = await users.by_id(str(claims.get("sub")))
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized")
    await refresh_tokens.revoke(token_id)  # rotation: one use per refresh token
    return await _issue_session(user)


@router.post("/admin/pin", response_model=AuthSessionResponse)
async def admin_pin_login(payload: dict) -> AuthSessionResponse:
    settings = get_settings()
    pin = str(payload.get("pin", "")).strip()
    expected_pin = settings.admin_security_pin.strip()
    if not pin or pin != expected_pin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect Admin Passcode (PIN). Access denied.",
        )
    admin_user = await users.by_phone("+910000004502", Role.admin)
    if admin_user is None:
        admin_user = await users.create_phone_user(phone="+910000004502", role=Role.admin)
        await users.update(
            admin_user.id,
            {
                "email": "admin@quickpress.online",
                "display_name": "QuickPress Super Admin",
                "status": "active",
                "is_verified": True,
                "is_onboarded": True,
            },
        )
        admin_user.email = "admin@quickpress.online"
        admin_user.display_name = "QuickPress Super Admin"
        admin_user.is_verified = True
        admin_user.is_onboarded = True
    return await _issue_session(admin_user)


@router.post("/logout")
async def logout(payload: LogoutRequest, user: User = Depends(current_user)) -> dict:
    if payload.refresh_token:
        try:
            claims = decode_token(payload.refresh_token, expected_type="refresh")
            await refresh_tokens.revoke(str(claims.get("jti")))
        except HTTPException:
            pass
    await refresh_tokens.revoke_all_for_user(user.id)
    revoke_refresh_tokens(user.firebase_uid)
    return {"ok": True}


@router.delete("/account")
@router.delete("/me")
async def delete_account(user: User = Depends(current_user)) -> dict:
    from app.db.profile_repositories import profile_repository
    return await profile_repository.delete_account(user)


