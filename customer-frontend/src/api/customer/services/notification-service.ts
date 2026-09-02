/**
 * Notification Service — GET /api/notifications/unread-count
 *
 * Drives the bell badge and the notification preview on Home.
 */

import { API_ENDPOINTS } from "../api/config";
import { CACHE_KEYS, readCache, readStaleCache, writeCache } from "../api/cache";
import { apiGet, resolveResource } from "../api/http-client";
export type UnreadCountResponse = { count: number };

export type NotificationPreview = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

import { readToken } from "@/api/core/session-store";

export function fetchUnreadNotificationCount(
  options: { forceRefresh?: boolean | undefined; signal?: AbortSignal | undefined } = {},
) {
  const token = readToken();
  if (!token) {
    return Promise.resolve(0);
  }
  return resolveResource<number>({
    forceRefresh: options.forceRefresh,
    request: async () => {
      const response = await apiGet<UnreadCountResponse | number>(
        API_ENDPOINTS.unreadNotifications,
        { signal: options.signal },
      );
      const count = typeof response === "number" ? response : response.count;
      return Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;
    },
    readCache: () => readCache<number>(CACHE_KEYS.unreadNotifications),
    readStaleCache: () => readStaleCache<number>(CACHE_KEYS.unreadNotifications),
    writeCache: (value) => writeCache(CACHE_KEYS.unreadNotifications, value),
  });
}
