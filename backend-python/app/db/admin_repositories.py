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
from datetime import datetime, timezone, timedelta
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
    address = order.get("address") or customer.get("address") or {}

    customer_name = order.get("customerName") or customer.get("name") or "QuickPress Customer"
    customer_phone = order.get("customerPhone") or customer.get("phone") or address.get("phone", "")
    customer_email = order.get("customerEmail") or customer.get("email") or ""
    user_id = str(order.get("userId") or order.get("user_id") or customer.get("id") or "")

    formatted_address = address.get("formatted") or address.get("street") or address.get("addressLine") or ""
    if not formatted_address:
        parts = [address.get("houseNo"), address.get("building"), address.get("area"), address.get("city")]
        formatted_address = ", ".join([str(p) for p in parts if p]) or "Kasganj Address"

    landmark = address.get("landmark") or ""
    pincode = address.get("pincode") or address.get("zip") or "207123"
    lat = address.get("lat") or address.get("latitude") or 27.8081
    lng = address.get("lng") or address.get("longitude") or 78.6475

    return {
        "id": str(order.get("_id") or order.get("id")),
        "code": order.get("code") or f"ORD-{(str(order.get('_id') or ''))[:8]}",
        "customer": customer_name,
        "customerName": customer_name,
        "customerPhone": customer_phone,
        "customerEmail": customer_email,
        "userId": user_id,
        "phone": customer_phone,
        "address": formatted_address,
        "landmark": landmark,
        "pincode": pincode,
        "lat": lat,
        "lng": lng,
        "pickupSlot": order.get("pickupSlot") or order.get("slot") or "Today 10:00 AM - 12:00 PM",
        "deliverySlot": order.get("deliverySlot") or "Tomorrow 04:00 PM - 06:00 PM",
        "partner": partner.get("name", "") or "QuickPress Main Hub",
        "partnerId": partner.get("id") or order.get("partnerId"),
        "partnerPhone": partner.get("phone", ""),
        "rider": (rider or {}).get("name", "Unassigned"),
        "riderId": (rider or {}).get("id") or order.get("riderId"),
        "riderPhone": (rider or {}).get("phone", ""),
        "status": order.get("status"),
        "statusLabel": status_label(order),
        "amount": totals.get("grandTotal", 0),
        "service": order.get("serviceLabel") or "Standard Laundry",
        "placedOn": (order.get("createdAt") or order.get("created_at") or "")[:10],
        "placedAt": order.get("createdAt") or order.get("created_at") or "",
        "city": partner.get("city", "") or address.get("city", "") or "Kasganj",
        "paymentMode": payment.get("mode", "cod"),
        "paymentStatus": payment.get("status", "pending"),
        "items": order.get("items") or [],
        "totals": totals,
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
        if current in (lifecycle.PARTNER_ACCEPTED, "rider_searching", lifecycle.PENDING):
            updated = await lifecycle.transition(
                order["_id"],
                lifecycle.RIDER_ASSIGNED,
                actor_id="admin",
                actor_role="admin",
                metadata={"riderId": rider_id, "riderName": rider_party["name"]},
                changes={"rider": rider_party, "riderId": rider_id, "rider_id": rider_id},
            )
        elif current in lifecycle.TERMINAL:
            raise ValueError("This order can no longer be assigned to a rider")
        else:
            # Re-assignment of an in-flight order keeps the status untouched but records admin audit trail
            now = now_iso()
            await database.update(
                self.collection,
                {"_id": order["_id"]},
                {"rider": rider_party, "riderId": rider_id, "rider_id": rider_id, "updatedAt": now},
            )
            await lifecycle.record_event(
                order,
                "RIDER_ASSIGNED",
                actor_id="admin",
                actor_role="admin",
                metadata={"riderId": rider_id, "riderName": rider_party["name"]},
                at=now,
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
    collection = "users"

    async def list(self, page: int, page_size: int, q: Optional[str] = None, city: Optional[str] = None) -> Dict[str, Any]:
        query: Dict[str, Any] = {"$or": [{"role": "customer"}, {"role": None}]}
        if q:
            q_regex = {"$regex": q, "$options": "i"}
            query = {
                "$and": [
                    query,
                    {
                        "$or": [
                            {"name": q_regex},
                            {"phone": q_regex},
                            {"email": q_regex},
                            {"displayName": q_regex},
                        ]
                    },
                ]
            }
        if city:
            query["city"] = city
        envelope = await database.paginate(self.collection, query, sort=[("createdAt", -1)], page=page, page_size=page_size)
        envelope["items"] = [await self._with_stats(d) for d in envelope["items"]]
        return envelope

    async def _with_stats(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        user_id = str(doc.get("_id") or doc.get("id"))
        orders = await database.find_many("customer_orders", {"$or": [{"userId": user_id}, {"customer.id": user_id}]})
        latest_order = orders[0] if orders else {}
        latest_addr = latest_order.get("address") or {}

        name = doc.get("name") or doc.get("displayName") or (latest_order.get("customer") or {}).get("name") or "QuickPress Customer"
        phone = doc.get("phone") or (latest_order.get("customer") or {}).get("phone") or latest_addr.get("phone", "")
        city = doc.get("city") or latest_addr.get("city", "")

        return {
            "id": user_id,
            "name": name,
            "phone": phone,
            "email": doc.get("email", ""),
            "city": city,
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
                {"businessName": {"$regex": q, "$options": "i"}},
                {"fullName": {"$regex": q, "$options": "i"}},
                {"ownerName": {"$regex": q, "$options": "i"}},
                {"phone": {"$regex": q, "$options": "i"}},
            ]
        if status and status != "all":
            if status.lower() == "pending":
                query["$or"] = [{"status": "pending_verification"}, {"status": "pending"}, {"isVerified": False}, {"kycStatus": "pending"}]
            elif status.lower() == "active":
                query["$or"] = [{"status": "active"}, {"kycStatus": "verified"}]
            else:
                query["status"] = status
        if city and city != "all":
            query["city"] = city
        return await database.paginate(self.collection, query, sort=[("createdAt", -1), ("_id", -1)], page=page, page_size=page_size)

    async def detail(self, entity_id: str) -> Optional[Dict[str, Any]]:
        # Query by _id, partnerId, riderId, id, or phone
        doc = await database.find_one(self.collection, {"_id": entity_id})
        if doc is None:
            doc = await database.find_one(self.collection, {"partnerId": entity_id})
        if doc is None:
            doc = await database.find_one(self.collection, {"riderId": entity_id})
        if doc is None:
            doc = await database.find_one(self.collection, {"id": entity_id})
        if doc is None:
            doc = await database.find_one(self.collection, {"phone": entity_id})
        return doc

    async def set_status(self, entity_id: str, status: str) -> Optional[Dict[str, Any]]:
        doc = await self.detail(entity_id)
        if doc is None:
            return None

        is_active = status == "active"
        is_suspended = status == "suspended"
        now_iso = datetime.now(timezone.utc).isoformat()

        changes: Dict[str, Any] = {
            "status": status,
            "isVerified": is_active,
            "isOnboarded": True,
            "isOnline": is_active,
            "isOpen": is_active,
            "kycStatus": "verified" if is_active else ("rejected" if is_suspended else "pending"),
            "updatedAt": now_iso,
        }

        if is_active:
            changes["suspensionReason"] = None
            changes["suspendedAt"] = None
            changes["approvedAt"] = now_iso
            changes["appealStatus"] = "none"

        doc_id = str(doc.get("_id") or entity_id)
        partner_val = doc.get("partnerId") or doc_id
        rider_val = doc.get("riderId") or doc_id
        phone_val = doc.get("phone")
        user_id_val = doc.get("userId") or doc.get("user_id")

        # 1. Update main profile collection
        await database.update(self.collection, {"_id": doc_id}, changes)
        if self.collection == "partner_profiles" and partner_val != doc_id:
            await database.update(self.collection, {"partnerId": partner_val}, changes)
        elif self.collection == "rider_profiles" and rider_val != doc_id:
            await database.update(self.collection, {"riderId": rider_val}, changes)

        # 2. Sync partner specific settings & partners table
        if self.collection == "partner_profiles":
            settings_update = {
                "isStoreOpen": is_active,
                "acceptingNewOrders": is_active,
                "autoAcceptOrders": True,
                "updatedAt": now_iso,
            }
            await database.update("partner_settings", {"_id": doc_id}, settings_update, upsert=True)
            if partner_val != doc_id:
                await database.update("partner_settings", {"_id": partner_val}, settings_update, upsert=True)
            await database.update("partners", {"partner_id": doc_id}, {"is_verified": is_active, "status": status})
            if partner_val != doc_id:
                await database.update("partners", {"partner_id": partner_val}, {"is_verified": is_active, "status": status})

        # 3. Sync rider specific table
        elif self.collection == "rider_profiles":
            await database.update("riders", {"rider_id": doc_id}, {"is_verified": is_active, "status": status, "is_available": is_active})
            if rider_val != doc_id:
                await database.update("riders", {"rider_id": rider_val}, {"is_verified": is_active, "status": status, "is_available": is_active})

        # 4. Sync users table
        user_changes = {
            "is_verified": is_active,
            "status": "active" if is_active else status,
            "isOnboarded": True,
            "updatedAt": now_iso,
        }
        if user_id_val:
            await database.update("users", {"_id": user_id_val}, user_changes)
            await database.update("users", {"user_id": user_id_val}, user_changes)
        if phone_val:
            await database.update("users", {"phone": phone_val}, user_changes)

        # Return updated document
        updated_doc = await self.detail(doc_id)
        return updated_doc or {**doc, **changes}


admin_partner_repository = AdminAccountRepository("partner_profiles")
admin_rider_repository = AdminAccountRepository("rider_profiles")


class AdminDashboardRepository:
    async def summary(self) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        today_str = now.strftime("%Y-%m-%d")
        week_ago_str = (now - timedelta(days=7)).strftime("%Y-%m-%d")
        month_ago_str = (now - timedelta(days=30)).strftime("%Y-%m-%d")

        orders = await database.find_many("customer_orders")
        delivered = [o for o in orders if o.get("status") == "delivered"]
        cancelled = [o for o in orders if o.get("status") == "cancelled"]
        live = [o for o in orders if o.get("status") not in ("delivered", "cancelled")]
        today_orders = [o for o in orders if (o.get("createdAt") or "").startswith(today_str)]

        partners = await database.find_many("partner_profiles")
        pending_partners = [p for p in partners if p.get("status") == "pending" or not p.get("isVerified")]
        active_partners = [p for p in partners if p.get("status") == "active" and p.get("isVerified")]
        suspended_partners = [p for p in partners if p.get("status") == "suspended"]

        riders = await database.find_many("rider_profiles")
        online_riders = [r for r in riders if r.get("isOnline") is True]
        busy_rider_ids = {o.get("rider", {}).get("id") for o in live if o.get("rider")}
        busy_riders = [r for r in riders if r.get("_id") in busy_rider_ids]
        available_riders = [r for r in online_riders if r.get("_id") not in busy_rider_ids]

        all_users = await database.find_many("users")
        customers = [
            u for u in all_users
            if str(u.get("role") or "customer").lower() in ("customer", "user", "none")
        ]
        if not customers:
            customers = await database.find_many("customers")

        today_customers = [
            c for c in customers
            if (c.get("createdAt") or c.get("created_at") or "").startswith(today_str)
        ]
        active_customer_ids = {
            o.get("userId") or o.get("user_id") or o.get("customer", {}).get("id")
            for o in orders
            if o.get("customer") or o.get("userId") or o.get("user_id")
        }

        today_revenue = sum(
            (o.get("totals") or {}).get("grandTotal", 0)
            for o in delivered
            if (o.get("createdAt") or "").startswith(today_str)
        )
        weekly_revenue = sum(
            (o.get("totals") or {}).get("grandTotal", 0)
            for o in delivered
            if (o.get("createdAt") or "") >= week_ago_str
        )
        monthly_revenue = sum(
            (o.get("totals") or {}).get("grandTotal", 0)
            for o in delivered
            if (o.get("createdAt") or "") >= month_ago_str
        )
        total_revenue = sum((o.get("totals") or {}).get("grandTotal", 0) for o in delivered)
        platform_earnings = round(total_revenue * 0.18)

        payouts = await database.find_many("admin_payouts", {"kind": "payout"})
        pending_payout_docs = [p for p in payouts if p.get("status") in ("Pending", "Requested", "processing")]
        pending_payout_amount = sum(p.get("amount", 0) for p in pending_payout_docs)

        # Real Membership Subscriptions from Supabase
        memberships_list = await database.find_many("memberships")
        active_memberships = [m for m in memberships_list if m.get("status") == "active" or m.get("active") is True]
        silver_count = sum(1 for m in active_memberships if str(m.get("plan_id") or "").lower() == "silver")
        gold_count = sum(1 for m in active_memberships if str(m.get("plan_id") or "").lower() == "gold")
        platinum_count = sum(1 for m in active_memberships if str(m.get("plan_id") or "").lower() in ("platinum", "premium"))
        membership_mrr = sum(int(m.get("amountPaid") or m.get("amount_paid") or 0) for m in active_memberships)

        # SLA Delay Warning (Live orders stuck > 45 minutes)
        now_ts = now.timestamp()
        delayed_orders = []
        for o in live:
            st = o.get("status")
            if st in ("placed", "pending_partner_acceptance", "partner_accepted"):
                created_iso = o.get("createdAt") or o.get("created_at") or ""
                try:
                    dt = datetime.fromisoformat(created_iso.replace("Z", "+00:00"))
                    if (now_ts - dt.timestamp()) > 2700:  # 45 minutes
                        delayed_orders.append(o)
                except Exception:
                    pass

        # Real Open Support Tickets
        tickets = await database.find_many("admin_support_tickets")
        open_tickets = [t for t in tickets if str(t.get("status") or "").lower() in ("open", "pending", "escalated")]

        # Real City-wise performance breakdown
        city_groups: Dict[str, Dict[str, Any]] = {}
        for o in orders:
            c_name = o.get("city") or (o.get("address") or {}).get("city") or "Kasganj"
            cg = city_groups.setdefault(c_name, {"city": c_name, "orders": 0, "revenue": 0, "partners": 0})
            cg["orders"] += 1
            if o.get("status") == "delivered":
                cg["revenue"] += (o.get("totals") or {}).get("grandTotal", 0)
        
        for p in partners:
            pc_name = p.get("city") or "Kasganj"
            if pc_name in city_groups:
                city_groups[pc_name]["partners"] += 1
            else:
                city_groups[pc_name] = {"city": pc_name, "orders": 0, "revenue": 0, "partners": 1}

        city_breakdown = sorted(city_groups.values(), key=lambda x: x["orders"], reverse=True)

        return {
            "totalOrders": len(orders),
            "todayOrders": len(today_orders),
            "liveOrders": len(live),
            "deliveredOrders": len(delivered),
            "cancelledOrders": len(cancelled),
            "revenue": total_revenue,
            "todayRevenue": today_revenue,
            "weeklyRevenue": weekly_revenue,
            "monthlyRevenue": monthly_revenue,
            "platformEarnings": platform_earnings,
            "partners": len(partners),
            "pendingPartners": len(pending_partners),
            "activePartners": len(active_partners),
            "suspendedPartners": len(suspended_partners),
            "riders": len(riders),
            "onlineRiders": len(online_riders),
            "busyRiders": len(busy_riders),
            "availableRiders": len(available_riders),
            "customers": len(customers),
            "todayCustomers": len(today_customers),
            "activeCustomers": len(active_customer_ids),
            "pendingPayouts": len(pending_payout_docs),
            "pendingPayoutAmount": pending_payout_amount,
            "unassignedOrders": len(unassigned_orders),
            "slaDelayedOrders": len(delayed_orders),
            "openSupportTickets": len(open_tickets),
            "activeMembers": len(active_memberships),
            "silverMembers": silver_count,
            "goldMembers": gold_count,
            "platinumMembers": platinum_count,
            "membershipMRR": membership_mrr,
            "topServices": top_services,
            "topPartners": top_partners,
            "cityBreakdown": city_breakdown,
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

    default_settings: Dict[str, Any] = {
        "platformName": "QuickPress Laundry",
        "supportEmail": "support@quickpress.app",
        "supportPhone": "+91 90000 00000",
        "currency": "INR",
        "currencySymbol": "₹",
        "defaultCountry": "India",
        "defaultCity": "Kasganj",
        "minimumOrderValue": 99,
        "handlingFee": 15,
        "deliveryFee": 29,
        "freeDeliveryAbove": 499,
        "pickupFee": 0,
        "gstPercent": 5,
        "tax_percentage": 5,
        "platformCommissionRate": 18,
        "defaultCommission": "18%",
        "partnerRegistrationEnabled": True,
        "partnerApprovalRequired": True,
        "orderAutoCancelMinutes": 15,
        "partnerAcceptanceTimeoutMinutes": 10,
        "platform": {
            "platformName": "QuickPress Laundry",
            "supportEmail": "support@quickpress.app",
            "supportPhone": "+91 90000 00000",
            "defaultCity": "Kasganj",
            "currency": "INR",
        },
        "business": {
            "legalName": "QuickPress Logistics Pvt Ltd",
            "gstin": "09AAAAA0000A1Z5",
            "address": "Express Hub, Kasganj, Uttar Pradesh 207123",
            "payoutCycle": "Weekly on Monday",
            "minimumOrderValue": "99",
            "deliveryFee": "29",
            "handlingFee": "15",
        },
        "integrations": {
            "paymentGateway": "Razorpay Live / UPI",
            "paymentKeyId": "rzp_live_qp99",
            "firebaseProject": "quickpress-app-prod",
            "googleMapsKey": "AIzaSy_Maps_Live",
            "smsProvider": "Twilio / Fast2SMS",
            "smsSenderId": "QKPRES",
        },
        "finance": {
            "gstPercent": "5%",
            "serviceTax": "0%",
            "defaultCommission": "18%",
            "riderCommission": "100% of Delivery Fee + Trip Bonus",
        },
    }

    async def get(self) -> Dict[str, Any]:
        doc = await database.find_one("admin_settings", {"_id": self.doc_id})
        if not doc:
            await database.insert("admin_settings", {"_id": self.doc_id, **self.default_settings})
            return dict(self.default_settings)
        return {**self.default_settings, **doc}

    async def update(self, changes: Dict[str, Any]) -> Dict[str, Any]:
        current = await self.get()
        merged = {**current, **changes}
        merged.pop("_id", None)
        # Update top-level flat aliases if nested groups changed
        if "business" in merged and isinstance(merged["business"], dict):
            if "minimumOrderValue" in merged["business"]:
                try:
                    merged["minimumOrderValue"] = int(merged["business"]["minimumOrderValue"])
                except Exception:
                    pass
            if "deliveryFee" in merged["business"]:
                try:
                    merged["deliveryFee"] = int(merged["business"]["deliveryFee"])
                except Exception:
                    pass
            if "handlingFee" in merged["business"]:
                try:
                    merged["handlingFee"] = int(merged["business"]["handlingFee"])
                except Exception:
                    pass
        if "finance" in merged and isinstance(merged["finance"], dict):
            if "gstPercent" in merged["finance"]:
                try:
                    clean_gst = str(merged["finance"]["gstPercent"]).replace("%", "").strip()
                    merged["gstPercent"] = float(clean_gst)
                    merged["tax_percentage"] = float(clean_gst)
                except Exception:
                    pass
            if "defaultCommission" in merged["finance"]:
                try:
                    clean_comm = str(merged["finance"]["defaultCommission"]).replace("%", "").strip()
                    merged["platformCommissionRate"] = float(clean_comm)
                except Exception:
                    pass

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
class AdminCityRepository:
    collection = "admin_cities"

    async def list(self) -> List[Dict[str, Any]]:
        cities = await database.find_sorted(self.collection, sort=[("city", 1)])
        partners = await database.find_many("partner_profiles")
        riders = await database.find_many("rider_profiles")
        customers = await database.find_many("customers")
        orders = await database.find_many("customer_orders")
        today_prefix = now_iso()[:10]

        result = []
        for c in cities:
            c_name = str(c.get("city", "")).strip().lower()

            # City matched partners
            city_partners = [
                p
                for p in partners
                if str(p.get("city", "")).strip().lower() == c_name
                or c_name in str(p.get("city", "")).strip().lower()
            ]
            active_partners = [p for p in city_partners if p.get("status") == "active"]

            # City matched riders
            city_riders = [
                r
                for r in riders
                if str(r.get("city", "")).strip().lower() == c_name
                or c_name in str(r.get("city", "")).strip().lower()
            ]
            online_riders = [r for r in city_riders if r.get("isOnline", False)]

            # City matched customers
            city_customers = [
                cust
                for cust in customers
                if str(cust.get("city", "")).strip().lower() == c_name
                or c_name in str(cust.get("city", "")).strip().lower()
            ]

            # City matched orders
            city_orders = [
                o
                for o in orders
                if str((o.get("address") or {}).get("city") or (o.get("partner") or {}).get("city") or "")
                .strip()
                .lower()
                == c_name
                or c_name
                in str((o.get("address") or {}).get("city") or (o.get("partner") or {}).get("city") or "")
                .strip()
                .lower()
            ]
            today_orders = [
                o for o in city_orders if (o.get("createdAt") or o.get("placedAt") or "")[:10] == today_prefix
            ]
            delivered_orders = [o for o in city_orders if o.get("status") == "delivered"]

            # Financials
            gross_sales = sum((o.get("totals") or {}).get("grandTotal", 0) for o in city_orders)
            platform_commission = round(gross_sales * 0.18)
            partner_net = gross_sales - platform_commission

            result.append(
                {
                    "_id": c["_id"],
                    "id": c["_id"],
                    "city": c.get("city", ""),
                    "state": c.get("state", "Uttar Pradesh"),
                    "country": c.get("country", "India"),
                    "areas": int(c.get("areas") or 0),
                    "partners": len(city_partners),
                    "activePartners": len(active_partners),
                    "riders": len(city_riders),
                    "onlineRiders": len(online_riders),
                    "customers": len(city_customers),
                    "orders": len(city_orders),
                    "todayOrders": len(today_orders),
                    "sales": gross_sales,
                    "revenue": gross_sales,
                    "platformEarnings": platform_commission,
                    "partnerEarnings": partner_net,
                    "pickupRadius": c.get("pickupRadius", "8 km"),
                    "status": c.get("status", "Live"),
                }
            )
        return result

    async def get(self, entity_id: str) -> Optional[Dict[str, Any]]:
        return await database.find_one(self.collection, {"_id": entity_id})

    async def create(self, document: Dict[str, Any]) -> Dict[str, Any]:
        document = {"_id": new_id("CI"), "country": "India", **document}
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


city_repository = AdminCityRepository()


class AdminAreaRepository:
    collection = "admin_areas"

    async def list(self, city_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = {"cityId": city_id} if city_id else {}
        areas = await database.find_sorted(self.collection, query, sort=[("city", 1), ("area", 1)])
        if not areas:
            cities = await database.find_many("admin_cities")
            fallback = []
            for c in cities:
                cid = c["_id"]
                c_name = c.get("city", "")
                s_name = c.get("state", "Uttar Pradesh")
                count = int(c.get("areas") or 2)
                for i in range(count):
                    fallback.append(
                        {
                            "_id": f"{cid}-area-{i + 1}",
                            "id": f"{cid}-area-{i + 1}",
                            "area": f"{c_name} Zone {i + 1}",
                            "city": c_name,
                            "cityId": cid,
                            "state": s_name,
                            "pincode": f"207{120 + i}",
                            "zone": f"Delivery Hub {i + 1}",
                            "status": "Live",
                        }
                    )
            return fallback
        return areas

    async def create(self, document: Dict[str, Any]) -> Dict[str, Any]:
        document = {"_id": new_id("AR"), "status": "Live", **document}
        return await database.insert(self.collection, document)

    async def update(self, area_id: str, changes: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        changes = {k: v for k, v in changes.items() if v is not None}
        return await database.update(self.collection, {"_id": area_id}, changes)

    async def delete(self, area_id: str) -> bool:
        return bool(await database.delete_one(self.collection, {"_id": area_id}))


area_repository = AdminAreaRepository()
service_repository = SimpleCrudRepository("admin_services", "s")


class AdminPartnerServiceRepository:
    collection = "partner_services"

    async def list(self, partner_id: Optional[str] = None, city: Optional[str] = None) -> List[Dict[str, Any]]:
        partner_docs = {p["_id"]: p for p in await database.find_many("partner_profiles")}
        services = await database.find_sorted(self.collection, sort=[("name", 1)])
        orders = await database.find_many("customer_orders")

        result = []
        for svc in services:
            pid = svc.get("partnerId", "")
            partner = partner_docs.get(pid) or {}

            if partner_id and pid != partner_id:
                continue
            partner_city = partner.get("city", "")
            if city and city != "all" and partner_city != city:
                continue

            svc_name = svc.get("name", "")
            matching_orders = [
                o
                for o in orders
                if (o.get("partner") or {}).get("id") == pid
                and any(
                    (item.get("name") or "").lower() == svc_name.lower()
                    or (item.get("service") or "").lower() == svc_name.lower()
                    for item in (o.get("items") or [])
                )
            ]

            is_enabled = bool(svc.get("enabled", svc.get("isActive", True)))
            is_suspended = bool(svc.get("isSuspended", False))
            status = "Suspended" if is_suspended else ("Active" if is_enabled else "Disabled")

            result.append(
                {
                    "id": str(svc.get("_id") or svc.get("id")),
                    "partnerId": pid,
                    "partnerName": partner.get("name", "Store"),
                    "city": partner_city or "—",
                    "masterServiceId": svc.get("masterServiceId") or svc.get("serviceId") or "",
                    "name": svc_name,
                    "category": svc.get("category", "laundry"),
                    "price": int(svc.get("price") or 0),
                    "unit": svc.get("unit", "kg"),
                    "turnaroundHours": int(svc.get("turnaroundHours") or 24),
                    "expressAvailable": bool(svc.get("expressAvailable", False)),
                    "minQuantity": int(svc.get("minQuantity") or 1),
                    "status": status,
                    "enabled": is_enabled,
                    "ordersCount": len(matching_orders),
                    "revenue": sum((o.get("totals") or {}).get("grandTotal", 0) for o in matching_orders),
                    "updatedAt": svc.get("updatedAt", ""),
                }
            )
        return result

    async def toggle_status(self, service_id: str, action: str) -> Optional[Dict[str, Any]]:
        existing = await database.find_one(self.collection, {"_id": service_id})
        if existing is None:
            existing = await database.find_one(self.collection, {"id": service_id})
        if existing is None:
            return None

        target_id = existing["_id"]
        changes: Dict[str, Any] = {}
        if action == "suspend":
            changes = {"isSuspended": True, "enabled": False, "isActive": False}
        elif action == "activate":
            changes = {"isSuspended": False, "enabled": True, "isActive": True}
        elif action == "disable":
            changes = {"enabled": False, "isActive": False}
        elif action == "enable":
            changes = {"enabled": True, "isActive": True}

        changes["updatedAt"] = now_iso()
        return await database.update(self.collection, {"_id": target_id}, changes)


admin_partner_service_repository = AdminPartnerServiceRepository()


class SupportRepository:
    collection = "admin_support_tickets"

    async def list(self) -> List[Dict[str, Any]]:
        help_tickets = await database.find_sorted("support_tickets", sort=[("created_at", -1)])
        admin_tickets = await database.find_sorted(self.collection, sort=[("createdAt", -1)])
        
        results: List[Dict[str, Any]] = []
        for t in help_tickets:
            customer_doc = await database.find_one("customers", {"_id": t.get("user_id")}) or await database.find_one("users", {"_id": t.get("user_id")})
            customer_name = (customer_doc or {}).get("name") or (customer_doc or {}).get("display_name") or t.get("user_id") or "Customer"
            results.append({
                "_id": str(t["_id"]),
                "id": str(t["_id"]),
                "ticketNumber": t.get("ticket_number") or str(t["_id"]),
                "subject": t.get("subject") or t.get("description") or "Customer Issue",
                "customer": customer_name,
                "priority": (t.get("priority") or "Medium").capitalize(),
                "status": (t.get("status") or "Open").capitalize(),
                "createdAt": t.get("created_at") or t.get("createdAt") or now_iso(),
                "replies": t.get("replies") or [],
            })
            
        for t in admin_tickets:
            if not any(r["id"] == str(t["_id"]) for r in results):
                results.append({
                    "_id": str(t["_id"]),
                    "id": str(t["_id"]),
                    "ticketNumber": t.get("ticketNumber") or str(t["_id"]),
                    "subject": t.get("subject") or "Support Request",
                    "customer": t.get("customer") or "Customer",
                    "priority": t.get("priority", "Medium"),
                    "status": t.get("status", "Open"),
                    "createdAt": t.get("createdAt") or now_iso(),
                    "replies": t.get("replies") or [],
                })
        return results

    async def get(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        doc = await database.find_one("support_tickets", {"_id": ticket_id})
        if doc is not None:
            return doc
        return await database.find_one(self.collection, {"_id": ticket_id})

    async def close(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        doc = await database.find_one("support_tickets", {"_id": ticket_id})
        if doc is not None:
            return await database.update("support_tickets", {"_id": ticket_id}, {"status": "resolved", "updated_at": now_iso()})
        return await database.update(self.collection, {"_id": ticket_id}, {"status": "Resolved"})

    async def reply(self, ticket_id: str, body: str) -> Optional[Dict[str, Any]]:
        doc = await database.find_one("support_tickets", {"_id": ticket_id})
        if doc is not None:
            now = now_iso()
            msg = {
                "_id": f"msg-{uuid.uuid4().hex[:12]}",
                "ticket_id": ticket_id,
                "user_id": "admin",
                "author": "support",
                "author_name": "QuickPress Support",
                "body": body,
                "attachment_name": None,
                "created_at": now,
            }
            await database.insert("support_messages", msg)
            await database.update("support_tickets", {"_id": ticket_id}, {"status": "in-progress", "last_message_at": now, "updated_at": now})
            return {"ok": True, "ticketId": ticket_id, "body": body}

        doc = await database.find_one(self.collection, {"_id": ticket_id})
        if doc is not None:
            replies = list(doc.get("replies") or [])
            replies.append({"body": body, "at": now_iso(), "author": "admin"})
            await database.update(self.collection, {"_id": ticket_id}, {"replies": replies})
            return {"ok": True, "ticketId": ticket_id, "body": body}
        return None


support_repository = SupportRepository()


class BannerRepository:
    collection = "banners"

    async def list(self) -> List[Dict[str, Any]]:
        return await database.find_sorted(self.collection, sort=[("priority", 1)])

    async def create(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        banner_id = payload.get("_id") or new_id("b")
        document = {
            "_id": banner_id,
            "id": banner_id,
            "eyebrow": payload.get("eyebrow") or "Offer",
            "title": payload.get("title") or "Special Discount",
            "subtitle": payload.get("subtitle") or "",
            "cta": payload.get("cta") or "Claim offer",
            "tone": payload.get("tone") or "primary",
            "redirectUrl": payload.get("redirectUrl") or "/offers",
            "priority": int(payload.get("priority") or 1),
            "createdAt": now_iso(),
        }
        await database.insert(self.collection, document)
        return document

    async def update(self, banner_id: str, changes: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        return await database.update(self.collection, {"_id": banner_id}, changes)

    async def delete(self, banner_id: str) -> bool:
        res = await database.delete_one(self.collection, {"_id": banner_id})
        return bool(res)


banner_repository = BannerRepository()


class NotificationRepository:
    collection = "admin_notifications"

    async def list(self) -> List[Dict[str, Any]]:
        return await database.find_sorted(self.collection, sort=[("createdAt", -1)])

    async def broadcast(self, audience: str, title: str, message: str) -> Dict[str, Any]:
        audience = (audience or "All").strip()
        audience_lower = audience.lower().rstrip("s")
        
        # 1. Fetch target users from real users collection
        all_users = await database.find_many("users", {})
        
        target_accounts: List[Dict[str, Any]] = []
        for u in all_users:
            user_id = str(u.get("_id") or u.get("id") or "")
            if not user_id:
                continue
            role = str(u.get("role") or "customer").lower()
            
            if audience_lower in ("all", "everyone"):
                target_accounts.append({"id": user_id, "role": role})
            elif audience_lower in ("customer", "all_customer") and role == "customer":
                target_accounts.append({"id": user_id, "role": role})
            elif audience_lower in ("partner", "all_partner") and role == "partner":
                target_accounts.append({"id": user_id, "role": role})
            elif audience_lower in ("rider", "all_rider") and role == "rider":
                target_accounts.append({"id": user_id, "role": role})

        # Also fallback to check partner_profiles & rider_profiles if not in users
        if audience_lower in ("all", "everyone", "partner", "all_partner"):
            partners = await database.find_many("partner_profiles", {})
            for p in partners:
                pid = str(p.get("userId") or p.get("_id") or "")
                if pid and not any(a["id"] == pid for a in target_accounts):
                    target_accounts.append({"id": pid, "role": "partner"})

        if audience_lower in ("all", "everyone", "rider", "all_rider"):
            riders = await database.find_many("rider_profiles", {})
            for r in riders:
                rid = str(r.get("userId") or r.get("_id") or "")
                if rid and not any(a["id"] == rid for a in target_accounts):
                    target_accounts.append({"id": rid, "role": "rider"})

        created_at = now_iso()
        is_promo = any(w in (title + " " + message).lower() for w in ("offer", "off", "discount", "deal", "cashback", "sale", "coupon", "₹", "%"))
        kind = "promotion" if is_promo else "broadcast"

        # 2. Insert into customer-facing `notifications` collection & `admin_notifications`
        for account in target_accounts:
            notif_id = new_id("ntf")
            
            # Customer / User feed document
            user_notif_doc = {
                "_id": notif_id,
                "user_id": account["id"],
                "role": account["role"],
                "kind": kind,
                "category": "system",
                "title": title or "QuickPress Announcement",
                "description": message or "",
                "created_at": created_at,
                "read": False,
                "read_at": None,
            }
            await database.insert("notifications", user_notif_doc)

            # Admin log document
            admin_notif_doc = {
                "_id": notif_id,
                "accountId": account["id"],
                "role": account["role"],
                "kind": kind,
                "title": title or "QuickPress Announcement",
                "description": message or "",
                "createdAt": created_at,
                "read": False,
            }
            await database.insert(self.collection, admin_notif_doc)

        # 3. Realtime Socket.IO Broadcast to all connected customer & partner devices
        try:
            from app.services.socket_service import broadcast_admin_notification_event
            await broadcast_admin_notification_event(
                title=title or "QuickPress Announcement",
                message=message or "",
                audience=audience,
            )
        except Exception as exc:
            pass

        return {"ok": True, "reached": len(target_accounts)}


notification_repository = NotificationRepository()


class AreaRepository:
    async def list(self, city_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = {"cityId": city_id} if city_id else {}
        areas = await database.find_many("admin_areas", query)
        if not areas and city_id:
            return await self.areas_for_city(city_id) or []
        return areas

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
# Baseline operational seed (master cities, categories and base services).
# All business transactional records (customers, partners, riders, orders,
# wallets, payouts, staff, support) are strictly generated and stored in
# live MongoDB collections in real time.
# --------------------------------------------------------------------------

_SEED_CITIES = [
    {"_id": "CI-1", "city": "Kasganj", "state": "Uttar Pradesh", "country": "India", "areas": 6, "partners": 1, "riders": 1, "pickupRadius": "8 km", "status": "Live"},
    {"_id": "CI-2", "city": "Aligarh", "state": "Uttar Pradesh", "country": "India", "areas": 8, "partners": 0, "riders": 0, "pickupRadius": "10 km", "status": "Coming Soon"},
    {"_id": "CI-3", "city": "Noida", "state": "Uttar Pradesh", "country": "India", "areas": 12, "partners": 0, "riders": 0, "pickupRadius": "12 km", "status": "Coming Soon"},
    {"_id": "CI-4", "city": "Mumbai", "state": "Maharashtra", "country": "India", "areas": 18, "partners": 0, "riders": 0, "pickupRadius": "6 km", "status": "Coming Soon"},
    {"_id": "CI-5", "city": "Pune", "state": "Maharashtra", "country": "India", "areas": 9, "partners": 0, "riders": 0, "pickupRadius": "5 km", "status": "Coming Soon"},
    {"_id": "CI-6", "city": "Bengaluru", "state": "Karnataka", "country": "India", "areas": 14, "partners": 0, "riders": 0, "pickupRadius": "8 km", "status": "Coming Soon"},
    {"_id": "CI-7", "city": "Delhi", "state": "Delhi", "country": "India", "areas": 15, "partners": 0, "riders": 0, "pickupRadius": "10 km", "status": "Coming Soon"},
    {"_id": "CI-8", "city": "Lucknow", "state": "Uttar Pradesh", "country": "India", "areas": 10, "partners": 0, "riders": 0, "pickupRadius": "10 km", "status": "Coming Soon"},
    {"_id": "CI-9", "city": "Etah", "state": "Uttar Pradesh", "country": "India", "areas": 4, "partners": 0, "riders": 0, "pickupRadius": "6 km", "status": "Coming Soon"},
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

_SEED_SETTINGS = [
    {"_id": "platform", "defaultCity": "Kasganj", "defaultCommission": "18%", "supportEmail": "support@quickpress.app", "supportPhone": "+91 90000 90000"}
]

ADMIN_SEED: Dict[str, List[Dict[str, Any]]] = {
    "admin_cities": _SEED_CITIES,
    "admin_categories": _SEED_CATEGORIES,
    "admin_services": _SEED_SERVICES,
}
