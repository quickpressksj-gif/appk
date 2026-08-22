"""Partner domain models — Sprint 5.2 (MongoDB integration).

These mirror `shared/src/types/partner.ts` byte-for-byte so the
partner-frontend consumes identical payloads from the mock TS server and
FastAPI + MongoDB.
"""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel

PartnerOrderStatus = Literal[
    "new", "accepted", "picked", "processing", "ready", "delivered", "cancelled"
]

BusinessCategory = Literal["laundry", "dry-clean", "premium", "shoe-care"]


class PartnerOrderItem(BaseModel):
    id: str
    name: str
    qty: int
    price: int


class PartnerOrderTimelineStage(BaseModel):
    id: str
    label: str
    time: str
    done: bool


class PartnerOrderResponse(BaseModel):
    id: str
    code: str
    customerName: str
    customerPhone: str
    status: PartnerOrderStatus
    placedAt: str
    slot: str
    address: str
    itemCount: int
    amount: int
    paymentMode: Literal["online", "cod"]
    serviceLabel: str
    items: List[PartnerOrderItem] = []
    timeline: List[PartnerOrderTimelineStage] = []


class RejectOrderPayload(BaseModel):
    reason: str = ""


class PartnerProfileResponse(BaseModel):
    partnerId: str
    id: Optional[str] = None
    businessName: str = "QuickPress Partner Store"
    ownerName: str = "Partner"
    phone: str = ""

    def model_post_init(self, __context: Any) -> None:
        if not self.id:
            self.id = self.partnerId
    email: str = ""
    city: str = "Bengaluru"
    rating: float = 5.0
    totalOrders: int = 0
    joinedOn: str = "August 2026"
    onTimeRate: float = 98.5
    tier: Literal["Bronze", "Silver", "Platinum", "Gold"] = "Silver"
    isVerified: bool = False
    status: str = "pending"


class PartnerProfileUpdate(BaseModel):
    businessName: Optional[str] = None
    ownerName: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None


class BusinessSettingsResponse(BaseModel):
    isStoreOpen: bool
    acceptingNewOrders: bool
    autoAcceptOrders: bool
    expressDelivery: bool
    pickupRadiusKm: int
    openingTime: str
    closingTime: str
    weeklyOff: str
    dailyOrderCap: int


class BusinessSettingsUpdate(BaseModel):
    isStoreOpen: Optional[bool] = None
    acceptingNewOrders: Optional[bool] = None
    autoAcceptOrders: Optional[bool] = None
    expressDelivery: Optional[bool] = None
    pickupRadiusKm: Optional[int] = None
    openingTime: Optional[str] = None
    closingTime: Optional[str] = None
    weeklyOff: Optional[str] = None
    dailyOrderCap: Optional[int] = None


class PartnerServiceResponse(BaseModel):
    id: str
    name: str
    unit: str
    price: int
    turnaroundHours: int = 24
    enabled: bool = True
    category: str = "laundry"
    description: str = ""
    image: str = ""
    minQuantity: int = 1
    expressAvailable: bool = False


class PartnerServiceCreate(BaseModel):
    name: str
    unit: str = "kg"
    price: int
    turnaroundHours: int = 24
    enabled: bool = True
    category: str = "laundry"
    description: str = ""
    image: str = ""
    minQuantity: int = 1
    expressAvailable: bool = False


class PartnerServiceUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    price: Optional[int] = None
    turnaroundHours: Optional[int] = None
    enabled: Optional[bool] = None
    category: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    minQuantity: Optional[int] = None
    expressAvailable: Optional[bool] = None


class PartnerDashboardResponse(BaseModel):
    newOrders: int
    inProgress: int
    readyForDelivery: int
    delivered: int
    earningsToday: int


class PartnerEarningsResponse(BaseModel):
    total: int
    orders: int


class PartnerWalletResponse(BaseModel):
    accountId: str
    balance: float
    cashbackBalance: float
    rewardPoints: int
    referralCode: str
    referralEarned: float
    onHold: float = 0
    lifetimeEarned: float = 0
    bankLast4: str = ""
    autoPayout: bool = True


class PartnerWalletTransactionResponse(BaseModel):
    id: str
    title: str
    date: str
    amount: float
    direction: Literal["credit", "debit"]
    status: Literal["success", "pending", "failed"]
    kind: str


class WithdrawPayload(BaseModel):
    amount: float


class PartnerReviewResponse(BaseModel):
    id: str
    partnerId: str
    customerName: str
    rating: float
    comment: str
    date: str


class PartnerNotificationResponse(BaseModel):
    id: str
    title: str
    body: str
    date: str
    read: bool
    kind: str


class OnboardingPayload(BaseModel):
    businessName: str
    ownerName: str
    category: BusinessCategory = "laundry"
    gstin: str = ""
    address: str = ""
    city: str = ""
    pincode: str = ""
    openingTime: str = "08:00"
    closingTime: str = "21:00"


class OnboardingResponse(BaseModel):
    partnerId: str
    phone: str
    businessName: str
    isVerified: bool
    isOnboarded: bool
