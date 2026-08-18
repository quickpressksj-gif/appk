"""One partner identity across the whole platform.

A customer order stores `partner.id` from the catalog (`catalog_partners`),
while the partner app reads `partner_profiles`. Those two must be the SAME id,
otherwise a partner store can never see the orders placed against it.

This module mirrors every catalog partner into `partner_profiles` (and gives it
default business settings) using the catalog id as the profile id, so the
canonical `partner.id` on an order is directly usable by the partner app.
"""

from __future__ import annotations

from typing import Any, Dict

from app.db.client import database

CATALOG = "catalog_partners"
PROFILES = "partner_profiles"
SETTINGS = "partner_settings"


def _profile_from_catalog(document: Dict[str, Any]) -> Dict[str, Any]:
    partner_id = str(document["_id"])
    city = document.get("city") or ""
    return {
        "_id": partner_id,
        "partnerId": partner_id,
        "name": document.get("name", ""),
        "businessName": document.get("name", ""),
        "ownerName": document.get("ownerName") or document.get("name", ""),
        "phone": document.get("phone", ""),
        "email": document.get("email", ""),
        "city": city,
        "rating": float(document.get("rating") or 0),
        "totalOrders": int(document.get("totalOrders") or 0),
        "joinedOn": document.get("joinedOn", ""),
        "onTimeRate": float(document.get("onTimeRate") or 95.0),
        "tier": document.get("tier", "Silver"),
        "status": "active",
        "isOpen": True,
        "acceptingNewOrders": True,
        "autoAccept": False,
    }


def _settings_for(partner_id: str) -> Dict[str, Any]:
    return {
        "_id": partner_id,
        "partnerId": partner_id,
        # Real partner id in snake_case too, so the partial unique index on
        # partner_settings.partner_id enforces uniqueness for real partners.
        "partner_id": partner_id,
        "isStoreOpen": True,
        "acceptingNewOrders": True,
        "autoAcceptOrders": False,
        "expressDelivery": True,
        "pickupRadiusKm": 6,
        "openingTime": "08:00",
        "closingTime": "21:00",
        "weeklyOff": "Sunday",
    }


async def align_partner_identities() -> int:
    """Idempotent: every catalog partner also exists as a partner profile.

    Settings are written with upsert semantics keyed on the canonical
    `partner_id`, so re-running the seed (every restart / Render deploy) never
    inserts a second document for the same partner and never writes a document
    without `partner_id`. This runs only after the identity index migrations in
    `app/db/migrations.py` have replaced the legacy `partner_id_1` index.
    """
    aligned = 0
    for document in await database.find_many(CATALOG):
        partner_id = str(document["_id"])
        if not partner_id:
            continue
        if await database.find_one(PROFILES, {"_id": partner_id}) is None:
            await database.insert(PROFILES, _profile_from_catalog(document))
            aligned += 1

        defaults = _settings_for(partner_id)
        # A legacy document may be keyed only by `_id` (no partner_id yet) —
        # repair it in place rather than inserting a second settings document.
        legacy = await database.find_one(SETTINGS, {"_id": partner_id})
        if legacy is not None:
            await database.update(
                SETTINGS,
                {"_id": partner_id},
                {"partner_id": partner_id, "partnerId": partner_id},
            )
            continue

        existing = await database.find_one(SETTINGS, {"partner_id": partner_id})
        if existing is None:
            # Upsert on the canonical id: concurrent instances converge on one
            # document instead of racing two inserts.
            body = {k: v for k, v in defaults.items() if k != "_id"}
            await database.collection(SETTINGS).update_one(
                {"partner_id": partner_id},
                {"$set": body, "$setOnInsert": {"_id": partner_id}},
                upsert=True,
            )
        else:
            await database.update(
                SETTINGS,
                {"partner_id": partner_id},
                {"partnerId": partner_id},
            )
    return aligned

