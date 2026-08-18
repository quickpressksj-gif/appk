"""Admin payments dashboard, settlements, refunds, wallet monitor, withdrawals."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import require_roles
from app.db import payment_repositories as repo
from app.db.client import database
from app.models.payment import ApproveSettlementPayload, ApproveWithdrawalPayload, RejectReasonPayload
from app.models.user import Role, User

router = APIRouter(tags=["admin-payments"])


def _fail(error: repo.PaymentError) -> HTTPException:
    return HTTPException(status_code=error.status_code, detail=error.message)


async def _owner_of(account_id: str) -> User | None:
    doc = await database.find_one("users", {"_id": account_id})
    return User.from_document(doc) if doc else None


@router.get("/admin/payments/dashboard")
async def admin_dashboard(user: User = Depends(require_roles(Role.admin))) -> dict:
    return await repo.admin_dashboard()


@router.get("/admin/settlements")
async def admin_settlements(user: User = Depends(require_roles(Role.admin))) -> dict:
    return await repo.all_settlements()


@router.post("/admin/settlements/{settlement_id}/approve")
async def approve_settlement(
    settlement_id: str, payload: ApproveSettlementPayload, user: User = Depends(require_roles(Role.admin))
) -> dict:
    settlements = await repo.all_settlements()
    match = next((s for s in settlements["items"] if s["id"] == settlement_id), None)
    owner = await _owner_of(match["accountId"]) if match else None
    try:
        return await repo.approve_settlement(settlement_id, payload.utr, owner)
    except repo.PaymentError as error:
        raise _fail(error) from error


@router.post("/admin/settlements/{settlement_id}/reject")
async def reject_settlement(
    settlement_id: str, payload: RejectReasonPayload, user: User = Depends(require_roles(Role.admin))
) -> dict:
    try:
        return await repo.reject_settlement(settlement_id, payload.reason)
    except repo.PaymentError as error:
        raise _fail(error) from error


@router.get("/admin/refunds/manage")
async def admin_refunds(user: User = Depends(require_roles(Role.admin))) -> dict:
    return await repo.list_refunds()


@router.post("/admin/refunds/{refund_id}/approve")
async def approve_refund(refund_id: str, user: User = Depends(require_roles(Role.admin))) -> dict:
    try:
        refund = await repo.refund_by_id(refund_id)
        owner = await _owner_of(refund["accountId"])
        return await repo.approve_refund(refund_id, owner)
    except repo.PaymentError as error:
        raise _fail(error) from error


@router.post("/admin/refunds/{refund_id}/reject")
async def reject_refund(
    refund_id: str, payload: RejectReasonPayload, user: User = Depends(require_roles(Role.admin))
) -> dict:
    try:
        return await repo.reject_refund(refund_id, payload.reason)
    except repo.PaymentError as error:
        raise _fail(error) from error


@router.get("/admin/wallets/monitor")
async def wallet_monitor(user: User = Depends(require_roles(Role.admin))) -> dict:
    docs = await database.find_sorted("users", {})
    accounts = [User.from_document(d) for d in docs]
    return await repo.wallet_monitor(accounts)


@router.get("/admin/withdrawals")
async def admin_withdrawals(user: User = Depends(require_roles(Role.admin))) -> dict:
    return await repo.all_withdrawals()


@router.post("/admin/withdrawals/{withdrawal_id}/approve")
async def approve_withdrawal(
    withdrawal_id: str, payload: ApproveWithdrawalPayload, user: User = Depends(require_roles(Role.admin))
) -> dict:
    try:
        return await repo.approve_withdrawal(withdrawal_id, payload.reference)
    except repo.PaymentError as error:
        raise _fail(error) from error


@router.post("/admin/withdrawals/{withdrawal_id}/reject")
async def reject_withdrawal(
    withdrawal_id: str, payload: RejectReasonPayload, user: User = Depends(require_roles(Role.admin))
) -> dict:
    try:
        withdrawals = await repo.all_withdrawals()
        match = next((w for w in withdrawals["items"] if w["id"] == withdrawal_id), None)
        owner = await _owner_of(match["accountId"]) if match else None
        return await repo.reject_withdrawal(withdrawal_id, payload.reason, owner)
    except repo.PaymentError as error:
        raise _fail(error) from error
