import asyncio
import os
import sys
import asyncpg
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres.acpxzppgjnqqhckzxcmk:QuickPress%408055@aws-0-ap-south-1.pooler.supabase.com:5432/postgres")

async def purge_all_riders():
    print(f"Connecting to database...")
    conn = await asyncpg.connect(DATABASE_URL)
    print("Connected successfully to PostgreSQL/Supabase database!")

    collections_to_clear = [
        "rider_profiles",
        "riders",
        "rider_deliveries",
        "rider_earnings",
        "rider_wallets",
        "rider_wallet_txns",
        "rider_notifications",
        "rider_settings",
        "rider_offers",
    ]

    deleted_counts = {}
    for coll_name in collections_to_clear:
        res = await conn.execute(
            "DELETE FROM quickpress_documents WHERE collection = $1", coll_name
        )
        deleted_counts[coll_name] = res
        print(f"Purged collection '{coll_name}': {res}")

    # Delete users with role 'rider' or 'captain'
    res_users = await conn.execute(
        """
        DELETE FROM quickpress_documents 
        WHERE collection = 'users' 
          AND (data->>'role' ILIKE 'rider' OR data->>'role' ILIKE 'captain')
        """
    )
    deleted_counts["users_rider"] = res_users
    print(f"Purged rider accounts from 'users': {res_users}")

    # Clean rider fields in customer_orders
    orders = await conn.fetch("SELECT id, data FROM quickpress_documents WHERE collection = 'customer_orders'")
    cleaned_orders = 0
    for row in orders:
        import json
        doc = json.loads(row["data"])
        modified = False
        for key in ["rider", "riderId", "rider_id", "assignedRider"]:
            if key in doc:
                del doc[key]
                modified = True
        if modified:
            await conn.execute(
                "UPDATE quickpress_documents SET data = $1::jsonb WHERE id = $2",
                json.dumps(doc),
                row["id"]
            )
            cleaned_orders += 1
    print(f"Cleaned rider assignments from {cleaned_orders} customer orders.")

    print("\n--- Summary of Purged Rider Data ---")
    for k, v in deleted_counts.items():
        print(f"  {k}: {v}")
    print("--------------------------------------")
    print("ALL DUMMY AND REAL RIDER DATA HAS BEEN COMPLETELY PURGED FROM DATABASE!")

    await conn.close()

if __name__ == "__main__":
    asyncio.run(purge_all_riders())
