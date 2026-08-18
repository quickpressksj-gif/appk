"""Rider domain models — Sprint 5.2 (Rider MongoDB integration).

Mirrors the camelCase shapes the rider frontend expects (see
backend/src/mock/server.ts "/api/rider/..." handlers and backend/src/rider/*.ts).
"""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class RiderTimelineStep(BaseModel):
    id: str
    label: str
    time: str
    done: bool


class RiderOrder(BaseModel):
    id: str
    code: str
    taskType: str
    status: str
    customerName: str
    customerPhone: str
    partnerName: str
    partnerPhone: str
    pickupAddress: str
    deliveryAddress: str
    distanceKm: float
    etaMinutes: int
    estimatedEarning: float
    itemCount: int
    slot: str
    placedAt: str
    paymentMode: str
    timeline: List[RiderTimelineStep] = []


class RiderDocumentStatus(BaseModel):
    id: str
    label: str
    status: str


class RiderProfile(BaseModel):
    riderId: str
    fullName: str
    phone: str
    email: str
    city: str
    rating: float
    totalTrips: int
    joinedOn: str
    vehicleType: str
    vehicleNumber: str
    bankName: str
    accountLast4: str
    ifsc: str
    kycStatus: str
    documents: List[RiderDocumentStatus] = []
    isOnline: bool = False
    onlineMinutes: int = 0


class RiderProfileUpdate(BaseModel):
    fullName: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    vehicleType: Optional[str] = None
    vehicleNumber: Optional[str] = None
    bankName: Optional[str] = None
    accountLast4: Optional[str] = None
    ifsc: Optional[str] = None


class RiderSettings(BaseModel):
    isOnline: bool = False
    vehicle: str = ""
    plate: str = ""
    notificationsEnabled: bool = True


class RiderDashboard(BaseModel):
    assigned: int
    active: int
    completedToday: int
    earningsToday: int


class RiderWallet(BaseModel):
    accountId: str
    balance: float
    cashbackBalance: float
    rewardPoints: int
    referralCode: str
    referralEarned: float
    bankLast4: str = ""


class RiderWalletTransaction(BaseModel):
    id: str
    title: str
    date: str
    amount: float
    direction: str
    status: str
    kind: str


class RiderEarnings(BaseModel):
    total: float
    orders: int


class RiderNotification(BaseModel):
    id: str
    accountId: str
    title: str
    body: str
    date: str
    read: bool
    kind: str


class RiderHistoryEntry(BaseModel):
    id: str
    code: str
    customerName: str
    partnerName: str
    date: str
    amount: float
    distanceKm: float
    outcome: str


class RiderAnalyticsDay(BaseModel):
    date: str
    deliveries: int
    earnings: float
    distanceKm: float


class RiderRegistrationPayload(BaseModel):
    payload: dict
