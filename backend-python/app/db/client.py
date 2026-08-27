"""Database abstraction.

Primary database is MongoDB Atlas (Motor). When MONGODB_URI is empty — e.g. a
preview environment with no outbound Mongo access — the exact same repository
interface is served by an in-memory store, so application code never branches.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional, Protocol

from app.config import get_settings

logger = logging.getLogger(__name__)


class Collection(Protocol):
    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]: ...
    async def insert_one(self, document: Dict[str, Any]) -> None: ...
    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False) -> None: ...
    async def delete_many(self, query: Dict[str, Any]) -> int: ...
    async def count_documents(self, query: Dict[str, Any]) -> int: ...


def _get_nested(doc: Dict[str, Any], key: str) -> Any:
    if "." in key:
        parts = key.split(".")
        curr = doc
        for part in parts:
            if not isinstance(curr, dict):
                return None
            curr = curr.get(part)
        return curr
    return doc.get(key)


def _matches(document: Dict[str, Any], query: Dict[str, Any]) -> bool:
    import re as _re

    for key, condition in query.items():
        if key == "$or":
            if not any(_matches(document, clause) for clause in condition):
                return False
            continue
        if key == "$and":
            if not all(_matches(document, clause) for clause in condition):
                return False
            continue
        value = _get_nested(document, key)
        if isinstance(condition, dict):
            if "$gt" in condition and not (value is not None and value > condition["$gt"]):
                return False
            if "$gte" in condition and not (value is not None and value >= condition["$gte"]):
                return False
            if "$lt" in condition and not (value is not None and value < condition["$lt"]):
                return False
            if "$lte" in condition and not (value is not None and value <= condition["$lte"]):
                return False
            if "$in" in condition and value not in condition["$in"]:
                return False
            if "$nin" in condition and value in condition["$nin"]:
                return False
            if "$ne" in condition and value == condition["$ne"]:
                return False
            if "$exists" in condition and (value is not None) != bool(condition["$exists"]):
                return False
            if "$regex" in condition:
                flags = _re.IGNORECASE if "i" in str(condition.get("$options", "")) else 0
                if value is None or not _re.search(str(condition["$regex"]), str(value), flags):
                    return False
        elif value != condition:
            return False
    return True


def _apply_update(target: Dict[str, Any], update: Dict[str, Any]) -> None:
    if "$set" in update:
        for k, v in update["$set"].items():
            if "." in k:
                parts = k.split(".")
                curr = target
                for part in parts[:-1]:
                    if part not in curr or not isinstance(curr[part], dict):
                        curr[part] = {}
                    curr = curr[part]
                curr[parts[-1]] = v
            else:
                target[k] = v
    if "$push" in update:
        for k, v in update["$push"].items():
            if k not in target or not isinstance(target[k], list):
                target[k] = []
            target[k].append(v)
    for k, v in update.items():
        if not k.startswith("$"):
            target[k] = v


def _sort_key(value: Any) -> Any:
    """Stable sort key: keeps None and mixed types from failing comparisons."""
    if value is None:
        return (0, 0, "")
    if isinstance(value, bool):
        return (1, int(value), "")
    if isinstance(value, (int, float)):
        return (1, float(value), "")
    return (2, 0, str(value))


class InMemoryCollection:

    """Minimal Mongo-compatible collection used only when Atlas is unavailable."""

    def __init__(self) -> None:
        self._docs: List[Dict[str, Any]] = []
        self._lock = asyncio.Lock()

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        async with self._lock:
            return next((dict(d) for d in self._docs if _matches(d, query)), None)

    async def insert_one(self, document: Dict[str, Any]) -> None:
        async with self._lock:
            self._docs.append(dict(document))

    async def update_one(
        self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False
    ) -> None:
        async with self._lock:
            target = next((d for d in self._docs if _matches(d, query)), None)
            if target is None:
                if not upsert:
                    return
                target = {**query, **update.get("$setOnInsert", {})}
                self._docs.append(target)
            _apply_update(target, update)

    async def update_many(
        self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False
    ) -> int:
        async with self._lock:
            count = 0
            for d in self._docs:
                if _matches(d, query):
                    _apply_update(d, update)
                    count += 1
            if count == 0 and upsert:
                target = {**query, **update.get("$setOnInsert", {})}
                self._docs.append(target)
                _apply_update(target, update)
                count = 1
            return count

    async def find_one_and_update(
        self, query: Dict[str, Any], update: Dict[str, Any], return_document: Any = None, upsert: bool = False
    ) -> Optional[Dict[str, Any]]:
        async with self._lock:
            target = next((d for d in self._docs if _matches(d, query)), None)
            if target is None:
                if not upsert:
                    return None
                target = {**query, **update.get("$setOnInsert", {})}
                self._docs.append(target)
            _apply_update(target, update)
            return dict(target)

    async def delete_many(self, query: Dict[str, Any]) -> int:
        async with self._lock:
            keep = [d for d in self._docs if not _matches(d, query)]
            removed = len(self._docs) - len(keep)
            self._docs = keep
            return removed

    async def count_documents(self, query: Dict[str, Any]) -> int:
        async with self._lock:
            return sum(1 for d in self._docs if _matches(d, query))

    async def find_many(self, query: Dict[str, Any]) -> List[Dict[str, Any]]:
        async with self._lock:
            return [dict(d) for d in self._docs if _matches(d, query)]

    async def insert_many(self, documents: List[Dict[str, Any]]) -> None:
        async with self._lock:
            self._docs.extend(dict(d) for d in documents)

    async def delete_one(self, query: Dict[str, Any]) -> int:
        async with self._lock:
            for index, doc in enumerate(self._docs):
                if _matches(doc, query):
                    self._docs.pop(index)
                    return 1
            return 0



def _with_id(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Expose Mongo's `_id` as `id` too, so models can read either key."""
    if doc is None:
        return None
    if "_id" in doc and "id" not in doc:
        doc = {**doc, "id": doc["_id"]}
    return doc


class Database:
    """Lazily connected database handle shared by every repository."""

    def __init__(self) -> None:
        self._client: Any = None
        self._db: Any = None
        self._supabase: Any = None
        self._memory: Dict[str, InMemoryCollection] = {}
        self._fallback_in_memory: bool = False
        self._engine: str = "in-memory"

    @property
    def in_memory(self) -> bool:
        if self._supabase is not None:
            return False
        settings = get_settings()
        if settings.app_env.lower() == "production":
            return False
        return settings.use_in_memory_db or self._fallback_in_memory

    @property
    def engine_type(self) -> str:
        if self._supabase is not None:
            return "supabase-postgresql"
        if self._db is not None:
            return "mongodb-atlas"
        return "in-memory"

    async def connect(self) -> None:
        """Connect to database (Supabase PostgreSQL / MongoDB Atlas / in-memory)."""
        settings = get_settings()
        is_prod = settings.app_env.lower() == "production"
        import logging

        # 1. Check Supabase PostgreSQL first (DATABASE_URL)
        if getattr(settings, "database_url", None) and settings.database_url.strip():
            try:
                from app.db.supabase_client import SupabaseDatabase
                sb_db = SupabaseDatabase(settings.database_url)
                await sb_db.connect()
                self._supabase = sb_db
                self._engine = "supabase-postgresql"
                self._fallback_in_memory = False
                logging.getLogger(__name__).info("Connected to Supabase PostgreSQL successfully.")
                return
            except Exception as err:
                logging.getLogger(__name__).warning("Supabase PostgreSQL connection failed: %s", err)
                self._supabase = None

        # 2. Check MongoDB Atlas (MONGODB_URI)
        if getattr(settings, "mongodb_uri", None) and settings.mongodb_uri.strip():
            from motor.motor_asyncio import AsyncIOMotorClient  # imported lazily
            try:
                self._client = AsyncIOMotorClient(
                    settings.mongodb_uri,
                    uuidRepresentation="standard",
                    serverSelectionTimeoutMS=3000,
                )
                self._db = self._client[settings.mongodb_db_name]
                await self._db.command("ping")
                self._engine = "mongodb-atlas"
                self._fallback_in_memory = False
                logging.getLogger(__name__).info("Connected to MongoDB Atlas successfully.")
                return
            except Exception as err:
                self._client = None
                self._db = None
                if is_prod:
                    logging.getLogger(__name__).error("FATAL: Production database connection to MongoDB Atlas failed: %s", err)
                    raise RuntimeError(f"FATAL: Production database connection to MongoDB Atlas failed: {err}") from err
                logging.getLogger(__name__).warning("MongoDB connection fallback to in-memory (dev mode): %s", err)

        self._fallback_in_memory = True
        self._engine = "in-memory"

    async def run_migrations(self) -> Optional[Dict[str, Any]]:
        """Backfill canonical ids and replace legacy unique indexes."""
        if self._supabase is not None:
            return {"status": "ok", "engine": "supabase-postgresql"}
        if self.in_memory or self._db is None:
            return None
        from app.db.migrations import run_identity_migrations

        report = await run_identity_migrations(self._db)
        return report.as_dict()

    async def verify_migrations(self) -> None:
        """Assert the identity indexes are in their post-migration shape."""
        if self._supabase is not None or self.in_memory or self._db is None:
            return
        from app.db.migrations import verify_identity_indexes

        await verify_identity_indexes(self._db)

    async def disconnect(self) -> None:
        if self._supabase is not None:
            await self._supabase.disconnect()
            self._supabase = None
        if self._client is not None:
            self._client.close()
            self._client = None
            self._db = None

    def collection(self, name: str) -> Any:
        if self._supabase is not None:
            return self._supabase.collection(name)
        if self.in_memory or self._db is None:
            return self._memory.setdefault(name, InMemoryCollection())
        return self._db[name]

    async def find_many(
        self,
        name: str,
        query: Optional[Dict[str, Any]] = None,
        *,
        sort_key: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """List documents from a collection — works for Motor and the memory store."""
        collection = self.collection(name)
        query = query or {}
        if isinstance(collection, InMemoryCollection):
            docs = await collection.find_many(query)  # type: ignore[attr-defined]
        else:
            cursor = collection.find(query)  # type: ignore[attr-defined]
            docs = await cursor.to_list(length=500)
        if sort_key:
            docs.sort(key=lambda doc: _sort_key(doc.get(sort_key)))
        return docs

    # ------------------------------------------------------------------
    # Sprint 5.2 — generic CRUD / pagination helpers shared by every
    # partner, rider and admin repository. Identical behaviour on Motor
    # and on the in-memory preview store.
    # ------------------------------------------------------------------

    async def find_sorted(
        self,
        name: str,
        query: Optional[Dict[str, Any]] = None,
        *,
        sort: Optional[List[tuple]] = None,
        skip: int = 0,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        collection = self.collection(name)
        query = query or {}
        if isinstance(collection, InMemoryCollection):
            docs = await collection.find_many(query)  # type: ignore[attr-defined]
            for key, direction in reversed(sort or []):
                docs.sort(key=lambda doc: _sort_key(doc.get(key)), reverse=direction < 0)
        else:
            cursor = collection.find(query)  # type: ignore[attr-defined]
            if sort:
                cursor = cursor.sort(sort)
            docs = await cursor.to_list(length=2000)
        if skip:
            docs = docs[skip:]
        if limit is not None:
            docs = docs[:limit]
        return [_with_id(d) for d in docs]

    async def paginate(
        self,
        name: str,
        query: Optional[Dict[str, Any]] = None,
        *,
        sort: Optional[List[tuple]] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        """Standard page envelope: items + total + page + pageSize + hasMore."""
        page = max(1, page)
        page_size = max(1, min(page_size, 100))
        query = query or {}
        total = await self.count(name, query)
        items = await self.find_sorted(
            name, query, sort=sort, skip=(page - 1) * page_size, limit=page_size
        )
        return {
            "items": items,
            "total": total,
            "page": page,
            "pageSize": page_size,
            "hasMore": page * page_size < total,
        }

    async def count(self, name: str, query: Optional[Dict[str, Any]] = None) -> int:
        return await self.collection(name).count_documents(query or {})

    async def find_one(self, name: str, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        return await self.collection(name).find_one(query)

    async def insert(self, name: str, document: Dict[str, Any]) -> Dict[str, Any]:
        await self.collection(name).insert_one(dict(document))
        return document

    async def insert_all(self, name: str, documents: List[Dict[str, Any]]) -> None:
        if not documents:
            return
        collection = self.collection(name)
        if True:  # both Motor and the in-memory store expose insert_many
            await collection.insert_many([dict(d) for d in documents])  # type: ignore[attr-defined]
        else:  # pragma: no cover - Motor always has insert_many
            for document in documents:
                await collection.insert_one(dict(document))

    async def update(
        self,
        name: str,
        query: Dict[str, Any],
        changes: Dict[str, Any],
        *,
        upsert: bool = False,
    ) -> Optional[Dict[str, Any]]:
        await self.collection(name).update_one(query, {"$set": changes}, upsert=upsert)
        return await self.find_one(name, query)

    async def delete_one(self, name: str, query: Dict[str, Any]) -> int:
        collection = self.collection(name)
        result = await collection.delete_one(query)  # type: ignore[attr-defined]
        return result if isinstance(result, int) else int(getattr(result, "deleted_count", 0))

    async def upsert_seed(self, seed: Dict[str, List[Dict[str, Any]]]) -> None:
        """Idempotent seed: only writes documents that do not exist yet."""
        for name, documents in seed.items():
            collection = self.collection(name)
            for document in documents:
                existing = await collection.find_one({"_id": document["_id"]})
                if existing is None:
                    await collection.insert_one(dict(document))



    async def ensure_indexes(self) -> None:
        """Indexes that back the auth queries. No-op for the in-memory store."""
        if self.in_memory or self._db is None:
            return
        # NOTE: every unique index on a canonical identity field lives in
        # app/db/migrations.py and is applied by run_identity_migrations()
        # BEFORE this method and before any seeding runs.

        await self._db["users"].create_index([("phone", 1), ("role", 1)])
        await self._db["users"].create_index([("email", 1), ("role", 1)])
        await self._db["refresh_tokens"].create_index("expires_at", expireAfterSeconds=0)
        await self._db["otp_attempts"].create_index([("phone", 1), ("created_at", -1)])
        # Sprint 2.7: notification feed lookups.
        await self._db["notifications"].create_index([("user_id", 1), ("created_at", -1)])
        await self._db["notifications"].create_index([("user_id", 1), ("read", 1)])
        # Sprint 2.8: referral lookups.
        await self._db["referral_transactions"].create_index([("referrer_id", 1), ("created_at", -1)])
        await self._db["referral_transactions"].create_index("referee_id")
        await self._db["referral_rewards"].create_index([("user_id", 1), ("created_at", -1)])
        await self._db["referral_rewards"].create_index("transaction_id")
        # Sprint 2.10: wallet, payment method, payment and refund lookups.
        await self._db["wallet_transactions"].create_index([("user_id", 1), ("created_at", -1)])
        await self._db["payment_methods"].create_index([("user_id", 1), ("order", 1)])
        await self._db["payments"].create_index([("user_id", 1), ("created_at", -1)])
        await self._db["payments"].create_index("transaction_id")
        await self._db["refunds"].create_index([("user_id", 1), ("created_at", -1)])
        # Sprint 2.11: invoice, FAQ and support ticket lookups.
        await self._db["invoices"].create_index([("user_id", 1), ("invoice_date", -1)])
        await self._db["invoices"].create_index("order_id")
        await self._db["faqs"].create_index([("category_id", 1), ("order", 1)])
        await self._db["faq_categories"].create_index("order")
        await self._db["support_tickets"].create_index([("user_id", 1), ("created_at", -1)])
        await self._db["support_messages"].create_index([("ticket_id", 1), ("created_at", 1)])
        # --- Sprint 5.2: partner / rider / admin collections -------------
        await self._db["partner_profiles"].create_index("user_id")
        await self._db["partner_profiles"].create_index("status")
        await self._db["partner_services"].create_index([("partner_id", 1), ("name", 1)])
        await self._db["partner_orders"].create_index([("partner_id", 1), ("created_at", -1)])
        await self._db["partner_orders"].create_index([("partner_id", 1), ("status", 1)])
        await self._db["partner_wallet_transactions"].create_index(
            [("partner_id", 1), ("created_at", -1)]
        )
        await self._db["partner_reviews"].create_index([("partner_id", 1), ("created_at", -1)])
        await self._db["partner_analytics"].create_index([("partner_id", 1), ("date", -1)])
        await self._db["rider_profiles"].create_index("user_id")
        await self._db["rider_profiles"].create_index("status")
        await self._db["rider_deliveries"].create_index([("rider_id", 1), ("created_at", -1)])
        await self._db["rider_deliveries"].create_index([("rider_id", 1), ("status", 1)])
        await self._db["rider_earnings"].create_index([("rider_id", 1), ("date", -1)])
        await self._db["rider_wallet_transactions"].create_index(
            [("rider_id", 1), ("created_at", -1)]
        )
        await self._db["rider_notifications"].create_index([("rider_id", 1), ("created_at", -1)])
        await self._db["rider_analytics"].create_index([("rider_id", 1), ("date", -1)])
        await self._db["admin_payouts"].create_index([("status", 1), ("created_at", -1)])
        await self._db["admin_reports"].create_index([("kind", 1), ("created_at", -1)])
        await self._db["admin_notifications"].create_index("created_at")
        await self._db["admin_audit_logs"].create_index("created_at")
        # P0 order lifecycle: canonical audit trail lookups.
        await self._db["order_events"].create_index([("orderId", 1), ("timestamp", 1)])
        await self._db["customer_orders"].create_index([("partner.id", 1), ("createdAt", -1)])
        await self._db["customer_orders"].create_index([("rider.id", 1), ("createdAt", -1)])




database = Database()
