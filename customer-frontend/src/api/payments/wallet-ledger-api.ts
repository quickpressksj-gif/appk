/**
 * Wallet ledger, settlement and withdrawal data layer — Phase 5 · Sprint 5.6.
 *
 * Shared by customer, partner, rider and admin apps:
 *
 *   GET  /api/wallet/ledger                       wallet ledger for the caller
 *   POST /api/wallet/credit                       credit (topup / refund / incentive)
 *   POST /api/wallet/debit                        debit (order payment / withdrawal)
 *   GET  /api/partner/earnings/summary            partner earnings breakdown
 *   GET  /api/partner/settlements                 partner settlement history
 *   GET  /api/partner/withdrawals                 partner withdrawal requests
 *   POST /api/partner/withdrawals                 raise a withdrawal request
 *   GET  /api/rider/earnings/summary              rider earnings breakdown
 *   GET  /api/rider/incentives                    rider incentives
 *   GET  /api/rider/settlements                   rider settlement history
 *   GET  /api/rider/withdrawals                   rider withdrawal requests
 *   POST /api/rider/withdrawals                   raise a withdrawal request
 */

import { apiGetJson, apiPostJson } from "../core/transport";
import { ApiError } from "../core/errors";
import type {
  EarningsBreakdown,
  LedgerReason,
  RiderIncentive,
  SettlementResult,
  WalletLedgerEntry,
  WalletLedgerResult,
  WithdrawalRequest,
  WithdrawalResult,
} from "@/shared/types/payment";

export const WALLET_ENDPOINTS = {
  ledger: "/api/wallet/ledger",
  credit: "/api/wallet/credit",
  debit: "/api/wallet/debit",
  partnerEarnings: "/api/partner/earnings/summary",
  partnerSettlements: "/api/partner/settlements",
  partnerWithdrawals: "/api/partner/withdrawals",
  riderEarnings: "/api/rider/earnings/summary",
  riderIncentives: "/api/rider/incentives",
  riderSettlements: "/api/rider/settlements",
  riderWithdrawals: "/api/rider/withdrawals",
} as const;

const EMPTY_LEDGER: WalletLedgerResult = {
  entries: [],
  balance: 0,
  pending: 0,
  lifetimeCredit: 0,
  lifetimeDebit: 0,
  currency: "INR",
};

function toLedger(raw: Partial<WalletLedgerResult>): WalletLedgerResult {
  return {
    entries: raw.entries ?? [],
    balance: raw.balance ?? 0,
    pending: raw.pending ?? 0,
    lifetimeCredit: raw.lifetimeCredit ?? 0,
    lifetimeDebit: raw.lifetimeDebit ?? 0,
    currency: raw.currency ?? "INR",
  };
}

/** GET /api/wallet/ledger — full wallet ledger for the caller. */
export async function fetchWalletLedger(
  options: { limit?: number; reason?: LedgerReason } = {},
): Promise<WalletLedgerResult> {
  try {
    const raw = await apiGetJson<Partial<WalletLedgerResult>>(WALLET_ENDPOINTS.ledger, {
      params: { limit: options.limit ?? 50, reason: options.reason ?? "" },
    });
    return toLedger(raw);
  } catch (error) {
    if (error instanceof ApiError && error.kind === "not-found") return EMPTY_LEDGER;
    throw error;
  }
}

/** POST /api/wallet/credit — wallet top-up, refund credit or incentive credit. */
export async function creditWallet(input: {
  amount: number;
  reason: LedgerReason;
  note?: string;
  reference?: string;
  orderId?: string;
}): Promise<{ entry: WalletLedgerEntry; balance: number }> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new ApiError("validation", "Credit amount must be greater than ₹0.");
  }
  return apiPostJson(WALLET_ENDPOINTS.credit, {
    amount: input.amount,
    reason: input.reason,
    note: input.note ?? "",
    reference: input.reference ?? null,
    orderId: input.orderId ?? null,
  });
}

/** POST /api/wallet/debit — order payment or withdrawal debit (never below ₹0). */
export async function debitWallet(input: {
  amount: number;
  reason: LedgerReason;
  note?: string;
  reference?: string;
  orderId?: string;
}): Promise<{ entry: WalletLedgerEntry; balance: number }> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new ApiError("validation", "Debit amount must be greater than ₹0.");
  }
  return apiPostJson(WALLET_ENDPOINTS.debit, {
    amount: input.amount,
    reason: input.reason,
    note: input.note ?? "",
    reference: input.reference ?? null,
    orderId: input.orderId ?? null,
  });
}

/* -------------------------------- partner -------------------------------- */

export async function fetchPartnerEarnings(): Promise<EarningsBreakdown> {
  return apiGetJson<EarningsBreakdown>(WALLET_ENDPOINTS.partnerEarnings);
}

export async function fetchPartnerSettlements(): Promise<SettlementResult> {
  return apiGetJson<SettlementResult>(WALLET_ENDPOINTS.partnerSettlements);
}

export async function fetchPartnerWithdrawals(): Promise<WithdrawalResult> {
  return apiGetJson<WithdrawalResult>(WALLET_ENDPOINTS.partnerWithdrawals);
}

export async function requestPartnerWithdrawal(input: {
  amount: number;
  method: "bank" | "upi";
  destination?: string;
}): Promise<WithdrawalRequest> {
  return submitWithdrawal(WALLET_ENDPOINTS.partnerWithdrawals, input);
}

/* --------------------------------- rider --------------------------------- */

export async function fetchRiderEarnings(): Promise<EarningsBreakdown> {
  return apiGetJson<EarningsBreakdown>(WALLET_ENDPOINTS.riderEarnings);
}

export async function fetchRiderIncentives(): Promise<RiderIncentive[]> {
  const raw = await apiGetJson<{ items?: RiderIncentive[] }>(WALLET_ENDPOINTS.riderIncentives);
  return raw.items ?? [];
}

export async function fetchRiderSettlements(): Promise<SettlementResult> {
  return apiGetJson<SettlementResult>(WALLET_ENDPOINTS.riderSettlements);
}

export async function fetchRiderWithdrawals(): Promise<WithdrawalResult> {
  return apiGetJson<WithdrawalResult>(WALLET_ENDPOINTS.riderWithdrawals);
}

export async function requestRiderWithdrawal(input: {
  amount: number;
  method: "bank" | "upi";
  destination?: string;
}): Promise<WithdrawalRequest> {
  return submitWithdrawal(WALLET_ENDPOINTS.riderWithdrawals, input);
}

async function submitWithdrawal(
  endpoint: string,
  input: { amount: number; method: "bank" | "upi"; destination?: string },
): Promise<WithdrawalRequest> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new ApiError("validation", "Enter an amount greater than ₹0.");
  }
  const raw = await apiPostJson<{ request?: WithdrawalRequest }>(endpoint, {
    amount: input.amount,
    method: input.method,
    destination: input.destination ?? "",
  });
  if (!raw.request) throw new ApiError("conflict", "Withdrawal request could not be created.");
  return raw.request;
}
