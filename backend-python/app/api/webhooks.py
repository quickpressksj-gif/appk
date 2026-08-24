"""Public gateway webhooks — Phase 5 · Sprint 5.6.

Razorpay posts server-to-server events here (payment.captured, payment.failed,
refund.processed). The raw body is verified against `X-Razorpay-Signature`
using `RAZORPAY_WEBHOOK_SECRET` before anything is trusted. Handling is
idempotent: each event is recorded once by its Razorpay event id and replays
are ignored.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request, status

from app.config import get_settings
from app.db.client import database
from app.db.payment_repositories import (  # noqa: F401 (internal reuse)
    PAYMENTS,
    _payment_doc,
    _save_payment,
    mark_order_paid,
)
from app.services import razorpay_client
from app.services import wallet_ledger as ledger

router = APIRouter(tags=["webhooks"])

WEBHOOK_EVENTS = "razorpay_webhook_events"


@router.post("/public/webhooks/razorpay")
async def razorpay_webhook(request: Request) -> dict:
    raw_body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    settings = get_settings()

    if not razorpay_client.verify_webhook_signature(raw_body, signature, settings.razorpay_webhook_secret):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature.")

    payload = await request.json()
    event_id = str(payload.get("id") or payload.get("event") or "") or str(hash(raw_body))

    # Idempotency: ignore events already processed.
    if await database.find_one(WEBHOOK_EVENTS, {"_id": event_id}):
        return {"ok": True, "message": "Already processed."}
    await database.collection(WEBHOOK_EVENTS).insert_one({"_id": event_id, "event": payload.get("event")})

    event = payload.get("event")
    entity = (
        payload.get("payload", {}).get("payment", {}).get("entity")
        or payload.get("payload", {}).get("refund", {}).get("entity")
        or {}
    )

    if event == "payment.captured":
        order_id = entity.get("order_id")
        gateway_payment_id = entity.get("id")
        secret = await database.find_one("gateway_order_secrets", {"_id": order_id}) if order_id else None
        if secret:
            payment = await _payment_doc(secret["paymentId"])
            if payment and payment.get("status") != "paid":
                payment["status"] = "paid"
                payment["gatewayPaymentId"] = gateway_payment_id
                payment["signatureVerified"] = True
                await _save_payment(payment)
                
                purpose_str = str(payment.get("purpose") or "").lower()
                if any(k in purpose_str for k in ("top-up", "topup", "add-funds", "add funds", "wallet")):
                    try:
                        from app.db.wallet_repositories import wallet_repository
                        from app.models.user import User
                        user_doc = await database.collection("users").find_one({"_id": payment["accountId"]})
                        if user_doc:
                            target_user = User.from_document(user_doc)
                            await wallet_repository.credit(
                                target_user,
                                payment["amount"],
                                kind="add-funds",
                                title="Money added to wallet",
                                description="Added via Razorpay Online Payment (Webhook)",
                                method="razorpay",
                                reference=payment["_id"],
                            )
                    except Exception:
                        pass
                elif "membership" in purpose_str:
                    try:
                        from app.db.membership_repositories import membership_repository
                        from app.models.user import User
                        user_doc = await database.collection("users").find_one({"_id": payment["accountId"]})
                        if user_doc:
                            target_user = User.from_document(user_doc)
                            notes = payment.get("notes") or {}
                            plan_id = str(notes.get("planId") or "").strip()
                            cycle = str(notes.get("billingCycle") or notes.get("cycle") or "monthly").strip()
                            if not plan_id:
                                for p in ("silver", "gold", "premium", "vip"):
                                    if p in purpose_str:
                                        plan_id = p
                                        break
                            if "yearly" in purpose_str:
                                cycle = "yearly"
                            if plan_id:
                                await membership_repository.subscribe(
                                    target_user,
                                    plan_id,
                                    billing_cycle=cycle,
                                    payment_reference=gateway_payment_id or payment["_id"],
                                )
                    except Exception:
                        pass

                await mark_order_paid(payment.get("orderId"), payment)

    elif event == "payment.failed":
        order_id = entity.get("order_id")
        secret = await database.find_one("gateway_order_secrets", {"_id": order_id}) if order_id else None
        if secret:
            payment = await _payment_doc(secret["paymentId"])
            if payment and payment.get("status") not in ("failed", "cancelled"):
                payment["status"] = "failed"
                payment["failureReason"] = entity.get("error_description") or "Payment failed at the gateway."
                await _save_payment(payment)
                if ledger.money(payment.get("walletAmount")) > 0:
                    await ledger.append_entry(
                        account_id=payment["accountId"],
                        role="customer",
                        direction="credit",
                        reason="refund",
                        amount=payment["walletAmount"],
                        note="Wallet share returned — gateway payment failed (webhook)",
                        payment_id=payment["_id"],
                    )

    elif event == "refund.processed":
        refund_gateway_id = entity.get("id")
        refund = await database.find_one("gateway_refunds", {"gatewayRefundId": refund_gateway_id})
        if refund and refund.get("status") != "processed":
            refund["status"] = "processed"
            await database.collection("gateway_refunds").update_one(
                {"_id": refund["_id"]}, {"$set": refund}
            )

    return {"ok": True}
