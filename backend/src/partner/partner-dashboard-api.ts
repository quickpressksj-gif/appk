/**
 * Partner dashboard summary — backed by the shared mock/live backend.
 */
import { apiGetJson, apiRequest } from "../core/transport";
import type { BusinessSettings, PartnerProfile } from "@shared/types/partner";

export type DashboardSummary = {
  todayEarnings: number;
  newOrders: number;
  inProcess: number;
  readyForDelivery: number;
  completedToday: number;
  rating: number;
  onTimeRate: number;
  isStoreOpen: boolean;
  capacityUsedPct: number;
};

type RawDashboard = {
  newOrders: number;
  inProgress: number;
  readyForDelivery: number;
  delivered: number;
  earningsToday: number;
};

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const [dashboard, profile, settings] = await Promise.all([
    apiGetJson<RawDashboard>("/api/partner/dashboard"),
    apiGetJson<PartnerProfile>("/api/partner/profile"),
    apiGetJson<BusinessSettings>("/api/partner/settings"),
  ]);

  const capacityUsedPct = settings.dailyOrderCap
    ? Math.min(100, Math.round((dashboard.inProgress / settings.dailyOrderCap) * 100))
    : 0;

  return {
    todayEarnings: dashboard.earningsToday,
    newOrders: dashboard.newOrders,
    inProcess: dashboard.inProgress,
    readyForDelivery: dashboard.readyForDelivery,
    completedToday: dashboard.delivered,
    rating: profile.rating,
    onTimeRate: profile.onTimeRate,
    isStoreOpen: settings.isStoreOpen,
    capacityUsedPct,
  };
}

export async function setStoreOpen(isOpen: boolean) {
  await apiRequest<BusinessSettings>("PUT", "/api/partner/settings", { body: { isStoreOpen: isOpen } });
  return { ok: true as const, isOpen };
}
