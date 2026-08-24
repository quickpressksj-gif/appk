import asyncio
from app.db.client import database

async def inspect_partners():
    await database.connect()
    partners = await database.find_many("partner_profiles")
    print(f"Total partner profiles: {len(partners)}")
    for p in partners:
        print(f"  - Partner: {p.get('businessName') or p.get('name')} | ID: {p.get('partnerId') or p.get('_id')} | userId: {p.get('userId')} | Phone: '{p.get('phone')}' | ownerPhone: '{p.get('ownerPhone')}' | isVerified: {p.get('isVerified')} | status: {p.get('status')}")

if __name__ == "__main__":
    asyncio.run(inspect_partners())
