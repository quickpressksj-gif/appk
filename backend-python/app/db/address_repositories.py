"""Address book repository — Sprint 2.4.

One MongoDB collection, `customer_addresses`, holds one document per saved
address:

    {_id, userId, type, label, houseNumber, building, street, area, landmark,
     city, state, pincode, contactName, phone, isDefault, createdAt}

Only one address per customer can be the default; setting a new default clears
the previous one.
"""

from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

from app.db.client import database
from app.models.address import AddressPayload, AddressResponse

COLLECTION = "customer_addresses"

LABELS = {"home": "Home", "office": "Work", "other": "Other"}


def _line(document: Dict[str, Any]) -> str:
    parts = [document.get("houseNumber"), document.get("building"), document.get("street")]
    return ", ".join([str(p).strip() for p in parts if p and str(p).strip()])


def _city_line(document: Dict[str, Any]) -> str:
    area = str(document.get("area") or "").strip()
    city = str(document.get("city") or "").strip()
    pincode = str(document.get("pincode") or "").strip()
    head = ", ".join([p for p in (area, city) if p])
    return f"{head} {pincode}".strip()


def to_response(document: Dict[str, Any]) -> AddressResponse:
    kind = document.get("type") or "home"
    return AddressResponse(
        id=str(document["_id"]),
        type=kind if kind in LABELS else "other",
        label=document.get("label") or LABELS.get(kind, "Other"),
        houseNumber=document.get("houseNumber", ""),
        building=document.get("building", ""),
        street=document.get("street", ""),
        area=document.get("area", ""),
        landmark=document.get("landmark", ""),
        city=document.get("city", ""),
        state=document.get("state", ""),
        pincode=document.get("pincode", ""),
        contactName=document.get("contactName", ""),
        phone=document.get("phone", ""),
        isDefault=bool(document.get("isDefault")),
        latitude=document.get("latitude"),
        longitude=document.get("longitude"),
        line=_line(document),
        cityLine=_city_line(document),
    )



def validate(payload: AddressPayload) -> None:
    """Invalid addresses can never reach an order."""
    missing = [
        field
        for field in ("houseNumber", "area", "city", "pincode", "phone")
        if not str(getattr(payload, field) or "").strip()
    ]
    if missing:
        raise ValueError(
            "House/flat number, area, city, pincode and phone are required"
        )
    pincode = str(payload.pincode).strip()
    if not pincode.isdigit() or len(pincode) != 6:
        raise ValueError("Pincode must be 6 digits")
    digits = "".join(ch for ch in str(payload.phone) if ch.isdigit())
    if len(digits) < 10:
        raise ValueError("Enter a valid 10 digit phone number")


class AddressRepository:
    async def list(self, user_id: str) -> List[AddressResponse]:
        docs = await database.find_many(COLLECTION, {"userId": user_id})
        docs.sort(key=lambda d: (not d.get("isDefault"), str(d.get("createdAt") or "")))
        return [to_response(d) for d in docs]

    async def get(self, user_id: str, address_id: str) -> Optional[AddressResponse]:
        document = await database.collection(COLLECTION).find_one(
            {"_id": address_id, "userId": user_id}
        )
        return to_response(document) if document else None

    async def default(self, user_id: str) -> Optional[AddressResponse]:
        addresses = await self.list(user_id)
        return next((a for a in addresses if a.isDefault), addresses[0] if addresses else None)

    async def create(self, user_id: str, payload: AddressPayload) -> AddressResponse:
        validate(payload)
        existing = await database.find_many(COLLECTION, {"userId": user_id})
        address_id = f"addr-{user_id}-{int(time.time() * 1000)}"
        is_default = bool(payload.isDefault) or not existing
        document = {
            "_id": address_id,
            "userId": user_id,
            **payload.model_dump(exclude={"isDefault"}),
            # An explicit label wins; otherwise it follows the address type.
            "label": payload.label
            if "label" in payload.model_fields_set and payload.label
            else LABELS.get(payload.type, "Other"),
            "isDefault": is_default,
            "createdAt": int(time.time() * 1000),
        }
        await database.collection(COLLECTION).insert_one(document)
        if is_default:
            await self._clear_other_defaults(user_id, address_id)
        return to_response(document)

    async def update(
        self, user_id: str, address_id: str, payload: AddressPayload
    ) -> Optional[AddressResponse]:
        document = await database.collection(COLLECTION).find_one(
            {"_id": address_id, "userId": user_id}
        )
        if document is None:
            return None
        # Only the fields the client actually sent: a partial PATCH such as
        # {"isDefault": true} must not wipe the stored street or phone.
        patch = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
        stored = {k: v for k, v in document.items() if k in AddressPayload.model_fields}
        if [key for key in patch if key != "isDefault"]:
            validate(AddressPayload(**{**stored, **patch}))
        merged = {**document, **patch}
        if "label" not in patch and "type" in patch:
            merged["label"] = LABELS.get(str(merged.get("type")), "Other")
        merged["label"] = merged.get("label") or LABELS.get(str(merged.get("type", "other")), "Other")
        await database.collection(COLLECTION).update_one(
            {"_id": address_id}, {"$set": {k: v for k, v in merged.items() if k != "_id"}}
        )
        if merged.get("isDefault"):
            await self._clear_other_defaults(user_id, address_id)
        return to_response(merged)

    async def delete(self, user_id: str, address_id: str) -> bool:
        """Remove an address; the oldest survivor inherits the default flag."""
        res = await database.collection(COLLECTION).delete_many(
            {"_id": address_id, "userId": user_id}
        )
        count = res if isinstance(res, int) else (getattr(res, "deleted_count", 0) if res is not None else 0)
        if not count:
            return False
        remaining = await self.list(user_id)
        if remaining and not any(a.isDefault for a in remaining):
            await database.collection(COLLECTION).update_one(
                {"_id": remaining[0].id}, {"$set": {"isDefault": True}}
            )
        return True

    async def set_default(self, user_id: str, address_id: str) -> Optional[AddressResponse]:
        """PUT /api/addresses/{id}/default — exactly one default per customer."""
        document = await database.collection(COLLECTION).find_one(
            {"_id": address_id, "userId": user_id}
        )
        if document is None:
            return None
        await database.collection(COLLECTION).update_one(
            {"_id": address_id}, {"$set": {"isDefault": True}}
        )
        await self._clear_other_defaults(user_id, address_id)
        return to_response({**document, "isDefault": True})

    async def _clear_other_defaults(self, user_id: str, keep_id: str) -> None:
        for document in await database.find_many(COLLECTION, {"userId": user_id}):
            if document["_id"] != keep_id and document.get("isDefault"):
                await database.collection(COLLECTION).update_one(
                    {"_id": document["_id"]}, {"$set": {"isDefault": False}}
                )


address_repository = AddressRepository()
