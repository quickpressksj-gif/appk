// Rider notifications data layer — backed by the shared mock/live backend.
import { apiGetJson } from "../core/transport";
import type { RiderNotification, RiderNotificationKind } from "@/shared/types/rider";

type RawNotification = {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  kind: string;
};

const KIND_MAP: Record<string, RiderNotificationKind> = {
  "partner-accepted": "new-order",
  "pickup-scheduled": "pickup-reminder",
  "pickup-completed": "delivery-reminder",
  processing: "delivery-reminder",
  "out-for-delivery": "delivery-reminder",
  delivered: "system",
  wallet: "payment",
  cashback: "payment",
  offer: "system",
};

export async function fetchRiderNotifications(): Promise<RiderNotification[]> {
  const items = await apiGetJson<RawNotification[]>("/api/rider/notifications");
  return items.map((item) => ({
    id: item.id,
    kind: KIND_MAP[item.kind] ?? "system",
    title: item.title,
    body: item.body,
    time: item.date,
    unread: !item.read,
  }));
}
