/**
 * Mock payment, wallet, settlement and admin routes — Phase 5 · Sprint 5.6.
 *
 * Spread into the main mock route table in `server.ts`. Every path here is the
 * exact path the FastAPI service exposes, so switching VITE_API_BASE_URL to the
 * Python backend needs no frontend change.
 */

import type { Account, AccountRole } from "@/shared/types";
import { ApiError } from "../core/errors";
import { demoAccounts } from "./auth-core";
import * as pay from "./payments-core";

type Ctx = {
  params: any;
  query: URLSearchParams;
  body: any;
  token: string | null;
  account: (role?: AccountRole) => Account;
};

type Handler = (ctx: Ctx) => unknown;

function allAccounts(): Account[] {
  return [
    ...demoAccounts("customer"),
    ...demoAccounts("partner"),
    ...demoAccounts("rider"),
  ];
}

function ownerOf(accountId: string): Account | null {
  return pay.accountOf(allAccounts(), accountId);
}

export const paymentRoutes: Array<[string, string, Handler]> = [
  /* ------------------------------- gateway ------------------------------- */
  ["GET", "/api/payments/razorpay/config", () => pay.paymentsConfig()],

  [
    "POST",
    "/api/payments/razorpay/order",
    ({ account, body }) => pay.createOrder(account(), body ?? {}),
  ],

  // Preview-only: stands in for the Razorpay Checkout dialog.
  [
    "POST",
    "/api/payments/razorpay/simulate",
    ({ account, body }) => {
      account();
      const orderId = String(body?.gatewayOrderId ?? "");
      if (!orderId) throw new ApiError("validation", "gatewayOrderId is required.", 400);
      return pay.simulateCheckout(orderId);
    },
  ],

  [
    "POST",
    "/api/payments/razorpay/verify",
    ({ account, body }) => pay.verifyPayment(account(), body ?? {}),
  ],

  [
    "POST",
    "/api/payments/razorpay/failure",
    ({ account, body }) => pay.recordFailure(account(), body ?? {}),
  ],

  ["GET", "/api/payments", ({ account }) => pay.gatewayPayments(account())],
  ["GET", "/api/payments/gateway", ({ account }) => pay.gatewayPayments(account())],

  [
    "GET",
    "/api/payments/:id",
    ({ account, params }) => {
      account();
      const payment = pay.paymentById(params.id);
      if (!payment) throw new ApiError("not-found", "Payment not found.", 404);
      return payment;
    },
  ],

  /* -------------------------------- refunds ------------------------------- */
  [
    "POST",
    "/api/payments/:id/refund",
    ({ account, params, body }) => pay.createRefund(account(), params.id, body ?? {}),
  ],

  [
    "GET",
    "/api/refunds",
    ({ account }) => pay.listRefunds(account().id),
  ],

  [
    "GET",
    "/api/refunds/:id",
    ({ account, params }) => {
      account();
      return pay.refundById(params.id);
    },
  ],

  /* ----------------------------- wallet ledger ---------------------------- */
  [
    "GET",
    "/api/wallet/ledger",
    ({ account, query }) =>
      pay.walletLedger(
        account(),
        Number(query.get("limit") ?? 50),
        query.get("reason") ?? undefined,
      ),
  ],

  ["GET", "/api/wallet/balance", ({ account }) => {
    const me = account();
    pay.seedFor(me);
    return { balance: pay.walletBalance(me.id), currency: "INR" };
  }],

  [
    "POST",
    "/api/wallet/topup",
    ({ account, body }) => {
      const me = account();
      const amount = Number(body?.amount ?? 0);
      if (!(amount > 0)) throw new ApiError("validation", "Enter a top-up amount.", 400);
      // Top-ups are funded through Razorpay, so this creates a gateway order.
      return pay.createOrder(me, { amount, purpose: "Wallet top-up", walletAmount: 0 });
    },
  ],

  [
    "POST",
    "/api/wallet/credit",
    ({ account, body }) =>
      pay.appendLedger(account(), {
        direction: "credit",
        reason: body?.reason ?? "wallet-topup",
        amount: Number(body?.amount ?? 0),
        note: body?.note ?? "Wallet credited",
        reference: body?.reference ?? null,
      }),
  ],

  /* ------------------------------ withdrawals ----------------------------- */
  ["GET", "/api/wallet/withdrawals", ({ account }) => pay.withdrawalsFor(account())],
  [
    "POST",
    "/api/wallet/withdrawals",
    ({ account, body }) => pay.createWithdrawal(account(), body ?? {}),
  ],

  /* ------------------------- earnings & settlements ----------------------- */
  [
    "GET",
    "/api/partner/earnings",
    ({ account }) => {
      const me = account("partner");
      return pay.earningsFor(me, 62, 12_400);
    },
  ],
  ["GET", "/api/partner/settlements", ({ account }) => pay.settlementsFor(account("partner"))],

  [
    "GET",
    "/api/rider/earnings",
    ({ account }) => {
      const me = account("rider");
      return pay.earningsFor(me, 88, 6_200);
    },
  ],
  ["GET", "/api/rider/settlements", ({ account }) => pay.settlementsFor(account("rider"))],
  ["GET", "/api/rider/incentives", ({ account }) => pay.riderIncentives(account("rider"))],

  /* --------------------------------- admin -------------------------------- */
  [
    "GET",
    "/api/admin/payments/dashboard",
    ({ account }) => {
      account("admin");
      return pay.adminDashboard(allAccounts());
    },
  ],

  [
    "GET",
    "/api/admin/settlements",
    ({ account }) => {
      account("admin");
      return pay.allSettlements();
    },
  ],
  [
    "POST",
    "/api/admin/settlements/:id/approve",
    ({ account, params, body }) => {
      account("admin");
      const settlement = pay
        .allSettlements()
        .items.find((item) => item.id === params.id);
      return pay.approveSettlement(
        params.id,
        body?.utr ?? null,
        settlement ? ownerOf(settlement.accountId) : null,
      );
    },
  ],
  [
    "POST",
    "/api/admin/settlements/:id/reject",
    ({ account, params, body }) => {
      account("admin");
      return pay.rejectSettlement(params.id, String(body?.reason ?? ""));
    },
  ],

  [
    "GET",
    "/api/admin/refunds/manage",
    ({ account }) => {
      account("admin");
      return pay.listRefunds();
    },
  ],
  [
    "POST",
    "/api/admin/refunds/:id/approve",
    ({ account, params }) => {
      account("admin");
      const refund = pay.refundById(params.id);
      return pay.approveRefund(params.id, ownerOf(refund.accountId));
    },
  ],
  [
    "POST",
    "/api/admin/refunds/:id/reject",
    ({ account, params, body }) => {
      account("admin");
      return pay.rejectRefund(params.id, String(body?.reason ?? ""));
    },
  ],

  [
    "GET",
    "/api/admin/wallets/monitor",
    ({ account }) => {
      account("admin");
      const accounts = allAccounts();
      accounts.forEach((item) => pay.seedFor(item));
      return pay.walletMonitor(accounts);
    },
  ],

  [
    "GET",
    "/api/admin/withdrawals",
    ({ account }) => {
      account("admin");
      return pay.allWithdrawals();
    },
  ],
  [
    "POST",
    "/api/admin/withdrawals/:id/approve",
    ({ account, params, body }) => {
      account("admin");
      return pay.approveWithdrawal(params.id, body?.reference ?? null);
    },
  ],
  [
    "POST",
    "/api/admin/withdrawals/:id/reject",
    ({ account, params, body }) => {
      account("admin");
      const request = pay.allWithdrawals().items.find((item) => item.id === params.id);
      return pay.rejectWithdrawal(
        params.id,
        String(body?.reason ?? ""),
        request ? ownerOf(request.accountId) : null,
      );
    },
  ],
];
