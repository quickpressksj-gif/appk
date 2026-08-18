"""Admin repositories + seed data — Sprint 5.2 (MongoDB integration).

Collections
    customers               customer directory (name/phone/email/city)
    partner_profiles        partner directory (status/approve/suspend/etc.)
    rider_profiles          rider directory (status/approve/suspend/etc.)
    customer_orders         canonical order documents (Sprint 2.4 shape) — the
                             admin order list/detail/assign-rider/cancel screens
                             read and mutate these directly.
    partner_orders          partner-facing projection of the same orders.
    admin_payouts           wallet withdrawal / payout requests
    admin_reports           analytics/report snapshots
    admin_notifications     broadcast + system notifications for every role
    admin_audit_logs        one entry per mutating admin action
    admin_cities            city / service-area configuration
    admin_coupons           promo codes
    admin_staff             internal staff directory
    admin_support_tickets   support tickets raised against the platform
    admin_settings          single-document platform settings
    admin_services          service catalogue (name/price/category)
    admin_categories        service categories
    admin_wallet_transactions payouts / refunds / commission ledger

Every read/write goes through `database`'s generic helpers so the exact same
code works against MongoDB Atlas and the in-memory preview store.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.db.client import database
from app.services import order_lifecycle as lifecycle

ORDER_STATUS_LABEL: Dict[str, str] = {
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


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"


def status_label(order: Dict[str, Any]) -> str:
    return ORDER_STATUS_LABEL.get(order.get("status", ""), order.get("status", ""))


def to_admin_order_row(order: Dict[str, Any]) -> Dict[str, Any]:
    partner = order.get("partner") or {}
    customer = order.get("customer") or {}
    rider = order.get("rider")
    totals = order.get("totals") or {}
    payment = order.get("payment") or {}
    return {
        "id": str(order.get("_id") or order.get("id")),
        "code": order.get("code"),
        "customer": customer.get("name", ""),
        "partner": partner.get("name", ""),
        "rider": (rider or {}).get("name", "Unassigned"),
        "status": order.get("status"),
        "statusLabel": status_label(order),
        "amount": totals.get("grandTotal", 0),
        "placedOn": (order.get("createdAt") or "")[:10],
        "city": partner.get("city", ""),
        "paymentMode": payment.get("mode", "cod"),
    }


class AdminAuditRepository:
    async def log(self, actor: str, action: str, target: str, meta: Optional[Dict[str, Any]] = None) -> None:
        await database.insert(
            "admin_audit_logs",
            {
                "_id": new_id("audit"),
                "actor": actor,
                "action": action,
                "target": target,
                "meta": meta or {},
                "at": now_iso(),
                "createdAt": now_iso(),
            },
        )


audit_repository = AdminAuditRepository()


class AdminOrderRepository:
    collection = "customer_orders"

    async def list(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {}
        if status and status != "all":
            query["status"] = status
        docs = await database.find_sorted(self.collection, query, sort=[("createdAt", -1)])
        return [to_admin_order_row(d) for d in docs]

    async def find(self, order_id: str) -> Optional[Dict[str, Any]]:
        doc = await database.find_one(self.collection, {"_id": order_id})
        if doc is None:
            doc = await database.find_one(self.collection, {"code": order_id})
        return doc

    async def assign_rider(self, order_id: str, rider_id: str) -> Dict[str, Any]:
        order = await self.find(order_id)
        if order is None:
            raise LookupError(f"Order {order_id} does not exist")
        rider = await database.find_one("rider_profiles", {"_id": rider_id})
        if rider is None:
            raise LookupError(f"Rider {rider_id} does not exist")
        rider_party = {
            "id": rider["_id"],
            "name": rider.get("name", ""),
            "phone": rider.get("phone", ""),
            "vehicle": rider.get("vehicle", ""),
            "plate": rider.get("plate", ""),
            "rating": rider.get("rating", 0),
            "trips": f"{rider.get('trips', 0)}+ trips",
        }
        current = lifecycle.order_status(order)
        if current == lifecycle.PARTNER_ACCEPTED:
            updated = await lifecycle.transition(
                order["_id"],
                lifecycle.RIDER_ASSIGNED,
                actor_id="admin",
                actor_role="admin",
                metadata={"riderId": rider_id, "riderName": rider_party["name"]},
                changes={"rider": rider_party},
            )
        elif current in lifecycle.TERMINAL:
            raise ValueError("This order can no longer be assigned to a rider")
        else:
            # Re-assignment of an in-flight order keeps the status untouched.
            await database.update(
                self.collection,
                {"_id": order["_id"]},
                {"rider": rider_party, "updatedAt": now_iso()},
            )
            updated = await self.find(order["_id"])
            await lifecycle.record_event(
                updated,
                "RIDER_REASSIGNED",
                actor_id="admin",
                actor_role="admin",
                metadata={"riderId": rider_id, "riderName": rider_party["name"]},
            )
        return to_admin_order_row(updated)

    async def cancel(self, order_id: str, reason: str) -> Dict[str, Any]:
        order = await self.find(order_id)
        if order is None:
            raise LookupError(f"Order {order_id} does not exist")
        if lifecycle.order_status(order) in lifecycle.TERMINAL:
            raise ValueError("This order can no longer be cancelled")
        updated = await lifecycle.transition(
            order["_id"],
            lifecycle.CANCELLED,
            actor_id="admin",
            actor_role="admin",
            metadata={"reason": reason or "Cancelled by admin"},
            changes={"cancelledReason": reason or "Cancelled by admin"},
        )
        return to_admin_order_row(updated)

    async def events(self, order_id: str) -> List[Dict[str, Any]]:
        """Full canonical audit trail for one order."""
        return await lifecycle.events_for(order_id)


admin_order_repository = AdminOrderRepository()


class AdminCustomerRepository:
    collection = "customers"

    async def list(self, page: int, page_size: int, q: Optional[str] = None, city: Optional[str] = None) -> Dict[str, Any]:
        query: Dict[str, Any] = {}
        if q:
            query["$or"] = [
                {"name": {"$regex": q, "$options": "i"}},
                {"phone": {"$regex": q, "$options": "i"}},
                {"email": {"$regex": q, "$options": "i"}},
            ]
        if city:
            query["city"] = city
        envelope = await database.paginate(self.collection, query, sort=[("name", 1)], page=page, page_size=page_size)
        envelope["items"] = [await self._with_stats(d) for d in envelope["items"]]
        return envelope

    async def _with_stats(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        orders = await database.find_many("customer_orders", {"customer.id": doc["_id"]})
        return {
            "id": doc["_id"],
            "name": doc.get("name", ""),
            "phone": doc.get("phone", ""),
            "email": doc.get("email", ""),
            "city": doc.get("city", ""),
            "orders": len(orders),
            "spend": sum((o.get("totals") or {}).get("grandTotal", 0) for o in orders),
            "status": doc.get("status", "active"),
        }

    async def detail(self, customer_id: str) -> Optional[Dict[str, Any]]:
        doc = await database.find_one(self.collection, {"_id": customer_id})
        if doc is None:
            return None
        return await self._with_stats(doc)

    async def set_blocked(self, customer_id: str, blocked: bool) -> Optional[Dict[str, Any]]:
        doc = await database.update(
            self.collection, {"_id": customer_id}, {"status": "blocked" if blocked else "active"}
        )
        return doc


admin_customer_repository = AdminCustomerRepository()


class AdminAccountRepository:
    """Shared list/detail/status logic for partners and riders."""

    def __init__(self, collection: str):
        self.collection = collection

    async def list(self, page: int, page_size: int, q: Optional[str] = None, status: Optional[str] = None, city: Optional[str] = None) -> Dict[str, Any]:
        query: Dict[str, Any] = {}
        if q:
            query["$or"] = [
                {"name": {"$regex": q, "$options": "i"}},
                {"ownerName": {"$regex": q, "$options": "i"}},
                {"phone": {"$regex": q, "$options": "i"}},
            ]
        if status and status != "all":
            query["status"] = status
        if city:
            query["city"] = city
        return await database.paginate(self.collection, query, sort=[("name", 1)], page=page, page_size=page_size)

    async def detail(self, entity_id: str) -> Optional[Dict[str, Any]]:
        return await database.find_one(self.collection, {"_id": entity_id})

    async def set_status(self, entity_id: str, status: str) -> Optional[Dict[str, Any]]:
        doc = await database.find_one(self.collection, {"_id": entity_id})
        if doc is None:
            return None
        return await database.update(self.collection, {"_id": entity_id}, {"status": status})


admin_partner_repository = AdminAccountRepository("partner_profiles")
admin_rider_repository = AdminAccountRepository("rider_profiles")


class AdminDashboardRepository:
    async def summary(self) -> Dict[str, Any]:
        orders = await database.find_many("customer_orders")
        delivered = [o for o in orders if o.get("status") == "delivered"]
        cancelled = [o for o in orders if o.get("status") == "cancelled"]
        live = [o for o in orders if o.get("status") not in ("delivered", "cancelled")]
        partners = await database.count("partner_profiles")
        riders = await database.count("rider_profiles")
        customers = await database.count("customers")
        revenue = sum((o.get("totals") or {}).get("grandTotal", 0) for o in delivered)
        return {
            "totalOrders": len(orders),
            "liveOrders": len(live),
            "deliveredOrders": len(delivered),
            "cancelledOrders": len(cancelled),
            "revenue": revenue,
            "partners": partners,
            "riders": riders,
            "customers": customers,
            "statusBreakdown": [
                {
                    "status": status,
                    "label": label,
                    "count": sum(1 for o in orders if o.get("status") == status),
                }
                for status, label in ORDER_STATUS_LABEL.items()
            ],
        }

    async def activity(self) -> List[Dict[str, Any]]:
        orders = await database.find_sorted("customer_orders", sort=[("updatedAt", -1)], limit=10)
        results = []
        for order in orders:
            partner = order.get("partner") or {}
            results.append(
                {
                    "id": order.get("_id"),
                    "title": f"Order {order.get('code')}: {status_label(order)}",
                    "meta": f"{partner.get('city', '')} · {order.get('serviceLabel', '')}",
                    "time": order.get("updatedAt"),
                    "tone": "danger" if order.get("status") == "cancelled" else ("success" if order.get("status") == "delivered" else "default"),
                }
            )
        return results

    async def latest_orders(self) -> List[Dict[str, Any]]:
        orders = await database.find_sorted("customer_orders", sort=[("updatedAt", -1)], limit=8)
        return [to_admin_order_row(o) for o in orders]

    async def _series(self, key_revenue: bool) -> List[Dict[str, Any]]:
        orders = await database.find_many("customer_orders")
        by_day: Dict[str, Dict[str, int]] = {}
        for order in orders:
            day = (order.get("createdAt") or "")[:10]
            entry = by_day.setdefault(day, {"value": 0, "secondary": 0})
            if key_revenue:
                if order.get("status") == "delivered":
                    entry["value"] += (order.get("totals") or {}).get("grandTotal", 0)
                entry["secondary"] += (order.get("totals") or {}).get("grandTotal", 0)
            else:
                entry["value"] += 1
                if order.get("status") == "cancelled":
                    entry["secondary"] += 1
        days = sorted(by_day.keys())[-7:]
        return [{"label": day, **by_day[day]} for day in days]

    async def revenue_series(self) -> List[Dict[str, Any]]:
        return await self._series(True)

    async def orders_series(self) -> List[Dict[str, Any]]:
        return await self._series(False)


admin_dashboard_repository = AdminDashboardRepository()


class AdminWalletRepository:
    async def wallet(self) -> Dict[str, Any]:
        transactions = await database.find_sorted("admin_wallet_transactions", sort=[("createdAt", -1)])
        wallets = await database.find_many("admin_wallets")
        return {"transactions": transactions, "wallets": wallets}

    async def kpis(self) -> List[Dict[str, Any]]:
        orders = await database.find_many("customer_orders")
        delivered = [o for o in orders if o.get("status") == "delivered"]
        revenue = sum((o.get("totals") or {}).get("grandTotal", 0) for o in delivered)
        commission = round(revenue * 0.18)
        wallets = await database.find_many("admin_wallets")
        pending_payouts = sum(w.get("balance", 0) for w in wallets)
        transactions = await database.find_many("admin_wallet_transactions")
        refunds = sum(t.get("amount", 0) for t in transactions if t.get("kind") == "refund")
        return [
            {"id": "revenue", "label": "Platform revenue", "value": revenue, "positive": True},
            {"id": "commission", "label": "Commission earned", "value": commission, "positive": True},
            {"id": "payouts", "label": "Pending payouts", "value": pending_payouts, "positive": False},
            {"id": "refunds", "label": "Refunds", "value": refunds, "positive": True},
        ]

    async def revenue_split(self) -> List[Dict[str, Any]]:
        orders = [o for o in await database.find_many("customer_orders") if o.get("status") == "delivered"]
        by_month: Dict[str, Dict[str, int]] = {}
        for order in orders:
            month = (order.get("createdAt") or "")[:7]
            entry = by_month.setdefault(month, {"value": 0, "secondary": 0})
            gross = (order.get("totals") or {}).get("grandTotal", 0)
            entry["value"] += gross
            entry["secondary"] += round(gross * 0.18)
        return [{"label": m, **v} for m, v in sorted(by_month.items())]

    async def partner_earnings(self) -> List[Dict[str, Any]]:
        partners = await database.find_many("partner_profiles")
        orders = await database.find_many("customer_orders")
        results = []
        for partner in partners:
            partner_orders = [
                o for o in orders if (o.get("partner") or {}).get("id") == partner["_id"] and o.get("status") == "delivered"
            ]
            gross = sum((o.get("totals") or {}).get("grandTotal", 0) for o in partner_orders)
            commission = round(gross * 0.18)
            results.append(
                {
                    "id": partner["_id"],
                    "account": partner.get("name", ""),
                    "city": partner.get("city", ""),
                    "orders": len(partner_orders),
                    "gross": gross,
                    "commission": commission,
                    "net": gross - commission,
                }
            )
        return results

    async def rider_earnings(self) -> List[Dict[str, Any]]:
        riders = await database.find_many("rider_profiles")
        orders = await database.find_many("customer_orders")
        results = []
        for rider in riders:
            rider_orders = [
                o for o in orders if (o.get("rider") or {}).get("id") == rider["_id"] and o.get("status") == "delivered"
            ]
            gross = sum(35 + round((o.get("totals") or {}).get("grandTotal", 0) * 0.05) for o in rider_orders)
            results.append(
                {
                    "id": rider["_id"],
                    "account": rider.get("name", ""),
                    "city": rider.get("city", ""),
                    "orders": len(rider_orders),
                    "gross": gross,
                    "commission": 0,
                    "net": gross,
                }
            )
        return results

    async def withdrawals(self) -> List[Dict[str, Any]]:
        return await database.find_many("admin_payouts", {"kind": "payout"})

    async def refunds(self) -> List[Dict[str, Any]]:
        return await database.find_many("admin_wallet_transactions", {"kind": "refund"})

    async def transactions(self) -> List[Dict[str, Any]]:
        return await database.find_sorted("admin_wallet_transactions", sort=[("createdAt", -1)])

    async def set_withdrawal_status(self, withdrawal_id: str, status: str) -> Optional[Dict[str, Any]]:
        doc = await database.find_one("admin_payouts", {"_id": withdrawal_id})
        if doc is None:
            return None
        return await database.update("admin_payouts", {"_id": withdrawal_id}, {"status": status})


admin_wallet_repository = AdminWalletRepository()


class AdminSettingsRepository:
    doc_id = "platform"

    async def get(self) -> Dict[str, Any]:
        doc = await database.find_one("admin_settings", {"_id": self.doc_id})
        return doc or {}

    async def update(self, changes: Dict[str, Any]) -> Dict[str, Any]:
        current = await self.get()
        merged = {**current, **changes}
        merged.pop("_id", None)
        await database.update("admin_settings", {"_id": self.doc_id}, merged, upsert=True)
        return await self.get()


admin_settings_repository = AdminSettingsRepository()


class SimpleCrudRepository:
    """Generic list/create/update/delete used for coupons/staff/cities/services."""

    def __init__(self, collection: str, prefix: str):
        self.collection = collection
        self.prefix = prefix

    async def list(self) -> List[Dict[str, Any]]:
        return await database.find_sorted(self.collection, sort=[("_id", 1)])

    async def get(self, entity_id: str) -> Optional[Dict[str, Any]]:
        return await database.find_one(self.collection, {"_id": entity_id})

    async def create(self, document: Dict[str, Any]) -> Dict[str, Any]:
        document = {"_id": new_id(self.prefix), **document}
        return await database.insert(self.collection, document)

    async def update(self, entity_id: str, changes: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        existing = await self.get(entity_id)
        if existing is None:
            return None
        changes = {k: v for k, v in changes.items() if v is not None}
        return await database.update(self.collection, {"_id": entity_id}, changes)

    async def delete(self, entity_id: str) -> bool:
        removed = await database.delete_one(self.collection, {"_id": entity_id})
        return bool(removed)


coupon_repository = SimpleCrudRepository("admin_coupons", "C")
staff_repository = SimpleCrudRepository("admin_staff", "ST")
city_repository = SimpleCrudRepository("admin_cities", "CI")
service_repository = SimpleCrudRepository("admin_services", "s")


class SupportRepository:
    collection = "admin_support_tickets"

    async def list(self) -> List[Dict[str, Any]]:
        return await database.find_sorted(self.collection, sort=[("createdAt", -1)])

    async def get(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        return await database.find_one(self.collection, {"_id": ticket_id})

    async def close(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        doc = await self.get(ticket_id)
        if doc is None:
            return None
        return await database.update(self.collection, {"_id": ticket_id}, {"status": "Resolved"})

    async def reply(self, ticket_id: str, body: str) -> Optional[Dict[str, Any]]:
        doc = await self.get(ticket_id)
        if doc is None:
            return None
        replies = list(doc.get("replies") or [])
        replies.append({"body": body, "at": now_iso(), "author": "admin"})
        await database.update(self.collection, {"_id": ticket_id}, {"replies": replies})
        return {"ok": True, "ticketId": ticket_id, "body": body}


support_repository = SupportRepository()


class NotificationRepository:
    collection = "admin_notifications"

    async def list(self) -> List[Dict[str, Any]]:
        return await database.find_sorted(self.collection, sort=[("createdAt", -1)])

    async def broadcast(self, audience: str, title: str, message: str) -> Dict[str, Any]:
        audience = audience or "All"
        target_role = None if audience == "All" else audience.lower().rstrip("s")
        accounts: List[Dict[str, Any]] = []
        for collection, role in (("customers", "customer"), ("partner_profiles", "partner"), ("rider_profiles", "rider")):
            if target_role and target_role != role:
                continue
            docs = await database.find_many(collection)
            accounts.extend({"id": d["_id"], "role": role} for d in docs)
        for account in accounts:
            await database.insert(
                self.collection,
                {
                    "_id": new_id("ntf"),
                    "accountId": account["id"],
                    "role": account["role"],
                    "kind": "system",
                    "title": title or "Announcement",
                    "description": message or "",
                    "createdAt": now_iso(),
                    "read": False,
                },
            )
        return {"ok": True, "reached": len(accounts)}


notification_repository = NotificationRepository()


class AreaRepository:
    async def areas_for_city(self, city_id: str) -> Optional[List[Dict[str, Any]]]:
        city = await database.find_one("admin_cities", {"_id": city_id})
        if city is None:
            return None
        return [
            {
                "id": f"{city_id}-area-{i + 1}",
                "area": f"Zone {i + 1}",
                "city": city.get("city", ""),
                "status": city.get("status", ""),
            }
            for i in range(int(city.get("areas", 0)))
        ]


area_repository = AreaRepository()


class CategoryRepository:
    async def list(self) -> List[Dict[str, Any]]:
        return await database.find_sorted("admin_categories", sort=[("_id", 1)])


category_repository = CategoryRepository()


class AnalyticsRepository:
    async def summary(self) -> Dict[str, Any]:
        orders = await database.find_many("customer_orders")
        delivered = [o for o in orders if o.get("status") == "delivered"]
        cities = await database.find_many("admin_cities")
        partners = await database.count("partner_profiles")
        riders = await database.count("rider_profiles")
        customers = await database.count("customers")
        revenue = sum((o.get("totals") or {}).get("grandTotal", 0) for o in delivered)
        return {
            "totalOrders": len(orders),
            "revenue": revenue,
            "cities": cities,
            "partners": partners,
            "riders": riders,
            "customers": customers,
        }


analytics_repository = AnalyticsRepository()


# --------------------------------------------------------------------------
# Idempotent demo seed — every admin screen renders even on a brand new
# database / preview environment with zero manual setup.
# --------------------------------------------------------------------------

_SEED_CUSTOMERS = [
    {"_id": "cust-1", "name": "Aarav Shah", "phone": "+91 90000 00001", "email": "aarav@example.com", "city": "Mumbai", "status": "active"},
    {"_id": "cust-2", "name": "Priya Nair", "phone": "+91 90000 00002", "email": "priya@example.com", "city": "Pune", "status": "active"},
    {"_id": "cust-3", "name": "Rohan Mehta", "phone": "+91 90000 00003", "email": "rohan@example.com", "city": "Bengaluru", "status": "active"},
]

_SEED_PARTNERS = [
    {
        "_id": "prt-1", "name": "SpinCycle Andheri", "ownerName": "Vikram Rao", "city": "Mumbai",
        "phone": "+91 98000 00011", "rating": 4.6, "status": "active", "isOpen": True, "acceptingNewOrders": True, "autoAccept": False,
    },
    {
        "_id": "prt-2", "name": "FreshFold Powai", "ownerName": "Neha Kapoor", "city": "Mumbai",
        "phone": "+91 98000 00012", "rating": 4.3, "status": "pending", "isOpen": False, "acceptingNewOrders": False, "autoAccept": False,
    },
    {
        "_id": "prt-3", "name": "CleanCrest Kothrud", "ownerName": "Sameer Iyer", "city": "Pune",
        "phone": "+91 98000 00013", "rating": 4.8, "status": "active", "isOpen": True, "acceptingNewOrders": True, "autoAccept": True,
    },
]

_SEED_RIDERS = [
    {"_id": "rdr-1", "name": "Sameer Khan", "phone": "+91 97000 00021", "city": "Mumbai", "vehicle": "Bike", "plate": "MH12AB1234", "rating": 4.7, "trips": 812, "isOnline": True, "status": "active"},
    {"_id": "rdr-2", "name": "Priya Das", "phone": "+91 97000 00022", "city": "Pune", "vehicle": "Scooter", "plate": "MH14CD5678", "rating": 4.5, "trips": 430, "isOnline": False, "status": "active"},
    {"_id": "rdr-3", "name": "Imran Sheikh", "phone": "+91 97000 00023", "city": "Bengaluru", "vehicle": "Bike", "plate": "KA05EF9012", "rating": 4.2, "trips": 120, "isOnline": False, "status": "pending"},
]

_SEED_ORDERS = [
    {
        "_id": "ord-QP1041", "userId": "cust-1", "code": "QP1041", "status": "delivered",
        "createdAt": "2024-05-01T09:00:00Z", "updatedAt": "2024-05-02T18:00:00Z",
        "customer": {"id": "cust-1", "name": "Aarav Shah", "phone": "+91 90000 00001"},
        "partner": {"id": "prt-1", "name": "SpinCycle Andheri", "phone": "+91 98000 00011", "image": "", "city": "Andheri, Mumbai"},
        "rider": {"id": "rdr-1", "name": "Sameer Khan", "phone": "+91 97000 00021", "vehicle": "Bike", "plate": "MH12AB1234", "rating": 4.7, "trips": "812+ trips"},
        "serviceLabel": "Wash & Fold",
        "items": [{"id": "svc-1", "name": "Shirt", "qty": 4, "price": 20}],
        "totals": {"itemsTotal": 80, "pickup": 0, "delivery": 0, "handling": 10, "gst": 16, "discount": 0, "grandTotal": 106},
        "address": {"label": "Home", "line": "Flat 302, Andheri West", "city": "Mumbai", "phone": "+91 90000 00001"},
        "pickup": {"date": "Wed, 01 May", "slot": "8 AM – 12 PM", "express": False},
        "delivery": {"date": "Thu, 02 May", "slot": "12 PM – 4 PM"},
        "payment": {"mode": "online", "label": "UPI", "note": "Paid from QuickPress wallet", "paid": True},
        "otp": {"pickup": "1234", "delivery": "5678"},
        "events": [{"id": "QP1041-evt-0", "status": "placed", "label": "Order placed", "at": "2024-05-01T09:00:00Z", "actor": "customer"}],
        "cancelledReason": None, "couponCode": "", "instructions": "", "idempotencyKey": None,
    },
    {
        "_id": "ord-QP1042", "userId": "cust-2", "code": "QP1042", "status": "rider_assigned",
        "createdAt": "2024-05-03T10:00:00Z", "updatedAt": "2024-05-03T10:30:00Z",
        "customer": {"id": "cust-2", "name": "Priya Nair", "phone": "+91 90000 00002"},
        "partner": {"id": "prt-3", "name": "CleanCrest Kothrud", "phone": "+91 98000 00013", "image": "", "city": "Kothrud, Pune"},
        "rider": None,
        "serviceLabel": "Dry Clean",
        "items": [{"id": "svc-2", "name": "Blazer", "qty": 1, "price": 220}],
        "totals": {"itemsTotal": 220, "pickup": 0, "delivery": 0, "handling": 10, "gst": 41, "discount": 0, "grandTotal": 271},
        "address": {"label": "Home", "line": "12 Kothrud Road", "city": "Pune", "phone": "+91 90000 00002"},
        "pickup": {"date": "Fri, 03 May", "slot": "12 PM – 4 PM", "express": False},
        "delivery": {"date": "Sun, 05 May", "slot": "4 PM – 8 PM"},
        "payment": {"mode": "cod", "label": "Cash", "note": "Pay on delivery", "paid": False},
        "otp": {"pickup": "2345", "delivery": "6789"},
        "events": [{"id": "QP1042-evt-0", "status": "placed", "label": "Order placed", "at": "2024-05-03T10:00:00Z", "actor": "customer"}, {"id": "QP1042-evt-1", "status": "partner_accepted", "label": "Accepted by store", "at": "2024-05-03T10:30:00Z", "actor": "partner"}],
        "cancelledReason": None, "couponCode": "", "instructions": "", "idempotencyKey": None,
    },
    {
        "_id": "ord-QP1043", "userId": "cust-3", "code": "QP1043", "status": "cancelled",
        "createdAt": "2024-05-04T08:00:00Z", "updatedAt": "2024-05-04T08:15:00Z",
        "customer": {"id": "cust-3", "name": "Rohan Mehta", "phone": "+91 90000 00003"},
        "partner": {"id": "prt-2", "name": "FreshFold Powai", "phone": "+91 98000 00012", "image": "", "city": "Powai, Mumbai"},
        "rider": None,
        "serviceLabel": "Steam Iron",
        "items": [{"id": "svc-3", "name": "Trouser", "qty": 2, "price": 40}],
        "totals": {"itemsTotal": 80, "pickup": 0, "delivery": 0, "handling": 10, "gst": 16, "discount": 0, "grandTotal": 106},
        "address": {"label": "Office", "line": "Powai Business Park", "city": "Mumbai", "phone": "+91 90000 00003"},
        "pickup": {"date": "Sat, 04 May", "slot": "8 AM – 12 PM", "express": False},
        "delivery": {"date": "Sun, 05 May", "slot": "12 PM – 4 PM"},
        "payment": {"mode": "cod", "label": "Cash", "note": "Pay on delivery", "paid": False},
        "otp": {"pickup": "3456", "delivery": "7890"},
        "events": [{"id": "QP1043-evt-0", "status": "placed", "label": "Order placed", "at": "2024-05-04T08:00:00Z", "actor": "customer"}, {"id": "QP1043-evt-1", "status": "cancelled", "label": "Cancelled", "at": "2024-05-04T08:15:00Z", "actor": "customer"}],
        "cancelledReason": "Changed my mind", "couponCode": "", "instructions": "", "idempotencyKey": None,
    },
]

_SEED_CITIES = [
    {"_id": "CI-1", "city": "Mumbai", "state": "Maharashtra", "areas": 18, "partners": 2, "riders": 2, "pickupRadius": "6 km", "status": "Live"},
    {"_id": "CI-2", "city": "Pune", "state": "Maharashtra", "areas": 9, "partners": 1, "riders": 1, "pickupRadius": "5 km", "status": "Live"},
    {"_id": "CI-3", "city": "Bengaluru", "state": "Karnataka", "areas": 14, "partners": 0, "riders": 0, "pickupRadius": "5 km", "status": "Pilot"},
]

_SEED_CATEGORIES = [
    {"_id": "cat-1", "name": "Wash & Fold"},
    {"_id": "cat-2", "name": "Dry Clean"},
    {"_id": "cat-3", "name": "Steam Iron"},
]

_SEED_SERVICES = [
    {"_id": "s1", "name": "Wash & Fold", "categoryId": "cat-1", "unit": "per kg", "price": 60, "image": "", "description": "Everyday laundry, washed and folded.", "badge": None, "popular": True},
    {"_id": "s2", "name": "Dry Clean", "categoryId": "cat-2", "unit": "per item", "price": 220, "image": "", "description": "Delicate fabrics, professionally dry cleaned.", "badge": None, "popular": True},
    {"_id": "s3", "name": "Steam Iron", "categoryId": "cat-3", "unit": "per item", "price": 20, "image": "", "description": "Crisp, wrinkle-free finish.", "badge": None, "popular": False},
]

_SEED_COUPONS = [
    {"_id": "C-1", "code": "WELCOME50", "discount": "50% OFF", "description": "First order discount", "expiry": "2024-12-31", "minOrder": 99, "status": "Active"},
    {"_id": "C-2", "code": "MONSOON30", "discount": "30% OFF", "description": "Monsoon special", "expiry": "2024-09-30", "minOrder": 199, "status": "Active"},
]

_SEED_STAFF = [
    {"_id": "ST-1", "name": "Ananya Verma", "email": "ananya@quickpress.app", "role": "Ops manager", "scope": "All cities", "lastActive": "2 hrs ago", "status": "Active"},
    {"_id": "ST-2", "name": "Karan Malhotra", "email": "karan@quickpress.app", "role": "Support lead", "scope": "Mumbai", "lastActive": "1 day ago", "status": "Active"},
]

_SEED_SUPPORT = [
    {"_id": "TCK-1", "subject": "Late delivery", "customer": "Aarav Shah", "priority": "High", "status": "Open", "createdAt": "2024-05-01T12:00:00Z", "replies": []},
    {"_id": "TCK-2", "subject": "Refund not received", "customer": "Priya Nair", "priority": "Medium", "status": "Resolved", "createdAt": "2024-04-28T09:00:00Z", "replies": []},
]

_SEED_SETTINGS = [
    {"_id": "platform", "defaultCity": "Mumbai", "defaultCommission": "18%", "supportEmail": "support@quickpress.app", "supportPhone": "+91 90000 90000"}
]

_SEED_WALLET_TRANSACTIONS = [
    {"_id": "TXN-1", "kind": "commission", "amount": 500, "account": "Platform", "createdAt": "2024-05-01T09:00:00Z"},
    {"_id": "TXN-2", "kind": "refund", "amount": 120, "account": "Aarav Shah", "createdAt": "2024-05-02T09:00:00Z"},
    {"_id": "TXN-3", "kind": "payout", "amount": 4200, "account": "Sameer Khan", "createdAt": "2024-05-02T11:00:00Z"},
]

_SEED_PAYOUTS = [
    {"_id": "WD-1", "kind": "payout", "account": "SpinCycle Andheri", "type": "Partner", "amount": 18000, "status": "Pending", "createdAt": "2024-05-03T09:00:00Z"},
    {"_id": "WD-2", "kind": "payout", "account": "Sameer Khan", "type": "Rider", "amount": 4200, "status": "Approved", "createdAt": "2024-05-02T11:00:00Z"},
]

_SEED_WALLETS = [
    {"_id": "wal-prt-1", "account": "SpinCycle Andheri", "balance": 42180},
    {"_id": "wal-rdr-1", "account": "Sameer Khan", "balance": 6420},
]

_SEED_NOTIFICATIONS = [
    {"_id": "ntf-seed-1", "accountId": "cust-1", "role": "customer", "kind": "system", "title": "Welcome to QuickPress", "description": "Your first order is on us", "createdAt": "2024-05-01T09:00:00Z", "read": False},
]

ADMIN_SEED: Dict[str, List[Dict[str, Any]]] = {
    "customers": _SEED_CUSTOMERS,
    "partner_profiles": _SEED_PARTNERS,
    "rider_profiles": _SEED_RIDERS,
    "customer_orders": _SEED_ORDERS,
    "admin_cities": _SEED_CITIES,
    "admin_categories": _SEED_CATEGORIES,
    "admin_services": _SEED_SERVICES,
    "admin_coupons": _SEED_COUPONS,
    "admin_staff": _SEED_STAFF,
    "admin_support_tickets": _SEED_SUPPORT,
    "admin_settings": _SEED_SETTINGS,
    "admin_wallet_transactions": _SEED_WALLET_TRANSACTIONS,
    "admin_payouts": _SEED_PAYOUTS,
    "admin_wallets": _SEED_WALLETS,
    "admin_notifications": _SEED_NOTIFICATIONS,
}
