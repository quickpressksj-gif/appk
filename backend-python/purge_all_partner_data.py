import asyncio
import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.client import database

async def purge_all_partners():
    await database.connect()
    print("Connected to database...")

    collections_to_clear = [
        "partner_profiles",
        "partner_settings",
        "partner_services",
        "partner_documents",
        "partner_staff",
        "partner_devices",
        "partner_payouts",
        "partner_reviews",
        "catalog_partners",
    ]

    deleted_counts = {}
    for coll_name in collections_to_clear:
        coll = database.collection(coll_name)
        res = await coll.delete_many({})
        count = getattr(res, "deleted_count", res)
        deleted_counts[coll_name] = count
        print(f"Deleted {count} documents from '{coll_name}'.")

    # Also delete users who have role == 'partner'
    res_users = await database.collection("users").delete_many({"role": {"$in": ["partner", "PARTNER"]}})
    count_users = getattr(res_users, "deleted_count", res_users)
    deleted_counts["users_partner"] = count_users
    print(f"Deleted {count_users} partner user accounts from 'users'.")

    print("\n--- Summary of Purged Partner Data ---")
    for k, v in deleted_counts.items():
        print(f"  {k}: {v} deleted")
    print("--------------------------------------")
    print("ALL PARTNER DATA SUCCESSFULLY PURGED. Zero dummy partners remain.")

    await database.disconnect()

if __name__ == "__main__":
    asyncio.run(purge_all_partners())
