/**
 * Notification data layer — Sprint 2.7.
 *
 * Every call maps 1:1 to a FastAPI endpoint served by `backend-python`:
 *
 *   GET    /api/notifications             paginated + search + type filter
 *   GET    /api/notifications/unread-count
 *   PUT    /api/notifications/{id}/read
 *   PUT    /api/notifications/read-all
 *   DELETE /api/notifications/{id}
 *
 * The module also owns offline support: the first page is cached locally, and
 * mutations performed while offline are queued and replayed on reconnect.
 */

import { apiDeleteJson, apiGetJson, apiPutJson } from "../core/transport";
import { ApiError } from "../core/errors";
import { CACHE_KEYS, readCache, readStaleCache, writeCache } from "./api/cache";
import { isOnline } from "./api/network";
import type { NotificationCategory, NotificationEntity } from "@/shared/types";

export type { NotificationCategory };
export type NotificationKind = NotificationEntity["kind"];
export type NotificationGroup = "today" | "yesterday" | "earlier";
export type NotificationFilter = "all" | NotificationCategory;

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  category: NotificationCategory;
  title: string;
  description: string;
  /** Absolute clock time, e.g. "4:20 PM". */
  time: string;
  /** Relative time, e.g. "2h ago". */
  timeAgo: string;
  createdAt: string;
  group: NotificationGroup;
  read: boolean;
  orderId: string | null;
  orderCode: string | null;
};

export type NotificationPage = {
  items: AppNotification[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  unread: number;
  /** True when the payload was served from the local cache (offline mode). */
  fromCache: boolean;
};

export type NotificationQuery = {
  page?: number;
  limit?: number;
  search?: string;
  filter?: NotificationFilter;
  forceRefresh?: boolean;
  signal?: AbortSignal;
};

export const NOTIFICATION_PAGE_SIZE = 15;

export const NOTIFICATION_FILTERS: { id: NotificationFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "order", label: "Orders" },
  { id: "offer", label: "Offers" },
  { id: "wallet", label: "Wallet" },
  { id: "membership", label: "Membership" },
  { id: "referral", label: "Referrals" },
  { id: "system", label: "System" },
];

const CATEGORY_BY_KIND: Record<NotificationKind, NotificationCategory> = {
  "partner-accepted": "order",
  "pickup-scheduled": "order",
  "pickup-completed": "order",
  processing: "order",
  "out-for-delivery": "order",
  delivered: "order",
  "order-new": "order",
  "order-cancelled": "order",
  "rider-assigned": "order",
  wallet: "wallet",
  cashback: "wallet",
  offer: "offer",
  coupon: "offer",
  membership: "membership",
  referral: "referral",
  system: "system",
};

export function categoryOf(kind: NotificationKind): NotificationCategory {
  return CATEGORY_BY_KIND[kind] ?? "system";
}

/* ----------------------------- mapping ---------------------------------- */

function groupOf(createdAt: string): NotificationGroup {
  const created = new Date(createdAt);
  const now = new Date();
  const days = Math.floor((now.getTime() - created.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return "earlier";
}

function relativeTime(createdAt: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function toNotification(item: NotificationEntity): AppNotification {
  const createdAt = item.createdAt ?? new Date().toISOString();
  return {
    id: item.id,
    kind: item.kind,
    category: item.category ?? categoryOf(item.kind),
    title: item.title,
    description: item.description,
    time: new Date(createdAt).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    }),
    timeAgo: relativeTime(createdAt),
    createdAt,
    group: groupOf(createdAt),
    read: Boolean(item.read),
    orderId: item.orderId ?? null,
    orderCode: item.orderCode ?? null,
  };
}

/* --------------------------- response parsing ---------------------------- */

type RawListResponse =
  | NotificationEntity[]
  | {
      items?: NotificationEntity[];
      results?: NotificationEntity[];
      page?: number;
      limit?: number;
      total?: number;
      hasMore?: boolean;
      unread?: number;
    };

function parseList(raw: RawListResponse, page: number, limit: number): NotificationPage {
  const list = Array.isArray(raw) ? raw : (raw.items ?? raw.results ?? []);
  const items = list.map(toNotification);
  const total = Array.isArray(raw) ? items.length : (raw.total ?? items.length);
  const unread = Array.isArray(raw)
    ? items.filter((item) => !item.read).length
    : (raw.unread ?? items.filter((item) => !item.read).length);
  const hasMore = Array.isArray(raw)
    ? false
    : (raw.hasMore ?? page * limit < total);
  return { items, page, limit, total, hasMore, unread, fromCache: false };
}

/* ------------------------------ local cache ------------------------------ */

/** Full local mirror used for offline reads and optimistic updates. */
function readMirror(stale = false): NotificationEntity[] | null {
  return stale
    ? readStaleCache<NotificationEntity[]>(CACHE_KEYS.notifications)
    : readCache<NotificationEntity[]>(CACHE_KEYS.notifications);
}

function writeMirror(items: NotificationEntity[]) {
  writeCache(CACHE_KEYS.notifications, items.slice(0, 200));
  writeCache(CACHE_KEYS.unreadNotifications, items.filter((item) => !item.read).length);
}

function mergeMirror(page: number, incoming: NotificationEntity[]) {
  const existing = page === 1 ? [] : (readMirror(true) ?? []);
  const byId = new Map(existing.map((item) => [item.id, item] as const));
  for (const item of incoming) byId.set(item.id, item);
  const merged = [...byId.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  writeMirror(merged);
}

function matchesQuery(
  item: NotificationEntity,
  filter: NotificationFilter,
  search: string,
): boolean {
  const category = item.category ?? categoryOf(item.kind);
  if (filter !== "all" && category !== filter) return false;
  if (!search) return true;
  const needle = search.toLowerCase();
  return (
    item.title.toLowerCase().includes(needle) ||
    item.description.toLowerCase().includes(needle) ||
    String(item.orderCode ?? "").toLowerCase().includes(needle)
  );
}

function pageFromMirror(
  page: number,
  limit: number,
  filter: NotificationFilter,
  search: string,
): NotificationPage | null {
  const mirror = readMirror(true);
  if (!mirror) return null;
  const matching = mirror.filter((item) => matchesQuery(item, filter, search));
  const slice = matching.slice((page - 1) * limit, page * limit);
  return {
    items: slice.map(toNotification),
    page,
    limit,
    total: matching.length,
    hasMore: page * limit < matching.length,
    unread: mirror.filter((item) => !item.read).length,
    fromCache: true,
  };
}

/* --------------------------- offline mutations --------------------------- */

type PendingAction =
  | { type: "read"; id: string }
  | { type: "read-all" }
  | { type: "delete"; id: string };

const PENDING_KEY = "quickpress:notifications:pending";

function readPending(): PendingAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingAction[]) : [];
  } catch {
    return [];
  }
}

function writePending(actions: PendingAction[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(actions.slice(-100)));
  } catch {
    /* storage unavailable — best effort */
  }
}

function queuePending(action: PendingAction) {
  writePending([...readPending(), action]);
}

/** Replay every mutation that happened while the device was offline. */
export async function syncPendingNotificationActions(): Promise<number> {
  if (!isOnline()) return 0;
  const pending = readPending();
  if (pending.length === 0) return 0;
  writePending([]);
  let synced = 0;
  const failed: PendingAction[] = [];
  for (const action of pending) {
    try {
      if (action.type === "read") await apiPutJson(`/api/notifications/${action.id}/read`, {});
      else if (action.type === "read-all") await apiPutJson(`/api/notifications/read-all`, {});
      else await apiDeleteJson(`/api/notifications/${action.id}`);
      synced += 1;
    } catch (error) {
      // Only keep transport failures — a 404 means the server already agrees.
      if (error instanceof ApiError && error.kind === "not-found") continue;
      failed.push(action);
    }
  }
  if (failed.length > 0) writePending(failed);
  return synced;
}

export function hasPendingNotificationActions(): boolean {
  return readPending().length > 0;
}

/* ------------------------------ change events ---------------------------- */

const CHANGE_EVENT = "quickpress:notifications-changed";

function emitChange(unread: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { unread } }));
}

/** Subscribe to unread-count changes (used by the header badge). */
export function onNotificationsChanged(listener: (unread: number) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<{ unread: number }>).detail;
    listener(detail?.unread ?? 0);
  };
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

/* --------------------------------- reads --------------------------------- */

export async function fetchNotificationPage(
  query: NotificationQuery = {},
): Promise<NotificationPage> {
  const page = Math.max(1, query.page ?? 1);
  const limit = query.limit ?? NOTIFICATION_PAGE_SIZE;
  const filter: NotificationFilter = query.filter ?? "all";
  const search = (query.search ?? "").trim();

  if (!isOnline()) {
    const cached = pageFromMirror(page, limit, filter, search);
    if (cached) return cached;
    throw new ApiError("offline", "Device is offline");
  }

  try {
    const raw = await apiGetJson<RawListResponse>("/api/notifications", {
      params: {
        page,
        limit,
        ...(filter === "all" ? {} : { type: filter }),
        ...(search ? { search } : {}),
      },
      ...(query.signal ? { signal: query.signal } : {}),
    });
    const parsed = parseList(raw, page, limit);
    if (!search && filter === "all") mergeMirror(page, parsed.items.map(toEntity));
    writeCache(CACHE_KEYS.unreadNotifications, parsed.unread);
    return parsed;
  } catch (error) {
    const cached = pageFromMirror(page, limit, filter, search);
    if (cached) return cached;
    throw error;
  }
}

function toEntity(item: AppNotification): NotificationEntity {
  return {
    id: item.id,
    accountId: "",
    role: "customer",
    kind: item.kind,
    category: item.category,
    title: item.title,
    description: item.description,
    createdAt: item.createdAt,
    read: item.read,
    orderId: item.orderId,
    orderCode: item.orderCode,
  };
}

/** Backwards-compatible helper: the first page as a plain list. */
export async function fetchNotifications(): Promise<AppNotification[]> {
  const page = await fetchNotificationPage({ limit: 50 });
  return page.items;
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  if (!isOnline()) {
    return readStaleCache<number>(CACHE_KEYS.unreadNotifications) ?? 0;
  }
  try {
    const response = await apiGetJson<{ count: number } | number>(
      "/api/notifications/unread-count",
    );
    const count = typeof response === "number" ? response : (response?.count ?? 0);
    writeCache(CACHE_KEYS.unreadNotifications, count);
    return count;
  } catch (error) {
    const cached = readStaleCache<number>(CACHE_KEYS.unreadNotifications);
    if (cached !== null) return cached;
    throw error;
  }
}

/* ------------------------------- mutations ------------------------------- */

function patchMirror(update: (items: NotificationEntity[]) => NotificationEntity[]): number {
  const mirror = readMirror(true);
  if (!mirror) return readStaleCache<number>(CACHE_KEYS.unreadNotifications) ?? 0;
  const next = update(mirror);
  writeMirror(next);
  return next.filter((item) => !item.read).length;
}

export async function markNotificationRead(id: string): Promise<{ ok: boolean; unread: number }> {
  const unread = patchMirror((items) =>
    items.map((item) => (item.id === id ? { ...item, read: true } : item)),
  );
  emitChange(unread);
  if (!isOnline()) {
    queuePending({ type: "read", id });
    return { ok: true, unread };
  }
  try {
    const response = await apiPutJson<{ unread?: number } | null>(
      `/api/notifications/${id}/read`,
      {},
    );
    const serverUnread = response?.unread ?? unread;
    writeCache(CACHE_KEYS.unreadNotifications, serverUnread);
    emitChange(serverUnread);
    return { ok: true, unread: serverUnread };
  } catch (error) {
    if (error instanceof ApiError && error.kind === "not-found") return { ok: true, unread };
    queuePending({ type: "read", id });
    return { ok: false, unread };
  }
}

/** Kept for callers that mark several notifications at once. */
export async function markNotificationsRead(ids: string[]) {
  for (const id of ids) await markNotificationRead(id);
  return { ok: true, ids };
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean; unread: number }> {
  patchMirror((items) => items.map((item) => ({ ...item, read: true })));
  emitChange(0);
  if (!isOnline()) {
    queuePending({ type: "read-all" });
    return { ok: true, unread: 0 };
  }
  try {
    await apiPutJson(`/api/notifications/read-all`, {});
    writeCache(CACHE_KEYS.unreadNotifications, 0);
    return { ok: true, unread: 0 };
  } catch {
    queuePending({ type: "read-all" });
    return { ok: false, unread: 0 };
  }
}

export async function deleteNotification(id: string): Promise<{ ok: boolean; unread: number }> {
  const unread = patchMirror((items) => items.filter((item) => item.id !== id));
  emitChange(unread);
  if (!isOnline()) {
    queuePending({ type: "delete", id });
    return { ok: true, unread };
  }
  try {
    const response = await apiDeleteJson<{ unread?: number } | null>(`/api/notifications/${id}`);
    const serverUnread = response?.unread ?? unread;
    writeCache(CACHE_KEYS.unreadNotifications, serverUnread);
    emitChange(serverUnread);
    return { ok: true, unread: serverUnread };
  } catch (error) {
    if (error instanceof ApiError && error.kind === "not-found") return { ok: true, unread };
    queuePending({ type: "delete", id });
    return { ok: false, unread };
  }
}
