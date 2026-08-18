// Real rider wallet data — composed from the live backend endpoints.
// today/week/month earnings are derived deterministically from the real
// wallet transaction ledger; there is no such breakdown on the backend.
import {
  fetchRiderTransactions,
  fetchRiderWallet,
  withdrawRiderEarnings,
} from "@/api/rider/rider-wallet-api";
import { fetchRiderProfile } from "@/api/rider/rider-profile-api";
import type { RiderTransaction } from "@/shared/types/rider";

import {
  type BankAccount,
  type IncentiveCard,
  type TransactionType,
  type WalletSummary,
  type WalletTransaction,
} from "./rider-wallet-mock";

export type WalletData = {
  summary: WalletSummary;
  transactions: WalletTransaction[];
  bank: BankAccount;
  /** No GET /api/rider/incentives endpoint exists on the backend — always
   * empty. Screens must show an honest "not available" state instead of
   * fabricating incentive data. */
  incentives: IncentiveCard[];
  incentivesAvailable: false;
};

const CREDIT_KIND: Record<RiderTransaction["kind"], TransactionType> = {
  trip: "credit",
  incentive: "incentive",
  tip: "tip",
  withdrawal: "settlement",
  penalty: "debit",
};

const CREDIT_TYPES: TransactionType[] = ["credit", "incentive", "tip", "refund"];

function isoDateOf(raw: string): string {
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? raw.slice(0, 10) : parsed.toISOString().slice(0, 10);
}

function toWalletTransaction(txn: RiderTransaction): WalletTransaction {
  const parsed = new Date(txn.date);
  const valid = !Number.isNaN(parsed.getTime());
  const type = CREDIT_KIND[txn.kind] ?? (txn.direction === "credit" ? "credit" : "debit");
  return {
    id: txn.id,
    referenceId: txn.id,
    title: txn.title,
    subtitle: txn.direction === "credit" ? "Credited to wallet" : "Debited from wallet",
    type,
    amount: txn.amount,
    date: valid
      ? parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : txn.date,
    time: valid ? parsed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "",
    isoDate: isoDateOf(txn.date),
    status: txn.status === "pending" ? "pending" : "success",
  };
}

function isoDaysAgo(days: number): string {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff.toISOString().slice(0, 10);
}

/** Deterministic sum of credit-type transactions within a real date window —
 * never fabricated. */
function sumSince(transactions: WalletTransaction[], cutoffIsoDate: string): number {
  return transactions
    .filter((row) => CREDIT_TYPES.includes(row.type) && row.isoDate >= cutoffIsoDate)
    .reduce((sum, row) => sum + row.amount, 0);
}

/** Loads the real rider wallet. Fields with no backend source (settlement
 * schedule, branch, account holder name beyond the profile name) are shown
 * as "Not available" instead of fabricated placeholder data. */
export async function loadWalletData(): Promise<WalletData> {
  const [wallet, rawTransactions, profile] = await Promise.all([
    fetchRiderWallet(),
    fetchRiderTransactions().catch(() => [] as RiderTransaction[]),
    fetchRiderProfile().catch(() => null),
  ]);

  const transactions = rawTransactions
    .map(toWalletTransaction)
    .sort((a, b) => (a.isoDate < b.isoDate ? 1 : -1));

  const today = isoDaysAgo(0);
  const summary: WalletSummary = {
    currentBalance: wallet.availableBalance,
    todayEarnings: sumSince(transactions, today),
    weeklyEarnings: sumSince(transactions, isoDaysAgo(7)),
    monthlyEarnings: sumSince(transactions, isoDaysAgo(30)),
    pendingSettlement: wallet.pendingSettlement,
    lifetimeEarnings: wallet.lifetimeEarnings,
    lastSettlementOn: "Not available",
    nextSettlementOn: "Not available",
    minimumWithdraw: 100,
    settlementWindow: "Not available",
  };

  const bank: BankAccount = {
    bankName: profile?.bankName || "Not available",
    accountHolder: profile?.fullName || "Not available",
    accountNumber: profile?.accountLast4 ? `XXXXXXXX${profile.accountLast4}` : "",
    ifsc: profile?.ifsc || "Not available",
    branch: "Not available",
    verified: profile?.kycStatus === "verified",
  };

  return { summary, transactions, bank, incentives: [], incentivesAvailable: false };
}

export { withdrawRiderEarnings };
