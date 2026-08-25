"""Public-facing informational and legal endpoints for QuickPress Website.

No authentication required. Read-only and public contact form submission.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.db.catalog_repositories import catalog
from app.db.client import database
from app.db.cms_repositories import cms_repo
from app.db.membership_repositories import membership_repository

router = APIRouter(prefix="/public", tags=["public-website"])


class ContactFormPayload(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=r"^[^@]+@[^@]+\.[^@]+$")
    phone: str = Field(..., min_length=10, max_length=15)
    subject: str = Field(..., min_length=3, max_length=150)
    message: str = Field(..., min_length=10, max_length=2000)


# =========================================================================
#  1. Public Legal Policies (Live CMS-backed)
# =========================================================================

@router.get("/legal/{doc_slug}")
async def get_public_legal_doc(doc_slug: str) -> Dict[str, Any]:
    doc = await cms_repo.get_legal_doc(doc_slug)
    if not doc:
        # Fallback if slug without suffix
        if not doc_slug.endswith("-policy") and doc_slug in ("privacy", "refund"):
            doc = await cms_repo.get_legal_doc(f"{doc_slug}-policy")
    if not doc:
        raise HTTPException(status_code=404, detail="Legal document not found or unpublished.")
    return {
        "slug": doc.get("slug"),
        "title": doc.get("title"),
        "currentVersion": doc.get("currentVersion", "1.0"),
        "effectiveDate": doc.get("effectiveDate", "2026-08-25"),
        "summary": doc.get("summary", ""),
        "content": doc.get("content", ""),
        "publishedAt": doc.get("publishedAt"),
    }


# =========================================================================
#  2. Public Services Catalog
# =========================================================================

@router.get("/services")
async def get_public_services() -> List[Dict[str, Any]]:
    """Return all active master services for the public website without internal pricing."""
    services = await catalog.services()
    results = []
    for s in services:
        turnaround = getattr(s, "processingTime", None) or getattr(s, "turnaround", "24-48 hours")
        results.append({
            "id": s.id,
            "slug": s.id,
            "name": s.name or getattr(s, "title", "Service"),
            "description": s.description or f"Professional {s.name} with door-to-door pickup & delivery.",
            "tagline": getattr(s, "tagline", "Expert care for your garments"),
            "icon": getattr(s, "icon", "sparkles"),
            "imageUrl": getattr(s, "image", None) or getattr(s, "imageUrl", ""),
            "turnaround": turnaround,
            "popular": getattr(s, "popular", False),
            "unit": getattr(s, "unit", "Item / Kg"),
            "features": [
                "Doorstep pickup & drop-off",
                "Color-separated washing",
                "Fabric-safe gentle detergent",
                "Crisp steam finish & safe packaging"
            ]
        })
    return results


@router.get("/services/{slug}")
async def get_public_service_detail(slug: str) -> Dict[str, Any]:
    """Return comprehensive public service details including process, fabric care, and FAQs."""
    services = await catalog.services()
    match = next((s for s in services if s.id == slug), None)
    if not match:
        raise HTTPException(status_code=404, detail="Service not found.")

    turnaround = getattr(match, "processingTime", None) or getattr(match, "turnaround", "24-48 hours")

    # Get editorial care instructions and FAQs if available
    content_doc = await database.find_one("service_content", {"_id": slug})

    care_instructions = content_doc.get("careInstructions") if content_doc else [
        "Whites and colours are washed in separate loads",
        "Temperature is carefully regulated per fabric care label",
        "Delicates and silks are hand-finished",
        "Stains are pre-treated before main washing cycles",
        "Garments are steam ironed and packed in breathable covers"
    ]

    faqs = content_doc.get("faq") if content_doc else [
        {"question": "How is the order verified?", "answer": "Garments are inspected and counted at pickup on a calibrated scale."},
        {"question": "What is the turnaround time?", "answer": f"Standard turnaround is {turnaround}. Express service is also available."},
        {"question": "Is pickup and delivery included?", "answer": "Yes, QuickPress riders handle pickup from and delivery back to your doorstep."}
    ]

    return {
        "id": match.id,
        "slug": match.id,
        "name": match.name or getattr(match, "title", "Service"),
        "description": match.description,
        "tagline": getattr(match, "tagline", "Expert care for your garments"),
        "icon": getattr(match, "icon", "sparkles"),
        "imageUrl": getattr(match, "image", None) or getattr(match, "imageUrl", ""),
        "turnaround": turnaround,
        "popular": getattr(match, "popular", False),
        "careInstructions": care_instructions,
        "faqs": faqs,
        "suitableItems": [
            "Shirts & T-shirts", "Trousers & Jeans", "Kurtas & Sarees",
            "Bed sheets & Linen", "Suits & Blazers", "Delicates & Woolens"
        ],
        "workflow": [
            {"step": "01", "title": "Doorstep Pickup", "desc": "Delivery rider collects your garments at your chosen slot."},
            {"step": "02", "title": "Inspection & Sorting", "desc": "Pre-treatment check for fabric type, color, and stains."},
            {"step": "03", "title": "Professional Care", "desc": "Washed, dry cleaned, or steam-pressed per garment specifications."},
            {"step": "04", "title": "Safe Delivery", "desc": "Freshly packed and delivered back to your home."}
        ]
    }


# =========================================================================
#  3. Public Cities & Service Coverage
# =========================================================================

@router.get("/cities")
async def get_public_cities() -> List[Dict[str, Any]]:
    """Return active published operating cities."""
    cities_docs = await database.find_many("admin_cities", {"status": "active"})
    if not cities_docs:
        cities_docs = await database.find_many("cities", {"status": "active"})
    if not cities_docs:
        # Verified baseline
        cities_docs = [{"_id": "kasganj", "name": "Kasganj", "state": "Uttar Pradesh", "status": "active", "hubsCount": 3}]
    
    return [
        {
            "id": c.get("_id"),
            "slug": c.get("slug") or c.get("_id", "").lower(),
            "name": c.get("name"),
            "state": c.get("state") or "Uttar Pradesh",
            "status": "active",
            "tagline": f"Doorstep laundry & dry cleaning across {c.get('name')}",
            "availableServices": [
                "Wash & Fold", "Dry Cleaning", "Steam Iron", "Shoe Care", "Express 24H"
            ]
        }
        for c in cities_docs
    ]


@router.get("/cities/{slug}")
async def get_public_city_detail(slug: str) -> Dict[str, Any]:
    cities = await get_public_cities()
    match = next((c for c in cities if c["slug"] == slug or c["id"] == slug), None)
    if not match:
        raise HTTPException(status_code=404, detail="Service city not found or currently inactive.")
    return {
        **match,
        "description": f"QuickPress operates reliable door-to-door laundry and dry cleaning services across {match['name']}. Connect with top neighbourhood laundries and enjoy fast doorstep pickup and delivery.",
        "operatingHours": "7 Days a week · 8:00 AM – 8:00 PM",
        "turnaround": "Standard: 24-48 Hours | Express: Same Day / Next Morning"
    }


# =========================================================================
#  4. Public VIP Membership Information
# =========================================================================

@router.get("/membership")
async def get_public_membership() -> Dict[str, Any]:
    """Return public VIP club highlights without exposing internal financial formulas."""
    plan_docs = await membership_repository._plan_documents()
    public_plans = []
    for p in plan_docs:
        public_plans.append({
            "id": str(p.get("_id")),
            "name": str(p.get("name")),
            "tagline": str(p.get("tagline") or "VIP Club Experience"),
            "monthlyPrice": int(p.get("monthly_price") or 0),
            "yearlyPrice": int(p.get("yearly_price") or 0),
            "validityDays": int(p.get("validity_days") or 30),
            "popular": bool(p.get("popular")),
            "badge": str(p.get("badge") or ""),
            "benefits": [
                "Unlimited Zero-Fee Delivery" if p.get("free_pickup") or int(p.get("monthly_price") or 0) > 0 else "Standard Delivery",
                "Priority Express Processing" if p.get("priority_processing") else "Standard Turnaround",
                f"{p.get('discount_percent', 0)}% Exclusive Member Savings" if int(p.get("discount_percent") or 0) > 0 else "Standard Rates",
                f"{p.get('support_tier', 'Standard')} Customer Support Line",
                "Complimentary Garment Protection Coverage"
            ]
        })
    return {
        "title": "QuickPress VIP Club",
        "tagline": "Elevate your laundry experience with exclusive privileges and zero delivery fees.",
        "plans": public_plans,
        "features": [
            {"title": "Free Delivery Always", "desc": "Never pay standard delivery or surge fees on eligible orders."},
            {"title": "Priority Processing", "desc": "Your garments skip the queue and get processed first."},
            {"title": "Exclusive Discounts", "desc": "Special promotional rates and member-only coupons."},
            {"title": "Priority Support", "desc": "Dedicated assistance on WhatsApp and phone lines."}
        ]
    }


# =========================================================================
#  5. Public FAQs
# =========================================================================

@router.get("/faqs")
async def get_public_faqs(category: Optional[str] = Query(None)) -> List[Dict[str, Any]]:
    return await cms_repo.get_published_faqs(category)


# =========================================================================
#  6. Public Brand & Contact Settings
# =========================================================================

@router.get("/settings")
async def get_public_website_settings() -> Dict[str, Any]:
    return await cms_repo.get_website_settings()


# =========================================================================
#  7. Public Inbound Contact Form
# =========================================================================

@router.post("/contact")
async def submit_public_contact(payload: ContactFormPayload) -> Dict[str, Any]:
    # Basic phone format check
    clean_phone = re.sub(r"[^\d+]", "", payload.phone)
    if len(clean_phone) < 10:
        raise HTTPException(status_code=422, detail="Please enter a valid 10-digit Indian phone number.")

    return await cms_repo.save_contact_message(
        name=payload.name,
        email=payload.email,
        phone=clean_phone,
        subject=payload.subject,
        message=payload.message
    )
