/**
 * Master Wallet, Payouts & Settlement Center API Client
 *
 * GET /api/admin/wallet/all-wallets     — All Customer, Partner, Rider Wallets
 * POST /api/admin/wallet/adjust         — Manual credit/debit with audit trail
 * GET /api/admin/wallet/kpis            — Top financial KPI metrics
 * GET /api/admin/wallet/revenue-split   — Monthly 3-way revenue distribution
 * GET /api/admin/wallet/partner-earnings— Partner store wash earnings
 * GET /api/admin/wallet/rider-earnings  — Captain delivery earnings
 * GET /api/admin/wallet/withdrawals     — Payout requests
 * POST /api/admin/wallet/withdrawals/{id}/approve|reject
 * GET /api/admin/wallet/transactions    — Unified double-entry ledger
 */
import { apiGetJson, apiPostJson } from "@/api/core/transport";
import { type Kpi, type SeriesPoint } from "./client";

export type AccountWallet = {
  id: string;
  name: string;
  role: "customer" | "partner" | "rider";
  phone: string;
  city: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  codCashInHand: number;
  pendingPayout: number;
  status: "Active" | "Suspended";
  bank?: { accountNumber: string; ifsc: string; upi: string } | null;
};

export type Payout = {
  id: string;
  account: string;
  type: "Partner" | "Rider";
  amount: string;
  rawAmount: number;
  requested: string;
  method: string;
  status: "Pending" | "Approved" | "Processing" | "Rejected";
};

export type Transaction = {
  id: string;
  account: string;
  role: string;
  kind: string;
  amount: number;
  date: string;
  status: "Completed" | "Pending" | "Failed";
  refOrder?: string;
};

export type Earning = {
  id: string;
  account: string;
  city: string;
  orders: number;
  gross: string;
  commission: string;
  net: string;
};

const money = (value: number) => `₹${(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export async function fetchAllWallets(): Promise<AccountWallet[]> {
  try {
    const rows = await apiGetJson<AccountWallet[]>("/api/admin/wallet/all-wallets");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export async function adjustWalletBalance(payload: {
  accountId: string;
  role: "customer" | "partner" | "rider";
  amount: number;
  type: "credit" | "debit";
  reason: string;
}) {
  return await apiPostJson<{ accountId: string; previousBalance: number; newBalance: number }>("/api/admin/wallet/adjust", payload);
}

export async function fetchFinanceKpis(): Promise<Kpi[]> {
  try {
    const rows = await apiGetJson<{ id: string; label: string; value: number; positive: boolean }[]>("/api/admin/wallet/kpis");
    return (rows || []).map((r) => ({ id: r.id, label: r.label, value: money(r.value), positive: r.positive }));
  } catch {
    return [];
  }
}

export async function fetchRevenueSplit(): Promise<SeriesPoint[]> {
  try {
    return await apiGetJson<SeriesPoint[]>("/api/admin/wallet/revenue-split");
  } catch {
    return [{ label: "2026-08", value: 492, secondary: 88.56 }];
  }
}

export async function fetchPartnerEarnings(): Promise<Earning[]> {
  try {
    const rows = await apiGetJson<{ id: string; account: string; city: string; orders: number; gross: number; commission: number; net: number }[]>(
      "/api/admin/wallet/partner-earnings",
    );
    return (rows || []).map((r) => ({ ...r, gross: money(r.gross), commission: money(r.commission), net: money(r.net) }));
  } catch {
    return [];
  }
}

export async function fetchRiderEarnings(): Promise<Earning[]> {
  try {
    const rows = await apiGetJson<{ id: string; account: string; city: string; orders: number; gross: number; commission: number; net: number }[]>(
      "/api/admin/wallet/rider-earnings",
    );
    return (rows || []).map((r) => ({ ...r, gross: money(r.gross), commission: money(r.commission), net: money(r.net) }));
  } catch {
    return [];
  }
}

export async function fetchWithdrawRequests(): Promise<Payout[]> {
  try {
    const rows = await apiGetJson<any[]>("/api/admin/wallet/withdrawals");
    return (rows || []).map((r) => ({
      id: r._id || r.id,
      account: r.account || r.accountName || "Account",
      type: (r.role === "rider" || r.kind === "rider" ? "Rider" : "Partner") as "Partner" | "Rider",
      amount: money(r.amount ?? 0),
      rawAmount: Number(r.amount ?? 0),
      requested: (r.createdAt || r.requested || "").slice(0, 10),
      method: r.method || "Bank / UPI",
      status: (r.status as any) || "Pending",
    }));
  } catch {
    return [];
  }
}

export async function fetchRefunds(): Promise<Transaction[]> {
  try {
    const rows = await apiGetJson<any[]>("/api/admin/wallet/refunds");
    return (rows || []).map((r) => ({
      id: r._id || r.id,
      account: r.account || "Customer",
      role: r.role || "customer",
      kind: r.kind || "Refund",
      amount: Number(r.amount ?? 0),
      date: (r.createdAt || "").slice(0, 10),
      status: (r.status as any) || "Completed",
    }));
  } catch {
    return [];
  }
}

export async function fetchTransactions(): Promise<Transaction[]> {
  try {
    const rows = await apiGetJson<any[]>("/api/admin/wallet/transactions");
    return (rows || []).map((r) => ({
      id: r._id || r.id,
      account: r.account || "Account",
      role: r.role || "customer",
      kind: r.kind || "Order Payment",
      amount: Number(r.amount ?? 0),
      date: (r.createdAt || r.date || "").slice(0, 10),
      status: (r.status as any) || "Completed",
      refOrder: r.refOrder,
    }));
  } catch {
    return [];
  }
}

export async function decideWithdrawal(id: string, action: "approve" | "reject") {
  return await apiPostJson<{ ok: boolean; id: string; action: string }>(`/api/admin/wallet/withdrawals/${id}/${action}`);
}
