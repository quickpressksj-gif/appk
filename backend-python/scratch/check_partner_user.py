import asyncio
from app.db.client import database

async def check_user():
    await database.connect()
    u = await database.find_one("users", {"_id": "de11cf35-c168-490f-a54d-fcd676a0344e"})
    print("User de11cf35-c168-490f-a54d-fcd676a0344e:", u)
    
    # Also check all partner users in users collection
    partners = await database.find_many("users", {"role": "partner"})
    print(f"\nAll partner users in users collection ({len(partners)}):")
    for p in partners:
        print(f"  - User _id: {p.get('_id')} | phone: {p.get('phone')} | linked_id: {p.get('linked_id')} | name: {p.get('display_name')} | is_onboarded: {p.get('is_onboarded')} | is_verified: {p.get('is_verified')}")

if __name__ == "__main__":
    asyncio.run(check_user())
