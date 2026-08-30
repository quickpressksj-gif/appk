"""Checkout API — Sprint 2.4.

    GET /api/checkout   one call that returns the address book, pickup schedule,
                        cart summary with server computed totals, wallet balance
                        and the available payment methods.

The checkout screen needs all of it before it can render, so bundling it keeps a
single loading state instead of four.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query

from app.core.deps import current_user
from app.db.address_repositories import address_repository
from app.db.cart_repositories import cart_repository, compute_totals
from app.db.client import database
from app.db.membership_repositories import membership_repository
from app.db.order_repositories import delivery_estimate
from app.models.checkout import (
    CheckoutMembershipInfo,
    CheckoutResponse,
    PaymentMethodResponse,
    PickupOptionResponse,
    PickupScheduleResponse,
)
from app.models.order import OrderPickup
from app.models.user import User

router = APIRouter(tags=["checkout"])

SLOTS = [
    PickupOptionResponse(id="morning", label="8 AM – 12 PM", sub="Morning"),
    PickupOptionResponse(id="afternoon", label="12 PM – 4 PM", sub="Afternoon"),
    PickupOptionResponse(id="evening", label="4 PM – 8 PM", sub="Evening"),
]


def pickup_schedule() -> PickupScheduleResponse:
    """Today, tomorrow and the next five days; slots are fixed windows."""
    today = datetime.now(timezone.utc).date()
    days = []
    for offset in range(7):
        date = today + timedelta(days=offset)
        if offset == 0:
            label, sub = "Today", date.strftime("%d %b")
        elif offset == 1:
            label, sub = "Tomorrow", date.strftime("%d %b")
        else:
            label, sub = date.strftime("%a"), date.strftime("%d %b")
        days.append(
            PickupOptionResponse(
                id=date.isoformat(), label=label, sub=sub, date=date.isoformat()
            )
        )
    return PickupScheduleResponse(
        days=days,
        slots=SLOTS,
        selectedDay=days[0].id,
        selectedSlot=SLOTS[0].id,
        minDate=days[0].id,
        maxDate=days[-1].id,
    )


async def wallet_balance(user: User) -> int:
    from app.db.wallet_repositories import wallet_repository
    wlt = await wallet_repository._wallet_document(user)
    return int(wlt.get("balance", 0.0))


def payment_methods(balance: int, payable: int) -> list[PaymentMethodResponse]:
    return [
        PaymentMethodResponse(
            id="cod",
            kind="cod",
            name="Cash on delivery",
            note="Pay the rider when your laundry arrives",
            enabled=True,
            comingSoon=False,
        ),
        PaymentMethodResponse(
            id="wallet",
            kind="wallet",
            name="QuickPress wallet",
            note=(
                f"Balance ₹{balance}"
                if balance >= payable
                else f"Balance ₹{balance} — not enough for full payment"
            ),
            enabled=True,
            comingSoon=False,
        ),
        PaymentMethodResponse(
            id="online",
            kind="online",
            name="UPI / Cards / NetBanking",
            note="Instant online payment via Razorpay (GPay, PhonePe, Paytm, Cards)",
            enabled=True,
            comingSoon=False,
        ),
    ]


@router.get("/checkout", response_model=CheckoutResponse)
async def get_checkout(
    couponDiscount: int = Query(default=0, ge=0),
    user: User = Depends(current_user),
) -> CheckoutResponse:
    addresses = await address_repository.list(user.id)
    items = await cart_repository.lines(user.id)
    charges = await cart_repository.charges()
    coupons = await cart_repository.coupons(user.id)

    # Evaluate live customer membership perks & quota
    membership_perks = await membership_repository.get_user_membership_perks(user.id)
    is_active_member = bool(membership_perks.get("active"))
    
    member_discount_amount = 0
    if is_active_member:
        if membership_perks.get("free_pickup"):
            charges = charges.model_copy(update={"pickup": 0, "delivery": 0})
        disc_pct = int(membership_perks.get("discount_percent") or 0)
        if disc_pct > 0:
            raw_subtotal = sum(it.price * it.qty for it in items)
            member_discount_amount = round(raw_subtotal * (disc_pct / 100.0))

    totals = compute_totals(items, charges, couponDiscount + member_discount_amount)
    store = await cart_repository._store(items)
    balance = await wallet_balance(user)
    schedule = pickup_schedule()
    delivery = delivery_estimate(OrderPickup(date=schedule.selectedDay, slot=schedule.selectedSlot))
    selected = next((a.id for a in addresses if a.isDefault), addresses[0].id if addresses else "")
    methods = payment_methods(balance, totals.grandTotal)

    mbs_info = None
    if is_active_member:
        plan_name = str(membership_perks.get("plan_name") or "VIP")
        rem_orders = int(membership_perks.get("remaining_orders") or 0)
        tot_orders = int(membership_perks.get("total_orders") or 0)
        mbs_info = CheckoutMembershipInfo(
            active=True,
            planId=str(membership_perks.get("plan_id") or "gold"),
            planName=plan_name,
            badge=f"{plan_name} Member",
            discountPercent=int(membership_perks.get("discount_percent") or 0),
            discountAmount=float(member_discount_amount),
            freePickupApplied=bool(membership_perks.get("free_pickup")),
            freeDeliveryApplied=bool(membership_perks.get("free_pickup")),
            priorityProcessing=bool(membership_perks.get("priority_processing")),
            remainingOrders=rem_orders,
            totalOrders=tot_orders,
            message=f"{plan_name} Membership Active: Free Delivery Applied & {membership_perks.get('discount_percent')}% Extra Savings ({rem_orders}/{tot_orders} orders left this month)",
        )

    return CheckoutResponse(
        addresses=addresses,
        selectedAddressId=selected,
        pickup=schedule,
        store=store,
        items=items,
        coupons=coupons,
        charges=charges,
        totals=totals,
        payments=methods,
        selectedPaymentId="cod",
        walletBalance=balance,
        deliveryEstimate=f"{delivery.date} · {delivery.slot}",
        membership=mbs_info,
    )



@router.get("/slots")
async def get_slots() -> dict:
    schedule = pickup_schedule()
    return {"days": schedule.days, "slots": schedule.slots}


@router.get("/payment-methods")
async def get_payment_methods(user: User = Depends(current_user)) -> list[PaymentMethodResponse]:
    balance = await wallet_balance(user.id)
    return payment_methods(balance, 100)

