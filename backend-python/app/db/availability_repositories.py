"""Service Availability Engine + Smart Reorder repositories — Sprint 2.12.

Collections
    service_availability   per service: enabled / maintenance / daily capacity
    delivery_zones         supported cities, areas and PIN codes
    business_hours         per partner weekly opening hours (Asia/Kolkata)
    reorder_history        one document per reorder the customer performs

The engine answers a single question — "can this customer check out right
now?" — by running every rule in order and stopping at the first failure. The
failing rule decides the state, the friendly title and the message the customer
sees, and drives the alternative partners / services offered instead.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from app.db.client import database
from app.models.availability import (
    AvailabilityAlternative,
    AvailabilityCapacity,
    AvailabilityCheck,
    AvailabilityResponse,
    ServiceAreaResponse,
)

SERVICE_AVAILABILITY = "service_availability"
DELIVERY_ZONES = "delivery_zones"
BUSINESS_HOURS = "business_hours"
REORDER_HISTORY = "reorder_history"
ORDERS = "customer_orders"
PARTNERS = "catalog_partners"
SERVICES = "services"

IST = timezone(timedelta(hours=5, minutes=30))
WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

# Friendly copy per unavailable state — the customer never sees a rule id.
STATE_COPY: Dict[str, Tuple[str, str]] = {
    "available": ("Available", "Pickup and delivery are available for this service."),
    "service_unavailable": (
        "Service Not Available",
        "This service isn't available right now. Try one of the alternatives below.",
    ),
    "maintenance": (
        "Service Temporarily Unavailable",
        "We've paused this service for maintenance. It will be back shortly.",
    ),
    "partner_inactive": (
        "Service Not Available",
        "This laundry partner isn't accepting orders at the moment.",
    ),
    "partner_closed": (
        "Partner Closed",
        "This store is closed right now. You can schedule with another partner nearby.",
    ),
    "out_of_service_area": (
        "Out of Service Area",
        "We don't serve this area yet. Try a nearby PIN code or another location.",
    ),
    "pickup_unavailable": (
        "Out of Service Area",
        "Doorstep pickup isn't available at this address yet.",
    ),
    "delivery_unavailable": (
        "Delivery Not Available",
        "We can pick up here, but delivery isn't live in this area yet.",
    ),
    "capacity_reached": (
        "Daily Capacity Reached",
        "Today's slots are fully booked. Try another partner or book for tomorrow.",
    ),
}


def _now_ist() -> datetime:
    return datetime.now(IST)


def _minutes(value: str) -> int:
    try:
        hour, minute = value.split(":")
        return int(hour) * 60 + int(minute)
    except Exception:
        return 0


def _iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _copy(state: str) -> Tuple[str, str]:
    return STATE_COPY.get(state, STATE_COPY["service_unavailable"])


class AvailabilityRepository:
    """Reads the four availability collections and evaluates the rule chain."""

    # ---------------------------------------------------------------- reads
    async def service_document(self, service_id: str) -> Optional[Dict[str, Any]]:
        return await database.collection(SERVICES).find_one({"_id": service_id})

    async def partner_document(self, partner_id: str) -> Optional[Dict[str, Any]]:
        return await database.collection(PARTNERS).find_one({"_id": partner_id})

    async def service_flags(self, service_id: str) -> Dict[str, Any]:
        document = await database.collection(SERVICE_AVAILABILITY).find_one({"_id": service_id})
        return document or {
            "_id": service_id,
            "serviceId": service_id,
            "enabled": True,
            "maintenance": False,
            "maintenanceMessage": "",
            "dailyCapacity": 0,
            "cities": [],
        }

    async def zones(self) -> List[Dict[str, Any]]:
        return await database.find_many(DELIVERY_ZONES)

    async def service_areas(self) -> List[ServiceAreaResponse]:
        """GET /api/service-areas — every supported city / area / PIN code."""
        zones = await self.zones()
        zones.sort(key=lambda zone: (zone.get("city", ""), zone.get("area", "")))
        return [
            ServiceAreaResponse(
                id=str(zone["_id"]),
                city=zone.get("city", ""),
                area=zone.get("area", ""),
                pincodes=list(zone.get("pincodes") or []),
                pickupAvailable=bool(zone.get("pickupAvailable", True)),
                deliveryAvailable=bool(zone.get("deliveryAvailable", True)),
                partnerIds=list(zone.get("partnerIds") or []),
                etaMinutes=int(zone.get("etaMinutes") or 0),
            )
            for zone in zones
        ]

    async def _matching_zones(
        self, *, city: str, pincode: str, partner_id: str
    ) -> List[Dict[str, Any]]:
        zones = await self.zones()
        pin = (pincode or "").strip()
        town = (city or "").strip().lower()
        if pin:
            matched = [zone for zone in zones if pin in (zone.get("pincodes") or [])]
            if matched:
                return matched
        if town:
            matched = [
                zone
                for zone in zones
                if town in (zone.get("city", "").lower(), zone.get("area", "").lower())
                or town in f"{zone.get('area', '')}, {zone.get('city', '')}".lower()
            ]
            if matched:
                return matched
        if not pin and not town and partner_id:
            # No location supplied — fall back to the partner's own zone.
            return [zone for zone in zones if partner_id in (zone.get("partnerIds") or [])]
        return []

    async def business_hours(self, partner_id: str) -> Optional[Dict[str, Any]]:
        return await database.collection(BUSINESS_HOURS).find_one({"_id": partner_id})

    def _today_hours(self, document: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not document:
            return None
        today = WEEKDAYS[_now_ist().weekday()]
        for entry in document.get("hours") or []:
            if entry.get("day") == today:
                return entry
        return None

    def _is_open_now(self, document: Optional[Dict[str, Any]]) -> Tuple[bool, str]:
        """(open now, next opening label) from the weekly business hours."""
        entry = self._today_hours(document)
        if entry is None:
            return True, ""
        now = _now_ist()
        minutes = now.hour * 60 + now.minute
        if entry.get("closed"):
            return False, self._next_open_label(document, now)
        opens, closes = _minutes(entry.get("open", "00:00")), _minutes(entry.get("close", "23:59"))
        if opens <= minutes < closes:
            return True, ""
        if minutes < opens:
            return False, f"Opens today at {entry.get('open', '')}"
        return False, self._next_open_label(document, now)

    def _next_open_label(self, document: Optional[Dict[str, Any]], now: datetime) -> str:
        if not document:
            return ""
        hours = {entry.get("day"): entry for entry in (document.get("hours") or [])}
        for offset in range(1, 8):
            day = now + timedelta(days=offset)
            entry = hours.get(WEEKDAYS[day.weekday()])
            if entry and not entry.get("closed"):
                label = "Opens tomorrow" if offset == 1 else f"Opens {day.strftime('%a')}"
                return f"{label} at {entry.get('open', '')}"
        return ""

    async def daily_usage(self, partner_id: str) -> int:
        """Orders already placed with this partner today (IST)."""
        if not partner_id:
            return 0
        today = _now_ist().date()
        orders = await database.find_many(ORDERS)
        used = 0
        for order in orders:
            if (order.get("partner") or {}).get("id") != partner_id:
                continue
            if order.get("status") == "cancelled":
                continue
            raw = str(order.get("createdAt") or "")
            try:
                created = datetime.fromisoformat(raw.replace("Z", "+00:00")).astimezone(IST).date()
            except Exception:
                continue
            if created == today:
                used += 1
        return used

    # ------------------------------------------------------------ evaluate
    async def evaluate(
        self,
        *,
        service_id: Optional[str] = None,
        partner_id: Optional[str] = None,
        city: str = "",
        pincode: str = "",
    ) -> AvailabilityResponse:
        checks: List[AvailabilityCheck] = []
        state = "available"
        message_override = ""

        service = await self.service_document(service_id) if service_id else None
        flags = await self.service_flags(service_id) if service_id else None

        # 1 — the service exists and is enabled
        if service_id:
            enabled = bool(service) and bool((flags or {}).get("enabled", True))
            checks.append(
                AvailabilityCheck(
                    id="service_enabled",
                    label="Service is enabled",
                    ok=enabled,
                    detail=(service or {}).get("name", service_id),
                )
            )
            if not enabled and state == "available":
                state = "service_unavailable"

            # 2 — maintenance window
            maintenance = bool((flags or {}).get("maintenance"))
            checks.append(
                AvailabilityCheck(
                    id="service_maintenance",
                    label="Service is not under maintenance",
                    ok=not maintenance,
                    detail=str((flags or {}).get("maintenanceMessage") or ""),
                )
            )
            if maintenance and state == "available":
                state = "maintenance"
                message_override = str((flags or {}).get("maintenanceMessage") or "")

        # 3 / 4 — the partner is active and open
        partner = await self.partner_document(partner_id) if partner_id else None
        hours = await self.business_hours(partner_id) if partner_id else None
        next_open = ""
        if partner_id:
            active = bool(partner) and partner.get("active", True) is not False
            checks.append(
                AvailabilityCheck(
                    id="partner_active",
                    label="Partner is active",
                    ok=active,
                    detail=(partner or {}).get("name", partner_id),
                )
            )
            if not active and state == "available":
                state = "partner_inactive"

            open_by_hours, next_open = self._is_open_now(hours)
            is_open = open_by_hours and (partner or {}).get("isOpen", True) is not False
            checks.append(
                AvailabilityCheck(
                    id="partner_open",
                    label="Partner is open",
                    ok=is_open,
                    detail=next_open,
                )
            )
            if not is_open and state == "available":
                state = "partner_closed"

        # 5 / 6 / 7 — pickup area, delivery area, city and PIN code
        zones = await self._matching_zones(city=city, pincode=pincode, partner_id=partner_id or "")
        located = bool(city.strip() or pincode.strip() or partner_id)
        if located:
            supported = bool(zones)
            checks.append(
                AvailabilityCheck(
                    id="city_supported",
                    label="Customer city is supported",
                    ok=supported or not (city.strip() or pincode.strip()),
                    detail=city or "",
                )
            )
            checks.append(
                AvailabilityCheck(
                    id="pincode_supported",
                    label="PIN Code is supported",
                    ok=supported or not pincode.strip(),
                    detail=pincode or "",
                )
            )
            if not supported and (city.strip() or pincode.strip()) and state == "available":
                state = "out_of_service_area"

            pickup_ok = any(zone.get("pickupAvailable", True) for zone in zones) if zones else True
            delivery_ok = (
                any(zone.get("deliveryAvailable", True) for zone in zones) if zones else True
            )
            checks.append(
                AvailabilityCheck(
                    id="pickup_area", label="Pickup area is supported", ok=pickup_ok, detail=""
                )
            )
            checks.append(
                AvailabilityCheck(
                    id="delivery_area", label="Delivery area is supported", ok=delivery_ok, detail=""
                )
            )
            if zones and not pickup_ok and state == "available":
                state = "pickup_unavailable"
            if zones and pickup_ok and not delivery_ok and state == "available":
                state = "delivery_unavailable"

        # 8 — daily order capacity
        limit = int((hours or {}).get("dailyCapacity") or (flags or {}).get("dailyCapacity") or 0)
        used = await self.daily_usage(partner_id or "") if partner_id else 0
        remaining = max(0, limit - used) if limit else 0
        within_capacity = (not limit) or used < limit
        checks.append(
            AvailabilityCheck(
                id="daily_capacity",
                label="Daily order capacity not exceeded",
                ok=within_capacity,
                detail=f"{used}/{limit}" if limit else "No cap",
            )
        )
        if not within_capacity and state == "available":
            state = "capacity_reached"

        title, message = _copy(state)
        available = state == "available"
        response = AvailabilityResponse(
            available=available,
            state=state,
            title=title,
            message=message_override or message,
            serviceId=service_id,
            partnerId=partner_id,
            city=city or "",
            pincode=pincode or "",
            checks=checks,
            capacity=AvailabilityCapacity(limit=limit, used=used, remaining=remaining),
            nextOpenLabel=next_open,
            alternatives=[],
        )
        if not available:
            response.alternatives = await self.alternatives(
                state=state, service_id=service_id, partner_id=partner_id, city=city, pincode=pincode
            )
        return response

    # --------------------------------------------------------- alternatives
    async def alternatives(
        self,
        *,
        state: str,
        service_id: Optional[str],
        partner_id: Optional[str],
        city: str,
        pincode: str,
    ) -> List[AvailabilityAlternative]:
        """Other partners (or other services) the customer can use instead."""
        results: List[AvailabilityAlternative] = []

        if state in ("service_unavailable", "maintenance") and service_id:
            service = await self.service_document(service_id)
            category = (service or {}).get("categoryId")
            services = await database.find_many(SERVICES)
            for other in services:
                if str(other["_id"]) == service_id:
                    continue
                flags = await self.service_flags(str(other["_id"]))
                if not flags.get("enabled", True) or flags.get("maintenance"):
                    continue
                if category and other.get("categoryId") != category and len(results) >= 2:
                    continue
                results.append(
                    AvailabilityAlternative(
                        kind="service",
                        id=str(other["_id"]),
                        name=other.get("name", ""),
                        subtitle=other.get("description", ""),
                        image=other.get("image", ""),
                        price=int(other.get("price") or 0),
                    )
                )
                if len(results) >= 4:
                    break
            return results

        partners = await database.find_many(PARTNERS)
        zones = await self._matching_zones(city=city, pincode=pincode, partner_id="")
        allowed = {pid for zone in zones for pid in (zone.get("partnerIds") or [])}
        for candidate in partners:
            pid = str(candidate["_id"])
            if pid == partner_id:
                continue
            if allowed and pid not in allowed:
                continue
            if candidate.get("active", True) is False:
                continue
            hours = await self.business_hours(pid)
            open_now, _ = self._is_open_now(hours)
            if not (open_now and candidate.get("isOpen", True) is not False):
                continue
            results.append(
                AvailabilityAlternative(
                    kind="partner",
                    id=pid,
                    name=candidate.get("name", ""),
                    subtitle=f"{candidate.get('area', '')}, {candidate.get('city', '')}".strip(", "),
                    image=candidate.get("image") or candidate.get("logo") or "",
                    rating=float(candidate.get("rating") or 0),
                    price=int(candidate.get("minPrice") or 0),
                )
            )
            if len(results) >= 4:
                break
        return results

    # ------------------------------------------------------ reorder history
    async def record_reorder(
        self, *, user_id: str, order_id: str, order_code: str, items: int, total: int
    ) -> None:
        at = _iso(datetime.now(timezone.utc))
        document = await database.collection(REORDER_HISTORY).find_one(
            {"_id": f"{user_id}:{order_id}"}
        )
        count = int((document or {}).get("count") or 0) + 1
        await database.collection(REORDER_HISTORY).update_one(
            {"_id": f"{user_id}:{order_id}"},
            {
                "$set": {
                    "userId": user_id,
                    "orderId": order_id,
                    "orderCode": order_code,
                    "items": items,
                    "total": total,
                    "count": count,
                    "lastReorderedAt": at,
                }
            },
            upsert=True,
        )

    async def reorder_stats(self, user_id: str) -> Dict[str, Dict[str, Any]]:
        rows = await database.find_many(REORDER_HISTORY, {"userId": user_id})
        return {str(row.get("orderId")): row for row in rows}


availability_repository = AvailabilityRepository()
