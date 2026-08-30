"""Clean Reset & Fresh Real Data Seeding Script for QuickPress (Supabase PostgreSQL).

Purges all old dummy/test orders, partners, riders, carts, and notifications,
and initializes real operational data:
1. Real Kasganj Partner ('QuickPress Laundry & Dry Cleaners')
2. 9 Standard Real Services with authentic pricing & turnaround
3. Real Banners, Offers, Categories, and Master City configs
"""

import asyncio
import json
import logging
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.client import database

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("reset_seed")


async def reset_database():
    await database.connect()
    logger.info("Connected to database engine: %s", database.engine_type)

    # 1. Collections to purge completely
    collections_to_purge = [
        "customer_orders",
        "order_events",
        "order_reviews",
        "order_counters",
        "reorder_history",
        "gateway_payments",
        "gateway_order_secrets",
        "gateway_refunds",
        "notifications",
        "admin_notifications",
        "rider_notifications",
        "otp_attempts",
        "refresh_tokens",
        "customer_carts",
        "customer_addresses",
        "wallet_transactions",
        "wallet_ledger",
        "loyalty_transactions",
        "wallets",
        "rider_offers",
        "rider_bank_accounts",
        "rider_wallets",
        "rider_settings",
        "rider_profiles",
        "riders",
        "partner_wallets",
        "partner_settings",
        "partner_profiles",
        "partners",
        "partner_services",
        "live_locations",
        "customers",
    ]

    for col in collections_to_purge:
        c = database.collection(col)
        res = await c.delete_many({})
        count = getattr(res, "deleted_count", res)
        logger.info("Purged collection '%s' (deleted: %s)", col, count)

    # Clean non-admin users
    user_res = await database.collection("users").delete_many({"role": {"$in": ["customer", "partner", "rider", "CUSTOMER", "PARTNER", "RIDER"]}})
    logger.info("Purged non-admin users from 'users' collection (deleted: %s)", getattr(user_res, "deleted_count", user_res))

    # 2. Seed Master Cities
    cities = [
        {
            "_id": "city-kasganj",
            "name": "Kasganj",
            "state": "Uttar Pradesh",
            "pincode": "207123",
            "center": {"lat": 27.8083, "lng": 78.6473},
            "radiusKm": 15.0,
            "status": "active",
            "tier": "tier-2",
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }
    ]
    for c in cities:
        await database.collection("admin_cities").update_one({"_id": c["_id"]}, {"$set": c}, upsert=True)
    logger.info("Seeded %d master cities.", len(cities))

    # 3. Seed Real Partner Profile (Kasganj)
    partner_id = "PRT-752489"
    partner_user_id = "usr-partner-kasganj"
    now_iso = datetime.now(timezone.utc).isoformat()

    partner_user = {
        "_id": partner_user_id,
        "id": partner_user_id,
        "phone": "+919876543210",
        "name": "Himanshu Pal",
        "email": "kasganj.store@quickpress.online",
        "role": "partner",
        "status": "active",
        "createdAt": now_iso,
        "updatedAt": now_iso,
    }
    await database.collection("users").update_one({"_id": partner_user_id}, {"$set": partner_user}, upsert=True)

    partner_profile = {
        "_id": partner_id,
        "id": partner_id,
        "userId": partner_user_id,
        "partnerId": partner_id,
        "businessName": "QuickPress Laundry & Dry Cleaners",
        "name": "QuickPress Laundry & Dry Cleaners",
        "ownerName": "Himanshu Pal",
        "phone": "+919876543210",
        "email": "kasganj.store@quickpress.online",
        "address": "Station Road, Near Main Market, Kasganj, Uttar Pradesh 207123",
        "city": "Kasganj",
        "state": "Uttar Pradesh",
        "pincode": "207123",
        "area": "Main Market",
        "landmark": "Near Railway Station",
        "latitude": 27.8083,
        "longitude": 78.6473,
        "coordinates": {"lat": 27.8083, "lng": 78.6473},
        "rating": 4.9,
        "ratingCount": 128,
        "reviewCount": 128,
        "deliveryRadiusKm": 12.0,
        "deliveryFee": 0,
        "minOrderValue": 99,
        "status": "active",
        "isLive": True,
        "isOpen": True,
        "isApproved": True,
        "operationalHours": "08:00 AM - 09:00 PM",
        "openingTime": "08:00",
        "closingTime": "21:00",
        "turnaroundHours": 24,
        "expressTurnaroundHours": 4,
        "image": "/images/partners/store-front.jpg",
        "heroImage": "/images/partners/store-front.jpg",
        "capacityOrdersPerDay": 60,
        "activeServicesCount": 9,
        "createdAt": now_iso,
        "updatedAt": now_iso,
    }
    await database.collection("partner_profiles").update_one({"_id": partner_id}, {"$set": partner_profile}, upsert=True)
    await database.collection("partners").update_one({"_id": partner_id}, {"$set": partner_profile}, upsert=True)
    logger.info("Seeded real partner profile: %s (%s)", partner_id, partner_profile["businessName"])

    # 4. Seed Real Partner Services (9 authentic services)
    real_services = [
        {
            "_id": "svc-PRT-7524-1",
            "id": "svc-PRT-7524-1",
            "partnerId": partner_id,
            "name": "Wash & Fold",
            "title": "Wash & Fold",
            "category": "c1",
            "categoryId": "c1",
            "description": "Daily wear clothes, shirts, pants, t-shirts, towels washed, dried and crisply folded.",
            "price": 79,
            "unit": "kg",
            "unitLabel": "per kg",
            "minQuantity": 2,
            "turnaroundHours": 24,
            "turnaround": "24 hrs",
            "badge": "Popular",
            "discount": 10,
            "icon": "washing-machine",
            "image": "/images/services/wash-fold.jpg",
            "isActive": True,
            "enabled": True,
            "sortOrder": 1,
            "createdAt": now_iso,
        },
        {
            "_id": "svc-PRT-7524-2",
            "id": "svc-PRT-7524-2",
            "partnerId": partner_id,
            "name": "Steam Ironing",
            "title": "Steam Ironing",
            "category": "c3",
            "categoryId": "c3",
            "description": "High-pressure industrial steam iron for crease-free finish on formal shirts, trousers and ethnic wear.",
            "price": 19,
            "unit": "pc",
            "unitLabel": "per piece",
            "minQuantity": 3,
            "turnaroundHours": 12,
            "turnaround": "12 hrs",
            "badge": "Fast Delivery",
            "discount": 0,
            "icon": "flame",
            "image": "/images/services/steam-iron.jpg",
            "isActive": True,
            "enabled": True,
            "sortOrder": 2,
            "createdAt": now_iso,
        },
        {
            "_id": "svc-PRT-7524-3",
            "id": "svc-PRT-7524-3",
            "partnerId": partner_id,
            "name": "Wash & Iron",
            "title": "Wash & Iron",
            "category": "c1",
            "categoryId": "c1",
            "description": "Complete laundry package: Premium detergent wash, tumble dry, and crisp steam press.",
            "price": 99,
            "unit": "kg",
            "unitLabel": "per kg",
            "minQuantity": 2,
            "turnaroundHours": 24,
            "turnaround": "24 hrs",
            "badge": "Best Value",
            "discount": 15,
            "icon": "sparkles",
            "image": "/images/services/wash-iron.jpg",
            "isActive": True,
            "enabled": True,
            "sortOrder": 3,
            "createdAt": now_iso,
        },
        {
            "_id": "svc-PRT-7524-4",
            "id": "svc-PRT-7524-4",
            "partnerId": partner_id,
            "name": "Dry Cleaning",
            "title": "Dry Cleaning",
            "category": "c2",
            "categoryId": "c2",
            "description": "Eco-friendly hydrocarbon solvent dry cleaning for delicate formal suits, blazers, jackets & silks.",
            "price": 149,
            "unit": "pc",
            "unitLabel": "per piece",
            "minQuantity": 1,
            "turnaroundHours": 48,
            "turnaround": "48 hrs",
            "badge": "Expert Care",
            "discount": 0,
            "icon": "shirt",
            "image": "/images/services/dry-clean.jpg",
            "isActive": True,
            "enabled": True,
            "sortOrder": 4,
            "createdAt": now_iso,
        },
        {
            "_id": "svc-PRT-7524-5",
            "id": "svc-PRT-7524-5",
            "partnerId": partner_id,
            "name": "Premium Saree Care",
            "title": "Premium Saree Care",
            "category": "c4",
            "categoryId": "c4",
            "description": "Specialized gentle cleaning, rolling, polishing, and starching for silk, zari, and bridal sarees.",
            "price": 199,
            "unit": "pc",
            "unitLabel": "per piece",
            "minQuantity": 1,
            "turnaroundHours": 48,
            "turnaround": "48 hrs",
            "badge": "Delicate Silk",
            "discount": 0,
            "icon": "sparkles",
            "image": "/images/services/saree-care.jpg",
            "isActive": True,
            "enabled": True,
            "sortOrder": 5,
            "createdAt": now_iso,
        },
        {
            "_id": "svc-PRT-7524-6",
            "id": "svc-PRT-7524-6",
            "partnerId": partner_id,
            "name": "Shoe Cleaning & Spa",
            "title": "Shoe Cleaning & Spa",
            "category": "c5",
            "categoryId": "c5",
            "description": "Deep sole & upper scrub, stain treatment, deodorizing and antifungal polish for sneakers, leather & sports shoes.",
            "price": 249,
            "unit": "pair",
            "unitLabel": "per pair",
            "minQuantity": 1,
            "turnaroundHours": 48,
            "turnaround": "48 hrs",
            "badge": "Shoe Spa",
            "discount": 0,
            "icon": "footprints",
            "image": "/images/services/shoe-cleaning.jpg",
            "isActive": True,
            "enabled": True,
            "sortOrder": 6,
            "createdAt": now_iso,
        },
        {
            "_id": "svc-PRT-7524-7",
            "id": "svc-PRT-7524-7",
            "partnerId": partner_id,
            "name": "Blanket & Quilt Cleaning",
            "title": "Blanket & Quilt Cleaning",
            "category": "c7",
            "categoryId": "c7",
            "description": "Heavy winter blankets, mink blankets, razai & comforters deep sanitized wash and fresh scented conditioning.",
            "price": 299,
            "unit": "pc",
            "unitLabel": "per piece",
            "minQuantity": 1,
            "turnaroundHours": 48,
            "turnaround": "48 hrs",
            "badge": "Deep Clean",
            "discount": 0,
            "icon": "bed-double",
            "image": "/images/services/blanket-cleaning.jpg",
            "isActive": True,
            "enabled": True,
            "sortOrder": 7,
            "createdAt": now_iso,
        },
        {
            "_id": "svc-PRT-7524-8",
            "id": "svc-PRT-7524-8",
            "partnerId": partner_id,
            "name": "Curtain & Fabric Wash",
            "title": "Curtain & Fabric Wash",
            "category": "c6",
            "categoryId": "c6",
            "description": "Dust extraction, gentle wash, stain treatment and vertical steam press for home curtains and drapes.",
            "price": 149,
            "unit": "panel",
            "unitLabel": "per panel",
            "minQuantity": 2,
            "turnaroundHours": 48,
            "turnaround": "48 hrs",
            "badge": "Home Care",
            "discount": 0,
            "icon": "blinds",
            "image": "/images/services/curtain-cleaning.jpg",
            "isActive": True,
            "enabled": True,
            "sortOrder": 8,
            "createdAt": now_iso,
        },
        {
            "_id": "svc-PRT-7524-9",
            "id": "svc-PRT-7524-9",
            "partnerId": partner_id,
            "name": "Express 2-Hour Laundry",
            "title": "Express 2-Hour Laundry",
            "category": "c9",
            "categoryId": "c9",
            "description": "Superfast express turnaround wash, dry & press delivered to your doorstep within 2 to 4 hours.",
            "price": 129,
            "unit": "kg",
            "unitLabel": "per kg",
            "minQuantity": 2,
            "turnaroundHours": 4,
            "turnaround": "2-4 hrs",
            "badge": "⚡ Express",
            "discount": 0,
            "icon": "zap",
            "image": "/images/services/express-laundry.jpg",
            "isActive": True,
            "enabled": True,
            "sortOrder": 9,
            "createdAt": now_iso,
        },
    ]

    for s in real_services:
        await database.collection("partner_services").update_one({"_id": s["_id"]}, {"$set": s}, upsert=True)
    logger.info("Seeded %d real partner services for %s.", len(real_services), partner_id)

    # 5. Seed Real Categories
    categories = [
        {"_id": "c1", "title": "Wash & Fold", "description": "Daily wear clothes washed and folded", "icon": "washing-machine", "image": "/images/services/wash-fold.jpg", "sortOrder": 1, "status": "active"},
        {"_id": "c2", "title": "Dry Cleaning", "description": "Delicate fabrics and formal wear", "icon": "shirt", "image": "/images/services/dry-clean.jpg", "sortOrder": 2, "status": "active"},
        {"_id": "c3", "title": "Steam Iron", "description": "Crisp, wrinkle-free steam press", "icon": "flame", "image": "/images/services/steam-iron.jpg", "sortOrder": 3, "status": "active"},
        {"_id": "c4", "title": "Premium Saree Care", "description": "Silk, zari and designer fabrics", "icon": "sparkles", "image": "/images/services/saree-care.jpg", "sortOrder": 4, "status": "active"},
        {"_id": "c5", "title": "Shoe Cleaning", "description": "Deep sneaker, suede & leather care", "icon": "footprints", "image": "/images/services/shoe-cleaning.jpg", "sortOrder": 5, "status": "active"},
        {"_id": "c6", "title": "Curtain Cleaning", "description": "Home fabrics and drapes care", "icon": "blinds", "image": "/images/services/curtain-cleaning.jpg", "sortOrder": 6, "status": "active"},
        {"_id": "c7", "title": "Blanket Cleaning", "description": "Heavy winter bedding and quilts", "icon": "bed-double", "image": "/images/services/blanket-cleaning.jpg", "sortOrder": 7, "status": "active"},
        {"_id": "c8", "title": "Carpet Cleaning", "description": "Fibre deep wash & sanitization", "icon": "layout-grid", "image": "/images/services/carpet-cleaning.jpg", "sortOrder": 8, "status": "active"},
        {"_id": "c9", "title": "Express Laundry", "description": "Urgent 2-4 hours delivery", "icon": "zap", "image": "/images/services/express-laundry.jpg", "sortOrder": 9, "status": "active"},
    ]
    for cat in categories:
        await database.collection("categories").update_one({"_id": cat["_id"]}, {"$set": cat}, upsert=True)
    logger.info("Seeded %d categories.", len(categories))

    # 6. Seed Real Banners
    banners = [
        {
            "_id": "banner-1",
            "title": "Welcome to QuickPress Kasganj",
            "subtitle": "Get 50% OFF up to ₹100 on your first doorstep laundry order",
            "badge": "⚡ Launch Offer",
            "image": "/images/banners/banner-1.jpg",
            "tone": "primary",
            "priority": 1,
            "actionUrl": "/offers",
        },
        {
            "_id": "banner-2",
            "title": "Express 2-Hour Delivery",
            "subtitle": "Need it fast? We wash, iron and deliver in record time",
            "badge": "🚀 Fast Express",
            "image": "/images/banners/banner-2.jpg",
            "tone": "accent",
            "priority": 2,
            "actionUrl": "/partner/PRT-752489?highlightService=svc-PRT-7524-9",
        },
        {
            "_id": "banner-3",
            "title": "Premium Silk & Saree Care",
            "subtitle": "Specialized gentle cleaning & rolling for precious garments",
            "badge": "✨ Premium",
            "image": "/images/banners/banner-3.jpg",
            "tone": "secondary",
            "priority": 3,
            "actionUrl": "/partner/PRT-752489?highlightService=svc-PRT-7524-5",
        },
    ]
    for b in banners:
        await database.collection("banners").update_one({"_id": b["_id"]}, {"$set": b}, upsert=True)
    logger.info("Seeded %d promotional banners.", len(banners))

    # 7. Seed Real Offers
    offers = [
        {
            "_id": "offer-first50",
            "code": "FIRST50",
            "title": "50% OFF First Order",
            "description": "Flat 50% discount up to ₹100 for all first time customers in Kasganj.",
            "discountPercent": 50,
            "maxDiscount": 100,
            "minOrderValue": 149,
            "badge": "NEW USER",
            "status": "active",
            "expiresAt": "2026-12-31T23:59:59Z",
        },
        {
            "_id": "offer-quick10",
            "code": "QUICK10",
            "title": "Flat 10% OFF",
            "description": "Enjoy 10% off on all regular laundry & dry cleaning orders above ₹300.",
            "discountPercent": 10,
            "maxDiscount": 50,
            "minOrderValue": 300,
            "badge": "EVERYDAY",
            "status": "active",
            "expiresAt": "2026-12-31T23:59:59Z",
        },
        {
            "_id": "offer-freeship",
            "code": "FREESHIP",
            "title": "Free Pickup & Delivery",
            "description": "Zero delivery charges on all doorstep orders in Kasganj.",
            "discountPercent": 100,
            "maxDiscount": 40,
            "minOrderValue": 199,
            "badge": "FREE DELIVERY",
            "status": "active",
            "expiresAt": "2026-12-31T23:59:59Z",
        },
    ]
    for o in offers:
        await database.collection("offers").update_one({"_id": o["_id"]}, {"$set": o}, upsert=True)
    logger.info("Seeded %d promo offers.", len(offers))

    await database.disconnect()
    logger.info("✅ ALL TEST / DUMMY DATA PURGED & REAL OPERATIONAL DATA SEEDED SUCCESSFULLY!")


if __name__ == "__main__":
    asyncio.run(reset_database())
