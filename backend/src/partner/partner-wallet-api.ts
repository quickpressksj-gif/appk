// Partner wallet data layer — backed by the shared mock/live backend.
import { apiGetJson, apiPostJson } from "../core/transport";
import type { PartnerWalletSummary, PartnerWalletTransaction } from "@shared/types/partner";

type RawWallet = {
  accountId: string;
  balance: number;
  cashbackBalance: number;
  rewardPoints: number;
  referralCode: string;
  referralEarned: number;
  onHold?: number;
  lifetimeEarned?: number;
  bankLast4?: string;
  autoPayout?: boolean;
};

type RawTransaction = {
  id: string;
  title: string;
  date: string;
  amount: number;
  direction: "credit" | "debit";
  status: "success" | "pending" | "failed";
  kind: string;
};

const TXN_KIND: Record<string, PartnerWalletTransaction["kind"]> = {
  payout: "order-payout",
  commission: "settlement",
  refund: "incentive",
  "order-payment": "order-payout",
  "order-cashback": "incentive",
  "referral-bonus": "incentive",
  "reward-credit": "incentive",
  recharge: "withdrawal",
};

function toWalletTransaction(raw: RawTransaction): PartnerWalletTransaction {
  return {
    id: raw.id,
    title: raw.title,
    date: raw.date,
    amount: raw.amount,
    direction: raw.direction,
    status: raw.status,
    kind: TXN_KIND[raw.kind] ?? "order-payout",
  };
}

export async function fetchPartnerWallet(): Promise<PartnerWalletSummary> {
  const wallet = await apiGetJson<RawWallet | null>("/api/partner/wallet");
  if (!wallet) {
    // No wallet record yet for this partner — show an honest empty state.
    return { availableBalance: 0, onHold: 0, lifetimeEarned: 0, bankLast4: "", autoPayout: false };
  }
  return {
    availableBalance: wallet.balance,
    onHold: wallet.onHold ?? wallet.cashbackBalance,
    lifetimeEarned: wallet.lifetimeEarned ?? wallet.balance + wallet.referralEarned,
    bankLast4: wallet.bankLast4 ?? "",
    autoPayout: wallet.autoPayout ?? true,
  };
}

export async function fetchPartnerWalletTransactions(): Promise<PartnerWalletTransaction[]> {
  const transactions = await apiGetJson<RawTransaction[]>("/api/partner/wallet/transactions");
  return transactions.map(toWalletTransaction);
}

export async function withdrawToBank(amount: number) {
  const wallet = await apiPostJson<RawWallet>("/api/partner/wallet/withdraw", { amount: Math.abs(amount) });
  return { ok: true as const, amount, wallet };
}
