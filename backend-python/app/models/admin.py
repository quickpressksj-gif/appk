"""Admin domain models — Sprint 5.2 (MongoDB integration).

Loose, additive pydantic models for request bodies used by the admin panel.
Most list/detail responses are returned as plain dicts (mirroring the mock
TS server's untyped JSON shapes) so the admin-frontend receives byte-for-byte
compatible payloads without over-constraining fields that differ per screen.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class AssignRiderPayload(BaseModel):
    riderId: str


class CancelOrderPayload(BaseModel):
    reason: Optional[str] = None


class UpdateOrderStatusPayload(BaseModel):
    status: str
    reason: Optional[str] = None


class AdjustCustomerWalletPayload(BaseModel):
    amount: float
    reason: str


class AdjustCustomerLoyaltyPayload(BaseModel):
    points: int
    reason: str


class AddCustomerNotePayload(BaseModel):
    note: str


class UpdateCustomerTagsPayload(BaseModel):
    tags: List[str]


class SendCustomerNotificationPayload(BaseModel):
    title: str
    body: str
    channel: Optional[str] = "push"


class SuspendPartnerPayload(BaseModel):
    reason: str
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    internalNote: Optional[str] = None


class BlockPartnerPayload(BaseModel):
    reason: str
    internalNote: Optional[str] = None


class UpdatePartnerKycPayload(BaseModel):
    status: str
    reason: Optional[str] = None


class UpdatePartnerCommissionPayload(BaseModel):
    commissionRate: float
    serviceRates: Optional[Dict[str, float]] = None


class AddPartnerNotePayload(BaseModel):
    note: str


class UpdatePartnerTagsPayload(BaseModel):

    tags: List[str]


class SendPartnerNotificationPayload(BaseModel):

    title: str
    body: str
    category: Optional[str] = "operational"


class CouponPayload(BaseModel):

    code: Optional[str] = None

    discount: Optional[str] = None
    description: Optional[str] = None
    expiry: Optional[str] = None
    minOrder: Optional[float] = None
class CreatePartnerPayload(BaseModel):
    businessName: str
    ownerName: str
    phone: str
    email: Optional[str] = None
    city: str
    zone: Optional[str] = "Main Zone"
    address: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    commissionRate: Optional[float] = 18.0


class AdminPartnerUpdatePayload(BaseModel):

    businessName: Optional[str] = None
    ownerName: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None
    pincode: Optional[str] = None
    pan: Optional[str] = None
    aadhaar: Optional[str] = None
    gstin: Optional[str] = None
    experience: Optional[str] = None
    bankName: Optional[str] = None
    accountHolder: Optional[str] = None
    accountNumber: Optional[str] = None
    ifsc: Optional[str] = None
    openingTime: Optional[str] = None
    closingTime: Optional[str] = None
    weeklyOff: Optional[str] = None
    pickupRadiusKm: Optional[int] = None
    deliveryRadiusKm: Optional[int] = None
    status: Optional[str] = None
    isVerified: Optional[bool] = None


class AdminRiderUpdatePayload(BaseModel):
    fullName: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    vehicleType: Optional[str] = None
    vehicleNumber: Optional[str] = None
    vehicle: Optional[str] = None
    plate: Optional[str] = None
    bankName: Optional[str] = None
    accountLast4: Optional[str] = None
    ifsc: Optional[str] = None
    status: Optional[str] = None
    kycStatus: Optional[str] = None
    isOnline: Optional[bool] = None


class AdjustRiderWalletPayload(BaseModel):
    amount: float
    reason: str
    isCodSettlement: Optional[bool] = False


class VerifyRiderDocumentPayload(BaseModel):
    status: str
    reason: Optional[str] = None


class AddRiderNotePayload(BaseModel):
    note: str


class SendRiderNotificationPayload(BaseModel):
    title: str
    body: str


class StaffPayload(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    scope: Optional[str] = None
    status: Optional[str] = None


class CityPayload(BaseModel):
    city: Optional[str] = None
    state: Optional[str] = None
    areas: Optional[int] = None
    pickupRadius: Optional[str] = None
    status: Optional[str] = None


class ServicePayload(BaseModel):
    name: Optional[str] = None
    categoryId: Optional[str] = None
    unit: Optional[str] = None
    price: Optional[float] = None
    image: Optional[str] = None
    description: Optional[str] = None


class SupportReplyPayload(BaseModel):
    body: Optional[str] = None


class BroadcastPayload(BaseModel):
    audience: Optional[str] = "All"
    title: Optional[str] = None
    message: Optional[str] = None


class SettingsUpdatePayload(BaseModel):
    model_config = {"extra": "allow"}
