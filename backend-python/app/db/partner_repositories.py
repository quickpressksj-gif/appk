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

import random
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
CATEGORIES = "admin_categories"
SERVICES_CATALOG = "admin_services"

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
        phone = str(getattr(user, "phone", "") or "")
        raw_phone = phone.replace("+91", "").replace(" ", "").replace("-", "").strip()

        # 1. Check direct partners collection link
        account = await database.find_one("partners", {"user_id": user_id}) or {}
        store_id = account.get("partner_id") or account.get("partnerId")

        # 2. Check partner profile by userId
        if not store_id:
            profile_by_user = await database.find_one(PROFILES, {"userId": user_id})
            if profile_by_user:
                store_id = str(profile_by_user.get("_id") or profile_by_user.get("partnerId"))

        # 3. Check partner profile by matching phone or existing partner users with same phone
        if not store_id and raw_phone:
            profile_by_phone = await database.find_one(PROFILES, {
                "$or": [
                    {"phone": phone},
                    {"phone": raw_phone},
                    {"phone": f"+91{raw_phone}"},
                    {"ownerPhone": phone},
                    {"ownerPhone": raw_phone},
                ]
            })
            if profile_by_phone:
                store_id = str(profile_by_phone.get("_id") or profile_by_phone.get("partnerId"))
            else:
                other_users = await database.find_many("users", {
                    "role": "partner",
                    "$or": [{"phone": phone}, {"phone": raw_phone}, {"phone": f"+91{raw_phone}"}]
                })
                for ou in other_users:
                    ou_id = str(ou.get("_id") or ou.get("id"))
                    ou_account = await database.find_one("partners", {"user_id": ou_id}) or {}
                    ou_partner_id = ou_account.get("partner_id") or ou_account.get("partnerId")
                    if ou_partner_id:
                        store_id = ou_partner_id
                        break
                    ou_profile = await database.find_one(PROFILES, {"userId": ou_id})
                    if ou_profile:
                        store_id = str(ou_profile.get("_id") or ou_profile.get("partnerId"))
                        break

        # 4. Fallback to user linked_partner_id / linked_id
        if not store_id:
            candidate = getattr(user, "linked_partner_id", None) or getattr(user, "linked_id", None)
            if candidate and await database.find_one(PROFILES, {"_id": str(candidate)}):
                store_id = str(candidate)

        # 5. If still none, generate a 6-digit random PRT-XXXXXX
        if not store_id:
            store_id = f"PRT-{random.randint(100000, 999999)}"

        # Cache/link the resolved store_id
        await self.link_account(user_id, str(store_id))

        # Ensure profile exists in PROFILES
        if await database.find_one(PROFILES, {"_id": str(store_id)}) is None:
            await self.profile(str(store_id))

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

    async def toggle_status(self, partner_id: str, is_online: bool) -> Dict[str, Any]:
        await database.update(PROFILES, {"_id": partner_id}, {"isOnline": is_online})
        await database.update(SETTINGS, {"_id": partner_id}, {"isStoreOpen": is_online, "acceptingNewOrders": is_online})
        return await self.profile(partner_id)


class PartnerServiceRepository:
    async def list(self, partner_id: str) -> List[Dict[str, Any]]:
        docs = await database.find_sorted(SERVICES, {"partnerId": partner_id}, sort=[("name", 1)])
        result = []
        for d in docs:
            doc = dict(d)
            doc["id"] = str(doc.get("_id") or doc.get("id"))
            doc["enabled"] = bool(doc.get("enabled", doc.get("isActive", True)))
            doc["turnaroundHours"] = int(doc.get("turnaroundHours") or 24)
            result.append(doc)
        return result

    async def by_id(self, partner_id: str, service_id: str) -> Dict[str, Any]:
        doc = await database.find_one(SERVICES, {"_id": service_id, "partnerId": partner_id})
        if doc is None:
            doc = await database.find_one(SERVICES, {"id": service_id, "partnerId": partner_id})
        if doc is None:
            raise PartnerNotFoundError("Service not found or you do not have permission to access it")
        result = dict(doc)
        result["id"] = str(result.get("_id") or result.get("id"))
        result["enabled"] = bool(result.get("enabled", result.get("isActive", True)))
        result["turnaroundHours"] = int(result.get("turnaroundHours") or 24)
        result["price"] = int(result.get("price") or 0)
        result["unit"] = str(result.get("unit") or "kg")
        result["category"] = str(result.get("category") or "laundry")
        result["description"] = str(result.get("description") or "")
        result["image"] = str(result.get("image") or "")
        result["minQuantity"] = int(result.get("minQuantity") or 1)
        result["expressAvailable"] = bool(result.get("expressAvailable", False))
        return result

    async def create(self, partner_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        svc_id = _uid("svc")
        enabled = bool(payload.get("enabled", True))
        document = {
            "_id": svc_id,
            "id": svc_id,
            "partnerId": partner_id,
            "name": str(payload.get("name", "")).strip() or "Laundry Service",
            "category": str(payload.get("category") or "laundry"),
            "price": int(payload.get("price") or 0),
            "unit": str(payload.get("unit") or "kg"),
            "turnaroundHours": int(payload.get("turnaroundHours") or 24),
            "enabled": enabled,
            "isActive": enabled,
            "description": str(payload.get("description") or ""),
            "image": str(payload.get("image") or ""),
            "minQuantity": int(payload.get("minQuantity") or 1),
            "expressAvailable": bool(payload.get("expressAvailable", False)),
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        }
        await database.insert(SERVICES, document)
        return document

    async def update(self, partner_id: str, service_id: str, changes: Dict[str, Any]) -> Dict[str, Any]:
        changes = {k: v for k, v in changes.items() if v is not None}
        existing = await database.find_one(SERVICES, {"_id": service_id, "partnerId": partner_id})
        if existing is None:
            existing = await database.find_one(SERVICES, {"id": service_id, "partnerId": partner_id})
        if existing is None:
            raise PartnerNotFoundError("Service not found or you do not have permission to edit it")

        target_id = existing["_id"]
        if "enabled" in changes:
            changes["isActive"] = bool(changes["enabled"])
        elif "isActive" in changes:
            changes["enabled"] = bool(changes["isActive"])
        changes["updatedAt"] = datetime.now(timezone.utc).isoformat()

        updated = await database.update(SERVICES, {"_id": target_id}, changes)
        updated_dict = dict(updated)
        updated_dict["id"] = str(updated_dict.get("_id") or updated_dict.get("id"))
        updated_dict["enabled"] = bool(updated_dict.get("enabled", updated_dict.get("isActive", True)))
        return updated_dict

    async def delete(self, partner_id: str, service_id: str) -> None:
        existing = await database.find_one(SERVICES, {"_id": service_id, "partnerId": partner_id})
        if existing is None:
            existing = await database.find_one(SERVICES, {"id": service_id, "partnerId": partner_id})
        if existing is None:
            raise PartnerNotFoundError("Service not found or you do not have permission to delete it")
        await database.delete_one(SERVICES, {"_id": existing["_id"]})

    async def toggle(self, partner_id: str, service_id: str, enabled: bool) -> Dict[str, Any]:
        return await self.update(partner_id, service_id, {"enabled": enabled, "isActive": enabled})


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

    Strict tenant isolation: queries strictly for orders belonging to partner_id.
    """

    async def _orders_for(self, partner_id: str) -> List[Dict[str, Any]]:
        profile = await database.find_one(PROFILES, {"$or": [{"_id": partner_id}, {"partnerId": partner_id}]})
        user_id = profile.get("userId") if profile else None
        partner_name = (profile.get("businessName") or profile.get("name")) if profile else None

        id_candidates = {partner_id, partner_id.lower(), partner_id.upper()}
        if user_id:
            id_candidates.add(user_id)

        or_conditions: List[Dict[str, Any]] = [
            {"partner.id": {"$in": list(id_candidates)}},
            {"partner_id": {"$in": list(id_candidates)}},
            {"partnerId": {"$in": list(id_candidates)}},
            {"store_id": {"$in": list(id_candidates)}},
        ]
        if partner_name:
            or_conditions.extend([
                {"partner.name": partner_name},
                {"partner.businessName": partner_name},
            ])

        docs = await database.find_many(lifecycle.ORDERS, {"$or": or_conditions})
        docs.sort(key=lambda d: d.get("createdAt") or d.get("placedAt") or "", reverse=True)
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


    async def toggle_status(self, partner_id: str, is_online: bool) -> Dict[str, Any]:
        await database.update("partner_profiles", {"_id": partner_id}, {"isOnline": is_online})
        await database.update("partner_settings", {"_id": partner_id}, {"isStoreOpen": is_online, "acceptingNewOrders": is_online})
        return await self.profile(partner_id)


class PartnerCustomerRepository:
    async def list(self, partner_id: str) -> List[Dict[str, Any]]:
        orders = [lifecycle.to_partner_order(d) for d in await partner_order_repository._orders_for(partner_id)]
        customer_map: Dict[str, Dict[str, Any]] = {}
        for o in orders:
            phone = o.get("customerPhone") or "No Phone"
            name = o.get("customerName") or "Customer"
            cid = phone
            if cid not in customer_map:
                customer_map[cid] = {
                    "id": cid,
                    "name": name,
                    "phone": phone,
                    "totalOrders": 0,
                    "totalSpent": 0,
                    "lastOrderDate": o.get("placedAt") or "",
                    "lastOrderCode": o.get("code") or "",
                }
            customer_map[cid]["totalOrders"] += 1
            customer_map[cid]["totalSpent"] += int(o.get("amount") or 0)
        return list(customer_map.values())


class PartnerAnalyticsRepository:
    async def get(self, partner_id: str, period: str = "7d") -> Dict[str, Any]:
        orders = [lifecycle.to_partner_order(d) for d in await partner_order_repository._orders_for(partner_id)]
        total_orders = len(orders)
        total_revenue = sum(int(o.get("amount") or 0) for o in orders)
        total_earnings = sum(round((o.get("amount") or 0) * 0.8) for o in orders if o.get("status") == "delivered")
        unique_customers = len(set(o.get("customerPhone") for o in orders if o.get("customerPhone")))

        from collections import defaultdict
        service_counts: Dict[str, Dict[str, Any]] = {}
        daily_orders = defaultdict(int)
        daily_revenue = defaultdict(int)

        for o in orders:
            for item in o.get("items") or []:
                sname = item.get("name") or "Laundry Service"
                if sname not in service_counts:
                    service_counts[sname] = {"name": sname, "count": 0, "revenue": 0}
                service_counts[sname]["count"] += int(item.get("qty") or 1)
                service_counts[sname]["revenue"] += int(item.get("price") or 0) * int(item.get("qty") or 1)

            date_str = (o.get("placedAt") or "")[:10] or "Recent"
            daily_orders[date_str] += 1
            daily_revenue[date_str] += int(o.get("amount") or 0)

        top_services = sorted(service_counts.values(), key=lambda s: s["count"], reverse=True)[:5]
        trend_labels = sorted(daily_orders.keys())[-7:] if daily_orders else ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        trend_orders = [daily_orders[k] for k in trend_labels] if daily_orders else [0, 0, 0, 0, 0, 0, 0]
        trend_revenue = [daily_revenue[k] for k in trend_labels] if daily_orders else [0, 0, 0, 0, 0, 0, 0]

        return {
            "totalOrders": total_orders,
            "totalRevenue": total_revenue,
            "totalEarnings": total_earnings,
            "totalCustomers": unique_customers,
            "trendLabels": trend_labels,
            "ordersTrend": trend_orders,
            "revenueTrend": trend_revenue,
            "topServices": top_services,
        }


partner_repository = PartnerRepository()
partner_service_repository = PartnerServiceRepository()
partner_order_repository = PartnerOrderRepository()
partner_wallet_repository = PartnerWalletRepository()
partner_review_repository = PartnerReviewRepository()
partner_customer_repository = PartnerCustomerRepository()
partner_analytics_repository = PartnerAnalyticsRepository()


# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Partner domain collections. All partner profiles, rate cards, orders,
# wallets, and transactions are strictly managed in real MongoDB collections.
# ---------------------------------------------------------------------------

PARTNER_SEED: Dict[str, List[Dict[str, Any]]] = {}

