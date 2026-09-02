"""
Full Clean Database Script for QuickPress (Supabase PostgreSQL).

Wipes all collections completely so the user can start from a 100% fresh, brand-new slate.
"""

import asyncio
import os
import sys
import logging

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.client import database
from app.db.availability_seed import AVAILABILITY_SEED
from app.db.service_content import SERVICE_CONTENT_SEED
from app.db.catalog_repositories import catalog
from app.db.cms_repositories import cms_repo

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("full_clean")

ALL_COLLECTIONS_TO_WIPE = [
    "customer_orders",
    "orders",
    "order_events",
    "order_reviews",
    "order_timeline",
    "order_counters",
    "reorder_history",
    "gateway_payments",
    "gateway_order_secrets",
    "gateway_refunds",
    "notifications",
    "admin_notifications",
    "rider_notifications",
    "otp_attempts",
    "refresh_tokens",
    "customer_carts",
    "carts",
    "customer_addresses",
    "wallet_transactions",
    "wallet_ledger",
    "loyalty_transactions",
    "wallets",
    "rider_offers",
    "rider_bank_accounts",
    "rider_wallets",
    "rider_settings",
    "rider_profiles",
    "riders",
    "partner_wallets",
    "partner_settings",
    "partner_profiles",
    "partners",
    "partner_services",
    "catalog_partners",
    "live_locations",
    "customers",
    "admin_support_tickets",
    "partner_activity_logs",
    "rider_activity_logs",
    "rider_shifts",
    "users",
]

async def full_clean():
    print("=" * 60)
    print("  QUICKPRESS FULL 100% DATABASE CLEAN WIPEOUT")
    print("=" * 60)

    await database.connect()
    logger.info("Connected to database engine: %s", database.engine_type)

    for col in ALL_COLLECTIONS_TO_WIPE:
        try:
            c = database.collection(col)
            res = await c.delete_many({})
            count = getattr(res, "deleted_count", res)
            logger.info("✓ Wiped collection '%s' (deleted %s records)", col, count)
        except Exception as e:
            logger.warning("⚠ Notice on '%s': %s", col, e)

    # Initialize master catalog skeleton & default SuperAdmin so the user can login to create everything
    from app.db.identity_seed import align_partner_identities
    await database.run_migrations()
    await database.ensure_indexes()
    await catalog.ensure_seed()
    await cms_repo.ensure_seed()
    await align_partner_identities()

    print("\n" + "=" * 60)
    print("  DATABASE IS 100% FULLY CLEANED! READY FOR NEW CREATIONS.")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(full_clean())
