"""Catalog seed documents for the Customer Home screen.

Loaded into MongoDB on first startup (idempotent). The same documents back the
in-memory store when Atlas is unavailable, so `/api/home` always answers.
"""

from __future__ import annotations

from typing import Any, Dict, List

BANNERS: List[Dict[str, Any]] = [
    {
        "_id": "b1",
        "eyebrow": "Limited period",
        "title": "30% OFF",
        "subtitle": "On your first three laundry pickups",
        "cta": "Claim offer",
        "tone": "primary",
        "redirectUrl": "/offers",
        "priority": 1,
    },
    {
        "_id": "b2",
        "eyebrow": "Free pickup",
        "title": "Doorstep pickup",
        "subtitle": "Zero pickup charges on every order above ₹299",
        "cta": "Book now",
        "tone": "green",
        "redirectUrl": "/services",
        "priority": 2,
    },
    {
        "_id": "b3",
        "eyebrow": "Premium care",
        "title": "Hand finished",
        "subtitle": "Fabric-safe cleaning with a 3-step quality check",
        "cta": "Explore",
        "tone": "dark",
        "redirectUrl": "/services",
        "priority": 3,
    },
]

CATEGORIES: List[Dict[str, Any]] = [
    {"_id": "c1", "title": "Wash & Fold", "description": "Everyday laundry", "icon": "washing-machine", "image": "/images/services/wash-fold.jpg", "sortOrder": 1},
    {"_id": "c2", "title": "Dry Cleaning", "description": "Delicate fabrics", "icon": "shirt", "image": "/images/services/dry-cleaning.jpg", "sortOrder": 2},
    {"_id": "c3", "title": "Steam Iron", "description": "Crisp finish", "icon": "flame", "image": "/images/services/steam-iron.jpg", "sortOrder": 3},
    {"_id": "c4", "title": "Premium Laundry", "description": "Hand finished", "icon": "sparkles", "image": "/images/services/premium-laundry.jpg", "sortOrder": 4},
    {"_id": "c5", "title": "Shoe Cleaning", "description": "Deep restore", "icon": "footprints", "image": "/images/services/shoe-cleaning.jpg", "sortOrder": 5},
    {"_id": "c6", "title": "Curtain Cleaning", "description": "Home fabrics", "icon": "blinds", "image": "/images/services/curtain-cleaning.jpg", "sortOrder": 6},
    {"_id": "c7", "title": "Blanket Cleaning", "description": "Bulky care", "icon": "bed-double", "image": "/images/services/blanket-cleaning.jpg", "sortOrder": 7},
    {"_id": "c8", "title": "Carpet Cleaning", "description": "Fibre deep wash", "icon": "layout-grid", "image": "/images/services/carpet-cleaning.jpg", "sortOrder": 8},
    {"_id": "c9", "title": "Express Laundry", "description": "Same day back", "icon": "zap", "image": "/images/services/express-laundry.jpg", "sortOrder": 9},
]

SERVICES: List[Dict[str, Any]] = [
    {"_id": "s1", "name": "Wash & Iron", "categoryId": "c1", "unit": "per kg", "price": 79, "image": "/images/services/wash-fold.jpg", "description": "Everyday laundry washed, dried and neatly folded.", "badge": "Trending", "popular": True, "discountPercent": 20, "processingTime": "24 hrs"},
    {"_id": "s2", "name": "Shirt Dry Clean", "categoryId": "c2", "unit": "per piece", "price": 99, "image": "/images/services/dry-cleaning.jpg", "description": "Solvent care for shirts and delicate fabrics.", "badge": "Best Seller", "popular": True, "discountPercent": 15, "processingTime": "36 hrs"},
    {"_id": "s3", "name": "Saree Care", "categoryId": "c4", "unit": "per piece", "price": 249, "image": "/images/services/premium-laundry.jpg", "description": "Hand finished care for fine sarees.", "badge": None, "popular": True, "discountPercent": 10, "processingTime": "48 hrs"},
    {"_id": "s4", "name": "Sneaker Spa", "categoryId": "c5", "unit": "per pair", "price": 299, "image": "/images/services/shoe-cleaning.jpg", "description": "Deep restore for sneakers, leather and suede.", "badge": "Trending", "popular": True, "discountPercent": 25, "processingTime": "48 hrs"},
    {"_id": "s5", "name": "Blanket Wash", "categoryId": "c7", "unit": "per piece", "price": 349, "image": "/images/services/blanket-cleaning.jpg", "description": "Bulky quilts and blankets washed and sun dried.", "badge": None, "popular": True, "discountPercent": 0, "processingTime": "48 hrs"},
    {"_id": "s6", "name": "Curtain Cleaning", "categoryId": "c6", "unit": "per panel", "price": 229, "image": "/images/services/curtain-cleaning.jpg", "description": "Dust free home fabrics with shrink safe washing.", "badge": None, "popular": False, "discountPercent": 10, "processingTime": "36 hrs"},
    {"_id": "s7", "name": "Carpet Shampoo", "categoryId": "c8", "unit": "per carpet", "price": 449, "image": "/images/services/carpet-cleaning.jpg", "description": "Fibre deep shampoo wash with odour removal.", "badge": None, "popular": False, "discountPercent": 0, "processingTime": "48 hrs"},
    {"_id": "s8", "name": "Express Laundry", "categoryId": "c9", "unit": "per kg", "price": 129, "image": "/images/services/express-laundry.jpg", "description": "Same day turnaround for urgent wardrobe rescues.", "badge": None, "popular": False, "discountPercent": 0, "processingTime": "12 hrs"},
    {"_id": "s9", "name": "Steam Iron", "categoryId": "c3", "unit": "per piece", "price": 15, "image": "/images/services/steam-iron.jpg", "description": "Crisp, wrinkle free finish with industrial steam presses.", "badge": None, "popular": False, "discountPercent": 0, "processingTime": "12 hrs"},
]

PARTNERS: List[Dict[str, Any]] = [
    {
        "_id": "prt-2001",
        "name": "Sparkle Laundry Works",
        "city": "Bengaluru",
        "area": "Indiranagar",
        "rating": 4.7,
        "reviewsCount": 1284,
        "distanceKm": 1.2,
        "pickupMinutes": 25,
        "deliveryTime": "24 hrs",
        "isOpen": True,
        "minPrice": 15,
        "minOrderValue": 149,
        "services": ["Wash & Fold", "Steam Iron", "Dry Clean"],
        # --- Sprint 2.2 partner details -----------------------------------
        "image": "store-1",
        "cover": "store-1",
        "logo": "store-2",
        "verified": True,
        "popularity": 980,
        "joinedDaysAgo": 420,
        "ownerName": "Rohit Sharma",
        "phone": "+91 98450 21178",
        "tagline": "Hospital grade hygiene with hand finished care, since 2011",
        "about": (
            "A neighbourhood favourite since 2011, Sparkle Laundry Works blends hospital grade "
            "hygiene with hand finished care. Every order is sorted by fabric, washed with pH "
            "balanced detergents and steam pressed before premium packaging."
        ),
        "address": "No. 42, 100 Feet Road, Indiranagar, Bengaluru 560038",
        "latitude": 12.9719,
        "longitude": 77.6412,
        "deliveryRadiusKm": 6,
        "yearsInBusiness": 14,
        "offerLabel": "20% OFF up to ₹100",
        "openingHours": [
            {"day": "Mon – Fri", "hours": "7:00 AM – 10:00 PM"},
            {"day": "Saturday", "hours": "7:00 AM – 10:30 PM"},
            {"day": "Sunday", "hours": "8:00 AM – 9:00 PM"},
        ],
        "features": [
            {"id": "f1", "title": "Doorstep Pickup", "icon": "truck"},
            {"id": "f2", "title": "Same Day Delivery", "icon": "clock"},
            {"id": "f3", "title": "Express Laundry", "icon": "zap"},
            {"id": "f4", "title": "Eco Friendly Cleaning", "icon": "leaf"},
            {"id": "f5", "title": "Premium Packaging", "icon": "package"},
            {"id": "f6", "title": "Live Order Tracking", "icon": "map-pin"},
        ],
        "gallery": [
            {"id": "g1", "image": "store-1", "caption": "Store Front"},
            {"id": "g2", "image": "store-2", "caption": "Laundry Machines"},
            {"id": "g3", "image": "store-3", "caption": "Packing Area"},
            {"id": "g4", "image": "service-hero", "caption": "Cleaning Area"},
        ],
        "policies": [
            "Free pickup and delivery on orders above ₹199",
            "Garments inspected and photographed before processing",
            "Damage protection up to ₹2,000 per garment",
            "Reschedule a pickup free of cost up to 2 hours before the slot",
            "Refund or rewash if you are not satisfied within 24 hours of delivery",
        ],
        "serviceItems": [
            {"id": "wash-fold", "name": "Wash & Fold", "description": "Everyday laundry washed, dried and neatly folded", "image": "item-wash-fold", "price": 79, "discountPercent": 20, "unit": "per kg", "processingTime": "24 hrs", "available": True},
            {"id": "dry-cleaning", "name": "Dry Cleaning", "description": "Solvent care for suits, sarees and delicate fabrics", "image": "item-dry-clean", "price": 149, "discountPercent": 10, "unit": "per piece", "processingTime": "48 hrs", "available": True},
            {"id": "steam-iron", "name": "Steam Iron", "description": "Crisp, wrinkle free finish with industrial steam presses", "image": "item-steam-iron", "price": 15, "discountPercent": 0, "unit": "per piece", "processingTime": "12 hrs", "available": True},
            {"id": "premium-laundry", "name": "Premium Laundry", "description": "Hand finished care with fabric conditioner and folding", "image": "item-premium", "price": 199, "discountPercent": 15, "unit": "per kg", "processingTime": "36 hrs", "available": True},
            {"id": "express-laundry", "name": "Express Laundry", "description": "Same day turnaround for urgent wardrobe rescues", "image": "item-express", "price": 129, "discountPercent": 0, "unit": "per kg", "processingTime": "8 hrs", "available": True},
            {"id": "shoe-cleaning", "name": "Shoe Cleaning", "description": "Deep restore for sneakers, leather and suede", "image": "item-shoes", "price": 299, "discountPercent": 25, "unit": "per pair", "processingTime": "72 hrs", "available": True},
            {"id": "blanket-cleaning", "name": "Blanket Cleaning", "description": "Bulky quilts and blankets washed and sun dried", "image": "item-blanket", "price": 349, "discountPercent": 0, "unit": "per piece", "processingTime": "48 hrs", "available": True},
            {"id": "curtain-cleaning", "name": "Curtain Cleaning", "description": "Dust free home fabrics with shrink safe washing", "image": "item-curtain", "price": 229, "discountPercent": 10, "unit": "per panel", "processingTime": "48 hrs", "available": False},
            {"id": "carpet-cleaning", "name": "Carpet Cleaning", "description": "Fibre deep shampoo wash with odour removal", "image": "item-carpet", "price": 449, "discountPercent": 0, "unit": "per carpet", "processingTime": "72 hrs", "available": True},
        ],
    },
    {
        "_id": "prt-2002",
        "name": "FreshFold Dry Clean",
        "city": "Bengaluru",
        "area": "Koramangala",
        "rating": 4.5,
        "reviewsCount": 942,
        "distanceKm": 2.1,
        "pickupMinutes": 30,
        "deliveryTime": "36 hrs",
        "isOpen": True,
        "minPrice": 20,
        "minOrderValue": 199,
        "services": ["Dry Clean", "Premium Care", "Shoe Cleaning"],
        "image": "store-2",
        "cover": "store-2",
        "logo": "store-3",
        "verified": True,
        "popularity": 870,
        "joinedDaysAgo": 210,
        "ownerName": "Anita Desai",
        "phone": "+91 98867 44210",
        "tagline": "Boutique dry cleaning for suits, sarees and sneakers",
        "about": (
            "FreshFold Dry Clean specialises in delicate fabrics. Solvent based cleaning, "
            "hand finishing and garment-by-garment quality checks keep your wardrobe looking new."
        ),
        "address": "18, 6th Block, Koramangala, Bengaluru 560095",
        "latitude": 12.9345,
        "longitude": 77.6266,
        "deliveryRadiusKm": 5,
        "yearsInBusiness": 9,
        "offerLabel": "Flat ₹75 OFF above ₹499",
        "openingHours": [
            {"day": "Mon – Sat", "hours": "8:00 AM – 9:30 PM"},
            {"day": "Sunday", "hours": "9:00 AM – 6:00 PM"},
        ],
        "features": [
            {"id": "f1", "title": "Doorstep Pickup", "icon": "truck"},
            {"id": "f2", "title": "Premium Packaging", "icon": "package"},
            {"id": "f3", "title": "Eco Friendly Cleaning", "icon": "leaf"},
            {"id": "f4", "title": "Live Order Tracking", "icon": "map-pin"},
        ],
        "gallery": [
            {"id": "g1", "image": "store-2", "caption": "Store Front"},
            {"id": "g2", "image": "store-3", "caption": "Steam Press Line"},
            {"id": "g3", "image": "service-hero", "caption": "Sorting Desk"},
        ],
        "policies": [
            "Free pickup and delivery on orders above ₹299",
            "Damage protection up to ₹1,500 per garment",
            "Rewash free of cost within 24 hours of delivery",
        ],
        "serviceItems": [
            {"id": "dry-cleaning", "name": "Dry Cleaning", "description": "Solvent care for suits, sarees and delicate fabrics", "image": "item-dry-clean", "price": 159, "discountPercent": 15, "unit": "per piece", "processingTime": "48 hrs", "available": True},
            {"id": "premium-laundry", "name": "Premium Laundry", "description": "Hand finished care with fabric conditioner", "image": "item-premium", "price": 209, "discountPercent": 10, "unit": "per kg", "processingTime": "36 hrs", "available": True},
            {"id": "shoe-cleaning", "name": "Shoe Cleaning", "description": "Deep restore for sneakers, leather and suede", "image": "item-shoes", "price": 279, "discountPercent": 20, "unit": "per pair", "processingTime": "72 hrs", "available": True},
            {"id": "steam-iron", "name": "Steam Iron", "description": "Crisp finish with industrial steam presses", "image": "item-steam-iron", "price": 20, "discountPercent": 0, "unit": "per piece", "processingTime": "12 hrs", "available": True},
            {"id": "wash-fold", "name": "Wash & Fold", "description": "Everyday laundry washed, dried and folded", "image": "item-wash-fold", "price": 89, "discountPercent": 0, "unit": "per kg", "processingTime": "24 hrs", "available": True},
        ],
    },
    {
        "_id": "prt-2003",
        "name": "UrbanPress Laundry",
        "city": "Bengaluru",
        "area": "HSR Layout",
        "rating": 4.8,
        "reviewsCount": 1633,
        "distanceKm": 3.4,
        "pickupMinutes": 20,
        "deliveryTime": "24 hrs",
        "isOpen": False,
        "minPrice": 18,
        "minOrderValue": 174,
        "services": ["Wash & Fold", "Express Laundry", "Curtain Cleaning"],
        "image": "store-3",
        "cover": "store-3",
        "logo": "store-1",
        "verified": False,
        "popularity": 1120,
        "joinedDaysAgo": 45,
        "ownerName": "Imran Qureshi",
        "phone": "+91 90350 88117",
        "tagline": "Express laundry with same day turnaround across HSR",
        "about": (
            "UrbanPress Laundry runs the fastest turnaround in HSR Layout — a fully automated "
            "line with 8 hour express slots and free re-delivery on missed handovers."
        ),
        "address": "221, 27th Main, Sector 2, HSR Layout, Bengaluru 560102",
        "latitude": 12.9121,
        "longitude": 77.6446,
        "deliveryRadiusKm": 8,
        "yearsInBusiness": 4,
        "offerLabel": None,
        "openingHours": [
            {"day": "Mon – Sun", "hours": "6:30 AM – 11:00 PM"},
        ],
        "features": [
            {"id": "f1", "title": "Express Laundry", "icon": "zap"},
            {"id": "f2", "title": "Doorstep Pickup", "icon": "truck"},
            {"id": "f3", "title": "Same Day Delivery", "icon": "clock"},
        ],
        "gallery": [
            {"id": "g1", "image": "store-3", "caption": "Store Front"},
            {"id": "g2", "image": "store-1", "caption": "Wash Floor"},
        ],
        "policies": [
            "Express orders delivered within 8 hours",
            "Free re-delivery on missed handovers",
        ],
        "serviceItems": [
            {"id": "express-laundry", "name": "Express Laundry", "description": "Same day turnaround for urgent wardrobe rescues", "image": "item-express", "price": 139, "discountPercent": 10, "unit": "per kg", "processingTime": "8 hrs", "available": True},
            {"id": "wash-fold", "name": "Wash & Fold", "description": "Everyday laundry washed, dried and folded", "image": "item-wash-fold", "price": 75, "discountPercent": 0, "unit": "per kg", "processingTime": "24 hrs", "available": True},
            {"id": "curtain-cleaning", "name": "Curtain Cleaning", "description": "Dust free home fabrics with shrink safe washing", "image": "item-curtain", "price": 219, "discountPercent": 0, "unit": "per panel", "processingTime": "48 hrs", "available": True},
            {"id": "blanket-cleaning", "name": "Blanket Cleaning", "description": "Bulky quilts and blankets washed and sun dried", "image": "item-blanket", "price": 329, "discountPercent": 5, "unit": "per piece", "processingTime": "48 hrs", "available": True},
        ],
    },
]

PARTNER_REVIEWS: List[Dict[str, Any]] = [
    {"_id": "rv-1", "partnerId": "prt-2001", "name": "Ananya Iyer", "initials": "AI", "photo": "store-3", "rating": 5, "text": "Picked up at 8 PM and delivered next morning, perfectly folded. The packaging genuinely feels premium.", "date": "2 days ago", "images": ["item-wash-fold", "item-premium"]},
    {"_id": "rv-2", "partnerId": "prt-2001", "name": "Vikram Mehta", "initials": "VM", "photo": "store-2", "rating": 4, "text": "Dry cleaned two blazers, both came back spotless. Slight delay in pickup but the team called ahead.", "date": "1 week ago", "images": []},
    {"_id": "rv-3", "partnerId": "prt-2001", "name": "Sneha Kapoor", "initials": "SK", "photo": "store-1", "rating": 5, "text": "The sneaker cleaning is worth every rupee. My whites look brand new again.", "date": "3 weeks ago", "images": ["item-shoes"]},
    {"_id": "rv-4", "partnerId": "prt-2001", "name": "Rahul Nair", "initials": "RN", "photo": "store-2", "rating": 4, "text": "Consistent quality across five orders now. Steam ironing is crisp.", "date": "1 month ago", "images": []},
    {"_id": "rv-5", "partnerId": "prt-2002", "name": "Meera Joshi", "initials": "MJ", "photo": "store-1", "rating": 5, "text": "My silk saree came back flawless. They clearly know delicate fabrics.", "date": "4 days ago", "images": ["item-dry-clean"]},
    {"_id": "rv-6", "partnerId": "prt-2002", "name": "Arjun Rao", "initials": "AR", "photo": "store-3", "rating": 4, "text": "Good dry cleaning, pickup window could be tighter.", "date": "2 weeks ago", "images": []},
    {"_id": "rv-7", "partnerId": "prt-2002", "name": "Divya Menon", "initials": "DM", "photo": "store-2", "rating": 5, "text": "Sneaker spa result was fantastic and the packaging was neat.", "date": "1 month ago", "images": []},
    {"_id": "rv-8", "partnerId": "prt-2003", "name": "Karthik S", "initials": "KS", "photo": "store-1", "rating": 5, "text": "8 hour express actually delivered in 7. Lifesaver before a trip.", "date": "1 day ago", "images": ["item-express"]},
    {"_id": "rv-9", "partnerId": "prt-2003", "name": "Pooja Bhat", "initials": "PB", "photo": "store-3", "rating": 4, "text": "Great speed and fair pricing. Wish they opened earlier on Sundays.", "date": "5 days ago", "images": []},
    {"_id": "rv-10", "partnerId": "prt-2003", "name": "Nikhil Verma", "initials": "NV", "photo": "store-2", "rating": 5, "text": "Curtains came back like new without any shrinkage.", "date": "3 weeks ago", "images": []},
]

OFFERS: List[Dict[str, Any]] = [
    {"_id": "o1", "code": "CASH50", "title": "₹50 Cashback", "description": "On orders above ₹499 paid via wallet", "kind": "cashback", "discountLabel": "₹50 back", "expiresAt": None, "banner": None},
    {"_id": "o2", "code": "FEST25", "title": "25% Festive OFF", "description": "Flat 25% off on dry cleaning this week", "kind": "festival", "discountLabel": "25% OFF", "expiresAt": None, "banner": None},
    {"_id": "o3", "code": "REFER100", "title": "Refer & Earn ₹100", "description": "Both you and your friend get ₹100 credit", "kind": "referral", "discountLabel": "₹100", "expiresAt": None, "banner": None},
]

SEED: Dict[str, List[Dict[str, Any]]] = {
    "banners": BANNERS,
    "categories": CATEGORIES,
    "services": SERVICES,
    "catalog_partners": PARTNERS,
    "partner_reviews": PARTNER_REVIEWS,
    "offers": OFFERS,
}
