/** GET /api/admin/notifications, POST /api/admin/notifications/broadcast — real in-app notifications only. */
import { apiGetJson, apiPostJson } from "@/api/core/transport";

export type Campaign = {
  id: string;
  title: string;
  audience: string;
  channel: "In-app";
  sent: string;
  opened: string;
  status: "Delivered";
  date: string;
};

type BackendNotification = {
  _id: string;
  accountId: string;
  role: string;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
};

/** The backend only stores per-recipient in-app notifications, so a "campaign" here
 * is a group of notifications created by the same broadcast (same title + timestamp). */
export async function fetchCampaigns(): Promise<Campaign[]> {
  const rows = await apiGetJson<BackendNotification[]>("/api/admin/notifications");
  const groups = new Map<string, { title: string; roles: Set<string>; count: number; date: string; read: number }>();
  for (const row of rows) {
    const key = `${row.title}__${row.createdAt}`;
    const group = groups.get(key) ?? { title: row.title, roles: new Set<string>(), count: 0, date: row.createdAt, read: 0 };
    group.roles.add(row.role);
    group.count += 1;
    if (row.read) group.read += 1;
    groups.set(key, group);
  }
  return Array.from(groups.entries()).map(([key, g]) => ({
    id: key,
    title: g.title || "Announcement",
    audience: Array.from(g.roles).map((r) => `${r.charAt(0).toUpperCase()}${r.slice(1)}s`).join(", ") || "—",
    channel: "In-app",
    sent: g.count.toLocaleString("en-IN"),
    opened: g.count ? `${Math.round((g.read / g.count) * 100)}%` : "—",
    status: "Delivered",
    date: g.date ? new Date(g.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—",
  }));
}

/** Broadcasts create in-app notifications only — there is no push/SMS/email provider wired up. */
export function sendBroadcast(payload: { title: string; body: string; audience: string }) {
  return apiPostJson<{ ok: boolean; reached: number }>("/api/admin/notifications/broadcast", {
    audience: payload.audience,
    title: payload.title,
    message: payload.body,
  });
}
