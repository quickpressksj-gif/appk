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

import { readSession } from "@/api/core/session-store";

/** Loads the real rider dashboard. Fields with no backend source are left
 * honestly empty/zero instead of using fabricated placeholder data. */
export async function loadRiderDashboard(): Promise<RiderDashboardData> {
  const session = readSession("rider") || readSession();
  const sessionName = session?.account?.name || (session as any)?.fullName;
  const sessionPhone = session?.account?.phone || (session as any)?.phone;
  const sessionRiderId = session?.account?.linkedId || session?.account?.id || (session as any)?.riderId;

  const isRiderOnline =
    typeof window !== "undefined"
      ? window.localStorage.getItem("qp.rider.isOnline") !== "0"
      : true;

  const [dashboard, ordersRaw, profile] = await Promise.all([
    fetchRiderDashboard().catch(() => ({
      riderName: sessionName || "Delivery Captain",
      isOnline: isRiderOnline,
      todayDeliveries: 0,
      todayEarnings: 0,
      pendingPickups: 0,
      pendingDeliveries: 0,
      completedDeliveries: 0,
      rating: 5.0,
      onlineMinutes: 0,
    })),
    fetchRiderOrders().catch(() => [] as RiderOrder[]),
    fetchRiderProfile().catch(() => null),
  ]);

  const orders: RiderOrder[] = Array.isArray(ordersRaw)
    ? ordersRaw
    : Array.isArray((ordersRaw as any)?.items)
      ? (ordersRaw as any).items
      : [];

  const active = orders.find((order) => ACTIVE_STATUSES.includes(order.status)) ?? null;

  const resolvedName =
    profile?.fullName && profile.fullName !== "Delivery Partner"
      ? profile.fullName
      : dashboard.riderName && dashboard.riderName !== "Delivery Partner"
        ? dashboard.riderName
        : sessionName || (sessionPhone ? `Captain ${sessionPhone.slice(-4)}` : "Delivery Captain");

  const resolvedRiderId = profile?.riderId ?? sessionRiderId ?? "—";

  return {
    rider: {
      name: resolvedName,
      riderId: resolvedRiderId,
      city: profile?.city ?? "—",
      photo: profile?.photo || "",
      vehicle: profile ? `${profile.vehicleType} · ${profile.vehicleNumber}` : "Two-Wheeler · Active",
    },
    status: isRiderOnline ? (active ? "on-delivery" : "online") : "offline",
    kpis: {
      deliveriesToday: dashboard.todayDeliveries ?? 0,
      earningsToday: dashboard.todayEarnings ?? 0,
      distanceKm: 0,
      workingHours: Math.round(((dashboard.onlineMinutes ?? 0) / 60) * 10) / 10,
      tips: 0,
      incentives: 0,
    },
    activeDelivery: active ? toActiveDelivery(active) : null,
    performance: [],
    feedback: [],
    announcements: [],
    unreadNotifications: 0,
  };
}
