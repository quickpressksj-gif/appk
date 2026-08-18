"""Partner / rider earnings, settlements and incentives — Phase 5 · Sprint 5.6."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.deps import require_roles
from app.db import payment_repositories as repo
from app.models.user import Role, User

router = APIRouter(tags=["earnings"])


@router.get("/partner/earnings")
async def partner_earnings(user: User = Depends(require_roles(Role.partner))) -> dict:
    return await repo.earnings_for(user, 62, 12_400)


@router.get("/partner/settlements")
async def partner_settlements(user: User = Depends(require_roles(Role.partner))) -> dict:
    return await repo.settlements_for(user)


@router.get("/rider/earnings")
async def rider_earnings(user: User = Depends(require_roles(Role.rider))) -> dict:
    return await repo.earnings_for(user, 88, 6_200)


@router.get("/rider/settlements")
async def rider_settlements(user: User = Depends(require_roles(Role.rider))) -> dict:
    return await repo.settlements_for(user)


@router.get("/rider/incentives")
async def rider_incentives(user: User = Depends(require_roles(Role.rider))) -> dict:
    return repo.rider_incentives()
