"""Thin Razorpay REST client — Phase 5 · Sprint 5.6.

Wraps the Razorpay Orders/Payments/Refunds API with httpx + HTTP basic auth
(`key_id` : `key_secret`). Errors surface as `HTTPException` in the same shape
the rest of the service uses (see `app/api/payments.py`'s `_fail` helper).

`verify_signature()` reproduces Razorpay's documented checkout signature:
    HMAC_SHA256(f"{order_id}|{payment_id}", key_secret)
compared with `hmac.compare_digest` to avoid timing attacks.
"""

from __future__ import annotations

import hashlib
import hmac
from typing import Any, Dict, Optional

import httpx
from fastapi import HTTPException, status

from app.config import get_settings

RAZORPAY_API_BASE = "https://api.razorpay.com/v1"


def _auth() -> tuple[str, str]:
    settings = get_settings()
    return settings.razorpay_key_id, settings.razorpay_key_secret


def _fail(exc: httpx.HTTPStatusError) -> HTTPException:
    try:
        detail = exc.response.json().get("error", {}).get("description", exc.response.text)
    except Exception:  # pragma: no cover - defensive, gateway returned non-JSON
        detail = exc.response.text
    return HTTPException(status_code=exc.response.status_code, detail=f"Razorpay error: {detail}")


async def _request(method: str, path: str, *, json: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    key_id, key_secret = _auth()
    if not key_id or not key_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Razorpay is not configured on this server.",
        )
    async with httpx.AsyncClient(base_url=RAZORPAY_API_BASE, timeout=15.0) as client:
        try:
            response = await client.request(method, path, json=json, auth=(key_id, key_secret))
            response.raise_for_status()
            return response.json() if response.content else {}
        except httpx.HTTPStatusError as exc:
            raise _fail(exc) from exc
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Could not reach Razorpay: {exc}",
            ) from exc


async def create_order(amount_in_paise: int, currency: str, receipt: str, notes: Dict[str, str]) -> Dict[str, Any]:
    """POST /orders — amount is always in the smallest currency unit (paise)."""
    return await _request(
        "POST",
        "/orders",
        json={
            "amount": amount_in_paise,
            "currency": currency,
            "receipt": receipt,
            "notes": notes,
            "payment_capture": 1,
        },
    )


async def fetch_payment(payment_id: str) -> Dict[str, Any]:
    """GET /payments/{id}."""
    return await _request("GET", f"/payments/{payment_id}")


async def capture_payment(payment_id: str, amount_in_paise: int, currency: str) -> Dict[str, Any]:
    """POST /payments/{id}/capture — used when auto-capture is disabled."""
    return await _request(
        "POST",
        f"/payments/{payment_id}/capture",
        json={"amount": amount_in_paise, "currency": currency},
    )


async def create_refund(payment_id: str, amount_in_paise: Optional[int] = None) -> Dict[str, Any]:
    """POST /payments/{id}/refund. Omit amount for a full refund."""
    body: Dict[str, Any] = {}
    if amount_in_paise is not None:
        body["amount"] = amount_in_paise
    return await _request("POST", f"/payments/{payment_id}/refund", json=body)


def verify_signature(order_id: str, payment_id: str, signature: str, key_secret: Optional[str] = None) -> bool:
    """Checkout signature verification per Razorpay's documented scheme."""
    secret = key_secret if key_secret is not None else get_settings().razorpay_key_secret
    if not secret or not signature:
        return False
    message = f"{order_id}|{payment_id}".encode()
    expected = hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def verify_webhook_signature(raw_body: bytes, signature: str, webhook_secret: Optional[str] = None) -> bool:
    """Verifies `X-Razorpay-Signature` over the raw webhook body."""
    secret = webhook_secret if webhook_secret is not None else get_settings().razorpay_webhook_secret
    if not secret or not signature:
        return False
    expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
