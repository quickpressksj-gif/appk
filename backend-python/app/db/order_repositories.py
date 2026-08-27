"""Order repository — Sprint 2.4 (Checkout & Order Creation).

Collections
    customer_orders    one document per order (the canonical order contract)
    order_counters     {_id: "order", value} — sequential QuickPress order numbers

POST /api/orders validates the cart, computes pricing server side from
`cart_settings`, clears the cart and returns the created order together with the
pickup and delivery estimates the Order Success screen renders.
"""

from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from app.db.cart_repositories import cart_repository, compute_totals
from app.db.client import database
from app.models.cart import CartItemPayload, CartLineResponse
from app.models.order import (
    OrderAddress,
    OrderDelivery,
    OrderEvent,
    OrderLine,
    OrderOtp,
    OrderPartnerParty,
    OrderParty,
    OrderPayment,
    OrderPickup,
    OrderResponse,
    OrderTotals,
    PlaceOrderPayload,
)
from app.models.user import User
from app.services import order_lifecycle as lifecycle

COLLECTION = "customer_orders"
COUNTER_COLLECTION = "order_counters"

STATUS_LABEL = {
    "pending_partner_acceptance": "Order placed",
    "placed": "Order placed",
    "rider_accepted": "Rider accepted",
    "partner_accepted": "Accepted by store",
    "rider_assigned": "Rider assigned",
    "picked_up": "Picked up",
    "at_partner": "Reached store",
    "processing": "In cleaning",
    "completed": "Laundry completed",
    "out_for_delivery": "Out for delivery",
    "delivered": "Delivered",
    "cancelled": "Cancelled",
}

SLOT_LABEL = {
    "morning": "8 AM – 12 PM",
    "afternoon": "12 PM – 4 PM",
    "evening": "4 PM – 8 PM",
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(value: datetime) -> str:
    return value.replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _otp() -> str:
    return f"{random.randint(1000, 9999)}"


def pickup_date_label(pickup: OrderPickup) -> str:
    """`today` / `tomorrow` / an ISO date become a human readable label."""
    raw = (pickup.date or "").strip()
    today = _now().date()
    if raw.lower() in ("", "today"):
        return f"Today, {today.strftime('%d %b')}"
    if raw.lower() == "tomorrow":
        return f"Tomorrow, {(today + timedelta(days=1)).strftime('%d %b')}"
    try:
        parsed = datetime.fromisoformat(raw).date()
    except ValueError:
        return raw
    if parsed == today:
        return f"Today, {parsed.strftime('%d %b')}"
    if parsed == today + timedelta(days=1):
        return f"Tomorrow, {parsed.strftime('%d %b')}"
    return parsed.strftime("%a, %d %b")


def pickup_slot_label(slot: str) -> str:
    return SLOT_LABEL.get((slot or "").lower(), slot or SLOT_LABEL["morning"])


def delivery_estimate(pickup: OrderPickup) -> OrderDelivery:
    """Standard turnaround is 48 hrs from pickup; express is 24 hrs."""
    raw = (pickup.date or "today").strip().lower()
    base = _now().date()
    if raw == "tomorrow":
        base = base + timedelta(days=1)
    elif raw not in ("", "today"):
        try:
            base = datetime.fromisoformat(raw).date()
        except ValueError:
            pass
    days = 1 if pickup.express else 2
    date = base + timedelta(days=days)
    return OrderDelivery(
        date=date.strftime("%a, %d %b"),
        slot="6 PM – 9 PM" if pickup.express else pickup_slot_label(pickup.slot),
    )


class OrderRepository:
    async def _highest_existing_number(self) -> int:
        """Highest QP#### already present in the canonical order collection.

        Seed/demo data (ord-QP1041 ... ord-QP1043) lives in the same collection,
        so the counter must never hand out a code that already exists — a
        duplicate `_id` makes lookups resolve to the OTHER order (and therefore
        to another partner store).
        """
        highest = 0
        for document in await database.find_many(COLLECTION, {}):
            code = str(document.get("code") or "").strip()
            digits = code[2:] if code.upper().startswith("QP") else ""
            if digits.isdigit():
                highest = max(highest, int(digits))
        return highest

    async def next_number(self) -> str:
        document = await database.collection(COUNTER_COLLECTION).find_one({"_id": "order"})
        counter = int((document or {}).get("value") or 1040)
        value = max(counter, await self._highest_existing_number()) + 1
        await database.collection(COUNTER_COLLECTION).update_one(
            {"_id": "order"}, {"$set": {"value": value}}, upsert=True
        )
        return f"QP{value}"


    def _to_order_response(self, document: Dict[str, Any]) -> OrderResponse:
        data = dict(document)
        otp_obj = data.get("otp") or {}
        p_val = otp_obj.get("pickup")
        d_val = otp_obj.get("delivery")
        disp_val = otp_obj.get("dispatch")

        p_code = p_val.get("code") if isinstance(p_val, dict) else str(p_val or "")
        d_code = d_val.get("code") if isinstance(d_val, dict) else str(d_val or "")
        disp_code = disp_val.get("code") if isinstance(disp_val, dict) else str(disp_val or "")

        data["otp"] = {
            "pickup": p_code or "",
            "delivery": d_code or "",
            "dispatch": disp_code or "",
        }
        return OrderResponse(
            **{
                k: v
                for k, v in data.items()
                if k not in ("_id", "id", "userId", "couponCode", "instructions", "idempotencyKey")
            },
            id=str(document.get("id") or document.get("_id")),
        )

    async def by_id(self, user_id: str, order_id: str) -> Optional[OrderResponse]:
        document = await database.collection(COLLECTION).find_one({"_id": order_id})
        if document is None:
            document = await database.collection(COLLECTION).find_one({"code": order_id})
        if document is None or document.get("userId") != user_id:
            return None
        return self._to_order_response(document)

    async def list(self, user_id: str) -> List[OrderResponse]:
        docs = await database.find_many(COLLECTION, {"userId": user_id})
        docs.sort(key=lambda d: d.get("createdAt") or "", reverse=True)
        return [self._to_order_response(d) for d in docs]

    async def find_recent_duplicate(
        self, user_id: str, idempotency_key: Optional[str]
    ) -> Optional[OrderResponse]:
        """Guard against double taps / retries creating a second order."""
        if not idempotency_key:
            return None
        document = await database.collection(COLLECTION).find_one(
            {"userId": user_id, "idempotencyKey": idempotency_key}
        )
        if document is None:
            return None
        return self._to_order_response(document)

    async def create(self, user: User, payload: PlaceOrderPayload) -> OrderResponse:
        items = await cart_repository.lines(user.id)
        if not items and payload.items:
            for it in payload.items:
                svc = await database.find_one("partner_services", {"_id": it.id}) or await database.find_one("partner_services", {"id": it.id})
                partner_id = svc.get("partnerId") if svc else None
                await cart_repository.add_item(
                    user.id,
                    CartItemPayload(
                        id=it.id,
                        itemId=it.id,
                        serviceId=it.id,
                        partnerId=partner_id,
                        name=it.name,
                        price=it.price,
                        qty=max(1, it.qty),
                    ),
                )
            items = await cart_repository.lines(user.id)

        if not items:
            raise ValueError("Your cart is empty — add an item before placing the order")

        charges = await cart_repository.charges()
        totals = compute_totals(items, charges, max(0, payload.couponDiscount))

        # Check live minimum order value rule from admin_settings
        admin_doc = await database.collection("admin_settings").find_one({"_id": "platform"})
        min_order = int((admin_doc or {}).get("minimumOrderValue") or (admin_doc or {}).get("min_order_value") or 0)
        if min_order > 0 and totals.itemsTotal < min_order:
            raise ValueError(f"Minimum order amount is ₹{min_order}. Your current items total is ₹{totals.itemsTotal}. Please add more items to checkout.")

        address = payload.address
        if address is None:
            raise ValueError("Select a pickup address before placing the order")
        if not (address.line.strip() and address.phone.strip()):
            raise ValueError("The selected pickup address is incomplete")

        partner = await self._partner(items)
        code = await self.next_number()
        created = _iso(_now())
        pickup = OrderPickup(
            date=pickup_date_label(payload.pickup),
            slot=pickup_slot_label(payload.pickup.slot),
            express=payload.pickup.express,
        )
        delivery = payload.delivery or delivery_estimate(payload.pickup)
        mode = payload.payment.mode

        # Live wallet debit handling if paying with wallet balance
        is_wallet_payment = (mode == "wallet") or (payload.payment.label and "wallet" in payload.payment.label.lower())
        if is_wallet_payment:
            from app.db.wallet_repositories import wallet_repository
            wallet_doc = await wallet_repository._wallet_document(user)
            available_balance = float(wallet_doc.get("balance", 0.0))
            if available_balance < totals.grandTotal:
                raise ValueError(
                    f"Insufficient wallet balance. Available: ₹{available_balance:.2f}, Required: ₹{totals.grandTotal:.2f}. Please add funds to your wallet."
                )
            await wallet_repository.debit(
                user,
                float(totals.grandTotal),
                kind="order-payment",
                title="Order Payment",
                description=f"Payment for Order #{code}",
                method="wallet",
                reference=f"ord-{code}",
            )

        # Permanent item price snapshots — historical order numbers never change on future rate updates
        item_snapshots = []
        for item in items:
            svc = await database.find_one("partner_services", {"_id": item.itemId or item.id}) or {}
            item_snapshots.append(
                {
                    "id": item.id,
                    "partnerServiceId": str(svc.get("_id") or item.itemId or item.id),
                    "masterServiceId": str(svc.get("masterServiceId") or item.serviceId or ""),
                    "name": item.name,
                    "qty": item.qty,
                    "price": item.price,
                    "unit": item.unit or "kg",
                    "subtotal": item.price * item.qty,
                }
            )

        from app.services.rider_dispatch import create_otp_record

        pickup_otp_record = create_otp_record()
        delivery_otp_record = create_otp_record()

        customer_name = (payload.customerName or user.display_name or "").strip() or "QuickPress Customer"
        customer_phone = (payload.customerPhone or user.phone or "").strip()

        if payload.customerName or payload.customerPhone:
            user_updates = {}
            if payload.customerName and payload.customerName.strip():
                user_updates["name"] = payload.customerName.strip()
                user_updates["displayName"] = payload.customerName.strip()
            if payload.customerPhone and payload.customerPhone.strip():
                user_updates["phone"] = payload.customerPhone.strip()
            if user_updates:
                await database.collection("users").update_one(
                    {"_id": user.id},
                    {"$set": user_updates}
                )

        document: Dict[str, Any] = {
            "_id": f"ord-{code}",
            "userId": user.id,
            "code": code,
            "status": lifecycle.PENDING,
            "createdAt": created,
            "updatedAt": created,
            "customerName": customer_name,
            "customerPhone": customer_phone,
            "customer": OrderParty(
                id=user.id, name=customer_name, phone=customer_phone
            ).model_dump(),
            "partner": partner.model_dump(),
            "partner_id": partner.id,
            "partnerId": partner.id,
            "rider": None,
            "serviceLabel": payload.serviceLabel or (items[0].name if items else "Laundry"),
            "items": item_snapshots,
            "totals": OrderTotals(
                itemsTotal=totals.itemsTotal,
                pickup=totals.pickup,
                delivery=totals.delivery,
                handling=totals.handling,
                gst=totals.gst,
                discount=totals.discount + totals.couponDiscount,
                grandTotal=totals.grandTotal,
            ).model_dump(),
            "address": address.model_dump(),
            "pickup": pickup.model_dump(),
            "delivery": delivery.model_dump(),
            "payment": OrderPayment(
                mode="wallet" if is_wallet_payment else mode,
                label="QuickPress Wallet" if is_wallet_payment else payload.payment.label,
                note="Paid from QuickPress wallet balance" if is_wallet_payment else (payload.payment.note or ("Paid online" if mode == "online" else "Pay on delivery")),
                paid=is_wallet_payment or (mode == "online"),
            ).model_dump(),
            "otp": {
                "pickup": pickup_otp_record,
                "delivery": delivery_otp_record,
            },
            "events": [
                OrderEvent(
                    id=f"{code}-evt-0",
                    status=lifecycle.PENDING,
                    label=STATUS_LABEL[lifecycle.PENDING],
                    at=created,
                    actor="customer",
                ).model_dump()
            ],
            "cancelledReason": None,
            "couponCode": payload.couponCode or "",
            "instructions": payload.instructions or "",
            "idempotencyKey": payload.idempotencyKey,
        }
        await database.collection(COLLECTION).insert_one(document)
        # Canonical audit trail: every order starts its life with ORDER_CREATED.
        await lifecycle.record_event(
            document,
            "ORDER_CREATED",
            actor_id=user.id,
            actor_role="customer",
            metadata={"code": code, "grandTotal": totals.grandTotal},
            at=created,
        )

        from app.services.socket_service import EVENT_ORDER_CREATED, broadcast_order_event

        await broadcast_order_event(EVENT_ORDER_CREATED, document)

        from app.services.order_notifications import dispatch_order_created_notifications

        await dispatch_order_created_notifications(document)
        # The cart belongs to the order now.
        await cart_repository.clear(user.id)
        return self._to_order_response(document)

    async def cancel(self, user_id: str, order_id: str, reason: str) -> Optional[OrderResponse]:
        """Customers can cancel until the rider has picked the laundry up."""
        order = await self.by_id(user_id, order_id)
        if order is None:
            return None
        if order.status in ("picked_up", "at_partner", "processing", "completed",
                            "out_for_delivery", "delivered"):
            raise ValueError("This order has already been picked up and can no longer be cancelled")
        if order.status == "cancelled":
            return order
        await lifecycle.transition(
            order.id,
            lifecycle.CANCELLED,
            actor_id=user_id,
            actor_role="customer",
            metadata={"reason": reason or "Cancelled by customer"},
            changes={"cancelledReason": reason or "Cancelled by customer"},
        )

        # Automatic instant refund to wallet for prepaid/wallet orders
        if order.payment and (order.payment.paid or order.payment.mode == "wallet"):
            try:
                from app.db.repositories import users
                from app.db.wallet_repositories import wallet_repository
                user_obj = await users.by_id(user_id)
                if user_obj:
                    await wallet_repository.credit(
                        user_obj,
                        float(order.totals.grandTotal),
                        kind="refund",
                        title="Order Refund",
                        description=f"Refund for cancelled Order #{order.code}",
                        method="wallet",
                        reference=f"ref-{order.id}",
                    )
            except Exception:
                pass

        return await self.by_id(user_id, order_id)

    async def history(
        self,
        user_id: str,
        q: Optional[str] = None,
        status: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        partner_id: Optional[str] = None,
    ) -> List[OrderResponse]:
        """GET /api/orders/history — searchable, filterable order history.

        `status` accepts a lifecycle status or one of the customer buckets
        `active` / `completed` / `cancelled`.
        """
        orders = await self.list(user_id)
        term = (q or "").strip().lower()
        wanted = (status or "").strip().lower()

        def keep(order: OrderResponse) -> bool:
            if partner_id and order.partner.id != partner_id:
                return False
            if wanted and wanted != "all":
                if wanted == "completed" and order.status != "delivered":
                    return False
                if wanted == "cancelled" and order.status != "cancelled":
                    return False
                if wanted == "active" and order.status in ("delivered", "cancelled"):
                    return False
                if wanted not in ("completed", "cancelled", "active") and order.status != wanted:
                    return False
            created = (order.createdAt or "")[:10]
            if date_from and created < date_from[:10]:
                return False
            if date_to and created > date_to[:10]:
                return False
            if term:
                haystack = " ".join(
                    [
                        order.code,
                        order.serviceLabel,
                        order.partner.name,
                        *[item.name for item in order.items],
                    ]
                ).lower()
                if term not in haystack:
                    return False
            return True

        return [order for order in orders if keep(order)]

    async def reorder(self, user: User, order_id: str) -> Optional[OrderResponse]:
        """POST /api/orders/{id}/reorder — put every past line back in the cart."""
        order = await self.by_id(user.id, order_id)
        if order is None:
            return None
        for line in order.items:
            await cart_repository.add_item(
                user.id,
                CartItemPayload(
                    id=line.id,
                    itemId=line.id,
                    serviceId=line.id,
                    partnerId=order.partner.id,
                    name=line.name,
                    price=line.price,
                    qty=max(1, line.qty),
                ),
            )
        return order

    async def _partner(self, items: List[CartLineResponse]) -> OrderPartnerParty:
        partner_id = next((item.partnerId for item in items if item.partnerId), None)
        if not partner_id and items:
            for it in items:
                svc = await database.find_one("partner_services", {"_id": it.id}) or await database.find_one("partner_services", {"id": it.id})
                if svc and svc.get("partnerId"):
                    partner_id = svc.get("partnerId")
                    break

        document = None
        if partner_id:
            document = await database.find_one("partner_profiles", {"_id": partner_id})
            if document is None:
                document = await database.find_one("partner_profiles", {"partnerId": partner_id})
        if document is None:
            partners = await database.find_many("partner_profiles")
            document = partners[0] if partners else None
        if document is None:
            return OrderPartnerParty(id=partner_id or "", name="QuickPress Partner", phone="", image="", city="")
        image = document.get("bannerUrl") or document.get("cover") or document.get("logoUrl") or document.get("logo") or ""
        city_area = f"{document.get('address') or document.get('area', '')}, {document.get('city', '')}".strip(", ")
        return OrderPartnerParty(
            id=str(document.get("_id") or document.get("partnerId") or partner_id),
            name=document.get("businessName") or document.get("name") or "QuickPress Partner",
            phone=document.get("phone", ""),
            image=image,
            city=city_area or "Bengaluru",
        )


order_repository = OrderRepository()
