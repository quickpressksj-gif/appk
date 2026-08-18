"""Razorpay gateway routes — Phase 5 · Sprint 5.6."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import current_user
from app.db import payment_repositories as repo
from app.models.payment import (
    CreateOrderPayload,
    GatewayPayment,
    PaymentFailurePayload,
    PaymentVerificationResult,
    RazorpayConfig,
    RazorpayOrderResult,
    RazorpaySuccessPayload,
    RefundRequestPayload,
    SimulateCheckoutPayload,
)
from app.models.user import User

router = APIRouter(tags=["razorpay-payments"])


def _fail(error: repo.PaymentError) -> HTTPException:
    return HTTPException(status_code=error.status_code, detail=error.message)


@router.get("/payments/razorpay/config", response_model=RazorpayConfig)
async def razorpay_config() -> RazorpayConfig:
    return RazorpayConfig(**repo.config())


@router.post("/payments/razorpay/order", response_model=RazorpayOrderResult)
async def create_order(payload: CreateOrderPayload, user: User = Depends(current_user)) -> RazorpayOrderResult:
    try:
        result = await repo.create_order(user, payload.model_dump())
    except repo.PaymentError as error:
        raise _fail(error) from error
    return RazorpayOrderResult(**result)


@router.post("/payments/razorpay/verify", response_model=PaymentVerificationResult)
async def verify_payment(payload: RazorpaySuccessPayload, user: User = Depends(current_user)) -> PaymentVerificationResult:
    try:
        result = await repo.verify_payment(user, payload.model_dump())
    except repo.PaymentError as error:
        raise _fail(error) from error
    return PaymentVerificationResult(**result)


@router.post("/payments/razorpay/failure")
async def record_failure(payload: PaymentFailurePayload, user: User = Depends(current_user)) -> dict:
    try:
        return await repo.record_failure(user, payload.model_dump())
    except repo.PaymentError as error:
        raise _fail(error) from error


@router.post("/payments/razorpay/simulate", response_model=RazorpaySuccessPayload)
async def simulate_checkout(
    payload: SimulateCheckoutPayload, user: User = Depends(current_user)
) -> RazorpaySuccessPayload:
    """TEST-MODE ONLY stand-in for Razorpay Checkout.

    Signs `{order_id}|{payment_id}` with the configured **test** key secret so
    the real server-side verification path runs unchanged. Refuses to run when
    the gateway is in live mode or the app is in production.
    """
    try:
        return RazorpaySuccessPayload(**await repo.simulate_checkout(user, payload.gatewayOrderId))
    except repo.PaymentError as error:
        raise _fail(error) from error


# Gateway payment history (the Sprint 2.10 `/payments` route keeps its shape).
@router.get("/payments/gateway")
async def list_gateway_payments(user: User = Depends(current_user)) -> dict:
    return await repo.payments_for(user)


@router.get("/payments/gateway/{payment_id}", response_model=GatewayPayment)
async def get_gateway_payment(payment_id: str, user: User = Depends(current_user)) -> GatewayPayment:
    try:
        return GatewayPayment(**await repo.payment_by_id(payment_id, user))
    except repo.PaymentError as error:
        raise _fail(error) from error


@router.post("/payments/{payment_id}/refund")
async def refund_payment(
    payment_id: str, payload: RefundRequestPayload, user: User = Depends(current_user)
) -> dict:
    try:
        return await repo.create_refund(user, payment_id, payload.model_dump())
    except repo.PaymentError as error:
        raise _fail(error) from error


@router.get("/refunds")
async def list_refunds(user: User = Depends(current_user)) -> dict:
    return await repo.list_refunds(user.id)


@router.get("/refunds/{refund_id}")
async def get_refund(refund_id: str, user: User = Depends(current_user)) -> dict:
    try:
        return await repo.refund_by_id(refund_id)
    except repo.PaymentError as error:
        raise _fail(error) from error
