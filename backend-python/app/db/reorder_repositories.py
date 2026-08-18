"""Smart Reorder repository — Sprint 2.12.

    GET  /api/reorder/history          completed orders that can be reordered
    POST /api/orders/{id}/reorder      one tap reorder into the smart cart

Reorder restores every service and quantity of a past order, reprices each line
against the live catalogue, validates the current availability of the partner
and the services, writes a `reorder_history` document and hands the customer to
the cart.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from app.db.availability_repositories import availability_repository
from app.db.cart_repositories import cart_repository
from app.db.client import database
from app.models.availability import (
    ReorderHistoryEntry,
    ReorderLine,
    ReorderResponse,
)
from app.models.cart import CartItemPayload
from app.models.order import OrderResponse
from app.models.user import User

SERVICES = "services"

# Statuses a customer may reorder from.
COMPLETED = ("delivered", "completed")


def _slug(value: str) -> str:
    return "".join(ch.lower() if ch.isalnum() else "-" for ch in value).strip("-")


class ReorderRepository:
    async def _services(self) -> List[Dict[str, Any]]:
        return await database.find_many(SERVICES)

    def _match_service(self, line_id: str, name: str, services: List[Dict[str, Any]]):
        target = _slug(name)
        for service in services:
            sid = str(service["_id"])
            if sid == line_id or _slug(sid) == line_id:
                return service
        for service in services:
            if _slug(service.get("name", "")) == target:
                return service
        for service in services:
            label = _slug(service.get("name", ""))
            if label and (label in target or target in label):
                return service
        return None

    async def _lines(self, order: OrderResponse) -> Tuple[List[ReorderLine], List[ReorderLine]]:
        """Repriced, availability-validated lines: (restorable, skipped)."""
        services = await self._services()
        restorable: List[ReorderLine] = []
        skipped: List[ReorderLine] = []

        for item in order.items:
            service = self._match_service(item.id, item.name, services)
            service_id = str(service["_id"]) if service else item.id
            current = int(service.get("price")) if service and service.get("price") else item.price
            flags = await availability_repository.service_flags(service_id)
            available = bool(service) and bool(flags.get("enabled", True)) and not flags.get(
                "maintenance"
            )
            line = ReorderLine(
                id=item.id,
                serviceId=service_id,
                name=service.get("name", item.name) if service else item.name,
                qty=max(1, item.qty),
                previousPrice=item.price,
                currentPrice=current,
                priceChanged=current != item.price,
                available=available,
                unavailableReason=""
                if available
                else str(flags.get("maintenanceMessage") or "This service isn't available today"),
            )
            (restorable if available else skipped).append(line)
        return restorable, skipped

    async def history(self, user: User, orders: List[OrderResponse]) -> List[ReorderHistoryEntry]:
        """GET /api/reorder/history — every completed order, ready to reorder."""
        stats = await availability_repository.reorder_stats(user.id)
        entries: List[ReorderHistoryEntry] = []

        for order in orders:
            if order.status not in COMPLETED:
                continue
            restorable, skipped = await self._lines(order)
            availability = await availability_repository.evaluate(
                service_id=(restorable[0].serviceId if restorable else None),
                partner_id=order.partner.id or None,
                city=order.address.city or "",
            )
            estimated = sum(line.currentPrice * line.qty for line in restorable)
            previous = sum(line.previousPrice * line.qty for line in (restorable + skipped))
            stat = stats.get(order.id) or {}
            entries.append(
                ReorderHistoryEntry(
                    orderId=order.id,
                    orderCode=order.code,
                    partnerId=order.partner.id,
                    partnerName=order.partner.name,
                    partnerImage=order.partner.image or "",
                    serviceLabel=order.serviceLabel,
                    placedAt=order.createdAt,
                    deliveredAt=order.updatedAt,
                    itemCount=sum(line.qty for line in restorable),
                    previousTotal=previous,
                    estimatedTotal=estimated,
                    priceChanged=any(line.priceChanged for line in restorable),
                    reorderable=bool(restorable),
                    availability=availability,
                    items=restorable + skipped,
                    lastReorderedAt=stat.get("lastReorderedAt"),
                    reorderCount=int(stat.get("count") or 0),
                )
            )
        return entries

    async def reorder(self, user: User, order: OrderResponse) -> ReorderResponse:
        """POST /api/orders/{id}/reorder — restore, reprice, validate, redirect."""
        restorable, skipped = await self._lines(order)

        for line in restorable:
            await cart_repository.add_item(
                user.id,
                CartItemPayload(
                    id=line.serviceId,
                    itemId=line.serviceId,
                    serviceId=line.serviceId,
                    partnerId=order.partner.id,
                    name=line.name,
                    price=line.currentPrice,
                    qty=line.qty,
                ),
            )

        availability = await availability_repository.evaluate(
            service_id=(restorable[0].serviceId if restorable else None),
            partner_id=order.partner.id or None,
            city=order.address.city or "",
        )
        estimated = sum(line.currentPrice * line.qty for line in restorable)
        previous = sum(line.previousPrice * line.qty for line in (restorable + skipped))

        await availability_repository.record_reorder(
            user_id=user.id,
            order_id=order.id,
            order_code=order.code,
            items=len(restorable),
            total=estimated,
        )

        return ReorderResponse(
            ok=bool(restorable),
            orderId=order.id,
            orderCode=order.code,
            redirectTo="/cart",
            restoredItems=len(restorable),
            previousTotal=previous,
            estimatedTotal=estimated,
            priceChanged=any(line.priceChanged for line in restorable),
            skipped=skipped,
            items=restorable,
            availability=availability,
        )


reorder_repository = ReorderRepository()
