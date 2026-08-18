/** GET/POST /api/admin/wallet/* — real finance data from the shared backend. */
import { apiGetJson, apiPostJson } from "@/api/core/transport";

import { type Kpi, type SeriesPoint } from "./client";

export type Payout = {
  id: string;
  account: string;
  type: "Partner" | "Rider";
  amount: string;
  requested: string;
  method: string;
  status: "Pending" | "Approved" | "Processing" | "Rejected";
};

export type Transaction = {
  id: string;
  party: string;
  kind: "Order" | "Payout" | "Refund" | "Commission";
  amount: string;
  date: string;
  status: "Settled" | "Pending" | "Failed";
};

export type Earning = { id: string; account: string; city: string; orders: number; gross: string; commission: string; net: string };

const money = (value: number) => `₹${(value ?? 0).toLocaleString("en-IN")}`;

export async function fetchFinanceKpis(): Promise<Kpi[]> {
  const rows = await apiGetJson<{ id: string; label: string; value: number; positive: boolean }[]>("/api/admin/wallet/kpis");
  return rows.map((r) => ({ id: r.id, label: r.label, value: money(r.value), positive: r.positive }));
}

export async function fetchRevenueSplit(): Promise<SeriesPoint[]> {
  return apiGetJson<SeriesPoint[]>("/api/admin/wallet/revenue-split");
}

export async function fetchPartnerEarnings(): Promise<Earning[]> {
  const rows = await apiGetJson<{ id: string; account: string; city: string; orders: number; gross: number; commission: number; net: number }[]>(
    "/api/admin/wallet/partner-earnings",
  );
  return rows.map((r) => ({ ...r, gross: money(r.gross), commission: money(r.commission), net: money(r.net) }));
}

export async function fetchRiderEarnings(): Promise<Earning[]> {
  const rows = await apiGetJson<{ id: string; account: string; city: string; orders: number; gross: number; commission: number; net: number }[]>(
    "/api/admin/wallet/rider-earnings",
  );
  return rows.map((r) => ({ ...r, gross: money(r.gross), commission: money(r.commission), net: money(r.net) }));
}

type BackendPayout = { _id: string; accountName?: string; kind?: string; amount?: number; createdAt?: string; method?: string; status?: string };

function toPayout(row: BackendPayout): Payout {
  return {
    id: row._id,
    account: row.accountName ?? row._id,
    type: (row.kind === "rider" ? "Rider" : "Partner") as "Partner" | "Rider",
    amount: money(row.amount ?? 0),
    requested: row.createdAt ?? "—",
    method: row.method ?? "—",
    status: (row.status as Payout["status"]) ?? "Pending",
  };
}

export async function fetchWithdrawRequests(): Promise<Payout[]> {
  const rows = await apiGetJson<BackendPayout[]>("/api/admin/wallet/withdrawals");
  return rows.map(toPayout);
}

type BackendTransaction = { _id: string; party?: string; kind?: string; amount?: number; createdAt?: string; status?: string };

function toTransaction(row: BackendTransaction): Transaction {
  return {
    id: row._id,
    party: row.party ?? "—",
    kind: (row.kind as Transaction["kind"]) ?? "Order",
    amount: money(row.amount ?? 0),
    date: row.createdAt ?? "—",
    status: (row.status as Transaction["status"]) ?? "Pending",
  };
}

export async function fetchRefunds(): Promise<Transaction[]> {
  const rows = await apiGetJson<BackendTransaction[]>("/api/admin/wallet/refunds");
  return rows.map(toTransaction);
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const rows = await apiGetJson<BackendTransaction[]>("/api/admin/wallet/transactions");
  return rows.map(toTransaction);
}

/** POST /api/admin/wallet/withdrawals/{id}/approve|reject */
export async function decideWithdrawal(id: string, action: "approve" | "reject") {
  return apiPostJson<{ ok: boolean; id: string; action: string }>(`/api/admin/wallet/withdrawals/${id}/${action}`);
}
