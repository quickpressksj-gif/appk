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
    logger.info("Starting Total Database Wipe...")
    import requests
    from app.config import get_settings
    settings = get_settings()

    # 1. Clear Supabase PostgreSQL via PostgREST if configured
    sb_url = getattr(settings, "supabase_url", "")
    sb_key = getattr(settings, "supabase_service_role_key", "")
    if sb_url and sb_key:
        try:
            r = requests.delete(
                f"{sb_url}/rest/v1/quickpress_documents?id=neq.__none__",
                headers={
                    "apikey": sb_key,
                    "Authorization": f"Bearer {sb_key}",
                    "Content-Type": "application/json",
                },
                timeout=10,
            )
            logger.info(f"Supabase PostgreSQL table wiped successfully (Status: {r.status_code}).")
        except Exception as e:
            logger.warning(f"Supabase PostgREST wipe note: {e}")

    # 2. Connect Database client
    logger.info("Connecting to Database...")
    await database.connect()

    total_deleted = 0
    # Clear all complete target collections using delete_many
    for coll in COLLECTIONS_TO_CLEAR_COMPLETELY:
        try:
            purged = await database.delete_many(coll, {})
            if purged > 0:
                logger.info(f"Purged {purged} documents from collection '{coll}'.")
                total_deleted += purged
            else:
                logger.info(f"Collection '{coll}' is already empty (0).")
        except Exception as e:
            logger.warning(f"Note on collection '{coll}': {e}")

    # Clear non-admin users
    try:
        users = await database.find_many("users", {})
        user_delete_count = 0
        for u in users:
            role = str(u.get("role") or "").lower()
            if role not in ("super_admin", "superadmin", "owner"):
                doc_id = u.get("_id") or u.get("id")
                if doc_id:
                    await database.delete_one("users", {"_id": doc_id})
                    user_delete_count += 1
        logger.info(f"Purged {user_delete_count} non-admin users from 'users' collection.")
        total_deleted += user_delete_count
    except Exception as e:
        logger.warning(f"Note on 'users' cleanup: {e}")

    # Ensure Super Admin Account is intact for Admin Console Login
    logger.info("Ensuring Super Admin account is available...")
    await ensure_super_admin_seed()

    logger.info(f"✅ TOTAL DATABASE WIPE COMPLETE: {total_deleted} total documents purged. Database is now 100% clean and blank!")
    await database.disconnect()


if __name__ == "__main__":
    asyncio.run(run_total_wipe())
