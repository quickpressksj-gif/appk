import asyncio
import random
from app.db.client import database

async def migrate_ids():
    await database.connect()

    # 1. Migrate Riders with UUID ids to 6-digit RDR-XXXXXX
    riders = await database.find_many("rider_profiles")
    for r in riders:
        old_id = str(r.get("_id") or r.get("riderId"))
        if len(old_id) > 20 and "-" in old_id:
            new_id = f"RDR-{random.randint(100000, 999999)}"
            print(f"Migrating Rider {r.get('fullName', 'Partner')} from {old_id} -> {new_id}")

            # Delete old documents first
            await database.delete_one("rider_profiles", {"_id": old_id})
            r["_id"] = new_id
            r["riderId"] = new_id
            r["rider_id"] = new_id
            await database.insert("rider_profiles", r)

            # Update riders mapping
            await database.collection("riders").update_many({"rider_id": old_id}, {"$set": {"rider_id": new_id}})
            await database.collection("riders").update_many({"riderId": old_id}, {"$set": {"riderId": new_id}})

            # Update users linked_id
            await database.collection("users").update_many({"linked_id": old_id}, {"$set": {"linked_id": new_id}})

            # Update rider_wallets
            wallet = await database.find_one("rider_wallets", {"_id": old_id})
            if wallet:
                await database.delete_one("rider_wallets", {"_id": old_id})
                wallet["_id"] = new_id
                wallet["riderId"] = new_id
                wallet["rider_id"] = new_id
                await database.insert("rider_wallets", wallet)

            # Update rider_settings
            settings = await database.find_one("rider_settings", {"_id": old_id})
            if settings:
                await database.delete_one("rider_settings", {"_id": old_id})
                settings["_id"] = new_id
                settings["riderId"] = new_id
                settings["rider_id"] = new_id
                await database.insert("rider_settings", settings)

            # Update orders assigned to this rider
            await database.collection("orders").update_many({"rider.id": old_id}, {"$set": {"rider.id": new_id}})
            await database.collection("orders").update_many({"riderId": old_id}, {"$set": {"riderId": new_id}})
            print(f"  ✓ Successfully migrated Rider to {new_id}")

    # 2. Migrate Partners with UUID ids to 6-digit PRT-XXXXXX
    partners = await database.find_many("partner_profiles")
    for p in partners:
        old_id = str(p.get("_id") or p.get("partnerId"))
        if len(old_id) > 20 and "-" in old_id:
            new_id = f"PRT-{random.randint(100000, 999999)}"
            print(f"Migrating Partner {p.get('businessName', 'Partner')} from {old_id} -> {new_id}")

            # Delete old documents first
            await database.delete_one("partner_profiles", {"_id": old_id})
            p["_id"] = new_id
            p["partnerId"] = new_id
            p["partner_id"] = new_id
            await database.insert("partner_profiles", p)

            # Update partners mapping
            await database.collection("partners").update_many({"partner_id": old_id}, {"$set": {"partner_id": new_id}})
            await database.collection("partners").update_many({"partnerId": old_id}, {"$set": {"partnerId": new_id}})

            # Update users linked_partner_id / linked_id
            await database.collection("users").update_many({"linked_id": old_id}, {"$set": {"linked_id": new_id}})
            await database.collection("users").update_many({"linked_partner_id": old_id}, {"$set": {"linked_partner_id": new_id}})

            # Update partner_services
            await database.collection("partner_services").update_many({"partnerId": old_id}, {"$set": {"partnerId": new_id, "partner_id": new_id}})

            # Update partner_wallets
            wallet = await database.find_one("partner_wallets", {"_id": old_id})
            if wallet:
                await database.delete_one("partner_wallets", {"_id": old_id})
                wallet["_id"] = new_id
                wallet["partnerId"] = new_id
                wallet["partner_id"] = new_id
                await database.insert("partner_wallets", wallet)

            # Update partner_settings
            settings = await database.find_one("partner_settings", {"_id": old_id})
            if settings:
                await database.delete_one("partner_settings", {"_id": old_id})
                settings["_id"] = new_id
                settings["partnerId"] = new_id
                settings["partner_id"] = new_id
                await database.insert("partner_settings", settings)

            # Update orders
            await database.collection("orders").update_many({"partner.id": old_id}, {"$set": {"partner.id": new_id}})
            await database.collection("orders").update_many({"partnerId": old_id}, {"$set": {"partnerId": new_id}})
            print(f"  ✓ Successfully migrated Partner to {new_id}")

    print("\n--- Migration Complete ---")
    await inspect_final()

async def inspect_final():
    riders = await database.find_many("rider_profiles")
    print(f"\nFinal Rider Profiles ({len(riders)}):")
    for r in riders:
        print(f"  - Rider: {r.get('fullName')} | ID: {r.get('riderId') or r.get('_id')} | Phone: {r.get('phone')}")

    partners = await database.find_many("partner_profiles")
    print(f"\nFinal Partner Profiles ({len(partners)}):")
    for p in partners:
        print(f"  - Partner: {p.get('businessName') or p.get('name')} | ID: {p.get('partnerId') or p.get('_id')} | Phone: {p.get('phone')}")

if __name__ == "__main__":
    asyncio.run(migrate_ids())
