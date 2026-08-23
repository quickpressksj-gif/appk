/** GET /api/admin/dashboard/* — real dashboard KPIs and derived views from shared backend. */
import { apiGetJson } from "@/api/core/transport";

import { table, type Kpi, type SeriesPoint, type TableData } from "./client";

export type StatusBreakdown = { status: string; label: string; count: number };

export type TopServiceItem = { service: string; orders: number; revenue: number };

export type TopPartnerItem = {
  id: string;
  name: string;
  city: string;
  orders: number;
  revenue: number;
  rating: number;
  status: string;
};

export type BackendDashboardSummary = {
  totalOrders: number;
  todayOrders: number;
  liveOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  revenue: number;
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  platformEarnings: number;
  partners: number;
  pendingPartners: number;
  activePartners: number;
  suspendedPartners: number;
  riders: number;
  onlineRiders: number;
  busyRiders: number;
  availableRiders: number;
  customers: number;
  todayCustomers: number;
  activeCustomers: number;
  pendingPayouts: number;
  pendingPayoutAmount: number;
  unassignedOrders: number;
  topServices: TopServiceItem[];
  topPartners: TopPartnerItem[];
  statusBreakdown: StatusBreakdown[];
};

export type BackendLatestOrderRow = {
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

export type BackendActivity = {
  id: string;
  title: string;
  meta: string;
  time: string;
  tone: "default" | "success" | "warning" | "danger";
};

export type BackendSeriesPoint = { label: string; value: number; secondary?: number };

const count = (value: number) => value.toLocaleString("en-IN");

/** GET /api/admin/dashboard */
export async function fetchDashboardSummary(): Promise<BackendDashboardSummary> {
  return apiGetJson<BackendDashboardSummary>("/api/admin/dashboard");
}

/** Legacy KPI format helper for widgets */
export async function fetchDashboardKpis(): Promise<Kpi[]> {
  const stats = await fetchDashboardSummary();
  const completion = stats.totalOrders
    ? Math.round((stats.deliveredOrders / stats.totalOrders) * 100)
    : 0;

  return [
    { id: "today-orders", label: "Today's Orders", value: count(stats.todayOrders), hint: `${count(stats.totalOrders)} Total Lifetime`, positive: true },
    { id: "active-orders", label: "Active In-Flight", value: count(stats.liveOrders), hint: `${count(stats.unassignedOrders)} Unassigned`, positive: true },
    { id: "today-revenue", label: "Today's Revenue", value: `₹${count(stats.todayRevenue)}`, hint: `₹${count(stats.revenue)} Lifetime`, positive: true },
    { id: "platform-earnings", label: "Platform Earnings (18%)", value: `₹${count(stats.platformEarnings)}`, hint: "Net Commission", positive: true },
    { id: "pending-partners", label: "Pending Partners", value: count(stats.pendingPartners), hint: `${count(stats.activePartners)} Active Stores`, positive: stats.pendingPartners === 0 },
    { id: "online-riders", label: "Online Riders", value: `${count(stats.onlineRiders)} / ${count(stats.riders)}`, hint: `${count(stats.busyRiders)} On Delivery`, positive: true },
    { id: "active-customers", label: "Active Customers", value: count(stats.activeCustomers), hint: `${count(stats.customers)} Total Registered`, positive: true },
    { id: "pending-payouts", label: "Pending Payouts", value: `₹${count(stats.pendingPayoutAmount)}`, hint: `${count(stats.pendingPayouts)} Requests`, positive: stats.pendingPayouts === 0 },
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

/** GET /api/admin/dashboard/activity */
export async function fetchRecentActivity(): Promise<BackendActivity[]> {
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
      { key: "rider", label: "Rider" },
      { key: "status", label: "Status" },
      { key: "amount", label: "Amount", className: "text-right" },
    ],
    rows.map((row) => ({
      id: row.code || row.id,
      customer: row.customer || "Customer",
      partner: row.partner || "Store",
      rider: row.rider || "Unassigned",
      status: row.statusLabel || row.status,
      amount: `₹${Number(row.amount || 0).toLocaleString("en-IN")}`,
    })),
  );
}
