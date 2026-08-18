"""Editorial content for the Service Details screen — Sprint 2.3.

Care instructions and FAQs are stored per service category so every service
answers with real backend content instead of hard coded UI copy. Documents are
seeded into the `service_content` collection on startup and can be edited in
MongoDB without a deploy.
"""

from __future__ import annotations

from typing import Any, Dict, List

DEFAULT_CARE_INSTRUCTIONS: List[str] = [
    "Whites and colours are always washed in separate loads",
    "Delicates such as silk and wool are hand finished, never machine spun",
    "Water temperature is matched to the fabric care label",
    "Stains are pre-treated before the main wash cycle",
    "Garments are steam pressed and packed in breathable covers",
]

DEFAULT_FAQ: List[Dict[str, str]] = [
    {
        "id": "f1",
        "question": "How is the price calculated?",
        "answer": (
            "Your laundry is weighed or counted at pickup on a calibrated scale and the exact "
            "amount is shared on your order screen before processing starts."
        ),
    },
    {
        "id": "f2",
        "question": "What if a garment is damaged?",
        "answer": (
            "Every garment is photographed before processing. If anything is damaged we cover you "
            "up to ₹2,000 per garment, credited to your QuickPress wallet."
        ),
    },
    {
        "id": "f3",
        "question": "Can I reschedule my pickup?",
        "answer": (
            "Yes. You can reschedule free of cost up to 2 hours before the slot from the order "
            "tracking screen."
        ),
    },
    {
        "id": "f4",
        "question": "Do you use fabric softener?",
        "answer": (
            "Standard orders use a pH balanced detergent. Fabric conditioner and premium "
            "fragrance are available as add-ons."
        ),
    },
]

DEFAULT_INCLUDED: List[str] = [
    "Professional Cleaning",
    "Premium Detergent",
    "Quality Inspection",
    "Safe Packaging",
    "Doorstep Pickup & Delivery",
]

DEFAULT_BENEFITS: List[str] = [
    "Fabric Safe",
    "Eco Friendly",
    "Express Delivery Available",
    "Professional Cleaning",
    "Doorstep Pickup",
]

# One document per service category (`categories._id`). Anything missing falls
# back to the defaults above.
SERVICE_CONTENT: List[Dict[str, Any]] = [
    {
        "_id": "c1",
        "careInstructions": DEFAULT_CARE_INSTRUCTIONS,
        "faq": DEFAULT_FAQ,
        "included": DEFAULT_INCLUDED,
        "benefits": DEFAULT_BENEFITS,
    },
    {
        "_id": "c2",
        "careInstructions": [
            "Every garment is inspected for fabric, lining and trims before cleaning",
            "Solvent strength is chosen per fabric — silk and wool get the gentlest cycle",
            "Stains are spot treated by hand before the dry clean cycle",
            "Buttons and embellishments are covered during pressing",
            "Finished pieces are returned on hangers in breathable covers",
        ],
        "faq": [
            {
                "id": "f1",
                "question": "Is dry cleaning safe for silk and embroidery?",
                "answer": (
                    "Yes. Delicate fabrics run on a low agitation solvent cycle and embroidery is "
                    "hand finished, never machine pressed."
                ),
            },
            {
                "id": "f2",
                "question": "Will old stains come out?",
                "answer": (
                    "We pre-treat every stain and share an honest assessment at pickup. If a stain "
                    "cannot be removed you are not charged for the treatment."
                ),
            },
            *DEFAULT_FAQ[2:],
        ],
        "included": [
            "Fabric-wise Solvent Cleaning",
            "Hand Stain Treatment",
            "Hand Finishing & Pressing",
            "Garment Covers",
            "Doorstep Pickup & Delivery",
        ],
        "benefits": ["Delicate Safe", "Hand Finished", "Garment Covers", "Odour Free", "Doorstep Pickup"],
    },
    {
        "_id": "c3",
        "careInstructions": [
            "Industrial steam presses are set to the fabric's safe temperature",
            "Shirts are pressed on collar, cuff and body forms for a crisp finish",
            "Pleats and creases are aligned before the final press",
            "Pressed garments are hung immediately to avoid fresh creases",
            "Delivered on hangers so nothing folds on the way back",
        ],
        "faq": DEFAULT_FAQ,
        "included": ["Industrial Steam Press", "Collar & Cuff Forming", "Hanger Delivery", "Quality Check"],
        "benefits": ["Crisp Finish", "Same Day Slots", "Hanger Delivery", "Fabric Safe"],
    },
    {
        "_id": "c5",
        "careInstructions": [
            "Soles, uppers and laces are cleaned separately",
            "Leather and suede are brushed dry — never soaked",
            "Sneakers are air dried in shape to avoid creasing",
            "Laces are washed and replaced when worn out",
            "Finished pairs are deodorised and boxed",
        ],
        "faq": DEFAULT_FAQ,
        "included": ["Deep Sole Clean", "Upper Restoration", "Lace Wash", "Deodorising", "Shoe Box Packing"],
        "benefits": ["Leather Safe", "Suede Safe", "Deodorised", "Shape Retained"],
    },
]

SERVICE_CONTENT_SEED: Dict[str, List[Dict[str, Any]]] = {"service_content": SERVICE_CONTENT}
