/**
 * Razorpay + wallet payment data layer — Phase 5 · Sprint 5.6.
 *
 * Endpoint contract (identical in the mock router and FastAPI):
 *
 *   GET  /api/payments/razorpay/config    publishable key + mode
 *   POST /api/payments/razorpay/order     create order (wallet / razorpay / mixed)
 *   POST /api/payments/razorpay/verify    HMAC signature verification
 *   POST /api/payments/razorpay/failure   record a gateway failure
 *   POST /api/payments/{id}/refund        request a refund
 *   GET  /api/refunds/{id}                refund status
 *   GET  /api/payments/gateway            gateway payment history
 *
 * The key secret never leaves the server. The browser only ever sees `keyId`.
 */

import { apiGetJson, apiPostJson } from "../core/transport";
import { ApiError } from "../core/errors";
import { isOnline } from "../customer/api/network";
import { isApiConfigured } from "../customer/api/config";
import {
  envRazorpayKeyId,
  openRazorpayCheckout,
  razorpayMode,
  type CheckoutOutcome,
  type CheckoutProfile,
} from "../core/razorpay";
import type {
  GatewayPayment,
  GatewayRefund,
  PaymentVerificationResult,
  RazorpayConfig,
  RazorpayOrderResult,
  RazorpaySuccessPayload,
} from "@shared/types/payment";

export const RAZORPAY_ENDPOINTS = {
  config: "/api/payments/razorpay/config",
  order: "/api/payments/razorpay/order",
  verify: "/api/payments/razorpay/verify",
  failure: "/api/payments/razorpay/failure",
  gatewayPayments: "/api/payments/gateway",
  simulate: "/api/payments/razorpay/simulate",
  refund: (paymentId: string) => `/api/payments/${encodeURIComponent(paymentId)}/refund`,
  refundStatus: (refundId: string) => `/api/refunds/${encodeURIComponent(refundId)}`,
} as const;

/** GET /api/payments/razorpay/config — publishable key + gateway mode. */
export async function fetchRazorpayConfig(): Promise<RazorpayConfig> {
  try {
    const raw = await apiGetJson<Partial<RazorpayConfig>>(RAZORPAY_ENDPOINTS.config);
    const keyId = (raw.keyId ?? "").trim() || envRazorpayKeyId();
    return {
      keyId,
      enabled: raw.enabled ?? Boolean(keyId),
      currency: raw.currency ?? "INR",
      mode: raw.mode ?? razorpayMode(keyId),
    };
  } catch {
    const keyId = envRazorpayKeyId();
    return { keyId, enabled: Boolean(keyId), currency: "INR", mode: razorpayMode(keyId) };
  }
}

export type CreateOrderInput = {
  /** Total amount payable for the order, in rupees. */
  amount: number;
  orderId?: string | undefined;
  purpose?: string | undefined;
  /** Rupees to take from the wallet first (mixed payment). */
  walletAmount?: number | undefined;
  /** Reuse a saved payment method id (saved payment flow). */
  savedMethodId?: string | undefined;
};

/** POST /api/payments/razorpay/order */
export async function createRazorpayOrder(input: CreateOrderInput): Promise<RazorpayOrderResult> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new ApiError("validation", "Payment amount must be greater than ₹0.");
  }
  if (!isOnline()) throw new ApiError("offline", "Reconnect to start this payment.");

  const raw = await apiPostJson<Partial<RazorpayOrderResult>>(RAZORPAY_ENDPOINTS.order, {
    amount: Number(input.amount.toFixed(2)),
    orderId: input.orderId ?? null,
    purpose: input.purpose ?? "Order payment",
    walletAmount: Number((input.walletAmount ?? 0).toFixed(2)),
    savedMethodId: input.savedMethodId ?? null,
  });

  const walletApplied = raw.walletApplied ?? 0;
  const payableAmount = raw.payableAmount ?? Math.max(0, input.amount - walletApplied);
  const keyId = (raw.keyId ?? "").trim() || envRazorpayKeyId();

  return {
    ok: raw.ok ?? true,
    paymentId: raw.paymentId ?? "",
    gatewayOrderId: raw.gatewayOrderId ?? "",
    keyId,
    currency: raw.currency ?? "INR",
    amount: raw.amount ?? input.amount,
    walletApplied,
    payableAmount,
    amountInPaise: raw.amountInPaise ?? Math.round(payableAmount * 100),
    fullyPaidByWallet: raw.fullyPaidByWallet ?? payableAmount <= 0,
    receipt: raw.receipt ?? "",
    notes: raw.notes ?? {},
  };
}

/** POST /api/payments/razorpay/verify — server-side HMAC SHA256 verification. */
export async function verifyRazorpayPayment(input: {
  paymentId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<PaymentVerificationResult> {
  const raw = await apiPostJson<Partial<PaymentVerificationResult>>(RAZORPAY_ENDPOINTS.verify, {
    paymentId: input.paymentId,
    razorpay_order_id: input.razorpayOrderId,
    razorpay_payment_id: input.razorpayPaymentId,
    razorpay_signature: input.razorpaySignature,
  });
  if (!raw.payment) {
    throw new ApiError("conflict", raw.message ?? "Payment could not be verified.");
  }
  return {
    ok: raw.ok ?? false,
    verified: raw.verified ?? false,
    message: raw.message ?? "Payment verified.",
    payment: raw.payment,
  };
}

/** POST /api/payments/razorpay/failure — persist gateway failures for support. */
export async function recordPaymentFailure(input: {
  paymentId: string;
  reason: string;
  code?: string;
}): Promise<GatewayPayment> {
  const raw = await apiPostJson<{ payment?: GatewayPayment }>(RAZORPAY_ENDPOINTS.failure, {
    paymentId: input.paymentId,
    reason: input.reason,
    code: input.code ?? "payment_failed",
  });
  if (!raw.payment) throw new ApiError("conflict", "Could not record the payment failure.");
  return raw.payment;
}

/** GET /api/payments/gateway — Razorpay/wallet payment history. */
export async function fetchGatewayPayments(): Promise<GatewayPayment[]> {
  const raw = await apiGetJson<{ items?: GatewayPayment[] }>(RAZORPAY_ENDPOINTS.gatewayPayments);
  return raw.items ?? [];
}

/** POST /api/payments/{id}/refund */
export async function requestRefund(input: {
  paymentId: string;
  amount?: number;
  reason: string;
  destination?: "source" | "wallet";
}): Promise<GatewayRefund> {
  if (!input.reason.trim()) throw new ApiError("validation", "Tell us why you need a refund.");
  const raw = await apiPostJson<{ refund?: GatewayRefund }>(
    RAZORPAY_ENDPOINTS.refund(input.paymentId),
    {
      amount: input.amount ?? null,
      reason: input.reason.trim(),
      destination: input.destination ?? "source",
    },
  );
  if (!raw.refund) throw new ApiError("conflict", "Refund could not be created.");
  return raw.refund;
}

/** GET /api/refunds/{id} */
export async function fetchRefundStatus(refundId: string): Promise<GatewayRefund> {
  return apiGetJson<GatewayRefund>(RAZORPAY_ENDPOINTS.refundStatus(refundId));
}

/* ------------------------- end-to-end checkout flow ------------------------ */

/**
 * Mock-mode stand-in for Razorpay Checkout. The mock gateway signs the payload
 * exactly the way Razorpay does, so verification still runs for real.
 */
async function simulateMockCheckout(gatewayOrderId: string): Promise<CheckoutOutcome> {
  try {
    const payload = await apiPostJson<RazorpaySuccessPayload>(RAZORPAY_ENDPOINTS.simulate, {
      gatewayOrderId,
    });
    return { status: "success", payload };
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof ApiError ? error.message : "Payment could not be completed.",
      code: "payment_failed",
    };
  }
}

export type PayResult =
  | { status: "paid"; payment: GatewayPayment; verified: boolean; message: string }
  | { status: "failed"; payment: GatewayPayment | null; message: string; code: string }
  | { status: "cancelled"; payment: GatewayPayment | null; message: string };

/**
 * One call that covers order payment, wallet payment, mixed payment and the
 * saved payment flow:
 *   1. create the order server side (wallet portion debited atomically)
 *   2. open Razorpay Checkout for whatever the wallet did not cover
 *   3. verify the signature server side
 *   4. record failures/cancellations so the UI can show an accurate state
 */
export async function payWithRazorpay(
  input: CreateOrderInput & { profile?: CheckoutProfile; description?: string },
): Promise<PayResult> {
  const order = await createRazorpayOrder(input);

  if (order.fullyPaidByWallet) {
    const payments = await fetchGatewayPayments();
    const payment = payments.find((item) => item.id === order.paymentId) ?? null;
    return {
      status: "paid",
      payment: payment as GatewayPayment,
      verified: true,
      message: "Paid from wallet.",
    };
  }

  // Preview runs against the mock gateway: there is no real Razorpay order to
  // hand to Checkout, so the mock returns the payload Checkout would have.
  const outcome = isApiConfigured()
    ? await openRazorpayCheckout(order, {
        ...(input.description === undefined ? {} : { description: input.description }),
        ...(input.profile === undefined ? {} : { profile: input.profile }),
      })
    : await simulateMockCheckout(order.gatewayOrderId);

  if (outcome.status === "success") {
    const verification = await verifyRazorpayPayment({
      paymentId: order.paymentId,
      razorpayOrderId: outcome.payload.razorpay_order_id,
      razorpayPaymentId: outcome.payload.razorpay_payment_id,
      razorpaySignature: outcome.payload.razorpay_signature,
    });
    if (!verification.verified) {
      return {
        status: "failed",
        payment: verification.payment,
        message: verification.message || "Signature verification failed.",
        code: "signature_mismatch",
      };
    }
    return {
      status: "paid",
      payment: verification.payment,
      verified: true,
      message: verification.message,
    };
  }

  const payment = await recordPaymentFailure({
    paymentId: order.paymentId,
    reason: outcome.reason,
    code: outcome.code,
  }).catch(() => null);

  if (outcome.status === "dismissed") {
    return { status: "cancelled", payment, message: outcome.reason };
  }
  return { status: "failed", payment, message: outcome.reason, code: outcome.code };
}
