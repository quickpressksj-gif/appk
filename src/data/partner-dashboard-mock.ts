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
  /** Sprint 5.5 — realtime room identity (partner:{id} / city:{city}). */
  partnerId?: string;
  city?: string;
};

/** TODO(api): GET /api/partner/profile */
export const dashboardShop: DashboardShop = {
  shopName: "Sparkle Laundry Co.",
  partnerName: "Rahul Mehta",
  logoInitials: "SL",
  isVerified: true,
  notifications: 3,
  partnerId: "partner-2001",
  city: "bengaluru",
};


export type DashboardSummaryCard = {
  totalOrders: number;
  revenue: number;
  earnings: number;
  activeOrders: number;
};

/** TODO(api): GET /api/partner/dashboard/summary */
export const dashboardSummary: DashboardSummaryCard = {
  totalOrders: 42,
  revenue: 18450,
  earnings: 14760,
  activeOrders: 9,
};

export type QuickStat = {
  id: string;
  label: string;
  value: number;
  tone: "primary" | "green" | "muted" | "danger";
};

/** TODO(api): GET /api/partner/orders/counts */
export const quickStats: QuickStat[] = [
  { id: "new", label: "New Orders", value: 6, tone: "primary" },
  { id: "processing", label: "Processing", value: 11, tone: "primary" },
  { id: "ready", label: "Ready", value: 5, tone: "green" },
  { id: "completed", label: "Completed", value: 18, tone: "green" },
  { id: "cancelled", label: "Cancelled", value: 2, tone: "danger" },
];

/** TODO(api): GET /api/partner/revenue?range=today|yesterday|week */
export const revenueBreakdown = {
  today: { amount: 18450, orders: 42, deltaPct: 12.4 },
  yesterday: { amount: 16420, orders: 38, deltaPct: -3.1 },
  week: { amount: 104300, orders: 261, deltaPct: 8.7 },
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

/** TODO(api): GET /api/partner/orders?status=live */
export const liveOrders: LiveOrder[] = [
  {
    id: "o1",
    code: "QP-48210",
    customerName: "Ananya Sharma",
    pickupTime: "Today · 10:30 AM",
    services: ["Wash & Fold", "Ironing"],
    amount: 640,
    status: "pending",
  },
  {
    id: "o2",
    code: "QP-48207",
    customerName: "Vikram Nair",
    pickupTime: "Today · 11:15 AM",
    services: ["Dry Clean"],
    amount: 1280,
    status: "accepted",
  },
  {
    id: "o3",
    code: "QP-48199",
    customerName: "Meera Iyer",
    pickupTime: "Today · 12:00 PM",
    services: ["Wash & Iron", "Shoe Care"],
    amount: 890,
    status: "washing",
  },
  {
    id: "o4",
    code: "QP-48188",
    customerName: "Dev Kapoor",
    pickupTime: "Today · 02:45 PM",
    services: ["Premium Care"],
    amount: 2150,
    status: "ready",
  },
];

export const orderStatusFlow = [
  "Pending",
  "Accepted",
  "Pickup",
  "Washing",
  "Ironing",
  "Ready",
  "Delivered",
] as const;

/** TODO(api): GET /api/partner/analytics/today */
export const performanceSeries = {
  orders: [4, 7, 5, 9, 12, 8, 11, 6],
  revenue: [1200, 2400, 1800, 3200, 4100, 2600, 3800, 2100],
  processing: [2, 4, 3, 6, 7, 5, 6, 3],
  labels: ["8a", "10a", "12p", "2p", "4p", "6p", "8p", "10p"],
};

export type Announcement = {
  id: string;
  kind: "promotion" | "membership" | "update";
  title: string;
  body: string;
};

/** TODO(api): GET /api/partner/announcements */
export const announcements: Announcement[] = [
  {
    id: "a1",
    kind: "promotion",
    title: "Monsoon Boost — 1.5x payouts",
    body: "Accept 20 orders this week and earn a ₹1,500 bonus on your Friday settlement.",
  },
  {
    id: "a2",
    kind: "membership",
    title: "QuickPress Gold Partner",
    body: "You are 4 five-star ratings away from Gold. Gold partners get priority order routing.",
  },
  {
    id: "a3",
    kind: "update",
    title: "New pickup slots released",
    body: "Late-evening 8–10 PM slots are now available for your area. Enable them in Settings.",
  },
];
