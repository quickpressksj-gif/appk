// Rider wallet data layer — backed by the live FastAPI backend.
import { apiGetJson, apiPostJson } from "../core/transport";
import type { RiderTransaction } from "@shared/types/rider";

export type RiderWalletDetail = {
  availableBalance: number;
  pendingSettlement: number;
  lifetimeEarnings: number;
};

type RawWallet = {
  accountId?: string;
  balance: number;
  pending?: number;
  lifetimeEarnings?: number;
  bankLast4?: string;
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

const TXN_KIND: Record<string, RiderTransaction["kind"]> = {
  payout: "trip",
  commission: "incentive",
  refund: "tip",
  "order-payment": "trip",
  "order-cashback": "tip",
  "referral-bonus": "incentive",
  "reward-credit": "incentive",
  recharge: "withdrawal",
  withdrawal: "withdrawal",
};

/** GET /api/rider/wallet — the real wallet balance/ledger snapshot.
 * There is no `today/week/month` breakdown on the backend; those are
 * derived client-side from real transactions in rider-wallet-adapter.ts. */
export async function fetchRiderWallet(): Promise<RiderWalletDetail> {
  const wallet = await apiGetJson<RawWallet>("/api/rider/wallet");
  return {
    availableBalance: wallet.balance,
    pendingSettlement: wallet.pending ?? 0,
    lifetimeEarnings: wallet.lifetimeEarnings ?? 0,
  };
}

export async function fetchRiderTransactions(): Promise<RiderTransaction[]> {
  const transactions = await apiGetJson<RawTransaction[]>("/api/rider/wallet/transactions");
  return transactions
    .filter((txn) => txn.status !== "failed")
    .map((txn) => ({
      id: txn.id,
      title: txn.title,
      date: txn.date,
      amount: txn.amount,
      direction: txn.direction,
      status: txn.status === "pending" ? "pending" : "success",
      kind: TXN_KIND[txn.kind] ?? "trip",
    }));
}

export async function withdrawRiderEarnings(amount: number) {
  await apiPostJson<{ ok: true }>("/api/rider/wallet/withdraw", { amount: Math.abs(amount) });
  return { ok: true as const, amount };
}
