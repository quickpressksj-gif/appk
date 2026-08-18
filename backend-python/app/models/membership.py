"""Membership models — Sprint 2.9."""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field

PlanId = Literal["free", "silver", "gold", "premium"]
BillingCycle = Literal["monthly", "yearly"]
MembershipStatus = Literal["active", "expired", "cancelled", "none"]
PaymentStatus = Literal["paid", "pending", "failed", "free", "refunded"]
TransactionType = Literal["subscribe", "renew", "upgrade", "cancel", "expire"]


class MembershipBenefit(BaseModel):
    id: str
    title: str
    description: str = ""
    icon: str = "sparkles"
    plans: List[PlanId] = Field(default_factory=list)


class MembershipPlan(BaseModel):
    id: PlanId
    name: str
    tagline: str = ""
    monthlyPrice: int = 0
    yearlyPrice: int = 0
    yearlySavings: int = 0
    savingsLabel: str = ""
    validityDays: int = 30
    yearlyValidityDays: int = 365
    popular: bool = False
    order: int = 0
    benefits: List[MembershipBenefit] = Field(default_factory=list)


class MembershipPlansResponse(BaseModel):
    plans: List[MembershipPlan] = Field(default_factory=list)
    currentPlanId: PlanId = "free"


class MembershipBenefitsResponse(BaseModel):
    items: List[MembershipBenefit] = Field(default_factory=list)
    activeBenefits: List[MembershipBenefit] = Field(default_factory=list)
    planId: PlanId = "free"


class MembershipResponse(BaseModel):
    planId: PlanId = "free"
    planName: str = "Free"
    status: MembershipStatus = "none"
    active: bool = False
    billingCycle: Optional[BillingCycle] = None
    amountPaid: int = 0
    startedAt: Optional[str] = None
    expiresAt: Optional[str] = None
    cancelledAt: Optional[str] = None
    autoRenew: bool = False
    remainingDays: int = 0
    canRenew: bool = True
    canCancel: bool = False
    plan: Optional[MembershipPlan] = None
    benefits: List[MembershipBenefit] = Field(default_factory=list)


class MembershipTransaction(BaseModel):
    id: str
    planId: PlanId
    planName: str
    type: TransactionType = "subscribe"
    billingCycle: BillingCycle = "monthly"
    amount: int = 0
    paymentStatus: PaymentStatus = "paid"
    paymentReference: Optional[str] = None
    subscribedAt: str
    renewalAt: Optional[str] = None
    expiresAt: Optional[str] = None


class MembershipHistoryResponse(BaseModel):
    items: List[MembershipTransaction] = Field(default_factory=list)
    total: int = 0


class SubscribePayload(BaseModel):
    planId: PlanId
    billingCycle: BillingCycle = "monthly"
    #: Reserved for a future payment gateway (Sprint 3) — accepted and stored.
    paymentReference: Optional[str] = Field(default=None, max_length=120)


class SubscribeResponse(BaseModel):
    ok: bool = True
    message: str = ""
    membership: MembershipResponse
    transaction: Optional[MembershipTransaction] = None


class CancelPayload(BaseModel):
    reason: Optional[str] = Field(default=None, max_length=240)


class CancelResponse(BaseModel):
    ok: bool = True
    message: str = ""
    membership: MembershipResponse
