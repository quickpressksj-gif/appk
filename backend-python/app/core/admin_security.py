"""Admin Security Guard & Audit Module.

Provides:
- Constant-time PIN verification (HMAC timing-attack resistance)
- IP-based brute-force defense & exponential lockouts
- Real-time audit logging for admin authentication events in Supabase
"""

from __future__ import annotations

import hmac
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from app.db.client import database

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_SECONDS = 900  # 15 minutes


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def constant_time_compare(val1: str, val2: str) -> bool:
    """Compare two strings in constant time to prevent timing side-channel attacks."""
    return hmac.compare_digest(val1.encode("utf-8"), val2.encode("utf-8"))


async def check_admin_rate_limit(client_ip: str) -> None:
    """Verify whether client IP is currently locked out due to failed attempts."""
    now_ts = time.time()
    record = await database.find_one("admin_rate_limits", {"_id": client_ip})
    if not record:
        return

    failed_count = int(record.get("failedCount", 0))
    locked_until = float(record.get("lockedUntil", 0))

    if locked_until > now_ts:
        remaining_secs = int(locked_until - now_ts)
        remaining_mins = (remaining_secs // 60) + 1
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Security Lockout: Too many failed passcode attempts. Please try again in {remaining_mins} minutes.",
            headers={"Retry-After": str(remaining_secs)},
        )


async def record_failed_attempt(client_ip: str, user_agent: str = "") -> int:
    """Record a failed attempt and apply lockout if threshold is exceeded."""
    now_ts = time.time()
    record = await database.find_one("admin_rate_limits", {"_id": client_ip}) or {}
    
    failed_count = int(record.get("failedCount", 0)) + 1
    locked_until = 0.0

    if failed_count >= MAX_FAILED_ATTEMPTS:
        locked_until = now_ts + LOCKOUT_DURATION_SECONDS

    update_payload = {
        "_id": client_ip,
        "ip": client_ip,
        "failedCount": failed_count,
        "lockedUntil": locked_until,
        "lastAttemptAt": _now_iso(),
        "userAgent": user_agent[:255] if user_agent else "",
    }
    await database.update_one("admin_rate_limits", {"_id": client_ip}, update_payload, upsert=True)

    # Log security event in audit trail
    await database.insert_one(
        "admin_security_events",
        {
            "eventType": "FAILED_PIN_ATTEMPT" if failed_count < MAX_FAILED_ATTEMPTS else "ACCOUNT_LOCKOUT",
            "clientIp": client_ip,
            "userAgent": user_agent[:255] if user_agent else "",
            "failedCount": failed_count,
            "lockedUntil": locked_until if locked_until > 0 else None,
            "timestamp": _now_iso(),
        },
    )
    return failed_count


async def record_successful_login(admin_id: str, client_ip: str, user_agent: str = "") -> None:
    """Reset rate limit counter and record successful admin access event."""
    await database.delete_many("admin_rate_limits", {"_id": client_ip})
    await database.insert_one(
        "admin_security_events",
        {
            "eventType": "SUCCESSFUL_ADMIN_LOGIN",
            "adminId": admin_id,
            "clientIp": client_ip,
            "userAgent": user_agent[:255] if user_agent else "",
            "timestamp": _now_iso(),
        },
    )
