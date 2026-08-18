/**
 * Sprint 3.9 — Partner Analytics & Reports mock data (UI only).
 *
 * No backend, no MongoDB, no Firebase. Charts render from these static series.
 * Future integration points are marked with `TODO(api)`.
 */

export type RangeId = "today" | "yesterday" | "week" | "month" | "last-month" | "custom";

export const ANALYTICS_RANGES: { id: RangeId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "last-month", label: "Last Month" },
  { id: "custom", label: "Custom Range" },
];

export type AnalyticsKpis = {
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  lifetimeRevenue: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  activeCustomers: number;
  repeatCustomers: number;
  avgOrderValue: number;
  avgRating: number;
  totalEarnings: number;
};

export type TrendPoint = { label: string; revenue: number; orders: number; customers: number };
export type ServiceSlice = { name: string; revenue: number; orders: number };
export type TopCustomerRow = {
  id: string;
  name: string;
  orders: number;
  spend: number;
  lastOrder: string;
};
export type InsightCardData = {
  id: string;
  title: string;
  value: string;
  detail: string;
  tone: "primary" | "green" | "muted" | "danger";
};
export type ReportRow = {
  id: string;
  period: "daily" | "weekly" | "monthly" | "yearly";
  title: string;
  date: string;
  service: string;
  customer: string;
  orders: number;
  revenue: number;
};

export type PartnerAnalyticsData = {
  kpis: AnalyticsKpis;
  revenueTrend: TrendPoint[];
  weeklyTrend: TrendPoint[];
  monthlyTrend: TrendPoint[];
  services: ServiceSlice[];
  customerGrowth: { label: string; total: number; repeat: number }[];
  topCustomers: TopCustomerRow[];
  insights: InsightCardData[];
  reports: ReportRow[];
};

const revenueTrend: TrendPoint[] = [
  { label: "Mon", revenue: 4820, orders: 18, customers: 12 },
  { label: "Tue", revenue: 5640, orders: 22, customers: 15 },
  { label: "Wed", revenue: 4310, orders: 16, customers: 11 },
  { label: "Thu", revenue: 7120, orders: 27, customers: 19 },
  { label: "Fri", revenue: 8460, orders: 31, customers: 23 },
  { label: "Sat", revenue: 9840, orders: 36, customers: 28 },
  { label: "Sun", revenue: 6250, orders: 24, customers: 17 },
];

const weeklyTrend: TrendPoint[] = [
  { label: "W1", revenue: 38200, orders: 142, customers: 96 },
  { label: "W2", revenue: 41560, orders: 158, customers: 104 },
  { label: "W3", revenue: 36980, orders: 137, customers: 91 },
  { label: "W4", revenue: 46440, orders: 174, customers: 118 },
];

const monthlyTrend: TrendPoint[] = [
  { label: "Apr", revenue: 128400, orders: 486, customers: 302 },
  { label: "May", revenue: 141200, orders: 524, customers: 331 },
  { label: "Jun", revenue: 133700, orders: 498, customers: 318 },
  { label: "Jul", revenue: 156900, orders: 578, customers: 366 },
  { label: "Aug", revenue: 163180, orders: 611, customers: 389 },
  { label: "Sep", revenue: 172540, orders: 642, customers: 412 },
];

const services: ServiceSlice[] = [
  { name: "Wash & Fold", revenue: 68400, orders: 268 },
  { name: "Dry Clean", revenue: 54120, orders: 149 },
  { name: "Wash & Iron", revenue: 31860, orders: 132 },
  { name: "Steam Iron", revenue: 12480, orders: 74 },
  { name: "Shoe Care", revenue: 5680, orders: 19 },
];

export const partnerAnalyticsMock: PartnerAnalyticsData = {
  kpis: {
    todayRevenue: 6250,
    weeklyRevenue: 46440,
    monthlyRevenue: 172540,
    lifetimeRevenue: 1284600,
    totalOrders: 642,
    completedOrders: 601,
    cancelledOrders: 41,
    activeCustomers: 412,
    repeatCustomers: 268,
    avgOrderValue: 268,
    avgRating: 4.7,
    totalEarnings: 1128450,
  },
  revenueTrend,
  weeklyTrend,
  monthlyTrend,
  services,
  customerGrowth: [
    { label: "Apr", total: 302, repeat: 168 },
    { label: "May", total: 331, repeat: 192 },
    { label: "Jun", total: 318, repeat: 186 },
    { label: "Jul", total: 366, repeat: 224 },
    { label: "Aug", total: 389, repeat: 246 },
    { label: "Sep", total: 412, repeat: 268 },
  ],
  topCustomers: [
    { id: "cus-1", name: "Anaya Sharma", orders: 24, spend: 18420, lastOrder: "Today" },
    { id: "cus-2", name: "Rohit Verma", orders: 19, spend: 14260, lastOrder: "Yesterday" },
    { id: "cus-3", name: "Meera Iyer", orders: 16, spend: 12880, lastOrder: "2 days ago" },
    { id: "cus-4", name: "Kabir Nair", orders: 14, spend: 10120, lastOrder: "4 days ago" },
    { id: "cus-5", name: "Sara Khan", orders: 11, spend: 8640, lastOrder: "6 days ago" },
  ],
  insights: [
    {
      id: "ins-1",
      title: "Peak Business Hours",
      value: "6 PM – 9 PM",
      detail: "42% of weekly orders arrive in this window. Keep two staff on pickup duty.",
      tone: "primary",
    },
    {
      id: "ins-2",
      title: "Best Selling Service",
      value: "Wash & Fold",
      detail: "268 orders · ₹68,400 revenue this month.",
      tone: "green",
    },
    {
      id: "ins-3",
      title: "Lowest Performing Service",
      value: "Shoe Care",
      detail: "19 orders this month. Consider a bundled discount.",
      tone: "danger",
    },
    {
      id: "ins-4",
      title: "Customer Retention",
      value: "76%",
      detail: "Customers who ordered again within 45 days.",
      tone: "green",
    },
    {
      id: "ins-5",
      title: "Repeat Customer %",
      value: "65%",
      detail: "268 of 412 active customers are repeat buyers.",
      tone: "primary",
    },
    {
      id: "ins-6",
      title: "Estimated Monthly Growth",
      value: "+9.4%",
      detail: "Projected from the last 6 months of revenue.",
      tone: "muted",
    },
  ],
  reports: [
    {
      id: "rep-1",
      period: "daily",
      title: "Daily Sales Report",
      date: "12 Sep 2025",
      service: "All services",
      customer: "All customers",
      orders: 24,
      revenue: 6250,
    },
    {
      id: "rep-2",
      period: "weekly",
      title: "Weekly Performance Report",
      date: "06 – 12 Sep 2025",
      service: "All services",
      customer: "All customers",
      orders: 174,
      revenue: 46440,
    },
    {
      id: "rep-3",
      period: "monthly",
      title: "Monthly Business Report",
      date: "Sep 2025",
      service: "Wash & Fold",
      customer: "Anaya Sharma",
      orders: 642,
      revenue: 172540,
    },
    {
      id: "rep-4",
      period: "yearly",
      title: "Yearly Revenue Report",
      date: "FY 2024 – 25",
      service: "All services",
      customer: "All customers",
      orders: 6284,
      revenue: 1284600,
    },
  ],
};

export const emptyAnalytics: PartnerAnalyticsData = {
  kpis: {
    todayRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    lifetimeRevenue: 0,
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    activeCustomers: 0,
    repeatCustomers: 0,
    avgOrderValue: 0,
    avgRating: 0,
    totalEarnings: 0,
  },
  revenueTrend: [],
  weeklyTrend: [],
  monthlyTrend: [],
  services: [],
  customerGrowth: [],
  topCustomers: [],
  insights: [],
  reports: [],
};

/** TODO(api): replace with GET /api/partner/analytics?range=... */
export async function fetchPartnerAnalytics(): Promise<PartnerAnalyticsData> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  return partnerAnalyticsMock;
}

export function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatCompactInr(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}