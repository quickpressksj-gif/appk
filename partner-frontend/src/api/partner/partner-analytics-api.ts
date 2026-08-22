import { apiGetJson } from "../core/transport";

export type TopServiceStat = {
  name: string;
  count: number;
  revenue: number;
};

export type PartnerAnalyticsData = {
  totalOrders: number;
  totalRevenue: number;
  totalEarnings: number;
  totalCustomers: number;
  trendLabels: string[];
  ordersTrend: number[];
  revenueTrend: number[];
  topServices: TopServiceStat[];
};

export async function fetchPartnerAnalytics(period: string = "7d"): Promise<PartnerAnalyticsData> {
  return apiGetJson<PartnerAnalyticsData>(`/api/partner/analytics?period=${encodeURIComponent(period)}`);
}
