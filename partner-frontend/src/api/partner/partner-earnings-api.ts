// Partner earnings data layer — backed by the shared mock/live backend.
import { apiGetJson } from "../core/transport";
import type { EarningsSummary } from "@/shared/types/partner";

type RawEarnings = { total: number; orders: number };
type RawTransaction = {
  id: string;
  title: string;
  date: string;
  amount: number;
  direction: "credit" | "debit";
  status: "success" | "pending" | "failed";
  kind: string;
};

export async function fetchEarnings(): Promise<EarningsSummary> {
  const [earnings, transactions] = await Promise.all([
    apiGetJson<RawEarnings>("/api/partner/earnings"),
    apiGetJson<RawTransaction[]>("/api/wallet/transactions"),
  ]);

  const payoutTxns = transactions.filter((txn) => txn.kind === "payout" || txn.kind === "commission");
  const trend = transactions
    .slice(0, 7)
    .reverse()
    .map((txn) => ({ label: txn.date, amount: txn.amount }));

  return {
    today: earnings.total,
    week: earnings.total,
    month: earnings.total,
    pendingPayout: payoutTxns.find((txn) => txn.status === "pending")?.amount ?? 0,
    completedOrders: earnings.orders,
    avgOrderValue: earnings.orders > 0 ? Math.round(earnings.total / earnings.orders) : 0,
    trend,
    payouts: payoutTxns.map((txn) => ({
      id: txn.id,
      date: txn.date,
      amount: txn.amount,
      status: txn.status === "failed" ? "failed" : txn.status === "pending" ? "processing" : "paid",
      utr: txn.id,
    })),
  };
}
