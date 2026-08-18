"""Referral repository — Sprint 2.8.

Collections
-----------
`referrals`              one document per customer: their own code + counters.

    {
      "_id":          "rfl-<user_id>",
      "user_id":      "<users._id>",
      "code":         "QPRAHUL42",
      "active":       true,
      "invites":      6,
      "applied_code": "QPMEERA19" | null,
      "referred_by":  "<users._id>" | null,
      "created_at":   "2026-08-05T09:10:00+00:00"
    }

`referral_transactions`  one document per referrer → referee relation.

    {
      "_id":          "rtx-<uuid>",
      "referrer_id":  "<users._id>",
      "referee_id":   "<users._id>",
      "referee_name": "Aisha K",
      "code":         "QPRAHUL42",
      "status":       "pending" | "completed",
      "created_at":   "...",
      "completed_at": "..." | null,
      "reward_amount": 50
    }

`referral_rewards`       one document per credited / pending reward, per user.

    {
      "_id":            "rwd-<uuid>",
      "user_id":        "<users._id>",
      "transaction_id": "rtx-…",
      "role":           "referrer" | "referee",
      "title":          "Referral bonus",
      "description":    "Aisha K joined with your code",
      "amount":         50,
      "status":         "pending" | "completed",
      "created_at":     "...",
      "credited_at":    "..." | null
    }

Business rules enforced here
---------------------------
* Every customer gets a unique code (created on first read).
* A customer can apply exactly one referral code, ever.
* Self-referrals and duplicate referrals are rejected.
* Rewards move from `pending` to `completed` only after the referred customer
  has one delivered (successfully completed) order.
"""

from __future__ import annotations

import re
import uuid
from typing import Any, Dict, List, Optional, Tuple

from app.db.client import database
from app.models.referral import (
    REFEREE_REWARD,
    REFERRER_REWARD,
    ApplyReferralResponse,
    InviteReferralResponse,
    ReferralHistoryItem,
    ReferralHistoryResponse,
    ReferralResponse,
    ReferralRewardItem,
    ReferralRewardsResponse,
    ReferralStatsResponse,
)
from app.models.user import User, utcnow

REFERRALS = "referrals"
TRANSACTIONS = "referral_transactions"
REWARDS = "referral_rewards"
ORDERS = "customer_orders"

SHARE_BASE = "https://quickpress.app/invite"
COMPLETED_ORDER_STATUSES = ("delivered", "completed")


class ReferralConflict(Exception):
    """Raised for business-rule violations (self / duplicate / invalid code)."""

    def __init__(self, message: str, status_code: int = 409) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _iso(value: Any) -> str:
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value or utcnow().isoformat())


def _slug(name: str) -> str:
    cleaned = re.sub(r"[^A-Za-z]", "", str(name or "")).upper()
    return (cleaned[:5] or "FRIEND")


def _link_for(code: str) -> str:
    return f"{SHARE_BASE}/{code}"


def _qr_for(code: str) -> str:
    """Deterministic QR image for the referral link (no extra dependency)."""
    from urllib.parse import quote

    return (
        "https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data="
        f"{quote(_link_for(code), safe='')}"
    )


def _share_message(code: str) -> str:
    return (
        f"I use QuickPress for laundry and dry cleaning — use my code {code} "
        f"and we both earn wallet credit on your first order. {_link_for(code)}"
    )


class ReferralRepository:
    # ------------------------------------------------------------------ code

    async def _code_taken(self, code: str) -> bool:
        found = await database.collection(REFERRALS).find_one({"code": code})
        return found is not None

    async def _generate_code(self, user: User) -> str:
        base = f"QP{_slug(user.display_name or 'FRIEND')}"
        for _ in range(25):
            candidate = f"{base}{uuid.uuid4().hex[:3].upper()}"
            if not await self._code_taken(candidate):
                return candidate
        return f"QP{uuid.uuid4().hex[:8].upper()}"

    async def ensure_profile(self, user: User) -> Dict[str, Any]:
        """Return (creating if needed) the caller's referral document."""
        collection = database.collection(REFERRALS)
        document = await collection.find_one({"user_id": user.id})
        if document is not None:
            return document
        document = {
            "_id": f"rfl-{user.id}",
            "user_id": user.id,
            "code": await self._generate_code(user),
            "active": True,
            "invites": 0,
            "applied_code": None,
            "referred_by": None,
            "created_at": utcnow().isoformat(),
        }
        await collection.insert_one(document)
        return document

    async def by_code(self, code: str) -> Optional[Dict[str, Any]]:
        normalised = str(code or "").strip().upper()
        if not normalised:
            return None
        return await database.collection(REFERRALS).find_one({"code": normalised})

    # ------------------------------------------------------- reward settling

    async def _has_completed_order(self, user_id: str) -> bool:
        orders = await database.find_many(ORDERS, {"userId": user_id})
        return any(
            str(order.get("status") or "").lower() in COMPLETED_ORDER_STATUSES for order in orders
        )

    async def settle(self, user_id: str) -> None:
        """Credit pending rewards whose referee finished their first order."""
        pending = await database.find_many(
            TRANSACTIONS, {"referrer_id": user_id, "status": "pending"}
        )
        # Also settle referrals where the caller is the referred customer.
        pending += await database.find_many(
            TRANSACTIONS, {"referee_id": user_id, "status": "pending"}
        )
        seen: set[str] = set()
        for transaction in pending:
            transaction_id = str(transaction.get("_id"))
            if transaction_id in seen:
                continue
            seen.add(transaction_id)
            referee_id = str(transaction.get("referee_id") or "")
            if not referee_id or not await self._has_completed_order(referee_id):
                continue
            now = utcnow().isoformat()
            await database.collection(TRANSACTIONS).update_one(
                {"_id": transaction_id},
                {"$set": {"status": "completed", "completed_at": now}},
            )
            for reward in await database.find_many(REWARDS, {"transaction_id": transaction_id}):
                if str(reward.get("status")) == "completed":
                    continue
                await database.collection(REWARDS).update_one(
                    {"_id": str(reward.get("_id"))},
                    {"$set": {"status": "completed", "credited_at": now}},
                )

    # --------------------------------------------------------- projections

    async def _transactions(self, user_id: str) -> List[Dict[str, Any]]:
        documents = await database.find_many(TRANSACTIONS, {"referrer_id": user_id})
        documents.sort(key=lambda doc: _iso(doc.get("created_at")), reverse=True)
        return documents

    async def _rewards(self, user_id: str) -> List[Dict[str, Any]]:
        documents = await database.find_many(REWARDS, {"user_id": user_id})
        documents.sort(key=lambda doc: _iso(doc.get("created_at")), reverse=True)
        return documents

    def _history_item(self, document: Dict[str, Any]) -> ReferralHistoryItem:
        status = str(document.get("status") or "pending")
        return ReferralHistoryItem(
            id=str(document.get("_id")),
            friendName=str(document.get("referee_name") or "QuickPress friend"),
            joinedAt=_iso(document.get("created_at")),
            status=status if status in ("pending", "completed", "expired") else "pending",
            rewardEarned=(
                int(document.get("reward_amount") or REFERRER_REWARD)
                if status == "completed"
                else 0
            ),
            completedAt=(
                _iso(document.get("completed_at")) if document.get("completed_at") else None
            ),
        )

    def _reward_item(self, document: Dict[str, Any]) -> ReferralRewardItem:
        status = "completed" if str(document.get("status")) == "completed" else "pending"
        return ReferralRewardItem(
            id=str(document.get("_id")),
            title=str(document.get("title") or "Referral reward"),
            description=str(document.get("description") or ""),
            amount=int(document.get("amount") or 0),
            status=status,
            createdAt=_iso(document.get("created_at")),
            creditedAt=_iso(document.get("credited_at")) if document.get("credited_at") else None,
            referralId=document.get("transaction_id"),
            friendName=document.get("friend_name"),
        )

    async def _stats(
        self, profile: Dict[str, Any], transactions: List[Dict[str, Any]], rewards: List[Dict[str, Any]]
    ) -> ReferralStatsResponse:
        successful = sum(1 for item in transactions if str(item.get("status")) == "completed")
        pending_referrals = sum(1 for item in transactions if str(item.get("status")) == "pending")
        earned = sum(
            int(item.get("amount") or 0) for item in rewards if str(item.get("status")) == "completed"
        )
        pending_amount = sum(
            int(item.get("amount") or 0) for item in rewards if str(item.get("status")) != "completed"
        )
        return ReferralStatsResponse(
            totalInvites=max(int(profile.get("invites") or 0), len(transactions)),
            successfulReferrals=successful,
            pendingReferrals=pending_referrals,
            totalRewardsEarned=earned,
            pendingRewards=pending_amount,
            walletRewards=earned,
        )

    # --------------------------------------------------------------- reads

    async def dashboard(self, user: User) -> ReferralResponse:
        profile = await self.ensure_profile(user)
        await self.settle(user.id)
        transactions = await self._transactions(user.id)
        rewards = await self._rewards(user.id)
        code = str(profile.get("code"))
        return ReferralResponse(
            code=code,
            link=_link_for(code),
            qrCodeUrl=_qr_for(code),
            active=bool(profile.get("active", True)),
            appliedCode=profile.get("applied_code"),
            canApply=profile.get("applied_code") is None,
            shareMessage=_share_message(code),
            stats=await self._stats(profile, transactions, rewards),
            history=[self._history_item(item) for item in transactions],
            rewards=[self._reward_item(item) for item in rewards],
        )

    async def history(self, user: User) -> ReferralHistoryResponse:
        await self.ensure_profile(user)
        await self.settle(user.id)
        transactions = await self._transactions(user.id)
        items = [self._history_item(item) for item in transactions]
        return ReferralHistoryResponse(items=items, total=len(items))

    async def rewards(self, user: User) -> ReferralRewardsResponse:
        await self.ensure_profile(user)
        await self.settle(user.id)
        documents = await self._rewards(user.id)
        items = [self._reward_item(item) for item in documents]
        completed = sum(item.amount for item in items if item.status == "completed")
        pending = sum(item.amount for item in items if item.status == "pending")
        return ReferralRewardsResponse(
            items=items,
            pendingRewards=pending,
            completedRewards=completed,
            walletRewards=completed,
        )

    async def stats(self, user: User) -> ReferralStatsResponse:
        profile = await self.ensure_profile(user)
        await self.settle(user.id)
        return await self._stats(
            profile, await self._transactions(user.id), await self._rewards(user.id)
        )

    # ------------------------------------------------------------ mutations

    async def invite(
        self, user: User, channel: str, contact: Optional[str]
    ) -> InviteReferralResponse:
        profile = await self.ensure_profile(user)
        invites = int(profile.get("invites") or 0) + 1
        await database.collection(REFERRALS).update_one(
            {"user_id": user.id},
            {"$set": {"invites": invites, "last_invited_at": utcnow().isoformat()}},
        )
        code = str(profile.get("code"))
        await database.collection(TRANSACTIONS).insert_one(
            {
                "_id": f"inv-{uuid.uuid4().hex[:12]}",
                "kind": "invite",
                "referrer_id": user.id,
                "referee_id": None,
                "channel": channel,
                "contact": contact,
                "code": code,
                "created_at": utcnow().isoformat(),
            }
        )
        return InviteReferralResponse(
            ok=True,
            channel=channel,  # type: ignore[arg-type]
            totalInvites=invites,
            link=_link_for(code),
            shareMessage=_share_message(code),
        )

    async def apply(self, user: User, raw_code: str) -> ApplyReferralResponse:
        profile = await self.ensure_profile(user)
        code = str(raw_code or "").strip().upper()

        if profile.get("applied_code"):
            raise ReferralConflict("You have already applied a referral code.")

        owner = await self.by_code(code)
        if owner is None:
            raise ReferralConflict("That referral code doesn't exist.", 404)
        if not bool(owner.get("active", True)):
            raise ReferralConflict("That referral code is no longer active.")
        if str(owner.get("user_id")) == user.id or code == str(profile.get("code")):
            raise ReferralConflict("You can't use your own referral code.")

        existing = await database.collection(TRANSACTIONS).find_one({"referee_id": user.id})
        if existing is not None:
            raise ReferralConflict("This account has already used a referral code.")

        referrer_id = str(owner.get("user_id"))
        now = utcnow().isoformat()
        transaction_id = f"rtx-{uuid.uuid4().hex[:12]}"
        friend_name = user.display_name or "QuickPress friend"

        await database.collection(TRANSACTIONS).insert_one(
            {
                "_id": transaction_id,
                "kind": "referral",
                "referrer_id": referrer_id,
                "referee_id": user.id,
                "referee_name": friend_name,
                "code": code,
                "status": "pending",
                "created_at": now,
                "completed_at": None,
                "reward_amount": REFERRER_REWARD,
            }
        )
        await database.collection(REFERRALS).update_one(
            {"user_id": user.id},
            {"$set": {"applied_code": code, "referred_by": referrer_id, "applied_at": now}},
        )
        await database.collection(REWARDS).insert_one(
            {
                "_id": f"rwd-{uuid.uuid4().hex[:12]}",
                "user_id": referrer_id,
                "transaction_id": transaction_id,
                "role": "referrer",
                "title": "Referral bonus",
                "description": f"{friend_name} joined with your code",
                "friend_name": friend_name,
                "amount": REFERRER_REWARD,
                "status": "pending",
                "created_at": now,
                "credited_at": None,
            }
        )
        await database.collection(REWARDS).insert_one(
            {
                "_id": f"rwd-{uuid.uuid4().hex[:12]}",
                "user_id": user.id,
                "transaction_id": transaction_id,
                "role": "referee",
                "title": "Welcome referral bonus",
                "description": f"Applied code {code}",
                "friend_name": None,
                "amount": REFEREE_REWARD,
                "status": "pending",
                "created_at": now,
                "credited_at": None,
            }
        )
        # A referee who already completed an order gets credited immediately.
        await self.settle(user.id)
        return ApplyReferralResponse(
            ok=True,
            message=(
                f"Code {code} applied. You'll earn ₹{REFEREE_REWARD} wallet credit "
                "after your first completed order."
            ),
            code=code,
            rewardAmount=REFEREE_REWARD,
            appliedCode=code,
        )


referral_repository = ReferralRepository()
