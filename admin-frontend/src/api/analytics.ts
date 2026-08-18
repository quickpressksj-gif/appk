/** GET /api/admin/analytics — analytics KPIs and reports derived from the shared backend. */
import { apiGetJson } from "@/api/core/transport";

import { type Kpi, type SeriesPoint } from "./client";

type BackendAnalytics = {
  totalOrders: number;
  revenue: number;
  cities: { id: string; city: string; state: string; areas: number; partners: number; riders: number; pickupRadius: string; status: string }[];
  partners: number;
  riders: number;
  customers: number;
};

export type CityPerformance = {
  id: string;
  city: string;
  orders: number;
  gmv: string;
  aov: string;
  partners: number;
  customers: number;
  growth: string;
};

export type ReportFile = { id: string; name: string; period: string; format: string; generated: string; status: string };

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

/** Derived from /api/admin/analytics (no dedicated KPI endpoint). */
export async function fetchAnalyticsKpis(): Promise<Kpi[]> {
  const data = await apiGetJson<BackendAnalytics>("/api/admin/analytics");
  const aov = data.totalOrders ? Math.round(data.revenue / data.totalOrders) : 0;
  return [
    { id: "aov", label: "Average order value", value: money(aov), positive: true },
    { id: "orders", label: "Total orders", value: data.totalOrders.toLocaleString("en-IN"), positive: true },
    { id: "partners", label: "Active partners", value: data.partners.toLocaleString("en-IN"), positive: true },
    { id: "riders", label: "Active riders", value: data.riders.toLocaleString("en-IN"), positive: true },
  ];
}

/** Derived from /api/admin/analytics (no dedicated series endpoint). */
export async function fetchGrowthSeries(): Promise<SeriesPoint[]> {
  const data = await apiGetJson<BackendAnalytics>("/api/admin/analytics");
  return data.cities.map((city) => ({ label: city.city, value: city.riders + city.partners, secondary: city.areas }));
}

/** GET /api/admin/analytics — reshaped to per-city performance rows. */
export async function fetchCityPerformance(): Promise<CityPerformance[]> {
  const data = await apiGetJson<BackendAnalytics>("/api/admin/analytics");
  const aov = data.totalOrders ? Math.round(data.revenue / data.totalOrders) : 0;
  return data.cities.map((city) => ({
    id: city.id,
    city: city.city,
    orders: data.totalOrders,
    gmv: money(data.revenue),
    aov: money(aov),
    partners: city.partners,
    customers: data.customers,
    growth: "—",
  }));
}

/** No report-generation endpoint exists yet; the console has nothing to list. */
export async function fetchReports(): Promise<ReportFile[]> {
  return [];
}

export async function exportReport(kind: string) {
  return { url: `#report-${kind}` };
}
