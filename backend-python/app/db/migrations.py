"""Identity index migrations.

Every canonical identity field in QuickPress (``partner_settings.partner_id``,
``users.firebase_uid``, ...) used to be indexed with a *plain* unique index
(``<field>_1``). A plain unique index treats every document that is missing the
field as carrying ``null``, so the second such document raises
``E11000 duplicate key error ... dup key: { partner_id: null }``.

This module owns the one and only migration path from those legacy indexes to
partial unique indexes that only index documents where the field exists and is
a string. It runs **before** any seeding, so no seed / alignment routine can
ever hit a legacy index.

Per collection+field the migration is strictly ordered and idempotent:

1. backfill the canonical field from known aliases (never guessing a value),
2. detect real duplicates on non-null values and abort loudly,
3. create the replacement partial unique index,
4. verify the replacement exists,
5. only then drop the legacy plain unique index,
6. verify the legacy index is gone.

A failure raises :class:`MigrationError`; nothing is swallowed and startup stops.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field as dataclass_field
from typing import Any, Dict, List, Tuple

logger = logging.getLogger(__name__)


class MigrationError(RuntimeError):
    """Raised when a startup migration cannot complete safely."""


@dataclass(frozen=True)
class IdentityIndex:
    """A canonical identity field that must be unique *when present*."""

    collection: str
    field: str
    #: Alias keys the value may already live under (checked in order).
    #: ``_id`` is only used when it is a non-empty string.
    sources: Tuple[str, ...] = ()
    #: Name of the replacement partial unique index.
    index_name: str = ""
    #: Legacy index names that must be removed once the replacement exists.
    legacy_names: Tuple[str, ...] = ()

    @property
    def target_name(self) -> str:
        return self.index_name or f"{self.field}_unique_present"

    @property
    def legacy(self) -> Tuple[str, ...]:
        names = self.legacy_names or (f"{self.field}_1",)
        return tuple(n for n in names if n != self.target_name)

    @property
    def partial_filter(self) -> Dict[str, Any]:
        return {self.field: {"$exists": True, "$type": "string"}}


#: Central registry. Adding an identity field here is enough: it is migrated in
#: the correct order on every startup, before any seed runs.
IDENTITY_INDEXES: Tuple[IdentityIndex, ...] = (
    IdentityIndex("users", "firebase_uid", sources=("firebaseUid",)),
    IdentityIndex("refresh_tokens", "token_id", sources=("tokenId",)),
    IdentityIndex("referrals", "user_id", sources=("userId",)),
    IdentityIndex("referrals", "code", sources=("referralCode",)),
    IdentityIndex("wallets", "user_id", sources=("userId",)),
    IdentityIndex("invoices", "invoice_number", sources=("invoiceNumber",)),
    IdentityIndex("support_tickets", "ticket_number", sources=("ticketNumber",)),
    IdentityIndex("partner_settings", "partner_id", sources=("partnerId", "_id")),
    IdentityIndex("partner_wallets", "partner_id", sources=("partnerId", "_id")),
    IdentityIndex("rider_settings", "rider_id", sources=("riderId", "_id")),
    IdentityIndex("rider_wallets", "rider_id", sources=("riderId", "_id")),
    # Account link on the profile collections. The replacement index keeps its
    # historical name so an already-migrated production database is a no-op.
    *[
        IdentityIndex(
            name,
            "user_id",
            sources=("userId",),
            index_name="user_id_unique_linked",
            legacy_names=("user_id_1",),
        )
        for name in ("customers", "partners", "riders", "admins")
    ],
)


@dataclass
class MigrationReport:
    backfilled: Dict[str, int] = dataclass_field(default_factory=dict)
    created: List[str] = dataclass_field(default_factory=list)
    dropped: List[str] = dataclass_field(default_factory=list)

    def as_dict(self) -> Dict[str, Any]:
        return {
            "backfilled": self.backfilled,
            "created": self.created,
            "dropped": self.dropped,
        }


async def _backfill(db: Any, spec: IdentityIndex) -> int:
    """Recover the canonical field from aliases. Never guesses, never overwrites."""
    if not spec.sources:
        return 0
    coll = db[spec.collection]
    repaired = 0
    cursor = coll.find({"$or": [{spec.field: {"$exists": False}}, {spec.field: None}]})
    async for document in cursor:
        value = None
        for key in spec.sources:
            candidate = document.get(key)
            if isinstance(candidate, str) and candidate.strip():
                value = candidate
                break
        if value is None:
            # No canonical id can be safely recovered — leave the document
            # untouched. The partial index simply does not index it.
            continue
        await coll.update_one(
            {"_id": document["_id"], "$or": [{spec.field: {"$exists": False}}, {spec.field: None}]},
            {"$set": {spec.field: value}},
        )
        repaired += 1
    if repaired:
        logger.info(
            "migration: backfilled %s.%s on %s document(s)", spec.collection, spec.field, repaired
        )
    return repaired


async def _find_duplicates(db: Any, spec: IdentityIndex) -> List[Dict[str, Any]]:
    cursor = db[spec.collection].aggregate(
        [
            {"$match": {spec.field: {"$exists": True, "$type": "string"}}},
            {"$group": {"_id": f"${spec.field}", "n": {"$sum": 1}}},
            {"$match": {"n": {"$gt": 1}}},
            {"$limit": 5},
        ]
    )
    return await cursor.to_list(length=5)


def _matches_target(info: Dict[str, Any], spec: IdentityIndex) -> bool:
    key = info.get("key")
    key_pairs = list(key.items()) if isinstance(key, dict) else list(key or [])
    return (
        key_pairs == [(spec.field, 1)]
        and bool(info.get("unique"))
        and info.get("partialFilterExpression") == spec.partial_filter
    )


async def migrate_identity_index(db: Any, spec: IdentityIndex, report: MigrationReport) -> None:
    coll = db[spec.collection]

    # 1. backfill
    repaired = await _backfill(db, spec)
    if repaired:
        report.backfilled[f"{spec.collection}.{spec.field}"] = repaired

    indexes = await coll.index_information()

    # 2/3. create the replacement partial unique index (unless it already matches)
    if spec.target_name in indexes and _matches_target(indexes[spec.target_name], spec):
        pass
    else:
        duplicates = await _find_duplicates(db, spec)
        if duplicates:
            values = ", ".join(repr(d["_id"]) for d in duplicates)
            raise MigrationError(
                f"Cannot create unique index on {spec.collection}.{spec.field}: "
                f"duplicate non-null values already exist ({values}). "
                "Resolve these documents in MongoDB before deploying."
            )
        if spec.target_name in indexes:
            await coll.drop_index(spec.target_name)
        try:
            await coll.create_index(
                [(spec.field, 1)],
                unique=True,
                partialFilterExpression=spec.partial_filter,
                name=spec.target_name,
            )
        except Exception as exc:  # noqa: BLE001 - re-raised as a migration failure
            raise MigrationError(
                f"Failed to create index {spec.target_name} on "
                f"{spec.collection}.{spec.field}: {exc}"
            ) from exc
        report.created.append(f"{spec.collection}.{spec.target_name}")

    # 4. verify the replacement really exists before touching the legacy index
    indexes = await coll.index_information()
    if spec.target_name not in indexes or not _matches_target(indexes[spec.target_name], spec):
        raise MigrationError(
            f"Replacement index {spec.target_name} missing on {spec.collection} "
            "after creation — refusing to drop the legacy index."
        )

    # 5. drop the legacy plain unique index(es)
    for legacy in spec.legacy:
        if legacy in indexes:
            try:
                await coll.drop_index(legacy)
            except Exception as exc:  # noqa: BLE001
                raise MigrationError(
                    f"Failed to drop legacy index {legacy} on {spec.collection}: {exc}"
                ) from exc
            report.dropped.append(f"{spec.collection}.{legacy}")

    # 6. verify the legacy index is gone
    indexes = await coll.index_information()
    still_there = [n for n in spec.legacy if n in indexes]
    if still_there:
        raise MigrationError(
            f"Legacy index(es) {still_there} still present on {spec.collection} "
            f"after migration of {spec.field}."
        )


async def run_identity_migrations(db: Any) -> MigrationReport:
    """Migrate every registered identity index. Ordered, verified, idempotent."""
    report = MigrationReport()
    for spec in IDENTITY_INDEXES:
        await migrate_identity_index(db, spec, report)
    logger.info("migration: identity indexes ready %s", report.as_dict())
    return report


async def verify_identity_indexes(db: Any) -> None:
    """Post-migration assertion used by startup and by tests."""
    for spec in IDENTITY_INDEXES:
        indexes = await db[spec.collection].index_information()
        if spec.target_name not in indexes or not _matches_target(indexes[spec.target_name], spec):
            raise MigrationError(
                f"Identity index {spec.collection}.{spec.target_name} missing or malformed."
            )
        for legacy in spec.legacy:
            if legacy in indexes:
                raise MigrationError(
                    f"Legacy index {spec.collection}.{legacy} still present."
                )
