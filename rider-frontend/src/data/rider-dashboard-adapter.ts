// Real rider dashboard data — composed from the live backend endpoints.
import { fetchRiderDashboard } from "@/api/rider/rider-dashboard-api";
import { fetchRiderOrders } from "@/api/rider/rider-orders-api";
import { fetchRiderProfile } from "@/api/rider/rider-profile-api";
import type { RiderOrder, RiderOrderStatus } from "@/shared/types/rider";

import type { ActiveDelivery, DeliveryStage, RiderDashboardData } from "./rider-dashboard-mock";

const STAGE_BY_STATUS: Partial<Record<RiderOrderStatus, DeliveryStage>> = {
  assigned: "assigned",
  accepted: "accepted",
  arriving: "accepted",
  "at-partner": "reached-partner",
  picked: "picked-up",
  "ready-for-delivery": "on-the-way",
};

const ACTIVE_STATUSES: RiderOrderStatus[] = [
  "assigned",
  "accepted",
  "arriving",
  "at-partner",
  "picked",
  "ready-for-delivery",
];

function toActiveDelivery(order: RiderOrder): ActiveDelivery {
  return {
    orderId: order.code,
    customerName: order.customerName,
    partnerName: order.partnerName,
    pickupAddress: order.pickupAddress,
    deliveryAddress: order.deliveryAddress,
    pickupTime: order.slot,
    etaDelivery: `${order.etaMinutes} min`,
    paymentType: order.paymentMode === "cod" ? "Cash on Delivery" : "Paid Online",
    amount: order.estimatedEarning,
    stage: STAGE_BY_STATUS[order.status] ?? "assigned",
    isNew: order.status === "assigned",
  };
}

/** Loads the real rider dashboard. Fields with no backend source are left
 * honestly empty/zero instead of using fabricated placeholder data. */
export async function loadRiderDashboard(): Promise<RiderDashboardData> {
  const [dashboard, orders, profile] = await Promise.all([
    fetchRiderDashboard(),
    fetchRiderOrders().catch(() => [] as RiderOrder[]),
    fetchRiderProfile().catch(() => null),
  ]);

  const active = orders.find((order) => ACTIVE_STATUSES.includes(order.status)) ?? null;

  return {
    rider: {
      name: dashboard.riderName,
      riderId: profile?.riderId ?? "—",
      city: profile?.city ?? "—",
      photo: "",
      vehicle: profile ? `${profile.vehicleType} · ${profile.vehicleNumber}` : "—",
    },
    status: dashboard.isOnline ? (active ? "on-delivery" : "online") : "offline",
    kpis: {
      deliveriesToday: dashboard.todayDeliveries,
      earningsToday: dashboard.todayEarnings,
      distanceKm: 0,
      workingHours: Math.round((dashboard.onlineMinutes / 60) * 10) / 10,
      tips: 0,
      incentives: 0,
    },
    activeDelivery: active ? toActiveDelivery(active) : null,
    // No backend endpoints exist yet for performance stats, feedback or
    // announcements — shown as empty sections instead of fabricated data.
    performance: [],
    feedback: [],
    announcements: [],
    unreadNotifications: 0,
  };
}
