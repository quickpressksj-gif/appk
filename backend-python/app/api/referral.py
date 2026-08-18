"""Customer referral & rewards API — Sprint 2.8.

    GET  /api/referral            dashboard: code, QR, stats, history, rewards
    GET  /api/referral/history    referred friends + status + reward earned
    GET  /api/referral/rewards    pending / completed rewards + history
    GET  /api/referral/stats      counters only (cheap poll for cards)
    POST /api/referral/apply      apply a friend's code (one per customer)
    POST /api/referral/invite     record an invite (copy / link / whatsapp / sms)

Every route requires a bearer token and is scoped to `current_user`.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import current_user
from app.db.referral_repositories import ReferralConflict, referral_repository
from app.models.referral import (
    ApplyReferralPayload,
    ApplyReferralResponse,
    InviteReferralPayload,
    InviteReferralResponse,
    ReferralHistoryResponse,
    ReferralResponse,
    ReferralRewardsResponse,
    ReferralStatsResponse,
)
from app.models.user import User

router = APIRouter(tags=["referral"])


@router.get("/referral", response_model=ReferralResponse)
async def referral_dashboard(user: User = Depends(current_user)) -> ReferralResponse:
    return await referral_repository.dashboard(user)


@router.get("/referral/history", response_model=ReferralHistoryResponse)
async def referral_history(user: User = Depends(current_user)) -> ReferralHistoryResponse:
    return await referral_repository.history(user)


@router.get("/referral/rewards", response_model=ReferralRewardsResponse)
async def referral_rewards(user: User = Depends(current_user)) -> ReferralRewardsResponse:
    return await referral_repository.rewards(user)


@router.get("/referral/stats", response_model=ReferralStatsResponse)
async def referral_stats(user: User = Depends(current_user)) -> ReferralStatsResponse:
    return await referral_repository.stats(user)


@router.post("/referral/apply", response_model=ApplyReferralResponse)
async def apply_referral(
    payload: ApplyReferralPayload, user: User = Depends(current_user)
) -> ApplyReferralResponse:
    try:
        return await referral_repository.apply(user, payload.code)
    except ReferralConflict as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error


@router.post("/referral/invite", response_model=InviteReferralResponse)
async def invite_referral(
    payload: InviteReferralPayload, user: User = Depends(current_user)
) -> InviteReferralResponse:
    return await referral_repository.invite(user, payload.channel, payload.contact)
