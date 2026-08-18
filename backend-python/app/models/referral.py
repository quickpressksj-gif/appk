"""Referral & rewards models — Sprint 2.8."""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field

ReferralStatus = Literal["pending", "completed", "expired"]
RewardStatus = Literal["pending", "completed"]
InviteChannel = Literal["copy", "link", "whatsapp", "sms", "share", "email"]

#: Reward amounts (INR) credited to the wallet once a referral completes.
REFERRER_REWARD = 50
REFEREE_REWARD = 25


class ReferralHistoryItem(BaseModel):
    id: str
    friendName: str
    joinedAt: str
    status: ReferralStatus = "pending"
    rewardEarned: int = 0
    completedAt: Optional[str] = None


class ReferralRewardItem(BaseModel):
    id: str
    title: str
    description: str = ""
    amount: int = 0
    status: RewardStatus = "pending"
    createdAt: str
    creditedAt: Optional[str] = None
    referralId: Optional[str] = None
    friendName: Optional[str] = None


class ReferralStatsResponse(BaseModel):
    totalInvites: int = 0
    successfulReferrals: int = 0
    pendingReferrals: int = 0
    totalRewardsEarned: int = 0
    pendingRewards: int = 0
    walletRewards: int = 0
    referrerReward: int = REFERRER_REWARD
    refereeReward: int = REFEREE_REWARD


class ReferralResponse(BaseModel):
    code: str
    link: str
    qrCodeUrl: str
    active: bool = True
    appliedCode: Optional[str] = None
    canApply: bool = True
    shareMessage: str = ""
    stats: ReferralStatsResponse = Field(default_factory=ReferralStatsResponse)
    history: List[ReferralHistoryItem] = Field(default_factory=list)
    rewards: List[ReferralRewardItem] = Field(default_factory=list)


class ReferralHistoryResponse(BaseModel):
    items: List[ReferralHistoryItem] = Field(default_factory=list)
    total: int = 0


class ReferralRewardsResponse(BaseModel):
    items: List[ReferralRewardItem] = Field(default_factory=list)
    pendingRewards: int = 0
    completedRewards: int = 0
    walletRewards: int = 0


class ApplyReferralPayload(BaseModel):
    code: str = Field(min_length=3, max_length=24)


class ApplyReferralResponse(BaseModel):
    ok: bool = True
    message: str = ""
    code: str = ""
    rewardAmount: int = REFEREE_REWARD
    appliedCode: Optional[str] = None


class InviteReferralPayload(BaseModel):
    channel: InviteChannel = "share"
    contact: Optional[str] = Field(default=None, max_length=120)


class InviteReferralResponse(BaseModel):
    ok: bool = True
    channel: InviteChannel = "share"
    totalInvites: int = 0
    link: str = ""
    shareMessage: str = ""
