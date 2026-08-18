/**
 * Admin payment operations data layer — Phase 5 · Sprint 5.6.
 *
 *   GET  /api/admin/payments/dashboard              KPIs + recent payments
 *   GET  /api/admin/settlements                     all settlements
 *   POST /api/admin/settlements/{id}/approve        approve + mark settled
 *   POST /api/admin/settlements/{id}/reject         reject with a reason
 *   GET  /api/admin/refunds/manage                  refund queue
 *   POST /api/admin/refunds/{id}/approve            approve (calls Razorpay refund)
 *   POST /api/admin/refunds/{id}/reject             reject with a reason
 *   GET  /api/admin/wallets/monitor                 wallet float monitoring
 *   GET  /api/admin/withdrawals                     withdrawal queue
 *   POST /api/admin/withdrawals/{id}/approve|reject
 */

import { apiGetJson, apiPostJson } from "../core/transport";
import type {
  AdminPaymentDashboard,
  AdminWalletMonitorRow,
  GatewayRefund,
  Settlement,
  WithdrawalRequest,
} from "@shared/types/payment";

export const ADMIN_PAYMENT_ENDPOINTS = {
  dashboard: "/api/admin/payments/dashboard",
  settlements: "/api/admin/settlements",
  refunds: "/api/admin/refunds/manage",
  wallets: "/api/admin/wallets/monitor",
  withdrawals: "/api/admin/withdrawals",
} as const;

export async function fetchAdminPaymentDashboard(): Promise<AdminPaymentDashboard> {
  return apiGetJson<AdminPaymentDashboard>(ADMIN_PAYMENT_ENDPOINTS.dashboard);
}

export async function fetchAdminSettlements(): Promise<{ items: Settlement[] }> {
  const raw = await apiGetJson<{ items?: Settlement[] }>(ADMIN_PAYMENT_ENDPOINTS.settlements);
  return { items: raw.items ?? [] };
}

export async function approveSettlement(id: string, utr?: string): Promise<Settlement> {
  const raw = await apiPostJson<{ settlement: Settlement }>(
    `${ADMIN_PAYMENT_ENDPOINTS.settlements}/${encodeURIComponent(id)}/approve`,
    { utr: utr ?? null },
  );
  return raw.settlement;
}

export async function rejectSettlement(id: string, reason: string): Promise<Settlement> {
  const raw = await apiPostJson<{ settlement: Settlement }>(
    `${ADMIN_PAYMENT_ENDPOINTS.settlements}/${encodeURIComponent(id)}/reject`,
    { reason },
  );
  return raw.settlement;
}

export async function fetchAdminRefunds(): Promise<{ items: GatewayRefund[] }> {
  const raw = await apiGetJson<{ items?: GatewayRefund[] }>(ADMIN_PAYMENT_ENDPOINTS.refunds);
  return { items: raw.items ?? [] };
}

export async function approveRefund(id: string): Promise<GatewayRefund> {
  const raw = await apiPostJson<{ refund: GatewayRefund }>(
    `/api/admin/refunds/${encodeURIComponent(id)}/approve`,
    {},
  );
  return raw.refund;
}

export async function rejectRefund(id: string, reason: string): Promise<GatewayRefund> {
  const raw = await apiPostJson<{ refund: GatewayRefund }>(
    `/api/admin/refunds/${encodeURIComponent(id)}/reject`,
    { reason },
  );
  return raw.refund;
}

export async function fetchWalletMonitor(): Promise<{ rows: AdminWalletMonitorRow[]; float: number }> {
  const raw = await apiGetJson<{ rows?: AdminWalletMonitorRow[]; float?: number }>(
    ADMIN_PAYMENT_ENDPOINTS.wallets,
  );
  return { rows: raw.rows ?? [], float: raw.float ?? 0 };
}

export async function fetchAdminWithdrawals(): Promise<{ items: WithdrawalRequest[] }> {
  const raw = await apiGetJson<{ items?: WithdrawalRequest[] }>(
    ADMIN_PAYMENT_ENDPOINTS.withdrawals,
  );
  return { items: raw.items ?? [] };
}

export async function approveWithdrawal(id: string, reference?: string): Promise<WithdrawalRequest> {
  const raw = await apiPostJson<{ request: WithdrawalRequest }>(
    `${ADMIN_PAYMENT_ENDPOINTS.withdrawals}/${encodeURIComponent(id)}/approve`,
    { reference: reference ?? null },
  );
  return raw.request;
}

export async function rejectWithdrawal(id: string, reason: string): Promise<WithdrawalRequest> {
  const raw = await apiPostJson<{ request: WithdrawalRequest }>(
    `${ADMIN_PAYMENT_ENDPOINTS.withdrawals}/${encodeURIComponent(id)}/reject`,
    { reason },
  );
  return raw.request;
}
