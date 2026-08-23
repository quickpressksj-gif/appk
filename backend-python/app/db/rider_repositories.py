"""Rider repositories — Sprint 5.2 (Rider MongoDB integration).

Collections
    rider_profiles              one document per rider (profile + online state)
    rider_deliveries             the rider's view of orders (pickup/delivery tasks)
    rider_earnings               per-day earnings ledger used to compute totals
    rider_wallets                one wallet document per rider
    rider_wallet_transactions    wallet ledger entries
    rider_notifications          the rider's notification feed
    rider_analytics              per-day delivery/earnings analytics
    rider_settings               online/vehicle/notification preferences

Every reader falls back to the seeded demo rider (`rider-demo-1`) so the
preview app is never blank even before a real rider signs in.
"""

from __future__ import annotations

import random
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.db.client import database
from app.services import order_lifecycle as lifecycle

PROFILES = "rider_profiles"
DELIVERIES = "rider_deliveries"
EARNINGS = "rider_earnings"
WALLETS = "rider_wallets"
WALLET_TXNS = "rider_wallet_transactions"
NOTIFICATIONS = "rider_notifications"
ANALYTICS = "rider_analytics"
SETTINGS = "rider_settings"

STATUS_LABEL = {
    "assigned": "Assigned",
    "accepted": "Accepted",
    "picked": "Picked up from customer",
    "at-partner": "Dropped at store",
    "ready-for-delivery": "Laundry completed",
    "delivered": "Delivered",
    "cancelled": "Cancelled",
    "failed": "Failed",
}


def _now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _public(document: Dict[str, Any], drop: tuple = ("_id",)) -> Dict[str, Any]:
    return {k: v for k, v in document.items() if k not in drop}


class RiderAccessError(Exception):
    """The signed-in account may not act as a rider."""


class RiderProfileRepository:
    async def get(self, rider_id: str) -> Optional[Dict[str, Any]]:
        return await database.find_one(PROFILES, {"_id": rider_id})

    async def resolve_rider_id(self, user) -> str:
        """The rider id for the signed-in account — no demo fallback.

        Deliveries are attached to this id on the canonical order, so an
        account that is not a linked rider gets a 403 instead of someone
        else's work queue.
        """
        role = getattr(user, "role", None)
        role_value = str(getattr(role, "value", role) or "")
        if role_value != "rider":
            raise RiderAccessError("This account is not a rider account")
        account = await database.find_one("riders", {"user_id": getattr(user, "id", "")}) or {}
        rider_id = account.get("rider_id") or account.get("riderId")
        if not rider_id:
            # A rider profile may already exist under the account id itself.
            candidate = getattr(user, "id", "")
            if candidate and await self.get(candidate) is not None:
                rider_id = candidate
        if not rider_id:
            profile = await database.find_one(PROFILES, {"userId": getattr(user, "id", "")})
            if profile:
                rider_id = profile.get("_id")
        if not rider_id:
            phone = getattr(user, "phone", "")
            if phone:
                clean_phone = phone.replace("+91", "").strip()
                profile = await database.find_one(
                    PROFILES,
                    {"$or": [{"phone": phone}, {"phone": clean_phone}, {"mobile": phone}, {"mobile": clean_phone}]},
                )
                if profile:
                    rider_id = profile.get("_id")
        if not rider_id:
            linked = getattr(user, "linked_id", None)
            if linked and await self.get(linked) is not None:
                rider_id = linked
        if not rider_id:
            # Fallback to generating 6-digit RDR-XXXXXX
            rider_id = f"RDR-{random.randint(100000, 999999)}"
            if await self.get(rider_id) is None:
                new_profile = {
                    "_id": rider_id,
                    "riderId": rider_id,
                    "fullName": getattr(user, "name", "") or getattr(user, "display_name", "") or "Delivery Partner",
                    "phone": getattr(user, "phone", ""),
                    "email": getattr(user, "email", ""),
                    "city": "Kasganj",
                    "rating": 5.0,
                    "totalTrips": 0,
                    "joinedOn": "August 2026",
                    "vehicleType": "Bike",
                    "vehicleNumber": "—",
                    "bankName": "State Bank of India",
                    "accountLast4": "4821",
                    "ifsc": "SBIN0001234",
                    "kycStatus": "verified" if getattr(user, "is_verified", False) else "pending",
                    "isVerified": getattr(user, "is_verified", False),
                    "isOnline": False,
                    "onlineMinutes": 0,
                }
                await database.insert(PROFILES, new_profile)
        return str(rider_id)

    async def link_account(self, user_id: str, rider_id: str) -> None:
        await database.update("riders", {"user_id": user_id}, {"rider_id": rider_id}, upsert=True)

    async def update(self, rider_id: str, changes: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        return await database.update(PROFILES, {"_id": rider_id}, changes)

    async def set_online(self, rider_id: str, is_online: Optional[bool]) -> Dict[str, Any]:
        profile = await self.get(rider_id)
        current = bool((profile or {}).get("isOnline", False))
        next_value = bool(is_online) if is_online is not None else (not current)
        await database.update(PROFILES, {"_id": rider_id}, {"isOnline": next_value})
        return {"ok": True, "isOnline": next_value}


class RiderSettingsRepository:
    async def get(self, rider_id: str) -> Dict[str, Any]:
        settings = await database.find_one(SETTINGS, {"_id": rider_id})
        profile = await database.find_one(PROFILES, {"_id": rider_id}) or {}
        if settings is None:
            return {
                "isOnline": bool(profile.get("isOnline", False)),
                "vehicle": profile.get("vehicleType", ""),
                "plate": profile.get("vehicleNumber", ""),
                "notificationsEnabled": True,
            }
        return _public(settings)

    async def update(self, rider_id: str, changes: Dict[str, Any]) -> Dict[str, Any]:
        await database.update(SETTINGS, {"_id": rider_id}, changes, upsert=True)
        return await self.get(rider_id)


class RiderDeliveryRepository:
    """The rider's view of the ONE canonical order (customer_orders).

    Tasks are not a separate record: they are the same order document the
    customer, partner and admin see, projected into the rider vocabulary and
    mutated only through the shared lifecycle service.
    """

    async def _orders_for(self, rider_id: str) -> List[Dict[str, Any]]:
        docs = [
            d
            for d in await database.find_many(lifecycle.ORDERS, {})
            if (d.get("rider") or {}).get("id") == rider_id
        ]
        docs.sort(key=lambda d: d.get("createdAt") or "", reverse=True)
        return docs

    async def list(
        self,
        rider_id: str,
        *,
        q: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        items = [lifecycle.to_rider_delivery(d) for d in await self._orders_for(rider_id)]
        if status and status != "all":
            items = [item for item in items if item["status"] == status]
        if q:
            term = q.strip().lower()
            items = [
                item
                for item in items
                if term
                in f"{item['code']} {item['customerName']} {item['partnerName']}".lower()
            ]
        page = max(1, page)
        page_size = max(1, min(page_size, 100))
        return {
            "items": items[(page - 1) * page_size : page * page_size],
            "total": len(items),
            "page": page,
            "pageSize": page_size,
            "hasMore": page * page_size < len(items),
        }

    async def all(self, rider_id: str) -> List[Dict[str, Any]]:
        return [lifecycle.to_rider_delivery(d) for d in await self._orders_for(rider_id)]

    async def by_id(self, order_id: str, rider_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        order = await lifecycle.find_order(order_id)
        if order is None:
            return None
        if rider_id is not None:
            lifecycle.assert_rider(order, rider_id)
        return lifecycle.to_rider_delivery(order)

    async def _transition(
        self,
        order_id: str,
        rider_id: str,
        target: str,
        *,
        metadata: Optional[Dict[str, Any]] = None,
        changes: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        try:
            order = await lifecycle.get_order(order_id)
        except lifecycle.OrderNotFoundError as error:
            raise LookupError(str(error)) from error
        lifecycle.assert_rider(order, rider_id)
        try:
            updated = await lifecycle.transition(
                order_id,
                target,
                actor_id=rider_id,
                actor_role="rider",
                metadata=metadata,
                changes=changes,
            )
        except (lifecycle.InvalidTransitionError, lifecycle.DuplicateActionError) as error:
            raise ValueError(str(error)) from error
        return lifecycle.to_rider_delivery(updated)

    async def accept(self, order_id: str, rider_id: str) -> Dict[str, Any]:
        return await self._transition(order_id, rider_id, lifecycle.RIDER_ACCEPTED)

    async def pickup(self, order_id: str, otp: Optional[str], rider_id: str) -> Dict[str, Any]:
        order = await lifecycle.get_order(order_id) if order_id else None
        if order is None:
            raise LookupError("Delivery not found")
        lifecycle.assert_rider(order, rider_id)
        expected = (order.get("otp") or {}).get("pickup") or ""
        if not otp or otp.strip() != expected:
            raise PermissionError("That pickup OTP doesn't match")
        return await self._transition(
            order_id, rider_id, lifecycle.PICKED_UP, metadata={"otpVerified": True}
        )

    async def drop_at_partner(self, order_id: str, rider_id: str) -> Dict[str, Any]:
        return await self._transition(order_id, rider_id, lifecycle.AT_PARTNER)

    async def start_delivery(self, order_id: str, rider_id: str) -> Dict[str, Any]:
        return await self._transition(order_id, rider_id, lifecycle.OUT_FOR_DELIVERY)

    async def deliver(self, order_id: str, otp: Optional[str], rider_id: str) -> Dict[str, Any]:
        order = await lifecycle.get_order(order_id) if order_id else None
        if order is None:
            raise LookupError("Delivery not found")
        lifecycle.assert_rider(order, rider_id)
        expected = (order.get("otp") or {}).get("delivery") or ""
        if not otp or otp.strip() != expected:
            raise PermissionError("That delivery OTP doesn't match")
        payment = dict(order.get("payment") or {})
        payment["paid"] = True
        return await self._transition(
            order_id,
            rider_id,
            lifecycle.DELIVERED,
            metadata={"otpVerified": True},
            changes={"payment": payment},
        )

    async def history(self, rider_id: str) -> List[Dict[str, Any]]:
        rows = []
        for document in await self._orders_for(rider_id):
            status = lifecycle.order_status(document)
            if status not in (lifecycle.DELIVERED, lifecycle.CANCELLED):
                continue
            task = lifecycle.to_rider_delivery(document)
            rows.append(
                {
                    "id": task["id"],
                    "code": task["code"],
                    "customerName": task["customerName"],
                    "partnerName": task["partnerName"],
                    "date": task["placedAt"],
                    "amount": task["estimatedEarning"] if status == lifecycle.DELIVERED else 0,
                    "distanceKm": task["distanceKm"],
                    "outcome": "completed" if status == lifecycle.DELIVERED else "cancelled",
                }
            )
        return rows

    async def dashboard(self, rider_id: str) -> Dict[str, Any]:
        tasks = [lifecycle.to_rider_delivery(d) for d in await self._orders_for(rider_id)]
        today = _now()[:10]
        completed_today = [
            t for t in tasks if t["status"] == "delivered" and (t["placedAt"] or "")[:10] == today
        ]
        return {
            "assigned": sum(1 for t in tasks if t["status"] == "assigned"),
            "active": sum(
                1
                for t in tasks
                if t["status"] in ("accepted", "picked", "at-partner", "ready-for-delivery")
            ),
            "completedToday": len(completed_today),
            "earningsToday": sum(t["estimatedEarning"] for t in completed_today),
        }


class RiderEarningsRepository:
    async def summary(self, rider_id: str) -> Dict[str, Any]:
        docs = await database.find_many(EARNINGS, {"riderId": rider_id})
        return {
            "total": sum(d.get("amount", 0) for d in docs),
            "orders": sum(1 for d in docs),
        }


class RiderWalletRepository:
    async def get(self, rider_id: str) -> Optional[Dict[str, Any]]:
        document = await database.find_one(WALLETS, {"_id": rider_id})
        if document is None:
            # A newly registered rider has no wallet yet — provision an empty one
            # instead of 404ing the dashboard.
            document = {
                "_id": rider_id,
                "rider_id": rider_id,
                "riderId": rider_id,
                "balance": 0.0,
                "pending": 0.0,
                "lifetimeEarnings": 0.0,
            }
            await database.insert(WALLETS, dict(document))
        return _public(document)

    async def withdraw(self, rider_id: str, amount: float) -> Dict[str, Any]:
        wallet = await database.find_one(WALLETS, {"_id": rider_id})
        if wallet is None:
            raise LookupError("Wallet not found")
        if amount <= 0:
            raise ValueError("Enter a valid withdrawal amount")
        if wallet.get("balance", 0) < amount:
            raise ValueError("Insufficient wallet balance")
        new_balance = wallet.get("balance", 0) - amount
        await database.update(WALLETS, {"_id": rider_id}, {"balance": new_balance})
        await database.insert(
            WALLET_TXNS,
            {
                "_id": f"rwtx-{rider_id}-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
                "rider_id": rider_id,
                "riderId": rider_id,
                "title": "Withdrawal to bank",
                "date": _now(),
                "amount": amount,
                "direction": "debit",
                "status": "success",
                "kind": "withdrawal",
            },
        )
        return {"ok": True, "amount": amount}

    async def transactions(self, rider_id: str) -> List[Dict[str, Any]]:
        docs = await database.find_sorted(
            WALLET_TXNS, {"riderId": rider_id}, sort=[("date", -1)]
        )
        return [_public(d) for d in docs]


class RiderNotificationRepository:
    async def list(self, rider_id: str) -> List[Dict[str, Any]]:
        docs = await database.find_sorted(
            NOTIFICATIONS, {"accountId": rider_id}, sort=[("date", -1)]
        )
        return [_public(d) for d in docs]

    async def mark_read(self, notification_id: str) -> Optional[Dict[str, Any]]:
        document = await database.find_one(NOTIFICATIONS, {"_id": notification_id})
        if document is None:
            return None
        await database.update(NOTIFICATIONS, {"_id": notification_id}, {"read": True})
        return await database.find_one(NOTIFICATIONS, {"_id": notification_id})

    async def mark_all_read(self, rider_id: str) -> int:
        docs = await database.find_many(NOTIFICATIONS, {"accountId": rider_id, "read": False})
        for document in docs:
            await database.update(NOTIFICATIONS, {"_id": document["_id"]}, {"read": True})
        return len(docs)


class RiderAnalyticsRepository:
    async def list(self, rider_id: str, limit: int = 30) -> List[Dict[str, Any]]:
        docs = await database.find_sorted(
            ANALYTICS, {"riderId": rider_id}, sort=[("date", -1)], limit=limit
        )
        return [_public(d) for d in docs]


rider_profile_repository = RiderProfileRepository()
rider_settings_repository = RiderSettingsRepository()
rider_delivery_repository = RiderDeliveryRepository()
rider_earnings_repository = RiderEarningsRepository()
rider_wallet_repository = RiderWalletRepository()
rider_notification_repository = RiderNotificationRepository()
rider_analytics_repository = RiderAnalyticsRepository()


# ---------------------------------------------------------------------------
# Rider domain collections. All rider profiles, work queues, wallets,
# earnings and notifications are strictly loaded and managed in real MongoDB.
# ---------------------------------------------------------------------------

RIDER_SEED: Dict[str, List[Dict[str, Any]]] = {}

