// Real rider notifications — backed by GET /api/rider/notifications.
// Maps the backend contract onto the notification-center view model.
// Fields the backend does not provide (priority, deep-link actions) are left
// at safe defaults instead of being invented.
import { fetchRiderNotifications } from "@/api/rider/rider-notifications-api";
import type { RiderNotificationKind } from "@/shared/types/rider";

import type { NotificationCategory, RiderNotification } from "./rider-notifications-mock";

const CATEGORY_BY_KIND: Record<RiderNotificationKind, NotificationCategory> = {
  "new-order": "order",
  "pickup-reminder": "order",
  "delivery-reminder": "order",
  payment: "payment",
  system: "system",
};

function groupFor(iso: string): RiderNotification["group"] {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return "Earlier";
  const days = Math.floor((Date.now() - parsed) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return "Earlier";
}

export async function loadRiderNotifications(): Promise<RiderNotification[]> {
  const items = await fetchRiderNotifications();
  return items.map((item) => ({
    id: item.id,
    category: CATEGORY_BY_KIND[item.kind] ?? "system",
    priority: "normal",
    title: item.title,
    body: item.body,
    time: item.time,
    isoTime: item.time,
    group: groupFor(item.time),
    read: !item.unread,
  }));
}
