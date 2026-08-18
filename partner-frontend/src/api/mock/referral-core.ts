/**
 * Mock referral engine — Sprint 2.8.
 *
 * Mirrors the FastAPI contract in `backend-python/app/api/referral.py` so the
 * Referral screen behaves identically with or without VITE_API_BASE_URL:
 *
 *   GET  /api/referral            GET  /api/referral/history
 *   GET  /api/referral/rewards    GET  /api/referral/stats
 *   POST /api/referral/apply      POST /api/referral/invite
 *
 * Business rules enforced: unique code per account, one applied code per
 * account, no self-referral, no duplicate referral, rewards credited only
 * after the referred customer has a delivered order.
 */

import { ApiError } from "../core/errors";
import { getDb } from "./db";

export const REFERRER_REWARD = 50;
export const REFEREE_REWARD = 25;

const SHARE_BASE = "https://quickpress.app/invite";

type MockTransaction = {
  id: string;
  referrerId: string;
  refereeId: string | null;
  refereeName: string;
  code: string;
  status: "pending" | "completed";
  createdAt: string;
  completedAt: string | null;
  rewardAmount: number;
};

type MockReward = {
  id: string;
  userId: string;
  transactionId: string;
  title: string;
  description: string;
  friendName: string | null;
  amount: number;
  status: "pending" | "completed";
  createdAt: string;
  creditedAt: string | null;
};

type MockProfile = {
  userId: string;
  code: string;
  active: boolean;
  invites: number;
  appliedCode: string | null;
};

const profiles = new Map<string, MockProfile>();
const transactions: MockTransaction[] = [];
const rewards: MockReward[] = [];

let seeded = false;
let counter = 0;

const id = (prefix: string) => `${prefix}-${(counter += 1).toString().padStart(4, "0")}`;
const isoAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

function codeFor(name: string): string {
  const slug = String(name || "friend")
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase()
    .slice(0, 5) || "FRIEND";
  let attempt = `QP${slug}${Math.floor(100 + Math.random() * 899)}`;
  const taken = new Set([...profiles.values()].map((profile) => profile.code));
  while (taken.has(attempt)) attempt = `QP${slug}${Math.floor(100 + Math.random() * 899)}`;
  return attempt;
}

export function linkFor(code: string): string {
  return `${SHARE_BASE}/${code}`;
}

export function qrFor(code: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(
    linkFor(code),
  )}`;
}

export function shareMessageFor(code: string): string {
  return `I use QuickPress for laundry and dry cleaning — use my code ${code} and we both earn wallet credit on your first order. ${linkFor(
    code,
  )}`;
}

function profileFor(accountId: string, name = "Customer"): MockProfile {
  const existing = profiles.get(accountId);
  if (existing) return existing;
  const created: MockProfile = {
    userId: accountId,
    code: codeFor(name),
    active: true,
    invites: 0,
    appliedCode: null,
  };
  profiles.set(accountId, created);
  return created;
}

/** A couple of referrals so the dashboard is never empty on first open. */
function seedFor(accountId: string) {
  if (seeded) return;
  seeded = true;
  const profile = profileFor(accountId);
  const completedId = id("rtx");
  const pendingId = id("rtx");
  transactions.push(
    {
      id: completedId,
      referrerId: accountId,
      refereeId: "cus-demo-1",
      refereeName: "Aisha Khan",
      code: profile.code,
      status: "completed",
      createdAt: isoAgo(9),
      completedAt: isoAgo(7),
      rewardAmount: REFERRER_REWARD,
    },
    {
      id: pendingId,
      referrerId: accountId,
      refereeId: "cus-demo-2",
      refereeName: "Rohan Mehta",
      code: profile.code,
      status: "pending",
      createdAt: isoAgo(2),
      completedAt: null,
      rewardAmount: REFERRER_REWARD,
    },
  );
  rewards.push(
    {
      id: id("rwd"),
      userId: accountId,
      transactionId: completedId,
      title: "Referral bonus",
      description: "Aisha Khan joined with your code",
      friendName: "Aisha Khan",
      amount: REFERRER_REWARD,
      status: "completed",
      createdAt: isoAgo(9),
      creditedAt: isoAgo(7),
    },
    {
      id: id("rwd"),
      userId: accountId,
      transactionId: pendingId,
      title: "Referral bonus",
      description: "Rohan Mehta joined with your code",
      friendName: "Rohan Mehta",
      amount: REFERRER_REWARD,
      status: "pending",
      createdAt: isoAgo(2),
      creditedAt: null,
    },
  );
  profile.invites = 4;
}

function hasCompletedOrder(userId: string): boolean {
  return getDb().orders.some(
    (order) =>
      order.customer?.id === userId && ["delivered", "completed"].includes(String(order.status)),
  );
}

/** Credit pending rewards whose referred friend now has a completed order. */
function settle(accountId: string) {
  for (const transaction of transactions) {
    if (transaction.status !== "pending") continue;
    if (transaction.referrerId !== accountId && transaction.refereeId !== accountId) continue;
    if (!transaction.refereeId || !hasCompletedOrder(transaction.refereeId)) continue;
    const now = new Date().toISOString();
    transaction.status = "completed";
    transaction.completedAt = now;
    for (const reward of rewards) {
      if (reward.transactionId !== transaction.id || reward.status === "completed") continue;
      reward.status = "completed";
      reward.creditedAt = now;
    }
  }
}

function historyOf(accountId: string) {
  return transactions
    .filter((item) => item.referrerId === accountId && item.refereeId !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((item) => ({
      id: item.id,
      friendName: item.refereeName,
      joinedAt: item.createdAt,
      status: item.status,
      rewardEarned: item.status === "completed" ? item.rewardAmount : 0,
      completedAt: item.completedAt,
    }));
}

function rewardsOf(accountId: string) {
  return rewards
    .filter((item) => item.userId === accountId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      amount: item.amount,
      status: item.status,
      createdAt: item.createdAt,
      creditedAt: item.creditedAt,
      referralId: item.transactionId,
      friendName: item.friendName,
    }));
}

function statsOf(accountId: string) {
  const history = historyOf(accountId);
  const list = rewardsOf(accountId);
  const earned = list
    .filter((item) => item.status === "completed")
    .reduce((sum, item) => sum + item.amount, 0);
  const pending = list
    .filter((item) => item.status === "pending")
    .reduce((sum, item) => sum + item.amount, 0);
  return {
    totalInvites: Math.max(profileFor(accountId).invites, history.length),
    successfulReferrals: history.filter((item) => item.status === "completed").length,
    pendingReferrals: history.filter((item) => item.status === "pending").length,
    totalRewardsEarned: earned,
    pendingRewards: pending,
    walletRewards: earned,
    referrerReward: REFERRER_REWARD,
    refereeReward: REFEREE_REWARD,
  };
}

export function mockReferralDashboard(accountId: string, name: string) {
  const profile = profileFor(accountId, name);
  seedFor(accountId);
  settle(accountId);
  return {
    code: profile.code,
    link: linkFor(profile.code),
    qrCodeUrl: qrFor(profile.code),
    active: profile.active,
    appliedCode: profile.appliedCode,
    canApply: profile.appliedCode === null,
    shareMessage: shareMessageFor(profile.code),
    stats: statsOf(accountId),
    history: historyOf(accountId),
    rewards: rewardsOf(accountId),
  };
}

export function mockReferralHistory(accountId: string, name: string) {
  profileFor(accountId, name);
  seedFor(accountId);
  settle(accountId);
  const items = historyOf(accountId);
  return { items, total: items.length };
}

export function mockReferralRewards(accountId: string, name: string) {
  profileFor(accountId, name);
  seedFor(accountId);
  settle(accountId);
  const items = rewardsOf(accountId);
  const completed = items
    .filter((item) => item.status === "completed")
    .reduce((sum, item) => sum + item.amount, 0);
  const pending = items
    .filter((item) => item.status === "pending")
    .reduce((sum, item) => sum + item.amount, 0);
  return { items, pendingRewards: pending, completedRewards: completed, walletRewards: completed };
}

export function mockReferralStats(accountId: string, name: string) {
  profileFor(accountId, name);
  seedFor(accountId);
  settle(accountId);
  return statsOf(accountId);
}

export function mockReferralInvite(
  accountId: string,
  name: string,
  channel: string,
  contact?: string,
) {
  const profile = profileFor(accountId, name);
  profile.invites += 1;
  return {
    ok: true,
    channel,
    contact: contact ?? null,
    totalInvites: profile.invites,
    link: linkFor(profile.code),
    shareMessage: shareMessageFor(profile.code),
  };
}

export function mockReferralApply(accountId: string, name: string, rawCode: string) {
  const profile = profileFor(accountId, name);
  const code = String(rawCode ?? "").trim().toUpperCase();

  if (!code) throw new ApiError("validation", "Enter a referral code to continue.", 422);
  if (profile.appliedCode) {
    throw new ApiError("conflict", "You have already applied a referral code.", 409);
  }

  const owner = [...profiles.values()].find((item) => item.code === code);
  const knownDemoCodes = new Set(["QPFRIEND100", "QPWELCOME50"]);
  if (!owner && !knownDemoCodes.has(code)) {
    throw new ApiError("not-found", "That referral code doesn't exist.", 404);
  }
  if (owner && !owner.active) {
    throw new ApiError("conflict", "That referral code is no longer active.", 409);
  }
  if (code === profile.code || owner?.userId === accountId) {
    throw new ApiError("conflict", "You can't use your own referral code.", 409);
  }
  if (transactions.some((item) => item.refereeId === accountId)) {
    throw new ApiError("conflict", "This account has already used a referral code.", 409);
  }

  const now = new Date().toISOString();
  const transactionId = id("rtx");
  profile.appliedCode = code;
  transactions.push({
    id: transactionId,
    referrerId: owner?.userId ?? "cus-referrer",
    refereeId: accountId,
    refereeName: name || "QuickPress friend",
    code,
    status: "pending",
    createdAt: now,
    completedAt: null,
    rewardAmount: REFERRER_REWARD,
  });
  rewards.push({
    id: id("rwd"),
    userId: accountId,
    transactionId,
    title: "Welcome referral bonus",
    description: `Applied code ${code}`,
    friendName: null,
    amount: REFEREE_REWARD,
    status: "pending",
    createdAt: now,
    creditedAt: null,
  });
  settle(accountId);
  return {
    ok: true,
    message: `Code ${code} applied. You'll earn ₹${REFEREE_REWARD} wallet credit after your first completed order.`,
    code,
    rewardAmount: REFEREE_REWARD,
    appliedCode: code,
  };
}
