"""Service Availability seed documents — Sprint 2.12.

Loaded into MongoDB on first startup (idempotent), exactly like the catalog
seed. Three collections back the availability engine:

    service_availability   per service: enabled / maintenance / daily capacity
    delivery_zones         supported cities, areas and PIN codes
    business_hours         per partner weekly opening hours (Asia/Kolkata)

The fourth Sprint 2.12 collection, `reorder_history`, is written at runtime and
therefore has no seed.
"""

from __future__ import annotations

from typing import Any, Dict, List

# Every service in `catalog_seed.SERVICES` gets an availability document. A
# service with `enabled: False` or `maintenance: True` can never reach checkout.
SERVICE_AVAILABILITY: List[Dict[str, Any]] = [
    {
        "_id": "s1",
        "serviceId": "s1",
        "enabled": True,
        "maintenance": False,
        "maintenanceMessage": "",
        "dailyCapacity": 120,
        "cities": [],
    },
    {
        "_id": "s2",
        "serviceId": "s2",
        "enabled": True,
        "maintenance": False,
        "maintenanceMessage": "",
        "dailyCapacity": 90,
        "cities": [],
    },
    {
        "_id": "s3",
        "serviceId": "s3",
        "enabled": True,
        "maintenance": False,
        "maintenanceMessage": "",
        "dailyCapacity": 40,
        "cities": [],
    },
    {
        "_id": "s4",
        "serviceId": "s4",
        "enabled": True,
        "maintenance": False,
        "maintenanceMessage": "",
        "dailyCapacity": 35,
        "cities": [],
    },
    {
        "_id": "s5",
        "serviceId": "s5",
        "enabled": True,
        "maintenance": False,
        "maintenanceMessage": "",
        "dailyCapacity": 30,
        "cities": [],
    },
    {
        "_id": "s6",
        "serviceId": "s6",
        "enabled": True,
        "maintenance": False,
        "maintenanceMessage": "",
        "dailyCapacity": 25,
        "cities": [],
    },
    {
        "_id": "s7",
        "serviceId": "s7",
        "enabled": True,
        "maintenance": True,
        "maintenanceMessage": "Carpet Shampoo is paused for equipment servicing. It returns shortly.",
        "dailyCapacity": 15,
        "cities": [],
    },
    {
        "_id": "s8",
        "serviceId": "s8",
        "enabled": True,
        "maintenance": False,
        "maintenanceMessage": "",
        "dailyCapacity": 50,
        "cities": [],
    },
    {
        "_id": "s9",
        "serviceId": "s9",
        "enabled": True,
        "maintenance": False,
        "maintenanceMessage": "",
        "dailyCapacity": 200,
        "cities": [],
    },
]

DELIVERY_ZONES: List[Dict[str, Any]] = []

_WEEKDAY_HOURS = [
    {"day": "mon", "open": "07:00", "close": "22:00", "closed": False},
    {"day": "tue", "open": "07:00", "close": "22:00", "closed": False},
    {"day": "wed", "open": "07:00", "close": "22:00", "closed": False},
    {"day": "thu", "open": "07:00", "close": "22:00", "closed": False},
    {"day": "fri", "open": "07:00", "close": "22:00", "closed": False},
    {"day": "sat", "open": "07:00", "close": "22:30", "closed": False},
    {"day": "sun", "open": "08:00", "close": "21:00", "closed": False},
]

BUSINESS_HOURS: List[Dict[str, Any]] = [
    {
        "_id": "prt-2001",
        "partnerId": "prt-2001",
        "timezone": "Asia/Kolkata",
        "dailyCapacity": 80,
        "hours": _WEEKDAY_HOURS,
    },
    {
        "_id": "prt-2002",
        "partnerId": "prt-2002",
        "timezone": "Asia/Kolkata",
        "dailyCapacity": 60,
        "hours": [
            {"day": "mon", "open": "08:00", "close": "21:30", "closed": False},
            {"day": "tue", "open": "08:00", "close": "21:30", "closed": False},
            {"day": "wed", "open": "08:00", "close": "21:30", "closed": False},
            {"day": "thu", "open": "08:00", "close": "21:30", "closed": False},
            {"day": "fri", "open": "08:00", "close": "21:30", "closed": False},
            {"day": "sat", "open": "08:00", "close": "22:00", "closed": False},
            {"day": "sun", "open": "09:00", "close": "20:00", "closed": False},
        ],
    },
    {
        "_id": "prt-2003",
        "partnerId": "prt-2003",
        "timezone": "Asia/Kolkata",
        "dailyCapacity": 45,
        "hours": [
            {"day": "mon", "open": "09:00", "close": "20:00", "closed": False},
            {"day": "tue", "open": "09:00", "close": "20:00", "closed": False},
            {"day": "wed", "open": "09:00", "close": "20:00", "closed": False},
            {"day": "thu", "open": "09:00", "close": "20:00", "closed": False},
            {"day": "fri", "open": "09:00", "close": "20:00", "closed": False},
            {"day": "sat", "open": "09:00", "close": "20:00", "closed": False},
            {"day": "sun", "open": "00:00", "close": "00:00", "closed": True},
        ],
    },
]

AVAILABILITY_SEED: Dict[str, List[Dict[str, Any]]] = {
    "service_availability": SERVICE_AVAILABILITY,
    "delivery_zones": DELIVERY_ZONES,
    "business_hours": BUSINESS_HOURS,
}
