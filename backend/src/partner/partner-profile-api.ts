// Partner profile / settings / notifications data layer — backed by the shared mock/live backend.
import { apiGetJson, apiPostJson, apiRequest } from "../core/transport";
import type { BusinessSettings, PartnerNotification, PartnerProfile } from "@shared/types/partner";

type RawNotification = {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  kind: string;
};

const NOTIFICATION_KIND: Record<string, PartnerNotification["kind"]> = {
  "partner-accepted": "order",
  "pickup-scheduled": "order",
  "pickup-completed": "order",
  processing: "order",
  "out-for-delivery": "order",
  delivered: "order",
  wallet: "payout",
  cashback: "promo",
  offer: "promo",
};

function toPartnerNotification(item: RawNotification): PartnerNotification {
  return {
    id: item.id,
    title: item.title,
    body: item.body,
    time: item.date,
    read: item.read,
    kind: NOTIFICATION_KIND[item.kind] ?? "alert",
  };
}

export async function fetchPartnerProfile(): Promise<PartnerProfile> {
  return apiGetJson<PartnerProfile>("/api/partner/profile");
}

export async function fetchBusinessSettings(): Promise<BusinessSettings> {
  return apiGetJson<BusinessSettings>("/api/partner/settings");
}

export async function updateBusinessSettings(patch: Partial<BusinessSettings>) {
  await apiRequest<BusinessSettings>("PUT", "/api/partner/settings", { body: patch });
  return { ok: true as const, patch };
}

export async function fetchPartnerNotifications(): Promise<PartnerNotification[]> {
  const items = await apiGetJson<RawNotification[]>("/api/partner/notifications");
  return items.map(toPartnerNotification);
}

export async function markNotificationsRead() {
  return apiPostJson<{ ok: true }>("/api/notifications/read-all");
}

export async function updatePartnerProfile(
  patch: Partial<Pick<PartnerProfile, "businessName" | "ownerName" | "phone" | "email" | "city">>,
) {
  const profile = await apiRequest<PartnerProfile>("PUT", "/api/partner/profile", { body: patch });
  return { ok: true as const, profile };
}
