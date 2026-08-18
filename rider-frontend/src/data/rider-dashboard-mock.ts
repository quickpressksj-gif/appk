/**
 * Realistic mock data for the Rider dashboard. UI-only sprint: no backend,
 * Firebase, MongoDB or Maps connections.
 */

export type RiderWorkStatus = "online" | "offline" | "busy" | "on-delivery" | "break";

export type DashboardRider = {
  name: string;
  riderId: string;
  city: string;
  photo: string;
  vehicle: string;
};

export type DashboardKpis = {
  deliveriesToday: number;
  earningsToday: number;
  distanceKm: number;
  workingHours: number;
  tips: number;
  incentives: number;
};

export type ActiveDelivery = {
  orderId: string;
  customerName: string;
  partnerName: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupTime: string;
  etaDelivery: string;
  paymentType: "Cash on Delivery" | "Paid Online" | "UPI on Delivery";
  amount: number;
  stage: DeliveryStage;
  isNew: boolean;
};

export type DeliveryStage =
  | "assigned"
  | "accepted"
  | "reached-partner"
  | "picked-up"
  | "on-the-way"
  | "delivered";

export const DELIVERY_STAGES: { id: DeliveryStage; label: string }[] = [
  { id: "assigned", label: "Assigned" },
  { id: "accepted", label: "Accepted" },
  { id: "reached-partner", label: "Reached Partner" },
  { id: "picked-up", label: "Picked Up" },
  { id: "on-the-way", label: "On The Way" },
  { id: "delivered", label: "Delivered" },
];

export type PerformanceStat = {
  id: string;
  label: string;
  value: string;
  progress: number;
  tone: "primary" | "green" | "muted";
};

export type Announcement = {
  id: string;
  type: "Incentive" | "Update" | "Tip" | "Maintenance";
  title: string;
  body: string;
  time: string;
};

export type RiderDashboardData = {
  rider: DashboardRider;
  status: RiderWorkStatus;
  kpis: DashboardKpis;
  activeDelivery: ActiveDelivery | null;
  performance: PerformanceStat[];
  feedback: { id: string; customer: string; rating: number; comment: string }[];
  announcements: Announcement[];
  unreadNotifications: number;
};

export const QUICK_ACTION_IDS = [
  "orders",
  "earnings",
  "history",
  "wallet",
  "navigation",
  "support",
] as const;

