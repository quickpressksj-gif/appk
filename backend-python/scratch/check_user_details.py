import asyncio
from app.db.client import database

async def check_user_state():
    await database.connect()
    phone_candidates = ["8279538461", "+918279538461", "+91 8279538461"]
    
    print("--- USERS COLLECTION ---")
    users = await database.find_many("users", {"$or": [{"phone": {"$in": phone_candidates}}, {"mobile": {"$in": phone_candidates}}]})
    for u in users:
        print(f"User _id: {u.get('_id')} | id: {u.get('id')} | role: {u.get('role')} | phone: {u.get('phone')} | is_onboarded: {u.get('is_onboarded')} | is_verified: {u.get('is_verified')} | linked_id: {u.get('linked_id')} | status: {u.get('status')}")

    print("\n--- RIDERS COLLECTION ---")
    riders = await database.find_many("riders")
    for r in riders:
        print(f"Rider mapping: {r}")

    print("\n--- RIDER_PROFILES COLLECTION ---")
    profiles = await database.find_many("rider_profiles")
    for p in profiles:
        print(f"Profile _id: {p.get('_id')} | riderId: {p.get('riderId')} | userId: {p.get('userId')} | name: {p.get('fullName') or p.get('name')} | phone: {p.get('phone')} | isVerified: {p.get('isVerified')} | status: {p.get('status')}")

if __name__ == "__main__":
    asyncio.run(check_user_state())
