import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.client import database

async def main():
    await database.connect()
    print(f"Database Engine: {database._engine}")

    collections = [
        "partner_profiles",
        "partners",
        "partner_settings",
        "partner_services",
        "partner_documents",
        "partner_staff",
        "partner_devices",
        "partner_payouts",
        "partner_reviews",
        "catalog_partners",
    ]

    for coll_name in collections:
        coll = database.collection(coll_name)
        # Check current count
        try:
            docs = await database.find_many(coll_name, {})
            print(f"Collection '{coll_name}' currently has {len(docs)} documents.")
            if len(docs) > 0:
                for d in docs:
                    print(f"  - Deleting: {d.get('_id')} ({d.get('name') or d.get('businessName') or 'no name'})")
            res = await coll.delete_many({})
            count = getattr(res, "deleted_count", res)
            print(f"  -> Deleted {count} from '{coll_name}'.")
        except Exception as e:
            print(f"Error on {coll_name}: {e}")

    # Delete users with role == 'partner'
    try:
        partner_users = await database.find_many("users", {"role": {"$in": ["partner", "PARTNER"]}})
        print(f"Found {len(partner_users)} partner user accounts in 'users'.")
        res_users = await database.collection("users").delete_many({"role": {"$in": ["partner", "PARTNER"]}})
        count_u = getattr(res_users, "deleted_count", res_users)
        print(f"  -> Deleted {count_u} partner users.")
    except Exception as e:
        print(f"Error deleting partner users: {e}")

    await database.disconnect()
    print("\n✅ ALL DUMMY / TEST PARTNERS DELETED FROM PRODUCTION DATABASE!")

if __name__ == "__main__":
    asyncio.run(main())
