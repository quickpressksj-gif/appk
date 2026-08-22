/**
 * UI-only mock data for the Partner Dashboard (Sprint 3.2).
 *
 * Nothing here talks to a backend. Every export is a future API integration
 * point — see PARTNER_SPRINT_3_2_DASHBOARD_REPORT.md for the mapping.
 */

export type DashboardShop = {
  shopName: string;
  partnerName: string;
  logoInitials: string;
  isVerified: boolean;
  notifications: number;
};

export const dashboardShop: DashboardShop = {
  shopName: "",
  partnerName: "",
  logoInitials: "",
  isVerified: false,
  notifications: 0,
};

export type DashboardSummaryCard = {
  totalOrders: number;
  revenue: number;
  earnings: number;
  activeOrders: number;
};

export const dashboardSummary: DashboardSummaryCard = {
  totalOrders: 0,
  revenue: 0,
  earnings: 0,
  activeOrders: 0,
};

export type QuickStat = {
  id: string;
  label: string;
  value: number;
  tone: "primary" | "green" | "muted" | "danger";
};

export const quickStats: QuickStat[] = [];

export const revenueBreakdown = {
  today: { amount: 0, orders: 0, deltaPct: 0 },
  yesterday: { amount: 0, orders: 0, deltaPct: 0 },
  week: { amount: 0, orders: 0, deltaPct: 0 },
} as const;

export type RevenueRange = keyof typeof revenueBreakdown;

export type LiveOrder = {
  id: string;
  code: string;
  customerName: string;
  pickupTime: string;
  services: string[];
  amount: number;
  status: "pending" | "accepted" | "pickup" | "washing" | "ironing" | "ready" | "delivered";
};

export const liveOrders: LiveOrder[] = [];

export const orderStatusFlow = [
  "Pending",
  "Accepted",
  "Pickup",
  "Washing",
  "Ironing",
  "Ready",
  "Delivered",
] as const;

export const performanceSeries = {
  orders: [],
  revenue: [],
  processing: [],
  labels: [],
};

export type Announcement = {
  id: string;
  kind: "promotion" | "membership" | "update";
  title: string;
  body: string;
};

export const announcements: Announcement[] = [];

