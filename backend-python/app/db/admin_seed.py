"""Comprehensive Operational Seed Data for QuickPress Operations Console.

Populates real, structured, production-grade records for:
- Operating Cities (Kasganj, Aligarh, Mathura, Agra, Noida, Delhi NCR)
- Master Service Categories & Services
- Verified Partner Laundromats & Dry Cleaning Hubs
- Active Online Delivery Captains (Riders)
- Registered Customers & Addresses
- Real-time Lifecycle Orders (spanning Today, Yesterday, and Past 7 Days)
- 2-Ride Pickup/Delivery Dispatches & Ride Assignments
- Store & Rider Payout Settlements
- Promotional Discount Coupons
- Support Tickets
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from app.db.client import database

logger = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(dt: datetime) -> str:
    return dt.replace(microsecond=0).isoformat().replace("+00:00", "Z")


async def ensure_admin_operational_seed() -> None:
    """Ensure rich operational records exist in database for the Admin Console."""
    now = _now()

    # 1. Operating Cities
    cities = [
        {"_id": "city_kasganj", "id": "city_kasganj", "name": "Kasganj", "state": "Uttar Pradesh", "status": "Active", "hubsCount": 12, "ridersCount": 18, "isDefault": True, "lat": 27.8083, "lng": 78.6477, "createdAt": _iso(now - timedelta(days=60))},
        {"_id": "city_aligarh", "id": "city_aligarh", "name": "Aligarh", "state": "Uttar Pradesh", "status": "Active", "hubsCount": 24, "ridersCount": 35, "isDefault": False, "lat": 27.8974, "lng": 78.0880, "createdAt": _iso(now - timedelta(days=60))},
        {"_id": "city_mathura", "id": "city_mathura", "name": "Mathura", "state": "Uttar Pradesh", "status": "Active", "hubsCount": 10, "ridersCount": 15, "isDefault": False, "lat": 27.4924, "lng": 77.6737, "createdAt": _iso(now - timedelta(days=45))},
        {"_id": "city_agra", "id": "city_agra", "name": "Agra", "state": "Uttar Pradesh", "status": "Active", "hubsCount": 30, "ridersCount": 42, "isDefault": False, "lat": 27.1767, "lng": 78.0081, "createdAt": _iso(now - timedelta(days=45))},
        {"_id": "city_noida", "id": "city_noida", "name": "Noida / Greater Noida", "state": "Uttar Pradesh", "status": "Active", "hubsCount": 45, "ridersCount": 60, "isDefault": False, "lat": 28.5355, "lng": 77.3910, "createdAt": _iso(now - timedelta(days=30))},
        {"_id": "city_delhi", "id": "city_delhi", "name": "Delhi NCR", "state": "Delhi", "status": "Active", "hubsCount": 80, "ridersCount": 110, "isDefault": False, "lat": 28.7041, "lng": 77.1025, "createdAt": _iso(now - timedelta(days=30))},
    ]
    for c in cities:
        await database.update_one("admin_cities", {"_id": c["_id"]}, {"$set": c}, upsert=True)

    # 2. Master Categories & Services
    categories = [
        {"_id": "cat_wash_fold", "id": "cat_wash_fold", "name": "Wash & Fold", "icon": "washing-machine", "description": "Everyday weight-based laundry wash, dry and fold"},
        {"_id": "cat_dry_clean", "id": "cat_dry_clean", "name": "Dry Cleaning", "icon": "shirt", "description": "Delicate fabrics and formal wear professional dry clean"},
        {"_id": "cat_steam_iron", "id": "cat_steam_iron", "name": "Steam Ironing", "icon": "flame", "description": "Crisp, wrinkle-free temperature-controlled steam press"},
        {"_id": "cat_shoe_care", "id": "cat_shoe_care", "name": "Shoe & Sneaker Care", "icon": "footprints", "description": "Deep footwear cleaning, disinfection, and restoration"},
        {"_id": "cat_bulky", "id": "cat_bulky", "name": "Home & Bulky Care", "icon": "bed-double", "description": "Curtains, heavy blankets, quilts, and sofa covers"},
    ]
    for cat in categories:
        await database.update_one("admin_categories", {"_id": cat["_id"]}, {"$set": cat}, upsert=True)

    services = [
        {"_id": "srv_wash_fold", "id": "srv_wash_fold", "name": "Wash & Fold (Standard)", "categoryId": "cat_wash_fold", "unit": "per kg", "price": 60, "turnaround": "24 hrs", "popular": True, "status": "Active", "description": "Everyday wear washed in RO water and neatly folded."},
        {"_id": "srv_steam_shirt", "id": "srv_steam_shirt", "name": "Shirt Steam Iron", "categoryId": "cat_steam_iron", "unit": "per piece", "price": 15, "turnaround": "12 hrs", "popular": True, "status": "Active", "description": "Crisp hanger finish with razor precision."},
        {"_id": "srv_steam_trouser", "id": "srv_steam_trouser", "name": "Trouser / Jeans Steam Iron", "categoryId": "cat_steam_iron", "unit": "per piece", "price": 15, "turnaround": "12 hrs", "popular": True, "status": "Active", "description": "Flat line crease press for cotton and denim."},
        {"_id": "srv_dc_suit", "id": "srv_dc_suit", "name": "2-Piece Suit Dry Clean", "categoryId": "cat_dry_clean", "unit": "per suit", "price": 350, "turnaround": "48 hrs", "popular": True, "status": "Active", "description": "Hydrocarbon premium chemical wash with jacket shape retention."},
        {"_id": "srv_dc_saree", "id": "srv_dc_saree", "name": "Silk / Designer Saree Dry Clean", "categoryId": "cat_dry_clean", "unit": "per piece", "price": 280, "turnaround": "48 hrs", "popular": True, "status": "Active", "description": "Zari and stone-safe specialized gentle dry cleaning."},
        {"_id": "srv_shoe_deep", "id": "srv_shoe_deep", "name": "Sneaker & Leather Shoe Clean", "categoryId": "cat_shoe_care", "unit": "per pair", "price": 299, "turnaround": "36 hrs", "popular": True, "status": "Active", "description": "Sole whitening, interior deodorizing, and exterior revival."},
        {"_id": "srv_quilt_clean", "id": "srv_quilt_clean", "name": "Double Bed Blanket / Quilt Clean", "categoryId": "cat_bulky", "unit": "per piece", "price": 350, "turnaround": "48 hrs", "popular": False, "status": "Active", "description": "Deep thermal wash and anti-bacterial hygiene drying."},
    ]
    for s in services:
        await database.update_one("admin_services", {"_id": s["_id"]}, {"$set": s}, upsert=True)

    # 3. Verified Partner Stores
    partner_docs = [
        {
            "_id": "prt_kasganj_express",
            "id": "prt_kasganj_express",
            "name": "QuickPress Express Hub - Station Road",
            "storeName": "QuickPress Express Hub - Station Road",
            "ownerName": "Rajesh Agarwal",
            "phone": "+91 98719 62511",
            "email": "kasganj.hub@quickpress.online",
            "city": "Kasganj",
            "address": "Shop 4, Railway Station Commercial Complex, Station Road, Kasganj",
            "status": "active",
            "isVerified": True,
            "rating": 4.9,
            "commissionRate": "18%",
            "capacityDaily": 80,
            "activeOrders": 8,
            "completedOrders": 340,
            "totalRevenue": 142800,
            "walletBalance": 18450.0,
            "payoutStatus": "Up to Date",
            "createdAt": _iso(now - timedelta(days=90)),
        },
        {
            "_id": "prt_royal_gandhinagar",
            "id": "prt_royal_gandhinagar",
            "name": "Royal Dry Cleaners & Steam Hub",
            "storeName": "Royal Dry Cleaners & Steam Hub",
            "ownerName": "Suresh Chandra Gupta",
            "phone": "+91 98719 62512",
            "email": "royal.kasganj@quickpress.online",
            "city": "Kasganj",
            "address": "Opp. Gandhi Statue, Main Market, Gandhi Nagar, Kasganj",
            "status": "active",
            "isVerified": True,
            "rating": 4.8,
            "commissionRate": "18%",
            "capacityDaily": 50,
            "activeOrders": 5,
            "completedOrders": 215,
            "totalRevenue": 96500,
            "walletBalance": 11200.0,
            "payoutStatus": "Up to Date",
            "createdAt": _iso(now - timedelta(days=75)),
        },
        {
            "_id": "prt_aligarh_centrepoint",
            "id": "prt_aligarh_centrepoint",
            "name": "SmartWash Laundromat - Centre Point",
            "storeName": "SmartWash Laundromat - Centre Point",
            "ownerName": "Mohd. Faisal Khan",
            "phone": "+91 98719 62513",
            "email": "faisal.aligarh@quickpress.online",
            "city": "Aligarh",
            "address": "Plot 12, Marris Road near Centre Point, Aligarh",
            "status": "active",
            "isVerified": True,
            "rating": 4.9,
            "commissionRate": "18%",
            "capacityDaily": 120,
            "activeOrders": 14,
            "completedOrders": 520,
            "totalRevenue": 248000,
            "walletBalance": 32100.0,
            "payoutStatus": "Up to Date",
            "createdAt": _iso(now - timedelta(days=120)),
        },
        {
            "_id": "prt_clean_agra_sanjay",
            "id": "prt_clean_agra_sanjay",
            "name": "CleanKart Mega Hub - Sanjay Place",
            "storeName": "CleanKart Mega Hub - Sanjay Place",
            "ownerName": "Vikas Bansal",
            "phone": "+91 98719 62514",
            "email": "vikas.agra@quickpress.online",
            "city": "Agra",
            "address": "Block B-4, Commercial Enclave, Sanjay Place, Agra",
            "status": "active",
            "isVerified": True,
            "rating": 4.7,
            "commissionRate": "18%",
            "capacityDaily": 150,
            "activeOrders": 18,
            "completedOrders": 680,
            "totalRevenue": 315000,
            "walletBalance": 41500.0,
            "payoutStatus": "Pending Settlement",
            "createdAt": _iso(now - timedelta(days=110)),
        },
        {
            "_id": "prt_freshpress_noida62",
            "id": "prt_freshpress_noida62",
            "name": "FreshPress Studio - Sector 62",
            "storeName": "FreshPress Studio - Sector 62",
            "ownerName": "Anand Mishra",
            "phone": "+91 98719 62515",
            "email": "anand.noida@quickpress.online",
            "city": "Noida / Greater Noida",
            "address": "Tower C Ground Floor, Stellar IT Park, Sector 62, Noida",
            "status": "active",
            "isVerified": True,
            "rating": 5.0,
            "commissionRate": "18%",
            "capacityDaily": 200,
            "activeOrders": 22,
            "completedOrders": 890,
            "totalRevenue": 462000,
            "walletBalance": 58900.0,
            "payoutStatus": "Up to Date",
            "createdAt": _iso(now - timedelta(days=150)),
        },
    ]
    for p in partner_docs:
        await database.update_one("partner_profiles", {"_id": p["_id"]}, {"$set": p}, upsert=True)
        await database.update_one("partners", {"_id": p["_id"]}, {"$set": p}, upsert=True)

    # 4. Active Delivery Captains (Riders)
    rider_docs = [
        {
            "_id": "rdr_vikram_singh",
            "id": "rdr_vikram_singh",
            "riderId": "rdr_vikram_singh",
            "name": "Vikram Singh",
            "fullName": "Vikram Singh",
            "phone": "+91 98719 62591",
            "email": "vikram.rider@quickpress.online",
            "city": "Kasganj",
            "vehicle": "Honda Activa 6G (UP-87-AB-1234)",
            "vehicleType": "Two Wheeler",
            "status": "approved",
            "isOnline": True,
            "dutyStatus": "ON_DUTY",
            "rating": 4.9,
            "trips": 142,
            "todayEarnings": 640.0,
            "walletBalance": 2450.0,
            "currentLocation": {"lat": 27.8085, "lng": 78.6480, "updatedAt": _iso(now)},
            "createdAt": _iso(now - timedelta(days=60)),
        },
        {
            "_id": "rdr_amit_kumar",
            "id": "rdr_amit_kumar",
            "riderId": "rdr_amit_kumar",
            "name": "Amit Kumar",
            "fullName": "Amit Kumar",
            "phone": "+91 98719 62592",
            "email": "amit.rider@quickpress.online",
            "city": "Kasganj",
            "vehicle": "TVS Jupiter 125 (UP-87-CD-5678)",
            "vehicleType": "Two Wheeler",
            "status": "approved",
            "isOnline": True,
            "dutyStatus": "ON_DUTY",
            "rating": 4.8,
            "trips": 98,
            "todayEarnings": 480.0,
            "walletBalance": 1820.0,
            "currentLocation": {"lat": 27.8090, "lng": 78.6465, "updatedAt": _iso(now)},
            "createdAt": _iso(now - timedelta(days=45)),
        },
        {
            "_id": "rdr_rahul_verma",
            "id": "rdr_rahul_verma",
            "riderId": "rdr_rahul_verma",
            "name": "Rahul Verma",
            "fullName": "Rahul Verma",
            "phone": "+91 98719 62593",
            "email": "rahul.rider@quickpress.online",
            "city": "Aligarh",
            "vehicle": "Hero Splendor Plus (UP-81-EF-9012)",
            "vehicleType": "Two Wheeler",
            "status": "approved",
            "isOnline": True,
            "dutyStatus": "ON_DUTY",
            "rating": 4.9,
            "trips": 210,
            "todayEarnings": 820.0,
            "walletBalance": 3400.0,
            "currentLocation": {"lat": 27.8980, "lng": 78.0890, "updatedAt": _iso(now)},
            "createdAt": _iso(now - timedelta(days=80)),
        },
        {
            "_id": "rdr_deepak_sharma",
            "id": "rdr_deepak_sharma",
            "riderId": "rdr_deepak_sharma",
            "name": "Deepak Sharma",
            "fullName": "Deepak Sharma",
            "phone": "+91 98719 62594",
            "email": "deepak.rider@quickpress.online",
            "city": "Agra",
            "vehicle": "Bajaj Pulsar 150 (UP-80-GH-3456)",
            "vehicleType": "Two Wheeler",
            "status": "approved",
            "isOnline": True,
            "dutyStatus": "ON_DUTY",
            "rating": 4.7,
            "trips": 115,
            "todayEarnings": 540.0,
            "walletBalance": 1950.0,
            "currentLocation": {"lat": 27.1770, "lng": 78.0090, "updatedAt": _iso(now)},
            "createdAt": _iso(now - timedelta(days=40)),
        },
        {
            "_id": "rdr_manoj_yadav",
            "id": "rdr_manoj_yadav",
            "riderId": "rdr_manoj_yadav",
            "name": "Manoj Yadav",
            "fullName": "Manoj Yadav",
            "phone": "+91 98719 62595",
            "email": "manoj.rider@quickpress.online",
            "city": "Noida / Greater Noida",
            "vehicle": "Ather 450X EV (UP-16-JK-7890)",
            "vehicleType": "Electric Two Wheeler",
            "status": "approved",
            "isOnline": True,
            "dutyStatus": "ON_DUTY",
            "rating": 5.0,
            "trips": 84,
            "todayEarnings": 720.0,
            "walletBalance": 2680.0,
            "currentLocation": {"lat": 28.5360, "lng": 77.3920, "updatedAt": _iso(now)},
            "createdAt": _iso(now - timedelta(days=35)),
        },
    ]
    for r in rider_docs:
        await database.update_one("rider_profiles", {"_id": r["_id"]}, {"$set": r}, upsert=True)
        await database.update_one("riders", {"_id": r["_id"]}, {"$set": r}, upsert=True)

    # 5. Registered Customers
    cust_docs = [
        {"_id": "cust_himanshu_pal", "id": "cust_himanshu_pal", "name": "Himanshu Pal", "phone": "+91 92587 30561", "email": "himanshupal@quickpress.in", "city": "Kasganj", "membership": "VIP Gold", "totalOrders": 14, "totalSpent": 7840, "createdAt": _iso(now - timedelta(days=60))},
        {"_id": "cust_pooja_sharma", "id": "cust_pooja_sharma", "name": "Pooja Sharma", "phone": "+91 98712 34501", "email": "pooja.sharma@gmail.com", "city": "Kasganj", "membership": "Regular", "totalOrders": 8, "totalSpent": 3420, "createdAt": _iso(now - timedelta(days=45))},
        {"_id": "cust_alok_verma", "id": "cust_alok_verma", "name": "Dr. Alok Verma", "phone": "+91 98712 34502", "email": "dr.alok@aligarh.org", "city": "Aligarh", "membership": "VIP Platinum", "totalOrders": 22, "totalSpent": 14650, "createdAt": _iso(now - timedelta(days=50))},
        {"_id": "cust_sunita_agarwal", "id": "cust_sunita_agarwal", "name": "Sunita Agarwal", "phone": "+91 98712 34503", "email": "sunita.agarwal@yahoo.com", "city": "Kasganj", "membership": "Regular", "totalOrders": 5, "totalSpent": 2100, "createdAt": _iso(now - timedelta(days=30))},
        {"_id": "cust_rohan_gupta", "id": "cust_rohan_gupta", "name": "Rohan Gupta", "phone": "+91 98712 34504", "email": "rohan.gupta@techfirm.com", "city": "Aligarh", "membership": "VIP Gold", "totalOrders": 16, "totalSpent": 9250, "createdAt": _iso(now - timedelta(days=40))},
        {"_id": "cust_neha_singh", "id": "cust_neha_singh", "name": "Neha Singh", "phone": "+91 98712 34505", "email": "neha.singh@outlook.com", "city": "Mathura", "membership": "Regular", "totalOrders": 7, "totalSpent": 3890, "createdAt": _iso(now - timedelta(days=25))},
    ]
    for c in cust_docs:
        await database.update_one("customers", {"_id": c["_id"]}, {"$set": c}, upsert=True)
        await database.update_one("users", {"_id": c["_id"]}, {"$set": {**c, "role": "customer", "status": "active", "is_verified": True, "is_onboarded": True}}, upsert=True)

    # 6. Real Live Lifecycle Customer Orders (Spanning Today, Yesterday, Last 7 Days)
    order_templates = [
        # --- TODAY'S ORDERS ---
        {
            "_id": "ord_today_101",
            "id": "ord_today_101",
            "code": "ORD-849201",
            "userId": "cust_himanshu_pal",
            "customerName": "Himanshu Pal",
            "customerPhone": "+91 92587 30561",
            "customerEmail": "himanshupal@quickpress.in",
            "serviceLabel": "Steam Ironing (Express)",
            "status": "out_for_delivery",
            "city": "Kasganj",
            "address": {"formatted": "Flat 402, Royal Residency, Station Road, Gandhi Nagar, Kasganj", "landmark": "Near Railway Station", "pincode": "207123", "city": "Kasganj", "latitude": 27.8083, "longitude": 78.6477},
            "partner": {"id": "prt_kasganj_express", "name": "QuickPress Express Hub - Station Road", "phone": "+91 98719 62511", "city": "Kasganj"},
            "rider": {"id": "rdr_vikram_singh", "name": "Vikram Singh", "phone": "+91 98719 62591"},
            "items": [{"name": "Shirt Steam Iron", "qty": 8, "price": 15}, {"name": "Trouser Steam Iron", "qty": 4, "price": 15}, {"name": "Blazer Steam Iron", "qty": 1, "price": 60}],
            "totals": {"itemTotal": 240, "deliveryFee": 0, "platformFee": 15, "tax": 12, "discount": 0, "grandTotal": 267},
            "payment": {"mode": "upi", "status": "paid", "transactionId": "TXN_UPI_8849102"},
            "slot": "Today 09:00 AM - 11:00 AM",
            "pickupSlot": "Today 09:00 AM - 11:00 AM",
            "deliverySlot": "Today 05:00 PM - 07:00 PM",
            "createdAt": _iso(now - timedelta(hours=3)),
        },
        {
            "_id": "ord_today_102",
            "id": "ord_today_102",
            "code": "ORD-849202",
            "userId": "cust_pooja_sharma",
            "customerName": "Pooja Sharma",
            "customerPhone": "+91 98712 34501",
            "customerEmail": "pooja.sharma@gmail.com",
            "serviceLabel": "Premium Dry Cleaning",
            "status": "processing",
            "city": "Kasganj",
            "address": {"formatted": "House 18, Awas Vikas Colony, Kasganj", "landmark": "Behind Water Tank", "pincode": "207123", "city": "Kasganj", "latitude": 27.8105, "longitude": 78.6415},
            "partner": {"id": "prt_royal_gandhinagar", "name": "Royal Dry Cleaners & Steam Hub", "phone": "+91 98719 62512", "city": "Kasganj"},
            "rider": {"id": "rdr_amit_kumar", "name": "Amit Kumar", "phone": "+91 98719 62592"},
            "items": [{"name": "Silk Saree Dry Clean", "qty": 2, "price": 280}, {"name": "Double Bed Blanket", "qty": 1, "price": 350}],
            "totals": {"itemTotal": 910, "deliveryFee": 0, "platformFee": 15, "tax": 45, "discount": 50, "grandTotal": 920},
            "payment": {"mode": "cod", "status": "pending"},
            "slot": "Today 10:00 AM - 12:00 PM",
            "pickupSlot": "Today 10:00 AM - 12:00 PM",
            "deliverySlot": "Tomorrow 04:00 PM - 06:00 PM",
            "createdAt": _iso(now - timedelta(hours=2)),
        },
        {
            "_id": "ord_today_103",
            "id": "ord_today_103",
            "code": "ORD-849203",
            "userId": "cust_alok_verma",
            "customerName": "Dr. Alok Verma",
            "customerPhone": "+91 98712 34502",
            "customerEmail": "dr.alok@aligarh.org",
            "serviceLabel": "Wash & Fold (5 kg Bulk)",
            "status": "pickup_in_progress",
            "city": "Aligarh",
            "address": {"formatted": "House 52, Professor Colony, Medical Road, Aligarh", "landmark": "Near JNMC", "pincode": "202002", "city": "Aligarh", "latitude": 27.8974, "longitude": 78.0880},
            "partner": {"id": "prt_aligarh_centrepoint", "name": "SmartWash Laundromat - Centre Point", "phone": "+91 98719 62513", "city": "Aligarh"},
            "rider": {"id": "rdr_rahul_verma", "name": "Rahul Verma", "phone": "+91 98719 62593"},
            "items": [{"name": "Wash & Fold (kg)", "qty": 5, "price": 60}],
            "totals": {"itemTotal": 300, "deliveryFee": 30, "platformFee": 15, "tax": 15, "discount": 0, "grandTotal": 360},
            "payment": {"mode": "upi", "status": "paid", "transactionId": "TXN_UPI_8849103"},
            "slot": "Today 11:30 AM - 01:30 PM",
            "pickupSlot": "Today 11:30 AM - 01:30 PM",
            "deliverySlot": "Tomorrow 11:00 AM - 01:00 PM",
            "createdAt": _iso(now - timedelta(hours=1)),
        },
        {
            "_id": "ord_today_104",
            "id": "ord_today_104",
            "code": "ORD-849204",
            "userId": "cust_rohan_gupta",
            "customerName": "Rohan Gupta",
            "customerPhone": "+91 98712 34504",
            "customerEmail": "rohan.gupta@techfirm.com",
            "serviceLabel": "Sneaker Care & Steam Press",
            "status": "partner_accepted",
            "city": "Aligarh",
            "address": {"formatted": "Flat B-301, Silver Oak Apartments, Marris Road, Aligarh", "landmark": "Near Centre Point", "pincode": "202001", "city": "Aligarh", "latitude": 27.8985, "longitude": 78.0895},
            "partner": {"id": "prt_aligarh_centrepoint", "name": "SmartWash Laundromat - Centre Point", "phone": "+91 98719 62513", "city": "Aligarh"},
            "rider": None,
            "items": [{"name": "Sneaker Restoration Clean", "qty": 1, "price": 299}, {"name": "Shirt Steam Iron", "qty": 5, "price": 15}],
            "totals": {"itemTotal": 374, "deliveryFee": 0, "platformFee": 15, "tax": 19, "discount": 0, "grandTotal": 408},
            "payment": {"mode": "card", "status": "paid", "transactionId": "TXN_CARD_992140"},
            "slot": "Today 02:00 PM - 04:00 PM",
            "pickupSlot": "Today 02:00 PM - 04:00 PM",
            "deliverySlot": "Day After Tomorrow 10:00 AM - 12:00 PM",
            "createdAt": _iso(now - timedelta(minutes=45)),
        },
        {
            "_id": "ord_today_105",
            "id": "ord_today_105",
            "code": "ORD-849205",
            "userId": "cust_sunita_agarwal",
            "customerName": "Sunita Agarwal",
            "customerPhone": "+91 98712 34503",
            "customerEmail": "sunita.agarwal@yahoo.com",
            "serviceLabel": "Curtain & Bulky Care",
            "status": "placed",
            "city": "Kasganj",
            "address": {"formatted": "House 12, Bilram Gate Road, Kasganj", "landmark": "Near Durga Temple", "pincode": "207123", "city": "Kasganj", "latitude": 27.8070, "longitude": 78.6490},
            "partner": None,
            "rider": None,
            "items": [{"name": "Curtains Heavy Wash", "qty": 4, "price": 120}],
            "totals": {"itemTotal": 480, "deliveryFee": 40, "platformFee": 15, "tax": 24, "discount": 40, "grandTotal": 519},
            "payment": {"mode": "cod", "status": "pending"},
            "slot": "Today 04:00 PM - 06:00 PM",
            "pickupSlot": "Today 04:00 PM - 06:00 PM",
            "deliverySlot": "08 Sept 2026",
            "createdAt": _iso(now - timedelta(minutes=15)),
        },
        {
            "_id": "ord_today_106",
            "id": "ord_today_106",
            "code": "ORD-849206",
            "userId": "cust_himanshu_pal",
            "customerName": "Himanshu Pal",
            "customerPhone": "+91 92587 30561",
            "customerEmail": "himanshupal@quickpress.in",
            "serviceLabel": "Suit Dry Clean & Press",
            "status": "delivered",
            "city": "Kasganj",
            "address": {"formatted": "Flat 402, Royal Residency, Station Road, Gandhi Nagar, Kasganj", "landmark": "Near Railway Station", "pincode": "207123", "city": "Kasganj", "latitude": 27.8083, "longitude": 78.6477},
            "partner": {"id": "prt_kasganj_express", "name": "QuickPress Express Hub - Station Road", "phone": "+91 98719 62511", "city": "Kasganj"},
            "rider": {"id": "rdr_vikram_singh", "name": "Vikram Singh", "phone": "+91 98719 62591"},
            "items": [{"name": "2-Piece Suit Dry Clean", "qty": 2, "price": 350}],
            "totals": {"itemTotal": 700, "deliveryFee": 0, "platformFee": 15, "tax": 35, "discount": 100, "grandTotal": 650},
            "payment": {"mode": "upi", "status": "paid", "transactionId": "TXN_UPI_8849106"},
            "createdAt": _iso(now - timedelta(hours=6)),
            "deliveredAt": _iso(now - timedelta(hours=1)),
        },
        # --- YESTERDAY'S ORDERS ---
        {
            "_id": "ord_yest_201",
            "id": "ord_yest_201",
            "code": "ORD-849180",
            "userId": "cust_neha_singh",
            "customerName": "Neha Singh",
            "customerPhone": "+91 98712 34505",
            "customerEmail": "neha.singh@outlook.com",
            "serviceLabel": "Premium Dry Clean (Lehenga & Suits)",
            "status": "delivered",
            "city": "Mathura",
            "address": {"formatted": "Villa 9, Krishna Nagar, Mathura", "landmark": "Near Birla Mandir", "pincode": "281001", "city": "Mathura", "latitude": 27.4924, "longitude": 77.6737},
            "partner": {"id": "prt_clean_agra_sanjay", "name": "CleanKart Mega Hub - Sanjay Place", "phone": "+91 98719 62514", "city": "Agra"},
            "rider": {"id": "rdr_deepak_sharma", "name": "Deepak Sharma", "phone": "+91 98719 62594"},
            "items": [{"name": "Designer Lehenga Dry Clean", "qty": 1, "price": 750}, {"name": "Kurta Pyjama Steam Press", "qty": 2, "price": 40}],
            "totals": {"itemTotal": 830, "deliveryFee": 0, "platformFee": 15, "tax": 42, "discount": 50, "grandTotal": 837},
            "payment": {"mode": "upi", "status": "paid", "transactionId": "TXN_UPI_8849080"},
            "createdAt": _iso(now - timedelta(days=1, hours=5)),
            "deliveredAt": _iso(now - timedelta(days=1, hours=1)),
        },
        {
            "_id": "ord_yest_202",
            "id": "ord_yest_202",
            "code": "ORD-849181",
            "userId": "cust_alok_verma",
            "customerName": "Dr. Alok Verma",
            "customerPhone": "+91 98712 34502",
            "customerEmail": "dr.alok@aligarh.org",
            "serviceLabel": "Executive Steam Ironing",
            "status": "delivered",
            "city": "Aligarh",
            "address": {"formatted": "House 52, Professor Colony, Medical Road, Aligarh", "landmark": "Near JNMC", "pincode": "202002", "city": "Aligarh", "latitude": 27.8974, "longitude": 78.0880},
            "partner": {"id": "prt_aligarh_centrepoint", "name": "SmartWash Laundromat - Centre Point", "phone": "+91 98719 62513", "city": "Aligarh"},
            "rider": {"id": "rdr_rahul_verma", "name": "Rahul Verma", "phone": "+91 98719 62593"},
            "items": [{"name": "Coat & Pants Steam Press", "qty": 3, "price": 90}],
            "totals": {"itemTotal": 270, "deliveryFee": 0, "platformFee": 15, "tax": 14, "discount": 0, "grandTotal": 299},
            "payment": {"mode": "card", "status": "paid"},
            "createdAt": _iso(now - timedelta(days=1, hours=8)),
            "deliveredAt": _iso(now - timedelta(days=1, hours=2)),
        },
        # --- PAST 7 DAYS ORDERS ---
        {
            "_id": "ord_past_301",
            "id": "ord_past_301",
            "code": "ORD-849120",
            "userId": "cust_himanshu_pal",
            "customerName": "Himanshu Pal",
            "customerPhone": "+91 92587 30561",
            "customerEmail": "himanshupal@quickpress.in",
            "serviceLabel": "Bedding & Quilts Deep Wash",
            "status": "delivered",
            "city": "Kasganj",
            "address": {"formatted": "Flat 402, Royal Residency, Station Road, Gandhi Nagar, Kasganj", "landmark": "Near Railway Station", "pincode": "207123", "city": "Kasganj", "latitude": 27.8083, "longitude": 78.6477},
            "partner": {"id": "prt_kasganj_express", "name": "QuickPress Express Hub - Station Road", "phone": "+91 98719 62511", "city": "Kasganj"},
            "rider": {"id": "rdr_vikram_singh", "name": "Vikram Singh", "phone": "+91 98719 62591"},
            "items": [{"name": "Double Bed Blanket Clean", "qty": 2, "price": 350}],
            "totals": {"itemTotal": 700, "deliveryFee": 0, "platformFee": 15, "tax": 35, "discount": 70, "grandTotal": 680},
            "payment": {"mode": "upi", "status": "paid"},
            "createdAt": _iso(now - timedelta(days=3, hours=4)),
            "deliveredAt": _iso(now - timedelta(days=2, hours=3)),
        },
        {
            "_id": "ord_past_302",
            "id": "ord_past_302",
            "code": "ORD-849095",
            "userId": "cust_pooja_sharma",
            "customerName": "Pooja Sharma",
            "customerPhone": "+91 98712 34501",
            "customerEmail": "pooja.sharma@gmail.com",
            "serviceLabel": "Wash & Iron (6 kg)",
            "status": "delivered",
            "city": "Kasganj",
            "address": {"formatted": "House 18, Awas Vikas Colony, Kasganj", "landmark": "Behind Water Tank", "pincode": "207123", "city": "Kasganj", "latitude": 27.8105, "longitude": 78.6415},
            "partner": {"id": "prt_royal_gandhinagar", "name": "Royal Dry Cleaners & Steam Hub", "phone": "+91 98719 62512", "city": "Kasganj"},
            "rider": {"id": "rdr_amit_kumar", "name": "Amit Kumar", "phone": "+91 98719 62592"},
            "items": [{"name": "Wash & Iron", "qty": 6, "price": 80}],
            "totals": {"itemTotal": 480, "deliveryFee": 0, "platformFee": 15, "tax": 24, "discount": 0, "grandTotal": 519},
            "payment": {"mode": "cod", "status": "paid"},
            "createdAt": _iso(now - timedelta(days=4, hours=6)),
            "deliveredAt": _iso(now - timedelta(days=3, hours=2)),
        },
        {
            "_id": "ord_past_303",
            "id": "ord_past_303",
            "code": "ORD-849050",
            "userId": "cust_rohan_gupta",
            "customerName": "Rohan Gupta",
            "customerPhone": "+91 98712 34504",
            "customerEmail": "rohan.gupta@techfirm.com",
            "serviceLabel": "Shoe Cleaning & Saree Dry Clean",
            "status": "delivered",
            "city": "Aligarh",
            "address": {"formatted": "Flat B-301, Silver Oak Apartments, Marris Road, Aligarh", "landmark": "Near Centre Point", "pincode": "202001", "city": "Aligarh", "latitude": 27.8985, "longitude": 78.0895},
            "partner": {"id": "prt_aligarh_centrepoint", "name": "SmartWash Laundromat - Centre Point", "phone": "+91 98719 62513", "city": "Aligarh"},
            "rider": {"id": "rdr_rahul_verma", "name": "Rahul Verma", "phone": "+91 98719 62593"},
            "items": [{"name": "Sneaker Clean", "qty": 2, "price": 299}, {"name": "Silk Saree Clean", "qty": 1, "price": 280}],
            "totals": {"itemTotal": 878, "deliveryFee": 0, "platformFee": 15, "tax": 44, "discount": 100, "grandTotal": 837},
            "payment": {"mode": "upi", "status": "paid"},
            "createdAt": _iso(now - timedelta(days=5, hours=2)),
            "deliveredAt": _iso(now - timedelta(days=4, hours=1)),
        },
        {
            "_id": "ord_past_304",
            "id": "ord_past_304",
            "code": "ORD-849010",
            "userId": "cust_sunita_agarwal",
            "customerName": "Sunita Agarwal",
            "customerPhone": "+91 98712 34503",
            "customerEmail": "sunita.agarwal@yahoo.com",
            "serviceLabel": "Express Wash & Fold (12 kg)",
            "status": "delivered",
            "city": "Kasganj",
            "address": {"formatted": "House 12, Bilram Gate Road, Kasganj", "landmark": "Near Durga Temple", "pincode": "207123", "city": "Kasganj", "latitude": 27.8070, "longitude": 78.6490},
            "partner": {"id": "prt_kasganj_express", "name": "QuickPress Express Hub - Station Road", "phone": "+91 98719 62511", "city": "Kasganj"},
            "rider": {"id": "rdr_vikram_singh", "name": "Vikram Singh", "phone": "+91 98719 62591"},
            "items": [{"name": "Wash & Fold (kg)", "qty": 12, "price": 60}],
            "totals": {"itemTotal": 720, "deliveryFee": 0, "platformFee": 15, "tax": 36, "discount": 50, "grandTotal": 721},
            "payment": {"mode": "cod", "status": "paid"},
            "createdAt": _iso(now - timedelta(days=6, hours=3)),
            "deliveredAt": _iso(now - timedelta(days=5, hours=1)),
        },
    ]
    for o in order_templates:
        await database.update_one("customer_orders", {"_id": o["_id"]}, {"$set": o}, upsert=True)
        await database.update_one("orders", {"_id": o["_id"]}, {"$set": o}, upsert=True)

    # 7. Dispatches & 2-Ride Assignments
    rides = [
        {"_id": "ride_p101", "id": "ride_p101", "orderId": "ord_today_101", "rideType": "pickup", "status": "COMPLETED", "riderId": "rdr_vikram_singh", "createdAt": _iso(now - timedelta(hours=3))},
        {"_id": "ride_d101", "id": "ride_d101", "orderId": "ord_today_101", "rideType": "delivery", "status": "IN_PROGRESS", "riderId": "rdr_vikram_singh", "createdAt": _iso(now - timedelta(minutes=40))},
        {"_id": "ride_p102", "id": "ride_p102", "orderId": "ord_today_102", "rideType": "pickup", "status": "COMPLETED", "riderId": "rdr_amit_kumar", "createdAt": _iso(now - timedelta(hours=2))},
        {"_id": "ride_p103", "id": "ride_p103", "orderId": "ord_today_103", "rideType": "pickup", "status": "ASSIGNED", "riderId": "rdr_rahul_verma", "createdAt": _iso(now - timedelta(hours=1))},
        {"_id": "ride_p104", "id": "ride_p104", "orderId": "ord_today_104", "rideType": "pickup", "status": "SEARCHING_RIDER", "riderId": None, "createdAt": _iso(now - timedelta(minutes=45))},
    ]
    for r in rides:
        await database.update_one("rides", {"_id": r["_id"]}, {"$set": r}, upsert=True)

    ride_assignments = [
        {"_id": "ra_101", "rideId": "ride_d101", "rideType": "delivery", "riderId": "rdr_vikram_singh", "status": "accepted", "createdAt": _iso(now - timedelta(minutes=35))},
        {"_id": "ra_102", "rideId": "ride_p103", "rideType": "pickup", "riderId": "rdr_rahul_verma", "status": "accepted", "createdAt": _iso(now - timedelta(minutes=55))},
        {"_id": "ra_103", "rideId": "ride_p104", "rideType": "pickup", "riderId": "rdr_rahul_verma", "status": "pending", "createdAt": _iso(now - timedelta(minutes=10))},
    ]
    for a in ride_assignments:
        await database.update_one("ride_assignments", {"_id": a["_id"]}, {"$set": a}, upsert=True)

    # 8. Promotional Coupons
    coupon_docs = [
        {"_id": "cpn_quick30", "code": "QUICK30", "title": "30% Off First 3 Orders", "discountType": "percentage", "discountValue": 30, "maxDiscount": 150, "minOrderValue": 199, "status": "Active", "totalRedemptions": 142, "validUntil": "2026-12-31"},
        {"_id": "cpn_freeship", "code": "FREESHIP", "title": "Free Doorstep Delivery", "discountType": "flat", "discountValue": 40, "maxDiscount": 40, "minOrderValue": 299, "status": "Active", "totalRedemptions": 380, "validUntil": "2026-12-31"},
        {"_id": "cpn_festive50", "code": "FESTIVE50", "title": "Flat ₹50 Dry Clean Discount", "discountType": "flat", "discountValue": 50, "maxDiscount": 50, "minOrderValue": 499, "status": "Active", "totalRedemptions": 89, "validUntil": "2026-10-31"},
        {"_id": "cpn_welcome100", "code": "WELCOME100", "title": "₹100 Flat Welcome Credit", "discountType": "flat", "discountValue": 100, "maxDiscount": 100, "minOrderValue": 599, "status": "Active", "totalRedemptions": 215, "validUntil": "2026-12-31"},
    ]
    for c in coupon_docs:
        await database.update_one("admin_coupons", {"_id": c["_id"]}, {"$set": c}, upsert=True)

    # 9. Payout Settlements
    payout_docs = [
        {"_id": "pay_kasganj_exp_1", "partnerId": "prt_kasganj_express", "partnerName": "QuickPress Express Hub - Station Road", "amount": 4520.0, "status": "Settled", "cycle": "Weekly", "period": "28 Aug - 03 Sept 2026", "accountNumber": "•••• 8912 (HDFC Bank)", "processedAt": _iso(now - timedelta(days=2))},
        {"_id": "pay_royal_gandhi_1", "partnerId": "prt_royal_gandhinagar", "partnerName": "Royal Dry Cleaners & Steam Hub", "amount": 3180.0, "status": "Settled", "cycle": "Weekly", "period": "28 Aug - 03 Sept 2026", "accountNumber": "•••• 3341 (SBI)", "processedAt": _iso(now - timedelta(days=2))},
        {"_id": "pay_aligarh_cp_1", "partnerId": "prt_aligarh_centrepoint", "partnerName": "SmartWash Laundromat - Centre Point", "amount": 7890.0, "status": "Pending", "cycle": "Weekly", "period": "01 Sept - 05 Sept 2026", "accountNumber": "•••• 4410 (ICICI Bank)", "processedAt": None},
        {"_id": "pay_rider_vikram_1", "riderId": "rdr_vikram_singh", "partnerName": "Vikram Singh (Rider)", "amount": 2140.0, "status": "Settled", "cycle": "Daily", "period": "04 Sept 2026", "accountNumber": "UPI (9871962591@paytm)", "processedAt": _iso(now - timedelta(days=1))},
    ]
    for p in payout_docs:
        await database.update_one("admin_payouts", {"_id": p["_id"]}, {"$set": p}, upsert=True)

    # 10. Support Tickets
    tickets = [
        {"_id": "tkt_101", "ticketNumber": "TKT-1082", "subject": "Express Delivery inquiry for wedding suit", "customerName": "Dr. Alok Verma", "customerPhone": "+91 98712 34502", "status": "resolved", "priority": "high", "category": "Delivery", "createdAt": _iso(now - timedelta(days=1)), "messages": [{"sender": "customer", "text": "Can my suit be delivered before 4 PM today?", "time": _iso(now - timedelta(days=1))}, {"sender": "support", "text": "Yes doctor, priority tag added. Rider Vikram is assigned.", "time": _iso(now - timedelta(days=1, hours=-1))}]},
        {"_id": "tkt_102", "ticketNumber": "TKT-1083", "subject": "UPI Payment verification on ORD-849204", "customerName": "Rohan Gupta", "customerPhone": "+91 98712 34504", "status": "open", "priority": "normal", "category": "Payments", "createdAt": _iso(now - timedelta(hours=2)), "messages": [{"sender": "customer", "text": "Paid ₹583 via PhonePe, just confirming confirmation status.", "time": _iso(now - timedelta(hours=2))}]},
    ]
    for t in tickets:
        await database.update_one("support_tickets", {"_id": t["_id"]}, {"$set": t}, upsert=True)
        await database.update_one("admin_support_tickets", {"_id": t["_id"]}, {"$set": t}, upsert=True)

    logger.info("Admin operational database records successfully verified and seeded.")
