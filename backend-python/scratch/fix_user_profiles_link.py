import asyncio
from app.db.client import database

async def sync_all_users():
    await database.connect()
    print("--- SYNCING ALL USERS WITH RIDER / PARTNER PROFILES ---")

    # 1. Sync Riders
    riders = await database.find_many("rider_profiles")
    for r in riders:
        phone = r.get("phone") or ""
        clean_phone = phone.replace("+91", "").replace("+", "").strip()
        candidates = [phone, clean_phone, f"+91{clean_phone}", f"+91 {clean_phone}"]
        rider_id = r.get("riderId") or r.get("_id")
        is_verified = bool(r.get("isVerified", False) or r.get("status") == "active")
        full_name = r.get("fullName") or r.get("name") or "Delivery Partner"
        user_id = r.get("userId")

        # Find matching users
        matching_users = await database.find_many("users", {
            "role": "rider",
            "$or": [
                {"_id": user_id},
                {"phone": {"$in": candidates}},
                {"phone": phone},
                {"linked_id": rider_id},
            ]
        })
        print(f"Rider Profile {r.get('fullName')} ({rider_id}) matched {len(matching_users)} user(s)")
        for u in matching_users:
            u_id = u.get("_id")
            await database.collection("users").update_one(
                {"_id": u_id},
                {"$set": {
                    "is_onboarded": True,
                    "is_verified": is_verified,
                    "linked_id": rider_id,
                    "display_name": full_name,
                    "role": "rider",
                }}
            )
            await database.collection("riders").update_one(
                {"user_id": u_id},
                {"$set": {"rider_id": rider_id, "user_id": u_id}},
                upsert=True
            )
            print(f"  ✓ Updated user {u_id} to onboarded=True, verified={is_verified}, linked_id={rider_id}")

    # 2. Sync Partners
    partners = await database.find_many("partner_profiles")
    for p in partners:
        phone = p.get("phone") or p.get("ownerPhone") or ""
        clean_phone = phone.replace("+91", "").replace("+", "").strip()
        candidates = [phone, clean_phone, f"+91{clean_phone}", f"+91 {clean_phone}"]
        partner_id = p.get("partnerId") or p.get("_id")
        is_verified = bool(p.get("isVerified", False) or p.get("status") == "active")
        b_name = p.get("businessName") or p.get("name") or "Partner Store"
        user_id = p.get("userId")

        matching_users = await database.find_many("users", {
            "role": "partner",
            "$or": [
                {"_id": user_id},
                {"phone": {"$in": candidates}},
                {"linked_id": partner_id},
                {"linked_partner_id": partner_id},
            ]
        })
        print(f"Partner Profile {p.get('businessName')} ({partner_id}) matched {len(matching_users)} user(s)")
        for u in matching_users:
            u_id = u.get("_id")
            await database.collection("users").update_one(
                {"_id": u_id},
                {"$set": {
                    "is_onboarded": True,
                    "is_verified": is_verified,
                    "linked_id": partner_id,
                    "linked_partner_id": partner_id,
                    "display_name": b_name,
                    "role": "partner",
                }}
            )
            await database.collection("partners").update_one(
                {"user_id": u_id},
                {"$set": {"partner_id": partner_id, "user_id": u_id}},
                upsert=True
            )
            print(f"  ✓ Updated partner user {u_id} to onboarded=True, verified={is_verified}, linked_id={partner_id}")

if __name__ == "__main__":
    asyncio.run(sync_all_users())
