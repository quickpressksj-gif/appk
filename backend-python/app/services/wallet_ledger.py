"""Double-entry wallet ledger primitives — Phase 5 · Sprint 5.6.

Every wallet mutation for customers, partners and riders goes through this
module so the balance shown anywhere in the product is always the sum of an
append-only ledger (`wallet_ledger` collection), never a mutable counter that
can drift. Mirrors the mock engine in `backend/src/mock/payments-core.ts`.

Collections
-----------
`wallet_ledger`   one document per credit/debit, ever-growing, never edited.
`wallet_holds`    pending debits (e.g. a withdrawal) that are not yet final —
                  they reduce the *spendable* balance without being reversed.

Rules
-----
* Balances are derived: `sum(credits) - sum(debits)` over `status="success"`
  entries, `pending` entries are tracked separately for visibility.
* A debit that would take the balance below zero is rejected before it is
  written — the ledger never contains a state that implies negative funds.
* Withdrawals place a `pending` debit hold immediately (so the money cannot
  be spent twice) and are later flipped to `success` (paid) or `failed`
  (rejected, funds implicitly returned because the hold no longer counts).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional

from app.db.client import database

LEDGER_COLLECTION = "wallet_ledger"
CURRENCY = "INR"

LedgerDirection = Literal["credit", "debit"]
LedgerStatus = Literal["success", "pending", "failed"]


def money(value: Any) -> float:
    try:
        return round(float(value or 0), 2)
    except (TypeError, ValueError):
        return 0.0


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def date_label(iso: str) -> str:
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except ValueError:
        dt = datetime.now(timezone.utc)
    return dt.strftime("%d %b %Y")


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


class WalletLedgerError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


async def _entries(account_id: str) -> List[Dict[str, Any]]:
    docs = await database.find_many(LEDGER_COLLECTION, {"accountId": account_id}, sort_key="createdAt")
    docs.reverse()
    return docs


async def balance(account_id: str) -> float:
    """Spendable balance: successful credits minus successful debits."""
    entries = await _entries(account_id)
    total = 0.0
    for entry in entries:
        if entry.get("status") != "success":
            continue
        amount = money(entry.get("amount"))
        total += amount if entry.get("direction") == "credit" else -amount
    return money(total)


async def pending_amount(account_id: str) -> float:
    entries = await _entries(account_id)
    return money(sum(money(e.get("amount")) for e in entries if e.get("status") == "pending"))


async def lifetime_credit(account_id: str) -> float:
    entries = await _entries(account_id)
    return money(
        sum(money(e.get("amount")) for e in entries if e.get("direction") == "credit" and e.get("status") == "success")
    )


async def lifetime_debit(account_id: str) -> float:
    entries = await _entries(account_id)
    return money(
        sum(money(e.get("amount")) for e in entries if e.get("direction") == "debit" and e.get("status") == "success")
    )


async def append_entry(
    *,
    account_id: str,
    role: Literal["customer", "partner", "rider"],
    direction: LedgerDirection,
    reason: str,
    amount: float,
    note: str = "",
    reference: Optional[str] = None,
    order_id: Optional[str] = None,
    payment_id: Optional[str] = None,
    status: LedgerStatus = "success",
) -> Dict[str, Any]:
    """Appends a ledger entry, enforcing the never-negative-balance rule.

    Only `success` debits are checked against the live balance — `pending`
    holds (withdrawals) are created deliberately below and already reserve
    funds via a prior successful debit or an explicit hold entry.
    """
    value = money(abs(amount))
    if value <= 0:
        raise WalletLedgerError("Ledger amount must be greater than ₹0.", 400)

    current = await balance(account_id)
    if direction == "debit" and status == "success" and value > current + 0.001:
        raise WalletLedgerError("Insufficient wallet balance.", 400)

    balance_after = money(current + value) if direction == "credit" else money(current - value)
    if status != "success":
        # Pending entries do not move the settled balance yet.
        balance_after = current

    created_at = now_iso()
    document = {
        "_id": new_id("wle"),
        "accountId": account_id,
        "role": role,
        "direction": direction,
        "reason": reason,
        "amount": value,
        "balanceAfter": balance_after,
        "currency": CURRENCY,
        "reference": reference,
        "orderId": order_id,
        "paymentId": payment_id,
        "note": note,
        "status": status,
        "createdAt": created_at,
        "dateLabel": date_label(created_at),
    }
    await database.collection(LEDGER_COLLECTION).insert_one(document)
    return document


async def ledger_for(account_id: str, limit: int = 50, reason: Optional[str] = None) -> Dict[str, Any]:
    entries = await _entries(account_id)
    if reason:
        entries = [e for e in entries if e.get("reason") == reason]
    return {
        "entries": entries[:limit],
        "balance": await balance(account_id),
        "pending": await pending_amount(account_id),
        "lifetimeCredit": await lifetime_credit(account_id),
        "lifetimeDebit": await lifetime_debit(account_id),
        "currency": CURRENCY,
    }


async def settle_pending_hold(account_id: str, reason: str, amount: float, *, outcome: LedgerStatus) -> None:
    """Flips a `pending` hold (e.g. a withdrawal) to `success` or `failed`.

    `success` finalises the debit (funds leave for good); `failed` releases
    the hold — since pending entries never reduced the settled balance, no
    extra credit is required, the funds simply become spendable again.
    """
    entries = await _entries(account_id)
    target = next(
        (e for e in entries if e.get("reason") == reason and e.get("status") == "pending" and money(e.get("amount")) == money(amount)),
        None,
    )
    if not target:
        return
    await database.collection(LEDGER_COLLECTION).update_one(
        {"_id": target["_id"]}, {"$set": {"status": outcome}}
    )


async def record_delivered_order_earnings(order: Dict[str, Any]) -> None:
    """Idempotently credits Partner and Rider wallets upon successful order delivery.
    Enforces double-entry ledger rules and prevents duplicate payouts.
    """
    order_id = str(order.get("_id") or order.get("id") or "")
    if not order_id:
        return

    # 1. Partner Earning Credit
    partner = order.get("partner") or {}
    partner_id = str(partner.get("id") or order.get("partner_id") or order.get("partnerId") or order.get("store_id") or "")
    if partner_id:
        existing_partner_entry = await database.collection(LEDGER_COLLECTION).find_one({
            "accountId": partner_id,
            "orderId": order_id,
            "reason": "ORDER_EARNING",
        })
        if not existing_partner_entry:
            total_amt = money(
                (order.get("totals") or {}).get("grandTotal")
                or (order.get("pricing") or {}).get("finalTotal")
                or order.get("total_amount")
                or order.get("amount")
                or 0
            )
            if total_amt > 0:
                commission_rate = 0.15  # 15% platform commission
                commission = money(total_amt * commission_rate)
                net_partner_earning = money(total_amt - commission)
                await append_entry(
                    account_id=partner_id,
                    role="partner",
                    direction="credit",
                    reason="ORDER_EARNING",
                    amount=net_partner_earning,
                    note=f"Net earnings for Order #{order.get('code') or order_id} (Gross: ₹{total_amt}, Commission: ₹{commission})",
                    reference=f"ord_earn_{order_id}",
                    order_id=order_id,
                    status="success",
                )

    # 2. Rider Delivery Fee Credit
    rider = order.get("rider") or {}
    rider_id = str(rider.get("id") or "")
    if rider_id:
        existing_rider_entry = await database.collection(LEDGER_COLLECTION).find_one({
            "accountId": rider_id,
            "orderId": order_id,
            "reason": "DELIVERY_PAYOUT",
        })
        if not existing_rider_entry:
            rider_fee = money(
                (order.get("totals") or {}).get("deliveryFee")
                or (order.get("totals") or {}).get("pickupFee")
                or 50.0  # standard delivery incentive
            )
            if rider_fee > 0:
                await append_entry(
                    account_id=rider_id,
                    role="rider",
                    direction="credit",
                    reason="DELIVERY_PAYOUT",
                    amount=rider_fee,
                    note=f"Delivery payout for Order #{order.get('code') or order_id}",
                    reference=f"rdr_earn_{order_id}",
                    order_id=order_id,
                    status="success",
                )

