"""Checkout models — Sprint 2.4.

GET /api/checkout returns every piece of data the checkout screen renders in one
round trip: address book (with the default pre-selected), pickup days and time
slots, the cart summary and the server computed charges/totals plus the payment
methods that are currently enabled.
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel

from app.models.address import AddressResponse
from app.models.cart import (
    CartChargesResponse,
    CartCouponResponse,
    CartLineResponse,
    CartStoreResponse,
    CartTotalsResponse,
)


class PickupOptionResponse(BaseModel):
    id: str
    label: str
    sub: str
    """ISO date (yyyy-mm-dd) for day options; empty for time slots."""
    date: str = ""
    custom: bool = False


class PickupScheduleResponse(BaseModel):
    days: List[PickupOptionResponse] = []
    slots: List[PickupOptionResponse] = []
    selectedDay: str = ""
    selectedSlot: str = ""
    minDate: str = ""
    maxDate: str = ""


class PaymentMethodResponse(BaseModel):
    id: str
    kind: str
    name: str
    note: str
    enabled: bool = True
    """Prepared but switched off (Razorpay) — rendered disabled by the UI."""
    comingSoon: bool = False


class CheckoutResponse(BaseModel):
    addresses: List[AddressResponse] = []
    selectedAddressId: str = ""
    pickup: PickupScheduleResponse = PickupScheduleResponse()
    store: Optional[CartStoreResponse] = None
    items: List[CartLineResponse] = []
    coupons: List[CartCouponResponse] = []
    charges: CartChargesResponse = CartChargesResponse()
    totals: CartTotalsResponse = CartTotalsResponse()
    couponCode: str = ""
    payments: List[PaymentMethodResponse] = []
    selectedPaymentId: str = ""
    walletBalance: int = 0
    deliveryEstimate: str = ""
