import asyncio
from app.db.client import database

async def sync_partner_phone():
    await database.connect()
    await database.collection("partner_profiles").update_one(
        {"_id": "PRT-259692"},
        {"$set": {"phone": "+919258500651", "ownerPhone": "+919258500651"}}
    )
    print("✓ Updated PRT-259692 phone in partner_profiles to +919258500651")

if __name__ == "__main__":
    asyncio.run(sync_partner_phone())
