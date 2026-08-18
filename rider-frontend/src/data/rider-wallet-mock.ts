/**
 * Types + presentational helpers for the Rider Wallet & Earnings module.
 * Real data is loaded via rider-wallet-adapter.ts — no fabricated values here.
 */

export type WalletRangeId = "today" | "week" | "month" | "custom";

export type WalletSummary = {
  currentBalance: number;
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  pendingSettlement: number;
  lifetimeEarnings: number;
  lastSettlementOn: string;
  nextSettlementOn: string;
  minimumWithdraw: number;
  settlementWindow: string;
};

export type EarningsKpi = {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  hint: string;
  tone: "primary" | "green" | "muted";
};

export type TransactionType =
  | "credit"
  | "debit"
  | "incentive"
  | "tip"
  | "settlement"
  | "refund";

export type TransactionStatus = "success" | "pending" | "failed";

export type WalletTransaction = {
  id: string;
  referenceId: string;
  title: string;
  subtitle: string;
  type: TransactionType;
  amount: number;
  date: string;
  time: string;
  isoDate: string;
  status: TransactionStatus;
};

export type IncentiveCard = {
  id: string;
  title: string;
  description: string;
  reward: number;
  current: number;
  target: number;
  unit: string;
  expiresIn: string;
  tone: "primary" | "green" | "amber";
};

export type BankAccount = {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  verified: boolean;
};

export const WALLET_RANGES: { id: WalletRangeId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "custom", label: "Custom Range" },
];

export const TRANSACTION_TYPES: { id: TransactionType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "credit", label: "Credit" },
  { id: "debit", label: "Debit" },
  { id: "incentive", label: "Incentive" },
  { id: "tip", label: "Tip" },
  { id: "settlement", label: "Settlement" },
  { id: "refund", label: "Refund" },
];

/** Masks all but the last four digits. */
export function maskAccountNumber(value: string) {
  if (!value) return "—";
  const last4 = value.slice(-4);
  return `${"•".repeat(Math.max(value.length - 4, 4))}${last4}`;
}

export function formatINR(amount: number, decimals = 0) {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function isoDaysAgo(days: number): string {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff.toISOString().slice(0, 10);
}

/** Range + type filtering for the transaction list — computed against the
 * real current date, never a fabricated fixed window. */
export function filterTransactions(
  rows: WalletTransaction[],
  range: WalletRangeId,
  type: TransactionType | "all",
  customFrom?: string,
  customTo?: string,
) {
  const cutoff = range === "today" ? isoDaysAgo(0) : range === "week" ? isoDaysAgo(7) : isoDaysAgo(30);
  return rows.filter((row) => {
    if (type !== "all" && row.type !== type) return false;
    if (range === "custom") {
      if (customFrom && row.isoDate < customFrom) return false;
      if (customTo && row.isoDate > customTo) return false;
      return true;
    }
    return row.isoDate >= cutoff;
  });
}
