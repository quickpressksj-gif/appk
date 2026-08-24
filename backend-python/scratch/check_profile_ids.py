import asyncio
import os
from app.db.client import database

async def inspect_ids():
    await database.connect()
    riders = await database.find_many("rider_profiles")
    print(f"Total Rider Profiles: {len(riders)}")
    for r in riders:
        print(f"  - Rider: {r.get('fullName')} | ID: {r.get('_id')} | riderId: {r.get('riderId')} | Phone: {r.get('phone')}")

    partners = await database.find_many("partner_profiles")
    print(f"\nTotal Partner Profiles: {len(partners)}")
    for p in partners:
        print(f"  - Partner: {p.get('businessName') or p.get('name')} | ID: {p.get('_id')} | partnerId: {p.get('partnerId')} | Phone: {p.get('phone')}")

if __name__ == "__main__":
    asyncio.run(inspect_ids())
