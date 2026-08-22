"""Partner domain repositories — Sprint 5.2 (MongoDB integration).

Collections
-----------
partner_profiles            one document per partner store (profile fields)
partner_services            rate-card line items, keyed by partnerId
partner_orders              partner facing projection of an order
partner_wallets             one wallet per partner account
partner_wallet_transactions append only ledger entries
partner_reviews             customer reviews for a partner
partner_analytics           cached dashboard/earnings snapshots (optional)
partner_settings            business settings per partner

All reads/writes go through `app.db.client.database` so the same code runs on
MongoDB Atlas and the in-memory preview store.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.db.client import database
from app.services import order_lifecycle as lifecycle

PROFILES = "partner_profiles"
SERVICES = "partner_services"
ORDERS = "partner_orders"
WALLETS = "partner_wallets"
WALLET_TXNS = "partner_wallet_transactions"
REVIEWS = "partner_reviews"
ANALYTICS = "partner_analytics"
SETTINGS = "partner_settings"

DEMO_PARTNER_ID = "PRT-10482"

ORDER_STAGES: List[Dict[str, str]] = [
    {"id": "placed", "label": "Order placed", "status": "new"},
    {"id": "accepted", "label": "Accepted", "status": "accepted"},
    {"id": "picked", "label": "Picked up by rider", "status": "picked"},
    {"id": "processing", "label": "In cleaning", "status": "processing"},
    {"id": "ready", "label": "Laundry completed", "status": "ready"},
    {"id": "delivered", "label": "Delivered", "status": "delivered"},
]

STAGE_RANK = {stage["status"]: index for index, stage in enumerate(ORDER_STAGES)}


def _now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _uid(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


class PartnerNotFoundError(Exception):
    pass


class PartnerAccessError(Exception):
    """The signed-in account may not act as a partner store."""


class InvalidTransitionError(Exception):
    pass


class PartnerRepository:
    """Profile + business settings."""

    async def resolve_partner_id(self, user) -> str:
        """The partner store id for the signed-in account."""
        role = getattr(user, "role", None)
        role_value = str(getattr(role, "value", role) or "")
        if role_value != "partner":
            raise PartnerAccessError("This account is not a partner account")
        user_id = str(getattr(user, "id", "") or "")
        account = await database.find_one("partners", {"user_id": user_id}) or {}
        store_id = (
            account.get("partner_id")
            or account.get("partnerId")
            or getattr(user, "linked_partner_id", None)
        )
        if not store_id:
            raise PartnerAccessError("Your account is not linked to a partner store yet")
        if await database.find_one(PROFILES, {"_id": str(store_id)}) is None:
            raise PartnerAccessError("The partner store linked to your account no longer exists")
        return str(store_id)

    async def link_account(self, user_id: str, store_id: str) -> None:
        """Attach a signed-in partner account to a real partner store."""
        await database.update(
            "partners", {"user_id": user_id}, {"partner_id": store_id}, upsert=True
        )

    async def profile(self, partner_id: str) -> Dict[str, Any]:
        doc = await database.find_one(PROFILES, {"_id": partner_id})
        if doc is None:
            doc = {
                "_id": partner_id,
                "partnerId": partner_id,
                "businessName": "QuickPress Partner Store",
                "ownerName": "Partner",
                "phone": "",
                "email": "",
                "city": "Bengaluru",
                "rating": 5.0,
                "totalOrders": 0,
                "joinedOn": datetime.now(timezone.utc).strftime("%B %Y"),
                "onTimeRate": 98.5,
                "tier": "Silver",
                "isOnline": True,
                "isVerified": True,
                "createdAt": _now(),
                "updatedAt": _now(),
            }
            await database.insert(PROFILES, doc)
        return doc

    async def update_profile(self, partner_id: str, changes: Dict[str, Any]) -> Dict[str, Any]:
        changes = {k: v for k, v in changes.items() if v is not None}
        if not changes:
            return await self.profile(partner_id)
        doc = await database.update(PROFILES, {"_id": partner_id}, changes)
        if doc is None:
            current = await self.profile(partner_id)
            doc = await database.update(PROFILES, {"_id": partner_id}, {**current, **changes}, upsert=True)
        return doc

    async def settings(self, partner_id: str) -> Dict[str, Any]:
        doc = await database.find_one(SETTINGS, {"_id": partner_id})
        if doc is None:
            doc = {
                "_id": partner_id,
                "partnerId": partner_id,
                "isStoreOpen": True,
                "acceptingNewOrders": True,
                "autoAcceptOrders": True,
                "expressDelivery": True,
                "pickupRadiusKm": 8,
                "openingTime": "08:00",
                "closingTime": "21:00",
                "weeklyOff": "None",
                "dailyOrderCap": 50,
            }
            await database.insert(SETTINGS, doc)
        return doc

    async def update_settings(self, partner_id: str, changes: Dict[str, Any]) -> Dict[str, Any]:
        changes = {k: v for k, v in changes.items() if v is not None}
        doc = await database.update(SETTINGS, {"_id": partner_id}, changes, upsert=True)
        return doc


class PartnerServiceRepository:
    async def list(self, partner_id: str) -> List[Dict[str, Any]]:
        return await database.find_sorted(SERVICES, {"partnerId": partner_id}, sort=[("name", 1)])

    async def create(self, partner_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        document = {
            "_id": _uid("svc"),
            "partnerId": partner_id,
            **payload,
        }
        return await database.insert(SERVICES, document)

    async def update(self, partner_id: str, service_id: str, changes: Dict[str, Any]) -> Dict[str, Any]:
        changes = {k: v for k, v in changes.items() if v is not None}
        existing = await database.find_one(SERVICES, {"_id": service_id, "partnerId": partner_id})
        if existing is None:
            raise PartnerNotFoundError("Service not found")
        return await database.update(SERVICES, {"_id": service_id}, changes)

    async def delete(self, partner_id: str, service_id: str) -> None:
        existing = await database.find_one(SERVICES, {"_id": service_id, "partnerId": partner_id})
        if existing is None:
            raise PartnerNotFoundError("Service not found")
        await database.delete_one(SERVICES, {"_id": service_id})

    async def toggle(self, partner_id: str, service_id: str, enabled: bool) -> Dict[str, Any]:
        return await self.update(partner_id, service_id, {"enabled": enabled})


def _timeline(events: Dict[str, str]) -> List[Dict[str, Any]]:
    return [
        {
            "id": stage["id"],
            "label": stage["label"],
            "time": events.get(stage["status"], "—"),
            "done": stage["status"] in events,
        }
        for stage in ORDER_STAGES
    ]


class PartnerOrderRepository:
    """The partner's view of the ONE canonical order (customer_orders).

    Nothing here owns an order: every read is a projection of the canonical
    document and every write goes through the shared lifecycle service, so the
    customer, rider and admin apps see the change immediately, under the same
    canonical orderId.
    """

    async def _orders_for(self, partner_id: str) -> List[Dict[str, Any]]:
        docs = await database.find_many(lifecycle.ORDERS, {"partner.id": partner_id})
        if not docs:  # in-memory store cannot match nested keys
            docs = [
                d
                for d in await database.find_many(lifecycle.ORDERS, {})
                if (d.get("partner") or {}).get("id") == partner_id
            ]
        docs.sort(key=lambda d: d.get("createdAt") or "", reverse=True)
        return docs

    async def list(
        self,
        partner_id: str,
        *,
        status: Optional[str] = None,
        q: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        items = [lifecycle.to_partner_order(d) for d in await self._orders_for(partner_id)]
        if status and status != "all":
            items = [item for item in items if item["status"] == status]
        if q:
            term = q.strip().lower()
            items = [
                item
                for item in items
                if term in f"{item['code']} {item['customerName']} {item['customerPhone']}".lower()
            ]
        page = max(1, page)
        page_size = max(1, min(page_size, 100))
        window = items[(page - 1) * page_size : page * page_size]
        return {
            "items": window,
            "total": len(items),
            "page": page,
            "pageSize": page_size,
            "hasMore": page * page_size < len(items),
        }

    async def by_id(self, partner_id: str, order_id: str) -> Dict[str, Any]:
        order = await lifecycle.find_order(order_id)
        if order is None:
            raise PartnerNotFoundError("Order not found")
        try:
            lifecycle.assert_partner(order, partner_id)
        except lifecycle.OrderAuthorizationError as error:
            raise PartnerAccessError(str(error)) from error
        return lifecycle.to_partner_order(order)

    async def _transition(
        self,
        partner_id: str,
        order_id: str,
        target: str,
        *,
        metadata: Optional[Dict[str, Any]] = None,
        changes: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        await self.by_id(partner_id, order_id)  # existence + ownership
        try:
            updated = await lifecycle.transition(
                order_id,
                target,
                actor_id=partner_id,
                actor_role="partner",
                metadata=metadata,
                changes=changes,
            )
        except lifecycle.OrderNotFoundError as error:
            raise PartnerNotFoundError(str(error)) from error
        except (lifecycle.InvalidTransitionError, lifecycle.DuplicateActionError) as error:
            raise InvalidTransitionError(str(error)) from error
        return lifecycle.to_partner_order(updated)

    async def accept(self, partner_id: str, order_id: str) -> Dict[str, Any]:
        return await self._transition(partner_id, order_id, lifecycle.PARTNER_ACCEPTED)

    async def reject(self, partner_id: str, order_id: str, reason: str) -> Dict[str, Any]:
        text = reason or "Rejected by store"
        return await self._transition(
            partner_id,
            order_id,
            lifecycle.CANCELLED,
            metadata={"reason": text},
            changes={"cancelledReason": text},
        )

    async def start_processing(self, partner_id: str, order_id: str) -> Dict[str, Any]:
        return await self._transition(partner_id, order_id, lifecycle.PROCESSING)

    async def complete(self, partner_id: str, order_id: str) -> Dict[str, Any]:
        return await self._transition(partner_id, order_id, lifecycle.COMPLETED)

    async def history(self, partner_id: str) -> List[Dict[str, Any]]:
        return [
            lifecycle.to_partner_order(d)
            for d in await self._orders_for(partner_id)
            if lifecycle.order_status(d) in (lifecycle.DELIVERED, lifecycle.CANCELLED)
        ]

    async def dashboard(self, partner_id: str) -> Dict[str, Any]:
        orders = [lifecycle.to_partner_order(d) for d in await self._orders_for(partner_id)]
        delivered = [o for o in orders if o["status"] == "delivered"]
        return {
            "newOrders": sum(1 for o in orders if o["status"] == "new"),
            "inProgress": sum(
                1 for o in orders if o["status"] in ("accepted", "picked", "processing")
            ),
            "readyForDelivery": sum(1 for o in orders if o["status"] == "ready"),
            "delivered": len(delivered),
            "earningsToday": sum(round(o["amount"] * 0.8) for o in delivered),
        }

    async def earnings(self, partner_id: str) -> Dict[str, Any]:
        delivered = [
            lifecycle.to_partner_order(d)
            for d in await self._orders_for(partner_id)
            if lifecycle.order_status(d) == lifecycle.DELIVERED
        ]
        return {"total": sum(round(o["amount"] * 0.8) for o in delivered), "orders": len(delivered)}


class PartnerWalletRepository:
    async def wallet(self, partner_id: str) -> Optional[Dict[str, Any]]:
        return await database.find_one(WALLETS, {"accountId": partner_id})

    async def transactions(self, partner_id: str) -> List[Dict[str, Any]]:
        return await database.find_sorted(
            WALLET_TXNS, {"accountId": partner_id}, sort=[("date", -1)]
        )

    async def withdraw(self, partner_id: str, amount: float) -> Dict[str, Any]:
        wallet = await self.wallet(partner_id)
        if wallet is None:
            raise PartnerNotFoundError("Wallet not found")
        if amount <= 0:
            raise InvalidTransitionError("Withdrawal amount must be greater than zero")
        if amount > wallet.get("balance", 0):
            raise InvalidTransitionError("Insufficient wallet balance")
        new_balance = wallet["balance"] - amount
        await database.update(WALLETS, {"accountId": partner_id}, {"balance": new_balance})
        txn = {
            "_id": _uid("wtx"),
            "accountId": partner_id,
            "title": "Withdrawal to bank",
            "date": _now(),
            "amount": amount,
            "direction": "debit",
            "status": "success",
            "kind": "withdrawal",
        }
        await database.insert(WALLET_TXNS, txn)
        return await self.wallet(partner_id)


class PartnerReviewRepository:
    async def list(self, partner_id: str) -> List[Dict[str, Any]]:
        return await database.find_sorted(
            REVIEWS, {"partnerId": partner_id}, sort=[("date", -1)]
        )


partner_repository = PartnerRepository()
partner_service_repository = PartnerServiceRepository()
partner_order_repository = PartnerOrderRepository()
partner_wallet_repository = PartnerWalletRepository()
partner_review_repository = PartnerReviewRepository()


# ---------------------------------------------------------------------------
# Idempotent seed — applied via `database.upsert_seed(PARTNER_SEED)` so the
# partner app is never blank in preview.
# ---------------------------------------------------------------------------

_SEED_EVENTS_NEW = {"new": "2024-05-01T08:00:00Z"}
_SEED_EVENTS_ACCEPTED = {"new": "2024-05-01T08:00:00Z", "accepted": "2024-05-01T08:20:00Z"}
_SEED_EVENTS_PROCESSING = {
    "new": "2024-05-01T08:00:00Z",
    "accepted": "2024-05-01T08:20:00Z",
    "picked": "2024-05-01T10:00:00Z",
    "processing": "2024-05-01T10:30:00Z",
}
_SEED_EVENTS_DELIVERED = {
    "new": "2024-04-28T08:00:00Z",
    "accepted": "2024-04-28T08:20:00Z",
    "picked": "2024-04-28T10:00:00Z",
    "processing": "2024-04-28T10:30:00Z",
    "ready": "2024-04-28T14:00:00Z",
    "delivered": "2024-04-28T18:00:00Z",
}


def _seed_order(
    _id: str,
    code: str,
    status: str,
    events: Dict[str, str],
    customer_name: str,
    customer_phone: str,
    amount: int,
    placed_at_raw: str,
) -> Dict[str, Any]:
    return {
        "_id": _id,
        "partnerId": DEMO_PARTNER_ID,
        "code": code,
        "customerName": customer_name,
        "customerPhone": customer_phone,
        "status": status,
        "placedAt": "9:00 AM",
        "placedAtRaw": placed_at_raw,
        "slot": "8 AM – 12 PM",
        "address": "12, MG Road, Bengaluru",
        "itemCount": 5,
        "amount": amount,
        "paymentMode": "online",
        "serviceLabel": "Wash & Fold",
        "items": [
            {"id": "itm-1", "name": "Shirt", "qty": 3, "price": 40},
            {"id": "itm-2", "name": "Trousers", "qty": 2, "price": 60},
        ],
        "events": events,
        "timeline": _timeline(events),
        "cancelledReason": None,
        "createdAt": placed_at_raw,
        "updatedAt": placed_at_raw,
    }


PARTNER_SEED: Dict[str, List[Dict[str, Any]]] = {
    PROFILES: [
        {
            "_id": DEMO_PARTNER_ID,
            "partnerId": DEMO_PARTNER_ID,
            "businessName": "Sparkle Laundry Co.",
            "ownerName": "Ravi Kumar",
            "phone": "+91 98765 43210",
            "email": "ravi@sparklelaundry.in",
            "city": "Bengaluru",
            "rating": 4.6,
            "totalOrders": 1284,
            "joinedOn": "2022-03-14",
            "onTimeRate": 96.5,
            "tier": "Gold",
        }
    ],
    SETTINGS: [
        {
            "_id": DEMO_PARTNER_ID,
            # Canonical id in both cases: without `partner_id` this seed row is
            # invisible to partner_id lookups and to the partial unique index.
            "partnerId": DEMO_PARTNER_ID,
            "partner_id": DEMO_PARTNER_ID,
            "isStoreOpen": True,

            "acceptingNewOrders": True,
            "autoAcceptOrders": False,
            "expressDelivery": True,
            "pickupRadiusKm": 6,
            "openingTime": "08:00",
            "closingTime": "21:00",
            "weeklyOff": "Sunday",
            "dailyOrderCap": 40,
        }
    ],
    SERVICES: [
        {
            "_id": "svc-wash-fold",
            "partnerId": DEMO_PARTNER_ID,
            "name": "Wash & Fold",
            "unit": "per kg",
            "price": 79,
            "turnaroundHours": 24,
            "enabled": True,
            "category": "laundry",
        },
        {
            "_id": "svc-dry-clean",
            "partnerId": DEMO_PARTNER_ID,
            "name": "Dry Clean",
            "unit": "per item",
            "price": 149,
            "turnaroundHours": 48,
            "enabled": True,
            "category": "dry-clean",
        },
        {
            "_id": "svc-steam-iron",
            "partnerId": DEMO_PARTNER_ID,
            "name": "Steam Iron",
            "unit": "per item",
            "price": 25,
            "turnaroundHours": 12,
            "enabled": True,
            "category": "premium",
        },
        {
            "_id": "svc-shoe-care",
            "partnerId": DEMO_PARTNER_ID,
            "name": "Shoe Care",
            "unit": "per pair",
            "price": 199,
            "turnaroundHours": 48,
            "enabled": False,
            "category": "shoe-care",
        },
    ],
    ORDERS: [
        _seed_order(
            "ord-p-1001", "QP1041", "new", _SEED_EVENTS_NEW,
            "Anita Sharma", "+91 90000 11111", 480, "2024-05-01T08:00:00Z",
        ),
        _seed_order(
            "ord-p-1002", "QP1042", "accepted", _SEED_EVENTS_ACCEPTED,
            "Vikram Rao", "+91 90000 22222", 620, "2024-05-01T09:00:00Z",
        ),
        _seed_order(
            "ord-p-1003", "QP1043", "processing", _SEED_EVENTS_PROCESSING,
            "Deepa Iyer", "+91 90000 33333", 350, "2024-05-01T07:00:00Z",
        ),
        _seed_order(
            "ord-p-1004", "QP1040", "delivered", _SEED_EVENTS_DELIVERED,
            "Sanjay Mehta", "+91 90000 44444", 890, "2024-04-28T08:00:00Z",
        ),
    ],
    WALLETS: [
        {
            "_id": f"wlt-{DEMO_PARTNER_ID}",
            "accountId": DEMO_PARTNER_ID,
            "balance": 18450.0,
            "cashbackBalance": 320.0,
            "rewardPoints": 640,
            "referralCode": "SPARKLE10",
            "referralEarned": 500.0,
            "onHold": 1200.0,
            "lifetimeEarned": 96500.0,
            "bankLast4": "4821",
            "autoPayout": True,
        }
    ],
    WALLET_TXNS: [
        {
            "_id": "wtx-p-1",
            "accountId": DEMO_PARTNER_ID,
            "title": "Order QP1040 payout",
            "date": "2024-04-28T19:00:00Z",
            "amount": 712.0,
            "direction": "credit",
            "status": "success",
            "kind": "payout",
        },
        {
            "_id": "wtx-p-2",
            "accountId": DEMO_PARTNER_ID,
            "title": "Platform commission",
            "date": "2024-04-28T19:05:00Z",
            "amount": 178.0,
            "direction": "debit",
            "status": "success",
            "kind": "commission",
        },
        {
            "_id": "wtx-p-3",
            "accountId": DEMO_PARTNER_ID,
            "title": "Weekly payout to bank",
            "date": "2024-04-25T10:00:00Z",
            "amount": 5200.0,
            "direction": "debit",
            "status": "pending",
            "kind": "recharge",
        },
    ],
    REVIEWS: [
        {
            "_id": "rev-p-1",
            "partnerId": DEMO_PARTNER_ID,
            "customerName": "Anita Sharma",
            "rating": 5,
            "comment": "Excellent service, clothes were spotless!",
            "date": "2024-04-20T10:00:00Z",
        },
        {
            "_id": "rev-p-2",
            "partnerId": DEMO_PARTNER_ID,
            "customerName": "Vikram Rao",
            "rating": 4,
            "comment": "Good but delivery was slightly late.",
            "date": "2024-04-18T10:00:00Z",
        },
    ],
    ANALYTICS: [
        {
            "_id": f"an-{DEMO_PARTNER_ID}",
            "partnerId": DEMO_PARTNER_ID,
            "updatedAt": "2024-05-01T00:00:00Z",
        }
    ],
}
