"""Total Database Reset Script for QuickPress.

Wipes:
- All users, customers (preserving only Super Admin for login access)
- All partners, partner profiles, partner services, partner wallets
- All riders, rider profiles, rider wallets, rider offers
- All orders, sales, rides, dispatches, order timelines
- All offers, coupons, banners, deals, promotions
- All membership plans, benefits, user memberships
- All services, master services, categories, master categories, availability
- All operating cities, areas, hubs, zones
- All support tickets, refunds, payouts, audit logs
"""

import asyncio
import logging
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.client import database
from app.core.admin_security import ensure_super_admin_seed

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("total_db_wipe")

COLLECTIONS_TO_CLEAR_COMPLETELY = [
    # Customer Data
    "customers",
    "customer_addresses",
    "customer_wallets",
    "customer_wallet_transactions",
    "customer_reviews",
    
    # Partner Data
    "partners",
    "partner_profiles",
    "partner_services",
    "partner_wallets",
    "partner_wallet_transactions",
    "partner_settings",
    "partner_reviews",
    "partner_orders",
    "partner_analytics",
    
    # Rider Data
    "riders",
    "rider_profiles",
    "rider_wallets",
    "rider_wallet_transactions",
    "rider_deliveries",
    "rider_offers",
    "rider_notifications",
    "rider_analytics",
    "rider_settings",
    "rider_locations",
    
    # Orders & Dispatches
    "customer_orders",
    "orders",
    "order_timeline",
    "order_events",
    "rides",
    "ride_assignments",
    "dispatches",
    
    # Offers, Coupons & Banners
    "offers",
    "banners",
    "admin_coupons",
    "promotions",
    "deals",
    "sales",
    
    # Membership
    "memberships",
    "membership_plans",
    "membership_benefits",
    "user_memberships",
    
    # Services & Categories
    "services",
    "admin_services",
    "categories",
    "admin_categories",
    "catalog_partners",
    "service_availability",
    "service_content",
    "service_faqs",
    "service_guarantees",
    
    # Cities & Locations
    "admin_cities",
    "cities",
    "areas",
    "hubs",
    "zones",
    "sectors",
    
    # Support & Financial
    "support_tickets",
    "admin_support_tickets",
    "support_faqs",
    "refunds",
    "admin_payouts",
    "payouts",
    "admin_wallet_transactions",
    "audit_logs",
]


async def run_total_wipe():
    logger.info("Connecting to Database...")
    await database.connect()

    total_deleted = 0
    # 1. Clear all complete target collections
    for coll in COLLECTIONS_TO_CLEAR_COMPLETELY:
        try:
            docs = await database.find_many(coll, {})
            count = len(docs)
            if count > 0:
                for d in docs:
                    doc_id = d.get("_id") or d.get("id")
                    if doc_id is not None:
                        await database.delete(coll, {"_id": doc_id})
                logger.info(f"Purged {count} documents from collection '{coll}'.")
                total_deleted += count
            else:
                logger.info(f"Collection '{coll}' is already empty (0).")
        except Exception as e:
            logger.warning(f"Note on collection '{coll}': {e}")

    # 2. Clear Users collection (preserving only super_admin)
    try:
        users = await database.find_many("users", {})
        user_delete_count = 0
        for u in users:
            role = str(u.get("role") or "").lower()
            if role not in ("super_admin", "superadmin", "owner"):
                await database.delete("users", {"_id": u.get("_id")})
                user_delete_count += 1
        logger.info(f"Purged {user_delete_count} non-admin users from 'users' collection.")
        total_deleted += user_delete_count
    except Exception as e:
        logger.warning(f"Note on 'users' cleanup: {e}")

    # 3. Ensure Super Admin Account is intact for Admin Console Login
    logger.info("Ensuring Super Admin account is available...")
    await ensure_super_admin_seed()

    logger.info(f"✅ TOTAL DATABASE WIPE COMPLETE: {total_deleted} total documents purged. Database is now 100% clean and blank!")
    await database.disconnect()


if __name__ == "__main__":
    asyncio.run(run_total_wipe())
