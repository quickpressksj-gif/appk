/**
 * Mock Razorpay + wallet ledger engine — Phase 5 · Sprint 5.6.
 *
 * This module is the preview-time stand-in for the production stack:
 *
 *   browser → mock router → payments-core (this file)
 *   browser → FastAPI     → app/api/razorpay.py + payment_repositories.py
 *
 * It reproduces the real contract exactly — order creation, HMAC-style
 * signature verification, failures, refunds, wallet ledger, settlements and
 * withdrawals — so every screen can be built and verified before the live
 * Razorpay keys are wired into the FastAPI service.
 *
 * Nothing here is imported by a screen; it is only reachable through the mock
 * router, exactly like the rest of `backend/src/mock/*`.
 */

import type { Account } from "@shared/types";
import type {
  AdminPaymentDashboard,
  AdminWalletMonitorRow,
  EarningsBreakdown,
  GatewayPayment,
  GatewayRefund,
  LedgerReason,
  RazorpayConfig,
  RazorpayOrderResult,
  RiderIncentive,
  Settlement,
  SettlementResult,
  WalletLedgerEntry,
  WalletLedgerResult,
  WithdrawalRequest,
  WithdrawalResult,
} from "@shared/types/payment";
import { ApiError } from "../core/errors";
import { envRazorpayKeyId, razorpayMode } from "../core/razorpay";

const STORAGE_KEY = "quickpress.mock.payments.v1";
const CURRENCY = "INR";
const MIN_WITHDRAWAL = 100;
const COMMISSION_RATE = 0.18;

type PaymentsStore = {
  payments: GatewayPayment[];
  refunds: GatewayRefund[];
  ledger: WalletLedgerEntry[];
  settlements: Settlement[];
  withdrawals: WithdrawalRequest[];
  /** gatewayOrderId -> the secret the mock gateway "signs" with. */
  orderSecrets: Record<string, string>;
  balances: Record<string, number>;
  seeded: boolean;
};

function emptyStore(): PaymentsStore {
  return {
    payments: [],
    refunds: [],
    ledger: [],
    settlements: [],
    withdrawals: [],
    orderSecrets: {},
    balances: {},
    seeded: false,
  };
}

let store: PaymentsStore | null = null;

function persist() {
  if (typeof localStorage === "undefined" || !store) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* storage full / private mode — keep the in-memory copy */
  }
}

function getStore(): PaymentsStore {
  if (store) return store;
  if (typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        store = { ...emptyStore(), ...(JSON.parse(raw) as PaymentsStore) };
        return store;
      }
    } catch {
      /* fall through to a fresh store */
    }
  }
  store = emptyStore();
  return store;
}

function mutate<T>(fn: (draft: PaymentsStore) => T): T {
  const draft = getStore();
  const result = fn(draft);
  persist();
  return result;
}

/* --------------------------------- utils --------------------------------- */

function nowIso() {
  return new Date().toISOString();
}

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

/**
 * Deterministic stand-in for `HMAC_SHA256(order_id|payment_id, key_secret)`.
 * The mock plays both gateway and verifier, so the same function signs and
 * checks. FastAPI uses the real `hmac.new(...).hexdigest()`.
 */
export function mockSignature(orderId: string, paymentId: string, secret: string): string {
  const input = `${orderId}|${paymentId}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  const material = `${input}::${secret}`;
  for (let index = 0; index < material.length; index += 1) {
    const code = material.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 16777619) >>> 0;
    h2 = Math.imul(h2 + code + index, 2246822519) >>> 0;
  }
  return `${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`.repeat(4);
}

function gatewayKeyId(): string {
  return envRazorpayKeyId();
}

/** The mock never sees the real secret; it signs with a deterministic stub. */
function mockOrderSecret(orderId: string) {
  return `mock-secret::${orderId}`;
}

export function paymentsConfig(): RazorpayConfig {
  const keyId = gatewayKeyId();
  const mode = razorpayMode(keyId);
  return {
    keyId,
    // In preview the mock gateway is always available so payment flows can be
    // exercised end to end; production gates on the real key.
    enabled: true,
    currency: CURRENCY,
    mode: mode === "disabled" ? "test" : mode,
  };
}

/* ------------------------------ wallet ledger ----------------------------- */

function roleOf(account: Account): "customer" | "partner" | "rider" {
  return account.role === "admin" ? "customer" : (account.role as "customer" | "partner" | "rider");
}

export function walletBalance(accountId: string): number {
  return money(getStore().balances[accountId] ?? 0);
}

export function appendLedger(
  account: Account,
  input: {
    direction: "credit" | "debit";
    reason: LedgerReason;
    amount: number;
    note?: string;
    reference?: string | null;
    orderId?: string | null;
    paymentId?: string | null;
    status?: "success" | "pending" | "failed";
  },
): WalletLedgerEntry {
  const amount = money(Math.abs(input.amount));
  return mutate((draft) => {
    const current = draft.balances[account.id] ?? 0;
    if (input.direction === "debit" && amount > current + 0.001) {
      throw new ApiError("validation", "Insufficient wallet balance.", 400);
    }
    const balanceAfter = money(input.direction === "credit" ? current + amount : current - amount);
    draft.balances[account.id] = balanceAfter;
    const createdAt = nowIso();
    const entry: WalletLedgerEntry = {
      id: id("wle"),
      accountId: account.id,
      role: roleOf(account),
      direction: input.direction,
      reason: input.reason,
      amount,
      balanceAfter,
      currency: CURRENCY,
      reference: input.reference ?? null,
      orderId: input.orderId ?? null,
      paymentId: input.paymentId ?? null,
      note: input.note ?? "",
      status: input.status ?? "success",
      createdAt,
      dateLabel: dateLabel(createdAt),
    };
    draft.ledger.unshift(entry);
    return entry;
  });
}

export function walletLedger(account: Account, limit = 50, reason?: string): WalletLedgerResult {
  seedFor(account);
  const draft = getStore();
  const mine = draft.ledger.filter(
    (entry) => entry.accountId === account.id && (!reason || entry.reason === reason),
  );
  const lifetimeCredit = mine
    .filter((entry) => entry.direction === "credit" && entry.status === "success")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const lifetimeDebit = mine
    .filter((entry) => entry.direction === "debit" && entry.status === "success")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const pending = mine
    .filter((entry) => entry.status === "pending")
    .reduce((sum, entry) => sum + entry.amount, 0);
  return {
    entries: mine.slice(0, limit),
    balance: walletBalance(account.id),
    pending: money(pending),
    lifetimeCredit: money(lifetimeCredit),
    lifetimeDebit: money(lifetimeDebit),
    currency: CURRENCY,
  };
}

/* --------------------------------- seeding -------------------------------- */

/** Gives every account a believable starting ledger the first time it is seen. */
export function seedFor(account: Account) {
  const draft = getStore();
  if (draft.balances[account.id] !== undefined) return;
  mutate((state) => {
    const base = account.role === "customer" ? 750 : account.role === "partner" ? 4820 : 2140;
    state.balances[account.id] = base;
    const seededAt = Date.now();
    const rows: Array<[string, LedgerReason, "credit" | "debit", number, number]> = [
      ["Wallet top-up", "wallet-topup", "credit", 1000, 6],
      ["Order payment", "order-payment", "debit", 250, 4],
      ["Refund credited", "refund", "credit", 120, 2],
    ];
    let running = base;
    rows.forEach(([note, reason, direction, amount, daysAgo], index) => {
      const createdAt = new Date(seededAt - daysAgo * 86_400_000).toISOString();
      state.ledger.push({
        id: `wle_seed_${account.id}_${index}`,
        accountId: account.id,
        role: roleOf(account),
        direction,
        reason,
        amount,
        balanceAfter: running,
        currency: CURRENCY,
        reference: null,
        orderId: null,
        paymentId: null,
        note,
        status: "success",
        createdAt,
        dateLabel: dateLabel(createdAt),
      });
      running = money(direction === "credit" ? running - amount : running + amount);
    });
    state.ledger.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (account.role === "partner" || account.role === "rider") {
      const role = account.role;
      for (let week = 1; week <= 3; week += 1) {
        const end = new Date(seededAt - week * 7 * 86_400_000);
        const start = new Date(end.getTime() - 6 * 86_400_000);
        const gross = role === "partner" ? 12_400 - week * 900 : 6_200 - week * 400;
        const commission = money(gross * COMMISSION_RATE);
        const incentives = role === "rider" ? 350 : 0;
        state.settlements.push({
          id: `stl_seed_${account.id}_${week}`,
          accountId: account.id,
          role,
          periodStart: start.toISOString(),
          periodEnd: end.toISOString(),
          periodLabel: `${dateLabel(start.toISOString())} – ${dateLabel(end.toISOString())}`,
          orders: role === "partner" ? 62 - week * 4 : 88 - week * 6,
          grossAmount: gross,
          commission,
          taxDeducted: money(commission * 0.18),
          incentives,
          netAmount: money(gross - commission - commission * 0.18 + incentives),
          status: week === 1 ? "pending" : "settled",
          utr: week === 1 ? null : `UTR${900000 + week}`,
          settledAt: week === 1 ? null : end.toISOString(),
          createdAt: end.toISOString(),
        });
      }
    }
    state.seeded = true;
    return null;
  });
}

/* ----------------------------- razorpay orders ---------------------------- */

export function createOrder(
  account: Account,
  body: {
    amount?: number;
    orderId?: string | null;
    purpose?: string;
    walletAmount?: number;
    savedMethodId?: string | null;
  },
): RazorpayOrderResult {
  seedFor(account);
  const amount = money(Number(body.amount ?? 0));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError("validation", "Payment amount must be greater than ₹0.", 400);
  }
  const requestedWallet = money(Math.max(0, Number(body.walletAmount ?? 0)));
  const walletApplied = money(Math.min(requestedWallet, walletBalance(account.id), amount));
  const payable = money(amount - walletApplied);
  const config = paymentsConfig();
  const createdAt = nowIso();

  const paymentId = id("pay");
  const gatewayOrderId = payable > 0 ? `order_${Math.random().toString(36).slice(2, 16)}` : "";

  const payment: GatewayPayment = {
    id: paymentId,
    orderId: body.orderId ?? null,
    accountId: account.id,
    gateway: walletApplied > 0 && payable > 0 ? "mixed" : payable > 0 ? "razorpay" : "wallet",
    status: payable > 0 ? "created" : "paid",
    amount,
    walletAmount: walletApplied,
    gatewayAmount: payable,
    currency: CURRENCY,
    gatewayOrderId: gatewayOrderId || null,
    gatewayPaymentId: null,
    signatureVerified: payable <= 0,
    purpose: body.purpose ?? "Order payment",
    failureReason: null,
    refundedAmount: 0,
    createdAt,
    updatedAt: createdAt,
  };

  if (walletApplied > 0) {
    appendLedger(account, {
      direction: "debit",
      reason: "order-payment",
      amount: walletApplied,
      note: payable > 0 ? "Wallet share of a mixed payment" : "Wallet payment",
      paymentId,
      orderId: body.orderId ?? null,
      reference: gatewayOrderId || paymentId,
    });
  }

  mutate((draft) => {
    draft.payments.unshift(payment);
    if (gatewayOrderId) draft.orderSecrets[gatewayOrderId] = mockOrderSecret(gatewayOrderId);
    return null;
  });

  return {
    ok: true,
    paymentId,
    gatewayOrderId,
    keyId: config.keyId,
    currency: CURRENCY,
    amount,
    walletApplied,
    payableAmount: payable,
    amountInPaise: Math.round(payable * 100),
    fullyPaidByWallet: payable <= 0,
    receipt: `rcpt_${paymentId}`,
    notes: {
      accountId: account.id,
      purpose: payment.purpose,
      orderId: body.orderId ?? "",
    },
  };
}

/**
 * Preview helper: the mock plays Razorpay Checkout, so it hands the browser
 * the payment id + signature it would have received from the gateway.
 */
export function simulateCheckout(gatewayOrderId: string) {
  const secret = getStore().orderSecrets[gatewayOrderId];
  if (!secret) throw new ApiError("not-found", "Unknown Razorpay order.", 404);
  const razorpayPaymentId = `pay_${Math.random().toString(36).slice(2, 16)}`;
  return {
    razorpay_order_id: gatewayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: mockSignature(gatewayOrderId, razorpayPaymentId, secret),
  };
}

export function verifyPayment(
  account: Account,
  body: {
    paymentId?: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  },
) {
  const draft = getStore();
  const payment = draft.payments.find((item) => item.id === body.paymentId);
  if (!payment) throw new ApiError("not-found", "Payment not found.", 404);

  const orderId = body.razorpay_order_id ?? payment.gatewayOrderId ?? "";
  const razorpayPaymentId = body.razorpay_payment_id ?? "";
  const secret = draft.orderSecrets[orderId] ?? "";
  const expected = mockSignature(orderId, razorpayPaymentId, secret);
  const verified = Boolean(secret) && expected === body.razorpay_signature;

  mutate((state) => {
    const target = state.payments.find((item) => item.id === payment.id);
    if (!target) return null;
    target.gatewayPaymentId = razorpayPaymentId || null;
    target.signatureVerified = verified;
    target.status = verified ? "paid" : "failed";
    target.failureReason = verified ? null : "Signature verification failed.";
    target.updatedAt = nowIso();
    return null;
  });

  if (!verified) {
    // Money already taken from the wallet is returned immediately.
    if (payment.walletAmount > 0) {
      appendLedger(account, {
        direction: "credit",
        reason: "refund",
        amount: payment.walletAmount,
        note: "Wallet share returned after a failed payment",
        paymentId: payment.id,
      });
    }
    return {
      ok: false,
      verified: false,
      message: "Signature verification failed. The payment was not accepted.",
      payment: getStore().payments.find((item) => item.id === payment.id)!,
    };
  }

  return {
    ok: true,
    verified: true,
    message: "Payment verified and captured.",
    payment: getStore().payments.find((item) => item.id === payment.id)!,
  };
}

export function recordFailure(
  account: Account,
  body: { paymentId?: string; reason?: string; code?: string },
) {
  const existing = getStore().payments.find((item) => item.id === body.paymentId);
  if (!existing) throw new ApiError("not-found", "Payment not found.", 404);

  if (existing.walletAmount > 0 && existing.status !== "failed" && existing.status !== "cancelled") {
    appendLedger(account, {
      direction: "credit",
      reason: "refund",
      amount: existing.walletAmount,
      note: "Wallet share returned — gateway payment did not complete",
      paymentId: existing.id,
    });
  }

  return mutate((draft) => {
    const payment = draft.payments.find((item) => item.id === body.paymentId)!;
    payment.status = body.code === "checkout_dismissed" ? "cancelled" : "failed";
    payment.failureReason = body.reason ?? "Payment failed at the gateway.";
    payment.updatedAt = nowIso();
    return { ok: true, payment };
  });
}

export function gatewayPayments(account: Account) {
  seedFor(account);
  return { items: getStore().payments.filter((item) => item.accountId === account.id) };
}

/* --------------------------------- refunds -------------------------------- */

export function createRefund(
  account: Account,
  paymentId: string,
  body: { amount?: number | null; reason?: string; destination?: "source" | "wallet" },
) {
  const payment = getStore().payments.find((item) => item.id === paymentId);
  if (!payment) throw new ApiError("not-found", "Payment not found.", 404);
  if (payment.status !== "paid" && payment.status !== "partially_refunded") {
    throw new ApiError("conflict", "Only captured payments can be refunded.", 409);
  }
  const refundable = money(payment.amount - payment.refundedAmount);
  const amount = money(Math.min(Number(body.amount ?? refundable), refundable));
  if (amount <= 0) throw new ApiError("validation", "Nothing left to refund.", 400);

  const createdAt = nowIso();
  const refund: GatewayRefund = {
    id: id("rfnd"),
    paymentId,
    orderId: payment.orderId,
    accountId: account.id,
    amount,
    reason: body.reason ?? "Customer requested a refund",
    status: "requested",
    gatewayRefundId: null,
    destination: body.destination ?? "source",
    createdAt,
    updatedAt: createdAt,
    dateLabel: dateLabel(createdAt),
    timeline: [{ label: "Refund requested", at: createdAt }],
  };

  return mutate((draft) => {
    draft.refunds.unshift(refund);
    return { ok: true, refund };
  });
}

export function refundById(refundId: string): GatewayRefund {
  const refund = getStore().refunds.find((item) => item.id === refundId);
  if (!refund) throw new ApiError("not-found", "Refund not found.", 404);
  return refund;
}

export function listRefunds(accountId?: string) {
  const items = getStore().refunds.filter((item) => !accountId || item.accountId === accountId);
  return { items };
}

/** Admin approval: marks the Razorpay refund as processed and credits wallets. */
export function approveRefund(refundId: string, walletOwner: Account | null) {
  const refund = refundById(refundId);
  const processedAt = nowIso();

  if (refund.destination === "wallet" && walletOwner) {
    appendLedger(walletOwner, {
      direction: "credit",
      reason: "refund",
      amount: refund.amount,
      note: `Refund for payment ${refund.paymentId}`,
      paymentId: refund.paymentId,
      orderId: refund.orderId,
      reference: refund.id,
    });
  }

  return mutate((draft) => {
    const target = draft.refunds.find((item) => item.id === refundId)!;
    target.status = "processed";
    target.gatewayRefundId = `rfnd_${Math.random().toString(36).slice(2, 14)}`;
    target.updatedAt = processedAt;
    target.timeline.push({ label: "Approved by operations", at: processedAt });
    target.timeline.push({ label: "Refund processed by Razorpay", at: processedAt });

    const payment = draft.payments.find((item) => item.id === target.paymentId);
    if (payment) {
      payment.refundedAmount = money(payment.refundedAmount + target.amount);
      payment.status = payment.refundedAmount >= payment.amount ? "refunded" : "partially_refunded";
      payment.updatedAt = processedAt;
    }
    return { ok: true, refund: target };
  });
}

export function rejectRefund(refundId: string, reason: string) {
  const at = nowIso();
  return mutate((draft) => {
    const target = draft.refunds.find((item) => item.id === refundId);
    if (!target) throw new ApiError("not-found", "Refund not found.", 404);
    target.status = "rejected";
    target.updatedAt = at;
    target.timeline.push({ label: `Rejected — ${reason || "no reason given"}`, at });
    return { ok: true, refund: target };
  });
}

/* ------------------------------- settlements ------------------------------ */

export function settlementsFor(account: Account): SettlementResult {
  seedFor(account);
  const items = getStore()
    .settlements.filter((item) => item.accountId === account.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    items,
    totalSettled: money(
      items.filter((i) => i.status === "settled").reduce((sum, i) => sum + i.netAmount, 0),
    ),
    totalPending: money(
      items.filter((i) => i.status !== "settled" && i.status !== "rejected")
        .reduce((sum, i) => sum + i.netAmount, 0),
    ),
    currency: CURRENCY,
  };
}

export function allSettlements() {
  return { items: getStore().settlements.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
}

export function approveSettlement(settlementId: string, utr: string | null, owner: Account | null) {
  const settlement = getStore().settlements.find((item) => item.id === settlementId);
  if (!settlement) throw new ApiError("not-found", "Settlement not found.", 404);
  if (settlement.status === "settled") {
    throw new ApiError("conflict", "This settlement is already paid out.", 409);
  }
  if (owner) {
    appendLedger(owner, {
      direction: "credit",
      reason: "settlement",
      amount: settlement.netAmount,
      note: `Settlement ${settlement.periodLabel}`,
      reference: utr ?? settlement.id,
    });
  }
  const at = nowIso();
  return mutate((draft) => {
    const target = draft.settlements.find((item) => item.id === settlementId)!;
    target.status = "settled";
    target.utr = utr ?? `UTR${Math.floor(Math.random() * 900000 + 100000)}`;
    target.settledAt = at;
    return { ok: true, settlement: target };
  });
}

export function rejectSettlement(settlementId: string, reason: string) {
  return mutate((draft) => {
    const target = draft.settlements.find((item) => item.id === settlementId);
    if (!target) throw new ApiError("not-found", "Settlement not found.", 404);
    target.status = "rejected";
    target.utr = null;
    void reason;
    return { ok: true, settlement: target };
  });
}

/* ------------------------------- withdrawals ------------------------------ */

export function withdrawalsFor(account: Account): WithdrawalResult {
  seedFor(account);
  const items = getStore()
    .withdrawals.filter((item) => item.accountId === account.id)
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  return {
    items,
    available: walletBalance(account.id),
    pendingAmount: money(
      items.filter((i) => i.status === "requested" || i.status === "approved" || i.status === "processing")
        .reduce((sum, i) => sum + i.amount, 0),
    ),
    minimumAmount: MIN_WITHDRAWAL,
    currency: CURRENCY,
  };
}

export function createWithdrawal(
  account: Account,
  body: { amount?: number; method?: "bank" | "upi"; destination?: string },
) {
  seedFor(account);
  const amount = money(Number(body.amount ?? 0));
  if (amount < MIN_WITHDRAWAL) {
    throw new ApiError("validation", `Minimum withdrawal is ₹${MIN_WITHDRAWAL}.`, 400);
  }
  if (amount > walletBalance(account.id)) {
    throw new ApiError("validation", "Withdrawal exceeds the available balance.", 400);
  }

  // Money is held immediately so it cannot be spent twice.
  appendLedger(account, {
    direction: "debit",
    reason: "withdrawal",
    amount,
    note: "Withdrawal requested",
    status: "pending",
  });

  const requestedAt = nowIso();
  const request: WithdrawalRequest = {
    id: id("wdr"),
    accountId: account.id,
    role: account.role === "rider" ? "rider" : "partner",
    amount,
    method: body.method ?? "bank",
    destination: body.destination ?? "Primary bank account",
    status: "requested",
    requestedAt,
    processedAt: null,
    rejectionReason: null,
    reference: null,
    dateLabel: dateLabel(requestedAt),
  };

  return mutate((draft) => {
    draft.withdrawals.unshift(request);
    return { ok: true, request };
  });
}

export function allWithdrawals() {
  return {
    items: getStore().withdrawals.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
  };
}

export function approveWithdrawal(withdrawalId: string, reference: string | null) {
  const at = nowIso();
  return mutate((draft) => {
    const target = draft.withdrawals.find((item) => item.id === withdrawalId);
    if (!target) throw new ApiError("not-found", "Withdrawal not found.", 404);
    target.status = "paid";
    target.processedAt = at;
    target.reference = reference ?? `NEFT${Math.floor(Math.random() * 900000 + 100000)}`;
    const held = draft.ledger.find(
      (entry) =>
        entry.accountId === target.accountId &&
        entry.reason === "withdrawal" &&
        entry.status === "pending" &&
        entry.amount === target.amount,
    );
    if (held) held.status = "success";
    return { ok: true, request: target };
  });
}

export function rejectWithdrawal(withdrawalId: string, reason: string, owner: Account | null) {
  const target = getStore().withdrawals.find((item) => item.id === withdrawalId);
  if (!target) throw new ApiError("not-found", "Withdrawal not found.", 404);
  if (owner) {
    appendLedger(owner, {
      direction: "credit",
      reason: "adjustment",
      amount: target.amount,
      note: `Withdrawal rejected — ${reason || "no reason given"}`,
      reference: target.id,
    });
  }
  const at = nowIso();
  return mutate((draft) => {
    const row = draft.withdrawals.find((item) => item.id === withdrawalId)!;
    row.status = "rejected";
    row.rejectionReason = reason || "Rejected by operations";
    row.processedAt = at;
    const held = draft.ledger.find(
      (entry) =>
        entry.accountId === row.accountId &&
        entry.reason === "withdrawal" &&
        entry.status === "pending" &&
        entry.amount === row.amount,
    );
    if (held) held.status = "failed";
    return { ok: true, request: row };
  });
}

/* -------------------------------- earnings -------------------------------- */

export function earningsFor(account: Account, orders: number, gross: number): EarningsBreakdown {
  seedFor(account);
  const settlements = settlementsFor(account);
  const day = 86_400_000;
  const ledger = getStore().ledger.filter(
    (entry) => entry.accountId === account.id && entry.direction === "credit",
  );
  const since = (ms: number) =>
    money(
      ledger
        .filter((entry) => Date.now() - new Date(entry.createdAt).getTime() <= ms)
        .reduce((sum, entry) => sum + entry.amount, 0),
    );
  const series = Array.from({ length: 7 }, (_, index) => {
    const at = new Date(Date.now() - (6 - index) * day);
    return {
      label: at.toLocaleDateString("en-IN", { weekday: "short" }),
      amount: money((gross / 7) * (0.7 + ((index * 13) % 7) / 10)),
    };
  });
  return {
    today: since(day) || money(gross / 30),
    week: since(7 * day) || money(gross / 4),
    month: since(30 * day) || gross,
    lifetime: money(gross + settlements.totalSettled),
    orders,
    averagePerOrder: orders > 0 ? money(gross / orders) : 0,
    commissionRate: COMMISSION_RATE,
    pendingSettlement: settlements.totalPending,
    currency: CURRENCY,
    series,
  };
}

export function riderIncentives(account: Account): { items: RiderIncentive[] } {
  seedFor(account);
  const expires = new Date(Date.now() + 3 * 86_400_000).toISOString();
  return {
    items: [
      {
        id: "inc-daily",
        title: "Complete 12 deliveries today",
        description: "Finish 12 deliveries before midnight to unlock the daily bonus.",
        target: 12,
        progress: 7,
        reward: 150,
        status: "active",
        expiresAt: expires,
      },
      {
        id: "inc-weekend",
        title: "Weekend surge streak",
        description: "Stay online for 6 hours on Saturday and Sunday.",
        target: 12,
        progress: 12,
        reward: 400,
        status: "completed",
        expiresAt: expires,
      },
      {
        id: "inc-rating",
        title: "Keep a 4.8+ rating",
        description: "Maintain a 4.8 rating across 40 deliveries this week.",
        target: 40,
        progress: 26,
        reward: 250,
        status: "active",
        expiresAt: expires,
      },
    ],
  };
}

/* --------------------------------- admin ---------------------------------- */

export function adminDashboard(accounts: Account[]): AdminPaymentDashboard {
  const draft = getStore();
  const captured = draft.payments.filter((item) => item.status === "paid" || item.status === "partially_refunded");
  const failed = draft.payments.filter((item) => item.status === "failed");
  const refunded = draft.refunds.filter((item) => item.status === "processed");
  const grossVolume = money(captured.reduce((sum, item) => sum + item.amount, 0));
  const total = captured.length + failed.length;
  const walletFloat = money(
    Object.values(draft.balances).reduce((sum, value) => sum + value, 0),
  );
  const day = 86_400_000;
  const series = Array.from({ length: 7 }, (_, index) => {
    const from = Date.now() - (6 - index) * day;
    const label = new Date(from).toLocaleDateString("en-IN", { weekday: "short" });
    const inWindow = (iso: string) => Math.abs(new Date(iso).getTime() - from) < day / 2;
    return {
      label,
      captured: money(
        captured.filter((item) => inWindow(item.createdAt)).reduce((s, i) => s + i.amount, 0),
      ),
      refunded: money(
        refunded.filter((item) => inWindow(item.createdAt)).reduce((s, i) => s + i.amount, 0),
      ),
    };
  });

  void accounts;
  return {
    kpis: {
      grossVolume,
      successfulPayments: captured.length,
      failedPayments: failed.length,
      successRate: total > 0 ? Math.round((captured.length / total) * 100) : 100,
      refundedAmount: money(refunded.reduce((sum, item) => sum + item.amount, 0)),
      refundCount: draft.refunds.length,
      walletFloat,
      pendingSettlements: draft.settlements.filter((item) => item.status === "pending").length,
      pendingWithdrawals: draft.withdrawals.filter((item) => item.status === "requested").length,
      currency: CURRENCY,
    },
    recentPayments: draft.payments.slice(0, 12),
    gatewayMode: paymentsConfig().mode,
    series,
  };
}

export function walletMonitor(accounts: Account[]): { rows: AdminWalletMonitorRow[]; float: number } {
  const draft = getStore();
  const rows: AdminWalletMonitorRow[] = accounts
    .filter((account) => account.role !== "admin")
    .map((account) => {
      const mine = draft.ledger.filter((entry) => entry.accountId === account.id);
      const credit = money(
        mine.filter((e) => e.direction === "credit").reduce((s, e) => s + e.amount, 0),
      );
      const debit = money(
        mine.filter((e) => e.direction === "debit").reduce((s, e) => s + e.amount, 0),
      );
      const balance = walletBalance(account.id);
      return {
        accountId: account.id,
        name: account.name,
        role: roleOf(account),
        balance,
        pending: money(
          mine.filter((e) => e.status === "pending").reduce((s, e) => s + e.amount, 0),
        ),
        lifetimeCredit: credit,
        lifetimeDebit: debit,
        lastActivityAt: mine[0]?.createdAt ?? null,
        flagged: balance > 50_000 || balance < 0,
      };
    })
    .sort((a, b) => b.balance - a.balance);
  return { rows, float: money(rows.reduce((sum, row) => sum + row.balance, 0)) };
}

export function accountOf(accounts: Account[], accountId: string): Account | null {
  return accounts.find((account) => account.id === accountId) ?? null;
}

export function paymentById(paymentId: string): GatewayPayment | null {
  return getStore().payments.find((item) => item.id === paymentId) ?? null;
}

/** Developer/test helper — wipes the payment sandbox. */
export function resetPaymentsStore() {
  store = emptyStore();
  persist();
  return { ok: true };
}
