"""Complete Database Reset & Cleanup Script for QuickPress.

Purges all legacy/dummy seed records across all collections while strictly
preserving essential master definitions (Master Catalog, Categories,
Operating Cities, Super Admin credentials, Dynamic Settings).
"""

import asyncio
import logging
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.client import database
from app.core.admin_security import ensure_super_admin_seed
from app.db.admin_seed import ensure_admin_operational_seed
from app.db.catalog_repositories import catalog

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("db_cleaner")

DUMMY_PARTNER_IDS = [
    "prt_kasganj_express",
    "prt_royal_gandhinagar",
    "prt_aligarh_centrepoint",
    "prt_clean_agra_sanjay",
    "prt_freshpress_noida62",
    "partner-demo-1",
    "partner-demo-2",
    "partner-demo-3",
    "partner-demo-4",
    "partner-demo-5",
]

DUMMY_RIDER_IDS = [
    "rdr_vikram_singh",
    "rdr_amit_kumar",
    "rdr_rahul_verma",
    "rdr_deepak_sharma",
    "rdr_manoj_yadav",
    "rider-demo-1",
]

DUMMY_CUSTOMER_IDS = [
    "cust_pooja_sharma",
    "cust_alok_verma",
    "cust_sunita_agarwal",
    "cust_rohan_gupta",
    "cust_neha_singh",
    "cust-1",
    "cust-2",
    "cust-3",
    "cust-4",
]

DUMMY_ORDER_PREFIXES = [
    "ord_today_",
    "ord_yest_",
    "ord_past_",
    "ORD-KSJ-",
    "ord-e2e-",
    "ord-neg-",
    "ord-QP",
    "order-demo-",
]

DUMMY_TICKET_IDS = [
    "tkt_101",
    "tkt_102",
    "tck-cust-001",
    "tck-part-002",
    "tck-rdr-003",
    "tck-cust-004",
]

DUMMY_REFUND_IDS = [
    "ref-001",
    "ref-002",
    "ref-003",
]


async def run_clean():
    logger.info("Connecting to Database...")
    await database.connect()

    # 1. Clean Dummy Orders
    for coll in ("customer_orders", "orders", "partner_orders", "rider_deliveries"):
        count = 0
        docs = await database.find_many(coll, {})
        for d in docs:
            doc_id = str(d.get("_id") or d.get("id") or "")
            code = str(d.get("code") or "")
            if (
                any(doc_id.startswith(p) for p in DUMMY_ORDER_PREFIXES)
                or any(code.startswith(p) for p in DUMMY_ORDER_PREFIXES)
                or doc_id in ("ord_today_101", "ord_today_102", "ord_today_103", "ord_today_104", "ord_today_105", "ord_today_106")
            ):
                await database.delete(coll, {"_id": doc_id})
                count += 1
        logger.info(f"Cleaned {count} dummy orders from '{coll}'.")

    # 2. Clean Dummy Dispatches & Rides
    for coll in ("rides", "ride_assignments", "rider_offers"):
        count = 0
        docs = await database.find_many(coll, {})
        for d in docs:
            doc_id = str(d.get("_id") or d.get("id") or "")
            if (
                doc_id.startswith("ride_")
                or doc_id.startswith("ra_")
                or any(str(d.get("orderId", "")).startswith(p) for p in DUMMY_ORDER_PREFIXES)
            ):
                await database.delete(coll, {"_id": doc_id})
                count += 1
        logger.info(f"Cleaned {count} dummy dispatches from '{coll}'.")

    # 3. Clean Dummy Partners
    for coll in ("partner_profiles", "partners", "partner_wallets", "partner_wallet_transactions"):
        count = 0
        docs = await database.find_many(coll, {})
        for d in docs:
            doc_id = str(d.get("_id") or d.get("id") or "")
            pid = str(d.get("partnerId") or d.get("partner_id") or doc_id)
            if pid in DUMMY_PARTNER_IDS or doc_id in DUMMY_PARTNER_IDS:
                await database.delete(coll, {"_id": doc_id})
                count += 1
        logger.info(f"Cleaned {count} dummy records from '{coll}'.")

    # 4. Clean Dummy Riders
    for coll in ("rider_profiles", "riders", "rider_wallets", "rider_wallet_transactions", "rider_notifications", "rider_analytics"):
        count = 0
        docs = await database.find_many(coll, {})
        for d in docs:
            doc_id = str(d.get("_id") or d.get("id") or "")
            rid = str(d.get("riderId") or d.get("rider_id") or doc_id)
            if rid in DUMMY_RIDER_IDS or doc_id in DUMMY_RIDER_IDS:
                await database.delete(coll, {"_id": doc_id})
                count += 1
        logger.info(f"Cleaned {count} dummy records from '{coll}'.")

    # 5. Clean Dummy Customers & Users
    for coll in ("customers", "users"):
        count = 0
        docs = await database.find_many(coll, {})
        for d in docs:
            doc_id = str(d.get("_id") or d.get("id") or "")
            if doc_id in DUMMY_CUSTOMER_IDS or doc_id in DUMMY_PARTNER_IDS or doc_id in DUMMY_RIDER_IDS:
                await database.delete(coll, {"_id": doc_id})
                count += 1
        logger.info(f"Cleaned {count} dummy users from '{coll}'.")

    # 6. Clean Dummy Support Tickets & Refunds & Payouts
    for coll, dummy_ids in [
        ("support_tickets", DUMMY_TICKET_IDS),
        ("admin_support_tickets", DUMMY_TICKET_IDS),
        ("refunds", DUMMY_REFUND_IDS),
        ("admin_payouts", ["pay_kasganj_exp_1", "pay_royal_gandhi_1", "pay_aligarh_cp_1", "pay_rider_vikram_1"]),
    ]:
        count = 0
        docs = await database.find_many(coll, {})
        for d in docs:
            doc_id = str(d.get("_id") or d.get("id") or "")
            if doc_id in dummy_ids or any(doc_id.startswith(p) for p in ("tkt_", "tck-", "ref-", "pay_")):
                await database.delete(coll, {"_id": doc_id})
                count += 1
        logger.info(f"Cleaned {count} dummy records from '{coll}'.")

    # 7. Ensure Master Essentials (Super Admin, Master Catalog, Operating Cities)
    logger.info("Re-verifying master catalog and super admin...")
    await catalog.ensure_seed()
    await ensure_super_admin_seed()
    await ensure_admin_operational_seed()

    logger.info("✅ Database Full Cleanup Complete! All dummy test data successfully purged.")
    await database.disconnect()


if __name__ == "__main__":
    asyncio.run(run_clean())
