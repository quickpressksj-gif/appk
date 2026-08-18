"""Wallet ledger routes — Phase 5 · Sprint 5.6."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import current_user
from app.db import payment_repositories as repo
from app.models.payment import CreateWithdrawalPayload, WalletCreditPayload, WalletTopupPayload
from app.models.user import User
from app.services import wallet_ledger as ledger

router = APIRouter(tags=["wallet-ledger"])


def _fail(error) -> HTTPException:
    status_code = getattr(error, "status_code", 400)
    message = getattr(error, "message", str(error))
    return HTTPException(status_code=status_code, detail=message)


@router.get("/wallet/ledger")
async def wallet_ledger_endpoint(
    limit: int = 50, reason: str | None = None, user: User = Depends(current_user)
) -> dict:
    return await ledger.ledger_for(user.id, limit, reason)


@router.get("/wallet/balance")
async def wallet_balance(user: User = Depends(current_user)) -> dict:
    return {"balance": await ledger.balance(user.id), "currency": "INR"}


@router.post("/wallet/topup")
async def wallet_topup(payload: WalletTopupPayload, user: User = Depends(current_user)) -> dict:
    # Top-ups are funded through Razorpay, so this creates a gateway order.
    try:
        return await repo.create_order(
            user, {"amount": payload.amount, "purpose": "Wallet top-up", "walletAmount": 0}
        )
    except repo.PaymentError as error:
        raise _fail(error) from error


@router.post("/wallet/credit")
async def wallet_credit(payload: WalletCreditPayload, user: User = Depends(current_user)) -> dict:
    try:
        return await ledger.append_entry(
            account_id=user.id,
            role=repo.role_of(user),
            direction="credit",
            reason=payload.reason,
            amount=payload.amount,
            note=payload.note,
            reference=payload.reference,
        )
    except ledger.WalletLedgerError as error:
        raise _fail(error) from error


@router.get("/wallet/withdrawals")
async def list_withdrawals(user: User = Depends(current_user)) -> dict:
    return await repo.withdrawals_for(user)


@router.post("/wallet/withdrawals")
async def create_withdrawal(payload: CreateWithdrawalPayload, user: User = Depends(current_user)) -> dict:
    try:
        return await repo.create_withdrawal(user, payload.model_dump())
    except repo.PaymentError as error:
        raise _fail(error) from error
