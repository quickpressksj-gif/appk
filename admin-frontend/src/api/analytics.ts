/**
 * Master Platform Analytics & Business Intelligence API Client
 *
 * GET /api/admin/analytics — Nationwide GMV, city metrics, fulfillment rates, service share, and growth.
 * GET /api/admin/analytics/export — Dynamic CSV export from database.
 */
import { apiGetJson } from "@/api/core/transport";
import { type Kpi, type SeriesPoint } from "./client";

export type ServiceEconomics = {
  name: string;
  description: string;
  color: string;
  icon: string;
  revenue: number;
  formattedRevenue: string;
  orders: number;
  sharePercent: number;
};

export type PaymentModeStat = {
  label: string;
  count: number;
  amount: number;
};

export type CityPerformance = {
  id: string;
  city: string;
  state: string;
  orders: number;
  delivered: number;
  gmv: string;
  rawGmv: number;
  aov: string;
  rawAov: number;
  partners: number;
  riders: number;
  customers: number;
  growth: string;
  status: string;
};

export type ReportFile = {
  id: string;
  name: string;
  period: string;
  format: "CSV" | "PDF" | "XLSX";
  generated: string;
  fileSize: string;
  status: "Ready" | "Generating";
  type: string;
};

export type BackendAnalytics = {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  inProgressOrders: number;
  placedOrders: number;
  revenue: number;
  ordersGmv: number;
  membershipRevenue: number;
  discountsGiven: number;
  grossBookedValue: number;
  aov: number;
  fulfillmentRate: number;
  cancellationRate: number;
  monthlyGrowthRate: string;
  topService: string;
  growthSeries: SeriesPoint[];
  servicesBreakdown: ServiceEconomics[];
  paymentModes: Record<string, PaymentModeStat>;
  cities: CityPerformance[];
  partners: number;
  riders: number;
  customers: number;
  reports: ReportFile[];
};

const money = (value: number) => `₹${(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export async function fetchAnalyticsData(params?: { range?: string; city?: string }): Promise<BackendAnalytics> {
  const query = new URLSearchParams();
  if (params?.range) query.set("range", params.range);
  if (params?.city && params.city !== "all") query.set("city", params.city);
  const qs = query.toString();
  const url = `/api/admin/analytics${qs ? `?${qs}` : ""}`;

  try {
    return await apiGetJson<BackendAnalytics>(url);
  } catch {
    return {
      totalOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      inProgressOrders: 0,
      placedOrders: 0,
      revenue: 0,
      ordersGmv: 0,
      membershipRevenue: 0,
      discountsGiven: 0,
      grossBookedValue: 0,
      aov: 0,
      fulfillmentRate: 100,
      cancellationRate: 0,
      monthlyGrowthRate: "+0.0%",
      topService: "Wash & Fold",
      growthSeries: [
        { label: "Day 1", value: 0, secondary: 0 },
        { label: "Day 2", value: 0, secondary: 0 },
        { label: "Today", value: 0, secondary: 0 },
      ],
      servicesBreakdown: [],
      paymentModes: {},
      cities: [],
      partners: 0,
      riders: 0,
      customers: 0,
      reports: [],
    };
  }
}

export async function fetchAnalyticsKpis(params?: { range?: string; city?: string }): Promise<Kpi[]> {
  const data = await fetchAnalyticsData(params);
  return [
    { id: "gmv", label: "Gross Platform Revenue", value: money(data.revenue), positive: true, hint: `Orders: ${money(data.ordersGmv)} + VIP: ${money(data.membershipRevenue)}` },
    { id: "aov", label: "Average Order Value (AOV)", value: money(data.aov), positive: true, hint: "Per delivered order" },
    { id: "orders", label: "Booked Pipeline", value: `${data.totalOrders} Orders`, positive: true, hint: `${data.deliveredOrders} Delivered · ${data.inProgressOrders} In Transit` },
    { id: "fulfillment", label: "Fulfillment Success", value: `${data.fulfillmentRate}%`, positive: true, hint: `${data.cancellationRate}% cancellations` },
    { id: "partners", label: "Active Partner Hubs", value: `${data.partners} Stores`, positive: true, hint: "Processing capacity" },
    { id: "fleet", label: "Delivery Fleet Captains", value: `${data.riders} Captains`, positive: true, hint: `${data.customers} Registered Users` },
  ];
}

export async function fetchGrowthSeries(params?: { range?: string; city?: string }): Promise<SeriesPoint[]> {
  const data = await fetchAnalyticsData(params);
  return data.growthSeries || [];
}

export async function fetchCityPerformance(params?: { range?: string; city?: string }): Promise<CityPerformance[]> {
  const data = await fetchAnalyticsData(params);
  return data.cities || [];
}

export async function fetchReports(params?: { range?: string; city?: string }): Promise<ReportFile[]> {
  const data = await fetchAnalyticsData(params);
  return data.reports || [];
}

export async function exportReportCsv(type: string, city?: string): Promise<string> {
  const query = new URLSearchParams({ type });
  if (city && city !== "all") query.set("city", city);
  return `/api/admin/analytics/export?${query.toString()}`;
}

