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

OFFERS: List[Dict[str, Any]] = [
    {"_id": "o1", "code": "CASH50", "title": "₹50 Cashback", "description": "On orders above ₹499 paid via wallet", "kind": "cashback", "discountLabel": "₹50 back", "expiresAt": None, "banner": None},
    {"_id": "o2", "code": "FEST25", "title": "25% Festive OFF", "description": "Flat 25% off on dry cleaning this week", "kind": "festival", "discountLabel": "25% OFF", "expiresAt": None, "banner": None},
    {"_id": "o3", "code": "REFER100", "title": "Refer & Earn ₹100", "description": "Both you and your friend get ₹100 credit", "kind": "referral", "discountLabel": "₹100", "expiresAt": None, "banner": None},
]

SEED: Dict[str, List[Dict[str, Any]]] = {
    "banners": BANNERS,
    "categories": CATEGORIES,
    "services": SERVICES,
    "offers": OFFERS,
}
