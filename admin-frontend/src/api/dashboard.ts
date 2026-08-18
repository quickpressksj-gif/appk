/** GET /api/admin/dashboard/* — dashboard KPIs and derived views from the shared backend. */
import { apiGetJson } from "@/api/core/transport";

import { table, type Kpi, type SeriesPoint, type TableData } from "./client";

type StatusBreakdown = { status: string; label: string; count: number };

type BackendDashboard = {
  totalOrders: number;
  liveOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  revenue: number;
  partners: number;
  riders: number;
  customers: number;
  statusBreakdown: StatusBreakdown[];
};

type BackendLatestOrderRow = {
  id: string;
  code: string;
  customer: string;
  partner: string;
  rider: string;
  status: string;
  statusLabel: string;
  amount: number;
  placedOn: string;
  city: string;
  paymentMode: string;
};

type BackendActivity = {
  id: string;
  title: string;
  meta: string;
  time: string;
  tone: "default" | "success" | "warning" | "danger";
};

type BackendSeriesPoint = { label: string; value: number; secondary?: number };

const count = (value: number) => value.toLocaleString("en-IN");

/** GET /api/admin/dashboard */
export async function fetchDashboardKpis(): Promise<Kpi[]> {
  const stats = await apiGetJson<BackendDashboard>("/api/admin/dashboard");
  const completion = stats.totalOrders
    ? Math.round((stats.deliveredOrders / stats.totalOrders) * 100)
    : 0;

  return [
    { id: "total-orders", label: "Total orders", value: count(stats.totalOrders), delta: "live data", positive: true },
    { id: "today-orders", label: "Today's orders", value: count(stats.totalOrders), delta: "live data", positive: true },
    { id: "pending-orders", label: "Pending orders", value: count(stats.liveOrders), delta: "in progress", positive: true },
    { id: "completed-orders", label: "Completed orders", value: count(stats.deliveredOrders), delta: `${completion}% completion`, positive: true },
    { id: "cancelled-orders", label: "Cancelled orders", value: count(stats.cancelledOrders), delta: "this cycle", positive: stats.cancelledOrders === 0 },
    { id: "revenue-today", label: "Revenue today", value: `₹${count(stats.revenue)}`, delta: "delivered orders", positive: true },
    { id: "revenue-month", label: "Revenue this month", value: `₹${count(stats.revenue)}`, delta: "delivered orders", positive: true },
    { id: "customers", label: "Total customers", value: count(stats.customers), delta: "registered", positive: true },
    { id: "partners", label: "Total partners", value: count(stats.partners), delta: "onboarded", positive: true },
    { id: "riders", label: "Total riders", value: count(stats.riders), delta: "onboarded", positive: true },
    { id: "growth", label: "Completion rate", value: `${completion}%`, delta: "delivered / total", positive: completion >= 50 },
  ];
}

/** GET /api/admin/dashboard/revenue-series */
export async function fetchRevenueSeries(): Promise<SeriesPoint[]> {
  const points = await apiGetJson<BackendSeriesPoint[]>("/api/admin/dashboard/revenue-series");
  return points.map((point) => (point.secondary === undefined ? { label: point.label, value: point.value } : { label: point.label, value: point.value, secondary: point.secondary }));
}

/** GET /api/admin/dashboard/orders-series */
export async function fetchOrdersSeries(): Promise<SeriesPoint[]> {
  const points = await apiGetJson<BackendSeriesPoint[]>("/api/admin/dashboard/orders-series");
  return points.map((point) => (point.secondary === undefined ? { label: point.label, value: point.value } : { label: point.label, value: point.value, secondary: point.secondary }));
}

export type Activity = {
  id: string;
  title: string;
  meta: string;
  time: string;
  tone: "default" | "success" | "warning" | "danger";
};

/** GET /api/admin/dashboard/activity */
export async function fetchRecentActivity(): Promise<Activity[]> {
  return apiGetJson<BackendActivity[]>("/api/admin/dashboard/activity");
}

/** GET /api/admin/dashboard/latest-orders */
export async function fetchLatestOrders(): Promise<TableData> {
  const rows = await apiGetJson<BackendLatestOrderRow[]>("/api/admin/dashboard/latest-orders");
  return table(
    [
      { key: "id", label: "Order" },
      { key: "customer", label: "Customer" },
      { key: "partner", label: "Partner" },
      { key: "status", label: "Status" },
      { key: "amount", label: "Amount" },
    ],
    rows.map((row) => ({
      id: row.code,
      customer: row.customer,
      partner: row.partner,
      status: row.statusLabel,
      amount: `₹${row.amount.toLocaleString("en-IN")}`,
    })),
  );
}
