"""CMS repositories and seeds for QuickPress Public Information Website.

Handles:
- website_legal_docs (Version controlled Privacy Policy, Terms & Conditions, Refund Policy)
- website_faqs (Categorized FAQs)
- website_contact_messages (Inbound contact inquiries)
- website_settings (Public brand metadata, contact info, SEO)
- website_pages (Public page content and editorial highlights)
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.db.client import database

logger = logging.getLogger(__name__)


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# =========================================================================
#  Initial Verified Legal Documents Seed (Version 1.0)
# =========================================================================

LEGAL_DOCS_SEED: Dict[str, Dict[str, Any]] = {
    "privacy-policy": {
        "_id": "privacy-policy",
        "title": "Privacy Policy",
        "slug": "privacy-policy",
        "currentVersion": "1.0",
        "effectiveDate": "2026-08-25",
        "status": "published",
        "publishedAt": "2026-08-25T00:00:00Z",
        "publishedBy": "QuickPress Legal Desk",
        "summary": "This Privacy Policy explains how QuickPress collects, uses, processes, and protects your personal data across our customer application, partner platform, rider app, and public website.",
        "content": """# QuickPress Privacy Policy

**Effective Date:** 25 August 2026  
**Last Updated:** 25 August 2026  
**Version:** 1.0  

QuickPress ("we", "us", "our", or "Company") is committed to protecting your privacy. This Privacy Policy describes how we collect, use, store, share, and protect your personal information when you use our website [https://www.quickpress.online](https://www.quickpress.online), our mobile applications (Customer, Partner, Rider), and our door-to-door laundry & dry cleaning platform services.

---

## 1. Information We Collect

We only collect information necessary to provide, optimize, and fulfill our laundry, dry cleaning, pickup, and delivery services:

### A. Information You Provide to Us
- **Account Identification:** Mobile phone number (used for secure OTP authentication), full name, and email address.
- **Address & Location:** Delivery addresses, home/office tags, landmark information, and GPS coordinates provided during order booking for pickup & doorstep drop-off.
- **Order Details:** Selected garments, laundry service choices, fabric preferences, special wash instructions, and pickup/delivery time slots.
- **Communications:** Messages sent via our support desk, contact forms, feedback surveys, or customer service tickets.

### B. Information Automatically Collected
- **Device & Connection:** Device type, operating system version, browser type, IP address, and network state to ensure secure session management.
- **Order & Payment Verification:** Transaction reference IDs, payment method kind (UPI, Card, NetBanking, QuickPress Wallet), and payment status returned by our secure payment gateway partner (Razorpay). *Note: QuickPress does NOT store your credit/debit card numbers, CVVs, or bank netbanking passwords.*
- **Logistics Tracking:** Real-time rider location coordinates during active order pickup and delivery journeys to show accurate live tracking on your app.

---

## 2. How We Use Your Information

We use the collected information strictly for legitimate operational purposes:
- To facilitate order placement, partner store garment processing, and rider pickup/delivery logistics.
- To authenticate your account securely via Firebase Phone OTP verification.
- To send transactional notifications (order confirmation, laundry stage updates, rider arrival, invoices).
- To process refunds, wallet balance credits, and member cashback allowances.
- To prevent fraud, double-payment errors, and unauthorized access to platform services.
- To comply with applicable statutory laws, tax regulations, and GST invoicing requirements in India.

---

## 3. Data Sharing & Third-Party Service Providers

QuickPress does NOT sell, rent, or trade your personal data to third parties for marketing purposes. We share data only with verified ecosystem partners strictly for service fulfillment:
- **Local Laundry Partners:** Garment lists, customer name, and order instructions so your clothes can be processed according to fabric care standards.
- **Delivery Fleet (Riders):** Customer delivery address, phone number (masked where applicable), and live delivery notes for accurate pickup/drop-off.
- **Payment Gateways:** Razorpay for secure end-to-end encrypted payment processing under RBI guidelines.
- **Cloud Infrastructure & Authentication:** Google Cloud / Firebase for secure OTP generation and data hosting.
- **Legal Authorities:** Only when mandated by Indian law, judicial orders, or governmental law enforcement agencies.

---

## 4. Data Security & Storage

- All data transmitted between your device, our apps, and our servers is encrypted using industry-standard TLS/HTTPS protocols.
- Access to sensitive operational records is restricted to authorized personnel with strict Role-Based Access Control (RBAC) and audit logging.
- Customer payment secrets and biometric data are never captured or saved on QuickPress systems.

---

## 5. Your Rights & Account Deletion

You maintain complete control over your personal information:
- **Access & Edit:** You can view and update your profile information, saved addresses, and preferences directly in the QuickPress Customer App.
- **Data Portability & Inquiries:** You may request a copy of your transaction history or order records.
- **Account Deletion:** You have the right to request permanent deletion of your account and associated profile data by contacting `support@quickpress.in` or using the In-App Account Settings > Delete Account option. Upon request, non-essential data is removed within 30 days, subject to mandatory tax & financial record retention laws.

---

## 6. Updates to This Policy

We may update this Privacy Policy periodically to reflect technological, operational, or legal changes. All revisions are version-tracked and published live through our Admin CMS without requiring an app reinstall. The effective date at the top will indicate when the latest version came into effect.

---

## 7. Contacting QuickPress Legal & Privacy Desk

If you have any questions, concerns, or requests regarding this Privacy Policy or our data handling practices, please reach out to us:

* **Official Email:** [support@quickpress.in](mailto:support@quickpress.in)
* **Helpline:** 1800 012 3456 / +91 90000 90000 (Mon–Sun, 8:00 AM – 9:00 PM IST)
* **Operating Address:** QuickPress Laundry Technologies, Kasganj, Uttar Pradesh 207123, India
""",
        "versions": [
            {
                "version": "1.0",
                "status": "published",
                "publishedAt": "2026-08-25T00:00:00Z",
                "publishedBy": "QuickPress Legal Desk",
                "changeLog": "Initial verified production baseline for QuickPress Platform.",
                "content": "..."  # matches content above
            }
        ]
    },
    "terms": {
        "_id": "terms",
        "title": "Terms & Conditions",
        "slug": "terms",
        "currentVersion": "1.0",
        "effectiveDate": "2026-08-25",
        "status": "published",
        "publishedAt": "2026-08-25T00:00:00Z",
        "publishedBy": "QuickPress Legal Desk",
        "summary": "These Terms and Conditions govern your access to and use of QuickPress consumer applications, partner services, pickup/delivery network, and online platform.",
        "content": """# QuickPress Terms & Conditions

**Effective Date:** 25 August 2026  
**Last Updated:** 25 August 2026  
**Version:** 1.0  

Welcome to QuickPress! These Terms and Conditions ("Terms") constitute a legally binding agreement between you ("Customer", "User", "you") and QuickPress ("QuickPress", "we", "us", "our") regarding your use of the QuickPress website ([https://www.quickpress.online](https://www.quickpress.online)), mobile applications, and laundry logistics services.

By accessing our website, creating an account, or placing an order, you agree to be bound by these Terms.

---

## 1. Eligibility & Account Registration

- You must be at least 18 years of age or possess legal parental/guardian consent to create an account and place orders on QuickPress.
- You agree to provide accurate, complete, and updated information (phone number, name, delivery address) during registration.
- Authentication is conducted via One-Time Password (OTP) sent to your registered mobile number. You are solely responsible for maintaining the confidentiality of your OTP and device access.

---

## 2. Laundry & Dry Cleaning Services

- QuickPress operates as a technology-enabled laundry and dry cleaning network connecting customers with certified local laundry partner stores and trained logistics delivery riders.
- Available services include **Wash & Fold, Dry Cleaning, Steam Iron, Premium Laundry, Shoe Cleaning, Carpet Cleaning, Curtain Cleaning, Blanket Cleaning, and Express Laundry**.
- Pricing is calculated based on exact garment counts or calibrated scale weight recorded during pickup verification. The finalized summary is presented to the customer prior to wash processing.

---

## 3. Pickup, Verification & Delivery

- Pickups and deliveries are scheduled during designated time windows (Morning: 8 AM–12 PM, Afternoon: 12 PM–4 PM, Evening: 4 PM–8 PM).
- Customers must ensure that all pockets, bags, and garment compartments are cleared of cash, jewelry, cards, electronics, and personal valuables prior to handover. QuickPress is not liable for items left inside pockets.
- At the time of pickup, our delivery rider conducts a garment item count inspection. Any pre-existing tears, discoloration, missing buttons, or heavy fabric damage will be noted.

---

## 4. Payment Terms & QuickPress Wallet

- Orders may be paid via supported payment methods: **Online Payment (Razorpay UPI, Debit/Credit Cards, NetBanking), QuickPress Wallet, or Cash on Delivery (COD)**.
- QuickPress Wallet credits and cashback points may be used against eligible order totals in accordance with wallet terms.
- In the event of an online payment failure where money is deducted from your bank, the payment gateway will automatically reconcile and credit your account within standard banking cycles.

---

## 5. Garment Care, Liability & Damage Policy

- Certified partner laundries adhere to strict international fabric care instructions (separate white/colour sorting, temperature-controlled cycles, steam finishing).
- In the rare and unfortunate event of garment damage or loss directly attributable to processing negligence:
  - The customer must report the issue within **24 hours** of order delivery through the Help & Support screen with photographic evidence.
  - QuickPress liability is capped at up to **₹2,000 per garment** or 5x the service charge for that specific item (whichever is lower), credited directly to your QuickPress Wallet or original payment method after technical inspection.
  - Normal wear and tear, pre-existing fabric thinning, color fading due to age, shrinkage of unpreshrunk fabrics, or delicate embellishment detachments are excluded from compensation.

---

## 6. VIP Membership Club

- QuickPress VIP Membership offers eligible customers complimentary delivery, priority express turnaround, and exclusive service privileges.
- Memberships are non-transferable and valid for the duration specified at the time of purchase.

---

## 7. Cancellation & Refunds

- Order cancellations and refunds are strictly governed by our [Refund & Cancellation Policy](/refund-policy).
- Approved refunds are processed back to the original source within **5–7 working days** subject to bank timelines.

---

## 8. Intellectual Property & Acceptable Use

- All logos, trademarks, content, graphics, and software interfaces on QuickPress are the exclusive property of QuickPress.
- Users shall not attempt to reverse engineer, decompile, scrape, or disrupt the platform's digital infrastructure.

---

## 9. Governing Law & Jurisdiction

These Terms are governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in Uttar Pradesh, India.

---

## 10. Contact Us

For any clarifications regarding these Terms:
* **Email:** [support@quickpress.in](mailto:support@quickpress.in)
* **Helpline:** 1800 012 3456
* **Registered Address:** QuickPress Laundry Technologies, Kasganj, Uttar Pradesh 207123, India
""",
        "versions": [
            {
                "version": "1.0",
                "status": "published",
                "publishedAt": "2026-08-25T00:00:00Z",
                "publishedBy": "QuickPress Legal Desk",
                "changeLog": "Initial verified production baseline for QuickPress Platform.",
                "content": "..."
            }
        ]
    },
    "refund-policy": {
        "_id": "refund-policy",
        "title": "Refund & Cancellation Policy",
        "slug": "refund-policy",
        "currentVersion": "1.0",
        "effectiveDate": "2026-08-25",
        "status": "published",
        "publishedAt": "2026-08-25T00:00:00Z",
        "publishedBy": "QuickPress Legal Desk",
        "summary": "This policy transparently explains order cancellation rules at different stages, refund eligibility, and payment gateway banking turnaround times.",
        "content": """# QuickPress Refund & Cancellation Policy

**Effective Date:** 25 August 2026  
**Last Updated:** 25 August 2026  
**Version:** 1.0  

At QuickPress, customer satisfaction and fabric care transparency are our highest priorities. We understand that plans change, and we have designed a fair, transparent cancellation and refund policy.

---

## 1. Order Cancellation by Stage

Your ability to cancel an order and the applicable refund depend on the operational stage of your laundry order:

| Order Stage | Cancellation Window | Refund / Cancellation Fee |
| :--- | :--- | :--- |
| **1. Placed / Pending Acceptance** | Instant from App | **100% Full Refund** (No fee) |
| **2. Partner Accepted (Before Rider Dispatch)** | Up to 2 hours before pickup | **100% Full Refund** (No fee) |
| **3. Rider Out for Pickup** | Rider is en route to your doorstep | **Full Refund minus ₹30** Rider Dispatch Fee |
| **4. Garments Picked Up & In Transit** | Clothes collected by rider | Cancellation allowed; **₹50 Logistics Fee** applies |
| **5. Processing / Washing / Dry Cleaning** | Garments in wash/clean cycles | **Cancellation NOT permitted** (Processing underway) |
| **6. Ready / Out for Delivery** | Garments finished & packed | **Cancellation NOT permitted** |
| **7. Delivered** | Order delivered to customer | Eligible for Quality Review within 24 hours |

---

## 2. Refund Eligibility & Scenarios

You are eligible for a refund or wallet credit under the following circumstances:

### A. Pre-Processing Cancellation
If you cancel your order within the eligible pre-pickup windows outlined above, your payment will be refunded in full.

### B. Double Payment / Gateway Glitches
If your bank account was debited multiple times for a single order due to a network glitch, all duplicate debits are automatically reconciled and refunded.

### C. Service Unavailability
If a certified partner store or rider is unable to fulfill your order due to unforeseen operational constraints, you will receive an immediate 100% refund.

### D. Quality Complaints & Service Deficiencies
If you are unsatisfied with garment cleaning quality or if an item is missing/damaged:
1. Raise a ticket within **24 hours** of delivery via App Help & Support.
2. Our Quality Assurance team will review the pre-wash intake photographs and issue a complimentary re-wash, QuickPress Wallet credit, or monetary compensation as per terms.

---

## 3. Refund Timelines & Payment Gateway Processing

> [!IMPORTANT]
> **Approved refunds will generally be processed within 5–7 working days, subject to applicable payment gateway and banking timelines.**

- **QuickPress Wallet Refunds:** Instant (available in your wallet within 5 minutes of approval).
- **UPI (Google Pay, PhonePe, Paytm, BHIM):** 1–3 business days.
- **Debit / Credit Cards & NetBanking:** 5–7 business days depending on your issuing bank.

*Note: QuickPress initiates approved refund requests immediately with our gateway partner (Razorpay). Banking holidays and weekend settlement cycles may affect final credit appearance in your account statement.*

---

## 4. How to Request a Cancellation or Refund

1. **In-App Cancellation:** Open QuickPress App > Orders > Select Active Order > Tap **Cancel Order**.
2. **Help Desk Support:** Go to Profile > Help & Support > Select "Refund Status" or "Cancel Order".
3. **Email Inquiry:** Write to [support@quickpress.in](mailto:support@quickpress.in) with your Order ID and contact details.

---

## 5. Contact Information

* **Email:** [support@quickpress.in](mailto:support@quickpress.in)
* **Toll-Free Helpline:** 1800 012 3456 / +91 90000 90000
* **Address:** QuickPress Laundry Technologies, Kasganj, Uttar Pradesh 207123, India
""",
        "versions": [
            {
                "version": "1.0",
                "status": "published",
                "publishedAt": "2026-08-25T00:00:00Z",
                "publishedBy": "QuickPress Legal Desk",
                "changeLog": "Initial verified production baseline for QuickPress Platform.",
                "content": "..."
            }
        ]
    }
}


# =========================================================================
#  Initial Categorized FAQs Seed
# =========================================================================

FAQS_SEED: List[Dict[str, Any]] = [
    # Customer / General
    {
        "_id": "faq-1",
        "category": "Customer",
        "question": "What is QuickPress and how does it work?",
        "answer": "QuickPress is a modern door-to-door laundry and dry cleaning network. You place an order through our app or website, our delivery rider picks up your garments from your doorstep, certified local partner stores clean them using professional fabric care methods, and we deliver fresh, crisp clothes back to your door.",
        "sortOrder": 1,
        "isPublished": True,
    },
    {
        "_id": "faq-2",
        "category": "Customer",
        "question": "How do I schedule my first laundry pickup?",
        "answer": "Simply open the QuickPress app or tap 'Explore Services' on our website, select your service (e.g. Wash & Fold, Dry Cleaning, Steam Iron), pick a convenient pickup time slot (Morning, Afternoon, Evening), enter your address, and confirm your booking.",
        "sortOrder": 2,
        "isPublished": True,
    },
    # Orders & Services
    {
        "_id": "faq-3",
        "category": "Orders",
        "question": "What services does QuickPress provide?",
        "answer": "We offer 9 specialized fabric care services: Wash & Fold, Dry Cleaning, Steam Iron, Premium Laundry, Shoe Cleaning, Carpet Cleaning, Curtain Cleaning, Blanket Cleaning, and Express Laundry.",
        "sortOrder": 3,
        "isPublished": True,
    },
    {
        "_id": "faq-4",
        "category": "Orders",
        "question": "How is the pricing calculated for my order?",
        "answer": "Pricing is calculated based on exact item counts or calibrated scale weight taken during pickup verification. The total is displayed transparently on your order screen before wash processing begins.",
        "sortOrder": 4,
        "isPublished": True,
    },
    # Pickup & Delivery
    {
        "_id": "faq-5",
        "category": "Pickup & Delivery",
        "question": "What are your standard pickup and delivery time slots?",
        "answer": "We operate 7 days a week with three fixed time windows: Morning (8:00 AM – 12:00 PM), Afternoon (12:00 PM – 4:00 PM), and Evening (4:00 PM – 8:00 PM). Express turnaround options are also available for urgent requirements.",
        "sortOrder": 5,
        "isPublished": True,
    },
    {
        "_id": "faq-6",
        "category": "Pickup & Delivery",
        "question": "Do I need to separate my laundry before pickup?",
        "answer": "Our delivery riders and laundry partners inspect and separate whites, darks, and delicate fabrics at the facility according to fabric care labels. However, please ensure all garment pockets are cleared of personal belongings before handover.",
        "sortOrder": 6,
        "isPublished": True,
    },
    # Payments
    {
        "_id": "faq-7",
        "category": "Payments",
        "question": "What payment methods are supported on QuickPress?",
        "answer": "QuickPress supports all major payment modes via Razorpay including UPI (Google Pay, PhonePe, Paytm, BHIM), Debit/Credit Cards (Visa, MasterCard, RuPay), NetBanking, QuickPress Wallet balance, and Cash on Delivery (COD).",
        "sortOrder": 7,
        "isPublished": True,
    },
    {
        "_id": "faq-8",
        "category": "Payments",
        "question": "How do refunds work if I cancel an order?",
        "answer": "Approved refunds to the QuickPress Wallet are instant. Refunds to UPI or original bank payment methods are processed through Razorpay and typically reflect in your account within 5–7 working days.",
        "sortOrder": 8,
        "isPublished": True,
    },
    # Membership
    {
        "_id": "faq-9",
        "category": "Membership",
        "question": "What are the benefits of QuickPress VIP Membership?",
        "answer": "QuickPress VIP Club members enjoy unlimited zero-fee deliveries, priority express turnaround, exclusive monthly wash allowances, and dedicated customer support.",
        "sortOrder": 9,
        "isPublished": True,
    },
    # Partners
    {
        "_id": "faq-10",
        "category": "Partners",
        "question": "How can my local laundry business partner with QuickPress?",
        "answer": "Local laundry owners can visit our 'Partner With Us' page or open the Partner Portal to register. Our team verifies your facility, equipment, and quality standards, after which you receive a digital storefront and live order dispatch.",
        "sortOrder": 10,
        "isPublished": True,
    },
    # Riders
    {
        "_id": "faq-11",
        "category": "Riders",
        "question": "How do I become a delivery rider with QuickPress?",
        "answer": "Visit our 'Become a Rider' page to apply. You will need a valid two-wheeler, driving license, and smartphone. Once onboarding and background verification are complete, you can start accepting flexible pickup and delivery shifts.",
        "sortOrder": 11,
        "isPublished": True,
    },
]


# =========================================================================
#  Initial Website Settings Seed
# =========================================================================

WEBSITE_SETTINGS_SEED: Dict[str, Any] = {
    "_id": "global_website_settings",
    "brandName": "QuickPress",
    "tagline": "Laundry, simplified.",
    "subheading": "Pickup. Clean. Care. Delivered.",
    "supportPhone": "1800 012 3456",
    "supportPhoneRaw": "+919000090000",
    "supportEmail": "support@quickpress.in",
    "operatingAddress": "QuickPress Laundry Technologies, Kasganj, Uttar Pradesh 207123, India",
    "workingHours": "Monday – Sunday, 8:00 AM – 9:00 PM IST",
    "activeOperatingCity": "Kasganj, Uttar Pradesh",
    "appStoreUrl": "https://apps.apple.com",  # Coming soon handled gracefully in UI
    "playStoreUrl": "https://play.google.com",
    "appStoreAvailable": False,
    "playStoreAvailable": True,
    "socialLinks": {
        "instagram": "https://instagram.com",
        "twitter": "https://twitter.com",
        "facebook": "https://facebook.com",
        "linkedin": "https://linkedin.com"
    },
    "seo": {
        "defaultTitle": "QuickPress — Premium Online Laundry & Dry Cleaning Doorstep Service",
        "defaultDescription": "QuickPress is India's premier technology-driven laundry and dry cleaning platform. Schedule doorstep pickup for Wash & Fold, Dry Cleaning, Steam Ironing & Shoe Care.",
        "canonicalDomain": "https://www.quickpress.online",
        "ogImage": "/og-image.jpg"
    }
}


# =========================================================================
#  CMS Repository Class
# =========================================================================

class CMSRepository:
    async def ensure_seed(self) -> None:
        """Seed initial legal documents, FAQs, and website settings into MongoDB."""
        # 1. Legal Docs
        for doc_id, doc_data in LEGAL_DOCS_SEED.items():
            existing = await database.find_one("website_legal_docs", {"_id": doc_id})
            if not existing:
                await database.collection("website_legal_docs").update_one(
                    {"_id": doc_id},
                    {"$set": doc_data},
                    upsert=True
                )
        
        # 2. FAQs
        for faq in FAQS_SEED:
            await database.collection("website_faqs").update_one(
                {"_id": faq["_id"]},
                {"$set": faq},
                upsert=True
            )
            
        # 3. Settings
        await database.collection("website_settings").update_one(
            {"_id": WEBSITE_SETTINGS_SEED["_id"]},
            {"$set": WEBSITE_SETTINGS_SEED},
            upsert=True
        )
        logger.info("QuickPress CMS initial seed verified successfully.")

    # ------------------ Legal Documents ------------------
    async def get_legal_doc(self, doc_slug: str) -> Optional[Dict[str, Any]]:
        return await database.find_one("website_legal_docs", {"slug": doc_slug, "status": "published"})

    async def get_legal_doc_admin(self, doc_slug: str) -> Optional[Dict[str, Any]]:
        return await database.find_one("website_legal_docs", {"slug": doc_slug})

    async def list_legal_docs_admin(self) -> List[Dict[str, Any]]:
        return await database.find_many("website_legal_docs", {})

    async def save_legal_draft(self, doc_slug: str, title: str, content: str, summary: str, user_name: str) -> Dict[str, Any]:
        now = utcnow_iso()
        doc = await database.find_one("website_legal_docs", {"slug": doc_slug})
        if not doc:
            doc = {
                "_id": doc_slug,
                "title": title,
                "slug": doc_slug,
                "currentVersion": "1.0",
                "effectiveDate": now[:10],
                "status": "draft",
                "versions": []
            }
        
        # Increment minor version for draft
        current_v = doc.get("currentVersion", "1.0")
        try:
            major, minor = current_v.split(".")
            next_v = f"{major}.{int(minor) + 1}"
        except Exception:
            next_v = "1.1"

        draft_version = {
            "version": next_v,
            "status": "draft",
            "updatedAt": now,
            "updatedBy": user_name,
            "title": title,
            "summary": summary,
            "content": content
        }

        # Keep last 20 versions
        versions = doc.get("versions", [])
        versions.insert(0, draft_version)
        versions = versions[:20]

        await database.collection("website_legal_docs").update_one(
            {"slug": doc_slug},
            {
                "$set": {
                    "draftTitle": title,
                    "draftContent": content,
                    "draftSummary": summary,
                    "draftVersion": next_v,
                    "draftUpdatedAt": now,
                    "draftUpdatedBy": user_name,
                    "hasDraft": True,
                    "versions": versions
                }
            },
            upsert=True
        )
        return {"ok": True, "slug": doc_slug, "version": next_v, "status": "draft"}

    async def publish_legal_doc(self, doc_slug: str, user_name: str, change_log: str = "") -> Dict[str, Any]:
        now = utcnow_iso()
        doc = await database.find_one("website_legal_docs", {"slug": doc_slug})
        if not doc:
            return {"ok": False, "message": "Document not found"}

        title = doc.get("draftTitle") or doc.get("title")
        content = doc.get("draftContent") or doc.get("content")
        summary = doc.get("draftSummary") or doc.get("summary")
        version = doc.get("draftVersion") or doc.get("currentVersion", "1.0")

        published_version_entry = {
            "version": version,
            "status": "published",
            "publishedAt": now,
            "publishedBy": user_name,
            "changeLog": change_log or "Published via Admin CMS",
            "title": title,
            "summary": summary,
            "content": content
        }

        versions = doc.get("versions", [])
        # Update existing version entry status or insert
        versions.insert(0, published_version_entry)
        versions = versions[:20]

        await database.collection("website_legal_docs").update_one(
            {"slug": doc_slug},
            {
                "$set": {
                    "title": title,
                    "content": content,
                    "summary": summary,
                    "currentVersion": version,
                    "status": "published",
                    "publishedAt": now,
                    "publishedBy": user_name,
                    "effectiveDate": now[:10],
                    "hasDraft": False,
                    "versions": versions
                },
                "$unset": {
                    "draftTitle": "",
                    "draftContent": "",
                    "draftSummary": "",
                    "draftVersion": "",
                    "draftUpdatedAt": "",
                    "draftUpdatedBy": ""
                }
            }
        )
        return {"ok": True, "slug": doc_slug, "version": version, "status": "published"}

    # ------------------ FAQs ------------------
    async def get_published_faqs(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"isPublished": True}
        if category and category.lower() != "all":
            query["category"] = {"$regex": f"^{category}$", "$options": "i"}
        return await database.find_many("website_faqs", query, sort_key="sortOrder")

    async def get_all_faqs_admin(self) -> List[Dict[str, Any]]:
        return await database.find_many("website_faqs", {}, sort_key="sortOrder")

    async def upsert_faq_admin(self, faq_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        data["updatedAt"] = utcnow_iso()
        await database.collection("website_faqs").update_one(
            {"_id": faq_id},
            {"$set": data},
            upsert=True
        )
        return {"ok": True, "id": faq_id}

    async def delete_faq_admin(self, faq_id: str) -> Dict[str, Any]:
        await database.collection("website_faqs").delete_one({"_id": faq_id})
        return {"ok": True, "id": faq_id}

    # ------------------ Contact Messages ------------------
    async def save_contact_message(self, name: str, email: str, phone: str, subject: str, message: str) -> Dict[str, Any]:
        now = utcnow_iso()
        msg_id = f"msg_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}_{name[:3].lower()}"
        doc = {
            "_id": msg_id,
            "name": name.strip(),
            "email": email.strip().lower(),
            "phone": phone.strip(),
            "subject": subject.strip(),
            "message": message.strip(),
            "status": "new",
            "createdAt": now,
            "ip": "public-web",
        }
        await database.collection("website_contact_messages").insert_one(doc)
        return {"ok": True, "id": msg_id, "message": "Inquiry received. QuickPress Support will reach out shortly."}

    async def list_contact_messages_admin(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        query = {}
        if status and status.lower() != "all":
            query["status"] = status
        docs = await database.find_many("website_contact_messages", query)
        docs.sort(key=lambda x: str(x.get("createdAt", "")), reverse=True)
        return docs

    async def update_contact_message_status_admin(self, msg_id: str, new_status: str) -> Dict[str, Any]:
        await database.collection("website_contact_messages").update_one(
            {"_id": msg_id},
            {"$set": {"status": new_status, "updatedAt": utcnow_iso()}}
        )
        return {"ok": True, "id": msg_id, "status": new_status}

    # ------------------ Settings ------------------
    async def get_website_settings(self) -> Dict[str, Any]:
        settings = await database.find_one("website_settings", {"_id": WEBSITE_SETTINGS_SEED["_id"]})
        return settings or WEBSITE_SETTINGS_SEED

    async def update_website_settings_admin(self, data: Dict[str, Any]) -> Dict[str, Any]:
        data["updatedAt"] = utcnow_iso()
        await database.collection("website_settings").update_one(
            {"_id": WEBSITE_SETTINGS_SEED["_id"]},
            {"$set": data},
            upsert=True
        )
        return {"ok": True}


cms_repo = CMSRepository()
