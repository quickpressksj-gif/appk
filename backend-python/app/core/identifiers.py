"""Unique 6-digit random identifier generators for QuickPress actors."""

import random
from app.db.client import database


async def generate_rider_id() -> str:
    """Generate a unique 6-digit random Rider ID, e.g. RDR-582914."""
    for _ in range(20):
        code = random.randint(100000, 999999)
        candidate = f"RDR-{code}"
        existing = await database.find_one("rider_profiles", {"$or": [{"_id": candidate}, {"riderId": candidate}]})
        if not existing:
            return candidate
    return f"RDR-{random.randint(100000, 999999)}"


async def generate_partner_id() -> str:
    """Generate a unique 6-digit random Partner ID, e.g. PRT-619284."""
    for _ in range(20):
        code = random.randint(100000, 999999)
        candidate = f"PRT-{code}"
        existing = await database.find_one("partner_profiles", {"$or": [{"_id": candidate}, {"partnerId": candidate}]})
        if not existing:
            return candidate
    return f"PRT-{random.randint(100000, 999999)}"


async def generate_customer_id() -> str:
    """Generate a unique 6-digit random Customer ID, e.g. CUST-391048."""
    code = random.randint(100000, 999999)
    return f"CUST-{code}"
