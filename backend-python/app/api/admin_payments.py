"""Admin payments dashboard, settlements, refunds, wallet monitor, withdrawals."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import require_roles
from app.db import payment_repositories as repo
from app.db.client import database
from app.models.payment import ApproveSettlementPayload, ApproveWithdrawalPayload, RejectReasonPayload
from app.models.user import Role, User, utcnow

router = APIRouter(tags=["admin-payments"])


def _fail(error: repo.PaymentError) -> HTTPException:
    return HTTPException(status_code=error.status_code, detail=error.message)


async def _owner_of(account_id: str) -> User | None:
    doc = await database.find_one("users", {"_id": account_id})
    return User.from_document(doc) if doc else None


@router.get("/admin/payments/dashboard")
async def admin_dashboard(user: User = Depends(require_roles(Role.admin))) -> dict:
    return await repo.admin_dashboard()


@router.get("/admin/settlements/overview")
async def admin_settlements_overview(user: User = Depends(require_roles(Role.admin))) -> dict:
    from app.services.settlement_engine import settlement_engine
    return await settlement_engine.get_admin_settlements_overview()


@router.post("/admin/settlements/batch-disburse")
async def admin_batch_disburse_settlements(user: User = Depends(require_roles(Role.admin))) -> dict:
    from app.services.settlement_engine import settlement_engine
    return await settlement_engine.batch_disburse_pending()


@router.get("/admin/settlements")
async def admin_settlements(user: User = Depends(require_roles(Role.admin))) -> dict:
    from app.services.settlement_engine import settlement_engine
    overview = await settlement_engine.get_admin_settlements_overview()
    items = overview.get("settlements") or []
    if not items:
        res = await repo.all_settlements()
        items = res.get("items") or []
    return {"items": items, "summary": overview.get("summary")}


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


# =========================================================================
#  /api/admin/wallet/* Endpoints for Admin Finance Console & Live Ledger
# =========================================================================

@router.get("/admin/wallet/kpis")
async def admin_wallet_kpis(user: User = Depends(require_roles(Role.admin))) -> list[dict]:
    """Calculate real platform financial KPIs from live MongoDB collections."""
    orders = await database.find_many("customer_orders", {})
    total_order_revenue = sum(int(o.get("grand_total") or o.get("total") or 0) for o in orders if o.get("status") != "cancelled")
    
    mbs_txns = await database.find_many("membership_transactions", {})
    total_mbs_revenue = sum(int(m.get("amount") or 0) for m in mbs_txns if m.get("payment_status") == "paid")
    
    total_revenue = total_order_revenue + total_mbs_revenue
    platform_commission = int(total_order_revenue * 0.15 + total_mbs_revenue)
    partner_payouts = int(total_order_revenue * 0.70)
    rider_earnings = int(total_order_revenue * 0.15)
    
    wallets = await database.find_many("wallets", {})
    total_wallet_balance = sum(int(w.get("current_balance") or 0) for w in wallets)
    
    withdrawals = await database.find_many("partner_withdrawals", {"status": "pending"})
    pending_settlements = sum(int(w.get("amount") or 0) for w in withdrawals)

    return [
        {"id": "total_revenue", "label": "Total Revenue", "value": total_revenue, "positive": True},
        {"id": "platform_commission", "label": "Platform Profit", "value": platform_commission, "positive": True},
        {"id": "partner_payouts", "label": "Partner Payouts", "value": partner_payouts, "positive": True},
        {"id": "rider_earnings", "label": "Rider Earnings", "value": rider_earnings, "positive": True},
        {"id": "wallet_balance", "label": "Customer Float", "value": total_wallet_balance, "positive": True},
        {"id": "pending_settlements", "label": "Pending Payouts", "value": pending_settlements, "positive": False},
    ]


@router.get("/admin/wallet/revenue-split")
async def admin_revenue_split(user: User = Depends(require_roles(Role.admin))) -> list[dict]:
    return [
        {"name": "Partner Payouts", "value": 70, "color": "#10b981"},
        {"name": "Platform Margin", "value": 15, "color": "#6366f1"},
        {"name": "Rider Delivery", "value": 15, "color": "#f59e0b"},
    ]


@router.get("/admin/wallet/partner-earnings")
async def admin_partner_earnings(user: User = Depends(require_roles(Role.admin))) -> list[dict]:
    partners = await database.find_many("partner_profiles", {})
    if not partners:
        partners = await database.find_many("admin_partners", {})
    if not partners:
        partners = await database.find_many("partners", {})
    orders = await database.find_many("customer_orders", {})
    
    rows = []
    for p in partners:
        p_id = str(p.get("_id") or p.get("id") or p.get("partnerId") or "")
        p_orders = [
            o for o in orders
            if str((o.get("partner") or {}).get("id") or o.get("partner_id") or o.get("partnerId") or "") == p_id
        ]
        gross = sum(float(o.get("grand_total") or o.get("total") or 0) for o in p_orders)
        commission = round(gross * 0.15, 2)
        net = round(gross - commission - (gross * 0.01), 2)
        rows.append({
            "id": p_id,
            "account": p.get("businessName") or p.get("storeName") or p.get("name") or "Laundry Store",
            "city": p.get("city") or "Kasganj",
            "orders": len(p_orders),
            "gross": gross,
            "commission": commission,
            "net": net,
        })
    return rows


@router.get("/admin/wallet/rider-earnings")
async def admin_rider_earnings(user: User = Depends(require_roles(Role.admin))) -> list[dict]:
    riders = await database.find_many("rider_profiles", {})
    if not riders:
        riders = await database.find_many("admin_riders", {})
    if not riders:
        riders = await database.find_many("riders", {})
    orders = await database.find_many("customer_orders", {})
    
    rows = []
    for r in riders:
        r_id = str(r.get("_id") or r.get("id") or r.get("riderId") or "")
        r_orders = [
            o for o in orders
            if str((o.get("rider") or {}).get("id") or o.get("rider_id") or o.get("riderId") or "") == r_id
        ]
        gross = sum(float(o.get("grand_total") or o.get("total") or 0) for o in r_orders)
        commission = round(gross * 0.10, 2)
        net = round(gross - commission, 2)
        rows.append({
            "id": r_id,
            "account": r.get("fullName") or r.get("name") or "Captain",
            "city": r.get("city") or "Kasganj",
            "orders": len(r_orders),
            "gross": gross,
            "commission": commission,
            "net": net,
        })
    return rows


@router.get("/admin/wallet/withdrawals")
async def admin_wallet_withdrawals(user: User = Depends(require_roles(Role.admin))) -> list[dict]:
    withdrawals = await database.find_many("partner_withdrawals", {})
    if not withdrawals:
        withdrawals = await database.find_many("withdrawals", {})
    return [
        {
            "_id": w.get("_id"),
            "accountName": w.get("account_name") or w.get("accountName") or "Partner",
            "kind": w.get("kind") or "partner",
            "amount": int(w.get("amount") or 0),
            "createdAt": w.get("created_at") or w.get("createdAt") or "—",
            "method": w.get("method") or "Bank Transfer / UPI",
            "status": w.get("status") or "Pending",
        }
        for w in withdrawals
    ]


@router.post("/admin/wallet/withdrawals/{withdrawal_id}/{action}")
async def admin_decide_wallet_withdrawal(
    withdrawal_id: str, action: str, user: User = Depends(require_roles(Role.admin))
) -> dict:
    new_status = "Approved" if action == "approve" else "Rejected"
    await database.collection("partner_withdrawals").update_one(
        {"_id": withdrawal_id},
        {"$set": {"status": new_status}}
    )
    return {"ok": True, "id": withdrawal_id, "action": action}


@router.get("/admin/wallet/refunds")
async def admin_wallet_refunds(user: User = Depends(require_roles(Role.admin))) -> list[dict]:
    refunds = await database.find_many("gateway_refunds", {})
    users = {doc["_id"]: doc.get("display_name") or doc.get("name") or doc.get("phone") or doc["_id"] 
             for doc in await database.find_many("users", {})}
    
    rows = []
    for r in refunds:
        user_name = users.get(r.get("accountId"), "Customer")
        rows.append({
            "_id": r.get("_id"),
            "party": f"{user_name} ({r.get('reason') or 'Order Refund'})",
            "kind": "Refund",
            "amount": int(r.get("amount") or 0),
            "createdAt": r.get("createdAt") or "—",
            "status": "Settled" if r.get("status") in ("processed", "success", "paid") else "Pending",
        })
    return rows


@router.get("/admin/wallet/transactions")
async def admin_wallet_transactions(user: User = Depends(require_roles(Role.admin))) -> list[dict]:
    """Full live transactions audit ledger merging Wallet, Razorpay, Orders & Memberships."""
    txns = []

    # Map user identities
    user_docs = await database.find_many("users", {})
    users = {
        doc["_id"]: doc.get("display_name") or doc.get("name") or doc.get("phone") or doc["_id"]
        for doc in user_docs
    }

    # 1. Wallet transactions (top-ups, credits, debits)
    wallet_txns = await database.find_many("wallet_transactions", {})
    for wt in wallet_txns:
        user_name = users.get(wt.get("user_id"), "Customer")
        w_type = str(wt.get("type") or "")
        kind = (
            "Top-up" if w_type in ("add-funds", "topup")
            else "Order" if w_type in ("order-payment", "order")
            else "Refund" if w_type == "refund"
            else "Commission" if "commission" in w_type
            else "Wallet"
        )
        status = "Settled" if wt.get("status") in ("success", "paid", "completed", None) else "Pending"
        txns.append({
            "_id": wt.get("_id"),
            "party": f"{user_name} ({wt.get('title') or kind})",
            "kind": kind,
            "amount": int(wt.get("amount") or 0),
            "createdAt": wt.get("created_at") or wt.get("timestamp") or "—",
            "status": status,
        })

    # 2. Razorpay Gateway Payments
    gw_payments = await database.find_many("gateway_payments", {})
    for gp in gw_payments:
        if any(t["_id"] == gp.get("_id") for t in txns):
            continue
        user_name = users.get(gp.get("accountId"), "Online Customer")
        purpose = str(gp.get("purpose") or "Razorpay Payment")
        kind = (
            "Top-up" if "top-up" in purpose.lower() or "topup" in purpose.lower()
            else "Membership" if "membership" in purpose.lower()
            else "Order" if "order" in purpose.lower()
            else "Razorpay"
        )
        status = "Settled" if gp.get("status") in ("paid", "completed", "success") else "Pending" if gp.get("status") in ("created", "pending", "processing") else "Failed"
        txns.append({
            "_id": gp.get("_id"),
            "party": f"{user_name} ({purpose})",
            "kind": kind,
            "amount": int(gp.get("amount") or 0),
            "createdAt": gp.get("createdAt") or "—",
            "status": status,
        })

    # 3. Membership Subscriptions
    mbs_txns = await database.find_many("membership_transactions", {})
    for mt in mbs_txns:
        if any(t["_id"] == mt.get("_id") for t in txns):
            continue
        user_name = users.get(mt.get("user_id"), "Subscriber")
        txns.append({
            "_id": mt.get("_id"),
            "party": f"{user_name} (VIP {mt.get('plan_name')})",
            "kind": "Membership",
            "amount": int(mt.get("amount") or 0),
            "createdAt": mt.get("subscribed_at") or "—",
            "status": "Settled" if mt.get("payment_status") == "paid" else "Pending",
        })

    # 4. Customer Orders
    orders = await database.find_many("customer_orders", {})
    for ord_doc in orders:
        ord_id = ord_doc.get("_id")
        user_name = users.get(ord_doc.get("customer_id"), "Customer")
        txns.append({
            "_id": ord_id,
            "party": f"{user_name} (Order #{ord_id[:8]})",
            "kind": "Order",
            "amount": int(ord_doc.get("grand_total") or ord_doc.get("total") or 0),
            "createdAt": ord_doc.get("created_at") or "—",
            "status": "Settled" if ord_doc.get("status") in ("delivered", "completed", "confirmed") else "Pending",
        })

    # Sort reverse chronological
    txns.sort(key=lambda x: str(x.get("createdAt", "")), reverse=True)
    return txns
