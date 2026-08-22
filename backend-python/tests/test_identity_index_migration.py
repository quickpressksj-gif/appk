"""Identity index migration tests.

Two layers:

* a Mongo-shaped fake that enforces unique / partial unique indexes exactly the
  way the server does (so the legacy `partner_id_1` null-collision is
  reproducible without a server), and
* an opt-in real MongoDB integration test that runs when MONGODB_URI is set.

Scenarios covered: fresh database, existing `partner_id: null`, missing
partner_id, camelCase `partnerId`, `_id`-only seed documents, real duplicates,
seed once / twice, restart, index migration, full production startup.
"""

from __future__ import annotations

import os
import re
from typing import Any, Dict, List, Optional

import pytest

from tests.conftest import real_mongodb_uri
from app.db.migrations import (
    IDENTITY_INDEXES,
    IdentityIndex,
    MigrationError,
    run_identity_migrations,
    verify_identity_indexes,
)

PARTNER_SETTINGS_SPEC = IdentityIndex(
    "partner_settings", "partner_id", sources=("partnerId", "_id")
)


class FakeDuplicateKeyError(Exception):
    pass


def _matches(doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
    for key, cond in query.items():
        if key == "$or":
            if not any(_matches(doc, c) for c in cond):
                return False
            continue
        value = doc.get(key)
        if isinstance(cond, dict):
            if "$exists" in cond and (key in doc) != bool(cond["$exists"]):
                return False
            if "$ne" in cond and value == cond["$ne"]:
                return False
            if "$type" in cond and cond["$type"] == "string" and not isinstance(value, str):
                return False
            if "$gt" in cond and not (value is not None and value > cond["$gt"]):
                return False
        elif value != cond:
            return False
    return True


class _Cursor:
    def __init__(self, docs: List[Dict[str, Any]]) -> None:
        self._docs = docs

    def __aiter__(self):
        async def gen():
            for doc in self._docs:
                yield dict(doc)

        return gen()

    async def to_list(self, length: Optional[int] = None):
        return [dict(d) for d in self._docs[:length]]


class FakeCollection:
    """Enforces unique and partial-unique indexes like the real server."""

    def __init__(self) -> None:
        self.docs: List[Dict[str, Any]] = []
        self.indexes: Dict[str, Dict[str, Any]] = {"_id_": {"key": [("_id", 1)]}}

    # --- index management -------------------------------------------------
    async def index_information(self) -> Dict[str, Any]:
        return {k: dict(v) for k, v in self.indexes.items()}

    async def create_index(self, keys, unique=False, partialFilterExpression=None, name=None,
                           expireAfterSeconds=None):
        if isinstance(keys, str):
            keys = [(keys, 1)]
        name = name or "_".join(f"{k}_{d}" for k, d in keys)
        info: Dict[str, Any] = {"key": list(keys)}
        if unique:
            info["unique"] = True
        if partialFilterExpression:
            info["partialFilterExpression"] = partialFilterExpression
        if unique:
            seen = set()
            for doc in self.docs:
                if not self._indexed(doc, info):
                    continue
                value = tuple(doc.get(k) for k, _ in keys)
                if value in seen:
                    raise FakeDuplicateKeyError(f"E11000 duplicate key {value}")
                seen.add(value)
        self.indexes[name] = info
        return name

    async def drop_index(self, name: str) -> None:
        if name not in self.indexes:
            raise Exception(f"index not found: {name}")
        del self.indexes[name]

    @staticmethod
    def _indexed(doc: Dict[str, Any], info: Dict[str, Any]) -> bool:
        pfe = info.get("partialFilterExpression")
        return _matches(doc, pfe) if pfe else True

    def _check_unique(self, candidate: Dict[str, Any], ignore: Optional[Any] = None) -> None:
        for name, info in self.indexes.items():
            if not info.get("unique"):
                continue
            if not self._indexed(candidate, info):
                continue
            keys = [k for k, _ in info["key"]]
            value = tuple(candidate.get(k) for k in keys)
            for doc in self.docs:
                if doc.get("_id") == ignore:
                    continue
                if not self._indexed(doc, info):
                    continue
                if tuple(doc.get(k) for k in keys) == value:
                    raise FakeDuplicateKeyError(
                        f"E11000 duplicate key error index: {name} dup key: {value}"
                    )

    # --- data -------------------------------------------------------------
    async def insert_one(self, document: Dict[str, Any]) -> None:
        document = dict(document)
        self._check_unique(document)
        self.docs.append(document)

    async def insert_many(self, documents: List[Dict[str, Any]]) -> None:
        for document in documents:
            await self.insert_one(document)

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        return next((dict(d) for d in self.docs if _matches(d, query)), None)

    def find(self, query: Dict[str, Any]) -> _Cursor:
        return _Cursor([d for d in self.docs if _matches(d, query)])

    async def count_documents(self, query: Dict[str, Any]) -> int:
        return sum(1 for d in self.docs if _matches(d, query))

    async def update_one(self, query, update, upsert: bool = False) -> None:
        target = next((d for d in self.docs if _matches(d, query)), None)
        if target is None:
            if not upsert:
                return
            base = {k: v for k, v in query.items() if not isinstance(v, dict)}
            base.update(update.get("$setOnInsert", {}))
            base.update(update.get("$set", {}))
            self._check_unique(base)
            self.docs.append(base)
            return
        candidate = {**target, **update.get("$set", {})}
        self._check_unique(candidate, ignore=target.get("_id"))
        target.update(update.get("$set", {}))

    async def delete_one(self, query) -> int:
        for index, doc in enumerate(self.docs):
            if _matches(doc, query):
                self.docs.pop(index)
                return 1
        return 0

    async def delete_many(self, query) -> int:
        keep = [d for d in self.docs if not _matches(d, query)]
        removed = len(self.docs) - len(keep)
        self.docs = keep
        return removed

    def aggregate(self, pipeline) -> _Cursor:
        docs = self.docs
        field = None
        for stage in pipeline:
            if "$match" in stage and "$group" not in stage:
                match = stage["$match"]
                if "n" in match:
                    continue
                docs = [d for d in docs if _matches(d, match)]
            if "$group" in stage:
                field = stage["$group"]["_id"].lstrip("$")
        counts: Dict[Any, int] = {}
        for doc in docs:
            counts[doc.get(field)] = counts.get(doc.get(field), 0) + 1
        return _Cursor([{"_id": k, "n": v} for k, v in counts.items() if v > 1])


class FakeDb:
    def __init__(self) -> None:
        self.collections: Dict[str, FakeCollection] = {}

    def __getitem__(self, name: str) -> FakeCollection:
        return self.collections.setdefault(name, FakeCollection())

    async def command(self, *_args, **_kwargs):
        return {"ok": 1}


def _legacy_partner_settings(db: FakeDb) -> FakeCollection:
    """A production-shaped collection carrying the legacy plain unique index."""
    coll = db["partner_settings"]
    coll.indexes["partner_id_1"] = {"key": [("partner_id", 1)], "unique": True}
    return coll


async def _migrate(db: FakeDb, spec: IdentityIndex = PARTNER_SETTINGS_SPEC):
    from app.db.migrations import MigrationReport, migrate_identity_index

    report = MigrationReport()
    await migrate_identity_index(db, spec, report)
    return report


# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_fresh_database_creates_partial_index_only():
    db = FakeDb()
    await _migrate(db)
    info = await db["partner_settings"].index_information()
    assert "partner_id_unique_present" in info
    assert "partner_id_1" not in info
    assert info["partner_id_unique_present"]["partialFilterExpression"] == {
        "partner_id": {"$exists": True, "$type": "string"}
    }


@pytest.mark.asyncio
async def test_existing_null_partner_id_is_migrated_and_insert_succeeds():
    db = FakeDb()
    coll = _legacy_partner_settings(db)
    coll.docs.append({"_id": "legacy-1", "partner_id": None})

    await _migrate(db)

    # legacy index gone, replacement present
    info = await coll.index_information()
    assert "partner_id_1" not in info and "partner_id_unique_present" in info
    # the null document is repaired from its string _id
    assert (await coll.find_one({"_id": "legacy-1"}))["partner_id"] == "legacy-1"
    # a second document with no partner_id no longer collides
    await coll.insert_one({"_id": "no-identity"})
    await coll.insert_one({"_id": "no-identity-2"})


@pytest.mark.asyncio
async def test_missing_partner_id_without_recoverable_id_is_left_untouched():
    db = FakeDb()
    coll = _legacy_partner_settings(db)
    coll.docs.append({"_id": 1234})  # numeric _id → nothing safe to recover

    await _migrate(db)

    doc = await coll.find_one({"_id": 1234})
    assert "partner_id" not in doc
    # and it does not participate in the unique index
    await coll.insert_one({"_id": 5678})


@pytest.mark.asyncio
async def test_camelcase_partner_id_is_backfilled():
    db = FakeDb()
    coll = _legacy_partner_settings(db)
    coll.docs.append({"_id": "row-1", "partnerId": "p-100"})

    report = await _migrate(db)

    assert report.backfilled["partner_settings.partner_id"] == 1
    assert (await coll.find_one({"_id": "row-1"}))["partner_id"] == "p-100"


@pytest.mark.asyncio
async def test_id_only_seed_document_uses_its_own_id():
    db = FakeDb()
    coll = _legacy_partner_settings(db)
    coll.docs.append({"_id": "partner-seed-1", "isStoreOpen": True})

    await _migrate(db)

    assert (await coll.find_one({"_id": "partner-seed-1"}))["partner_id"] == "partner-seed-1"


@pytest.mark.asyncio
async def test_valid_existing_partner_id_is_never_overwritten():
    db = FakeDb()
    coll = _legacy_partner_settings(db)
    coll.docs.append({"_id": "row", "partner_id": "real-id", "partnerId": "other-id"})

    await _migrate(db)

    assert (await coll.find_one({"_id": "row"}))["partner_id"] == "real-id"


@pytest.mark.asyncio
async def test_real_duplicate_fails_loudly_and_keeps_legacy_index():
    db = FakeDb()
    coll = _legacy_partner_settings(db)
    coll.docs.extend(
        [{"_id": "a", "partner_id": "dup"}, {"_id": "b", "partner_id": "dup"}]
    )

    with pytest.raises(MigrationError) as excinfo:
        await _migrate(db)

    assert "partner_settings.partner_id" in str(excinfo.value)
    assert "dup" in str(excinfo.value)
    # nothing was dropped or half-applied
    info = await coll.index_information()
    assert "partner_id_1" in info
    assert "partner_id_unique_present" not in info


@pytest.mark.asyncio
async def test_migration_is_idempotent_across_restarts():
    db = FakeDb()
    coll = _legacy_partner_settings(db)
    coll.docs.append({"_id": "p1", "partnerId": "p1"})

    first = await _migrate(db)
    second = await _migrate(db)
    third = await _migrate(db)

    assert first.created and not second.created and not third.created
    assert not second.backfilled and not third.backfilled
    info = await coll.index_information()
    assert "partner_id_unique_present" in info and "partner_id_1" not in info


@pytest.mark.asyncio
async def test_all_registered_identity_indexes_migrate_and_verify():
    db = FakeDb()
    for spec in IDENTITY_INDEXES:
        for legacy in spec.legacy:
            db[spec.collection].indexes[legacy] = {
                "key": [(spec.field, 1)],
                "unique": True,
            }
        db[spec.collection].docs.append({"_id": f"legacy-{spec.field}"})

    await run_identity_migrations(db)
    await verify_identity_indexes(db)

    for spec in IDENTITY_INDEXES:
        info = await db[spec.collection].index_information()
        assert spec.target_name in info
        for legacy in spec.legacy:
            assert legacy not in info


# --- align_partner_identities against the migrated schema ------------------


@pytest.mark.asyncio
async def test_seed_twice_after_migration_creates_one_settings_document(monkeypatch):
    from app.db import identity_seed
    from app.db.client import database

    db = FakeDb()
    _legacy_partner_settings(db)
    await run_identity_migrations(db)

    monkeypatch.setattr(type(database), "in_memory", property(lambda self: False))
    monkeypatch.setattr(database, "_db", db, raising=False)

    await db["catalog_partners"].insert_one({"_id": "partner-1", "name": "Fresh Fold"})

    assert await identity_seed.align_partner_identities() == 1
    await identity_seed.align_partner_identities()  # restart / redeploy
    await identity_seed.align_partner_identities()

    settings = db["partner_settings"].docs
    assert len(settings) == 1
    assert settings[0]["partner_id"] == "partner-1"
    assert settings[0]["_id"] == "partner-1"
    assert len(db["partner_profiles"].docs) == 1


@pytest.mark.asyncio
async def test_production_startup_with_dirty_database(monkeypatch):
    """Full production shape: legacy index + null row + camelCase row + seed."""
    from app.db import identity_seed
    from app.db.client import database

    db = FakeDb()
    coll = _legacy_partner_settings(db)
    coll.docs.extend(
        [
            {"_id": "partner-1", "partner_id": None},
            {"_id": "partner-2", "partnerId": "partner-2"},
            {"_id": 99},
        ]
    )
    await run_identity_migrations(db)
    await verify_identity_indexes(db)

    monkeypatch.setattr(type(database), "in_memory", property(lambda self: False))
    monkeypatch.setattr(database, "_db", db, raising=False)
    await db["catalog_partners"].insert_many(
        [{"_id": "partner-1", "name": "A"}, {"_id": "partner-2", "name": "B"},
         {"_id": "partner-3", "name": "C"}]
    )

    await identity_seed.align_partner_identities()
    await identity_seed.align_partner_identities()

    ids = sorted(str(d.get("partner_id")) for d in coll.docs if d.get("partner_id"))
    assert ids == ["partner-1", "partner-2", "partner-3"]
    # the unrecoverable document is preserved, unindexed
    assert any(d["_id"] == 99 and "partner_id" not in d for d in coll.docs)

# --- real MongoDB integration (opt-in via MONGODB_URI) ----------------------


REAL_URI = real_mongodb_uri()


@pytest.mark.skipif(not REAL_URI, reason="MONGODB_URI not configured")
@pytest.mark.asyncio
async def test_real_mongodb_migration_is_safe_and_idempotent():
    """Reproduces the exact production failure, then proves the migration fixes it.

    Dirty production state: `partner_settings` carries the legacy plain unique
    index `partner_id_1` plus documents whose canonical id is missing/null. A
    second such document is rejected with
    `E11000 ... index: partner_id_1 dup key: { partner_id: null }` — the crash
    seen on Render. After the migration the same insert must succeed, no
    document may be lost, and re-running must be a no-op.
    """
    from motor.motor_asyncio import AsyncIOMotorClient
    from pymongo.errors import DuplicateKeyError

    client = AsyncIOMotorClient(REAL_URI, uuidRepresentation="standard")
    db = client[re.sub(r"\W+", "_", "quickpress_migration_test")]
    coll = db["partner_settings"]
    try:
        await coll.drop()
        # 1. Legacy production state. A real server only ever tolerates ONE
        #    null-keyed document under a plain unique index, so the dirty DB is
        #    built the way it actually arose: rows first, then the index.
        await coll.insert_one({"_id": "partner-1", "partner_id": None})
        await coll.create_index("partner_id", unique=True, name="partner_id_1")
        await coll.insert_one({"_id": "partner-2", "partner_id": "partner-2"})

        # 2. The production symptom: any further id-less document collides on
        #    null and the request dies with E11000 on partner_id_1.
        with pytest.raises(DuplicateKeyError):
            await coll.insert_one({"_id": "legacy-no-id"})
        with pytest.raises(DuplicateKeyError):
            await coll.insert_one({"_id": "legacy-camel", "partnerId": "legacy-camel"})


        # 3. migrate (twice — idempotent) and verify.
        await run_identity_migrations(db)
        await run_identity_migrations(db)
        await verify_identity_indexes(db)

        info = await coll.index_information()
        assert "partner_id_1" not in info
        target = info["partner_id_unique_present"]
        assert target["unique"] is True
        assert target["partialFilterExpression"] == {
            "partner_id": {"$exists": True, "$type": "string"}
        }

        # 4. backfill happened where it was safe; nothing was deleted.
        assert (await coll.find_one({"_id": "partner-2"}))["partner_id"] == "partner-2"
        # partner-1 had an explicit null and no alias other than its string _id.
        assert (await coll.find_one({"_id": "partner-1"}))["partner_id"] == "partner-1"

        # 5. the previously fatal inserts now succeed: nulls no longer collide.
        await coll.insert_one({"_id": "no-id-a"})
        await coll.insert_one({"_id": "no-id-b", "partner_id": None})
        assert await coll.count_documents({}) == 4
        # camelCase-only documents are backfilled instead of rejected.
        await coll.insert_one({"_id": "camel", "partnerId": "camel"})

        # 6. real duplicates on valid ids still fail loudly.
        with pytest.raises(DuplicateKeyError):
            await coll.insert_one({"_id": "dup", "partner_id": "partner-2"})
    finally:
        await coll.drop()
        client.close()


@pytest.mark.skipif(not REAL_URI, reason="MONGODB_URI not configured")
@pytest.mark.asyncio
async def test_real_mongodb_all_registered_identity_indexes():
    """Every registered identity index migrates and verifies on a real server."""
    from motor.motor_asyncio import AsyncIOMotorClient

    client = AsyncIOMotorClient(REAL_URI, uuidRepresentation="standard")
    db = client[re.sub(r"\W+", "_", "quickpress_identity_indexes_test")]
    try:
        for spec in IDENTITY_INDEXES:
            await db[spec.collection].drop()
        await run_identity_migrations(db)
        await run_identity_migrations(db)  # idempotent
        await verify_identity_indexes(db)
        for spec in IDENTITY_INDEXES:
            info = await db[spec.collection].index_information()
            assert spec.target_name in info, spec
            for legacy in spec.legacy:
                assert legacy not in info, (spec, legacy)
    finally:
        try:
            for spec in IDENTITY_INDEXES:
                await db[spec.collection].drop()
            await client.drop_database(db.name)
        except Exception:
            pass
        client.close()


@pytest.mark.skipif(not REAL_URI, reason="MONGODB_URI not configured")
@pytest.mark.asyncio
async def test_real_mongodb_duplicate_valid_ids_abort_migration():
    """Real duplicate canonical ids must abort loudly and keep the legacy index."""
    from motor.motor_asyncio import AsyncIOMotorClient

    client = AsyncIOMotorClient(REAL_URI, uuidRepresentation="standard")
    db = client[re.sub(r"\W+", "_", "quickpress_duplicate_test")]
    coll = db["partner_settings"]
    try:
        await coll.drop()
        await coll.insert_many(
            [
                {"_id": "a", "partner_id": "same"},
                {"_id": "b", "partner_id": "same"},
            ]
        )
        with pytest.raises(MigrationError) as excinfo:
            await run_identity_migrations(db)
        assert "partner_settings.partner_id" in str(excinfo.value)
        assert "same" in str(excinfo.value)
        # no data was touched
        assert await coll.count_documents({}) == 2
    finally:
        try:
            await coll.drop()
            await client.drop_database(db.name)
        except Exception:
            pass
        client.close()


