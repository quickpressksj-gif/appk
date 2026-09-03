/**
 * Realistic mock data for the Rider Notifications & Communication module
 * (Sprint 4.7). UI-only: no backend, no Firebase, no push service.
 */

export type NotificationCategory =
  | "order"
  | "payment"
  | "system"
  | "promotion"
  | "support"
  | "alert";

export type NotificationPriority = "normal" | "high" | "critical";

export type RiderNotification = {
  id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  time: string;
  isoTime: string;
  group: "Today" | "Yesterday" | "Earlier";
  read: boolean;
  actionLabel?: string;
  actionTarget?: "order" | "wallet" | "support" | "announcement";
  reference?: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  date: string;
  tag: "Policy" | "Feature" | "Zone" | "Safety" | "Payout";
  pinned: boolean;
};

export type ChatSender = "rider" | "customer" | "partner" | "support" | "system";

export type ChatMessage = {
  id: string;
  sender: ChatSender;
  body: string;
  time: string;
  status: "sent" | "delivered" | "read";
};

export type ChatThread = {
  id: string;
  kind: "customer" | "partner" | "support";
  name: string;
  subtitle: string;
  orderId: string;
  avatarInitials: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  online: boolean;
  messages: ChatMessage[];
};

export type NotificationPreferences = {
  orderAlerts: boolean;
  paymentAlerts: boolean;
  promotions: boolean;
  systemUpdates: boolean;
  chatMessages: boolean;
  sound: boolean;
  vibration: boolean;
  doNotDisturb: boolean;
  dndFrom: string;
  dndTo: string;
};

export const NOTIFICATION_CATEGORIES: { id: NotificationCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "order", label: "Orders" },
  { id: "payment", label: "Payments" },
  { id: "alert", label: "Alerts" },
  { id: "promotion", label: "Offers" },
  { id: "system", label: "System" },
  { id: "support", label: "Support" },
];

export const RIDER_NOTIFICATIONS: RiderNotification[] = [];

export const ANNOUNCEMENTS: Announcement[] = [];

export const QUICK_REPLIES: Record<ChatThread["kind"], string[]> = {
  customer: [
    "I'm on the way, arriving soon.",
    "I'm at your gate, please come down.",
    "Could you share the exact flat or building details?",
  ],
  partner: [
    "Reaching the store in 5 minutes.",
    "Please keep the order packed and ready.",
    "I'm waiting at the pickup counter.",
  ],
  support: [
    "Need help with order address.",
    "Customer is not answering calls.",
  ],
};

export const CHAT_THREADS: ChatThread[] = [];

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  orderAlerts: true,
  paymentAlerts: true,
  promotions: false,
  systemUpdates: true,
  chatMessages: true,
  sound: true,
  vibration: true,
  doNotDisturb: false,
  dndFrom: "23:00",
  dndTo: "06:00",
};

export const NOTIFICATION_GROUP_ORDER: RiderNotification["group"][] = [
  "Today",
  "Yesterday",
  "Earlier",
];

/** Category + read-state filtering used by the notification center. */
export function selectNotifications(
  rows: RiderNotification[],
  category: NotificationCategory | "all",
  unreadOnly: boolean,
  query: string,
) {
  const term = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (category !== "all" && row.category !== category) return false;
    if (unreadOnly && row.read) return false;
    if (term && !`${row.title} ${row.body} ${row.reference ?? ""}`.toLowerCase().includes(term)) {
      return false;
    }
    return true;
  });
}

export function groupNotifications(rows: RiderNotification[]) {
  return NOTIFICATION_GROUP_ORDER.map((group) => ({
    group,
    rows: rows.filter((row) => row.group === group),
  })).filter((section) => section.rows.length > 0);
}

export function loadNotifications() {
  return new Promise<RiderNotification[]>((resolve) => {
    setTimeout(() => resolve(RIDER_NOTIFICATIONS), 600);
  });
}

export function loadAnnouncements() {
  return new Promise<Announcement[]>((resolve) => {
    setTimeout(() => resolve(ANNOUNCEMENTS), 540);
  });
}

export function loadChatThreads() {
  return new Promise<ChatThread[]>((resolve) => {
    setTimeout(() => resolve(CHAT_THREADS), 560);
  });
}

/* ---------------------------------------------------------------------------
 * Sprint 4.7 additions — announcement streams for the Announcements screen.
 * Existing exports above are untouched.
 * ------------------------------------------------------------------------- */

export type AnnouncementStream =
  | "campaign"
  | "incentive"
  | "festival"
  | "maintenance"
  | "system";

export type StreamedAnnouncement = Announcement & { stream: AnnouncementStream };

export const ANNOUNCEMENT_STREAMS: { id: AnnouncementStream | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "campaign", label: "Campaigns" },
  { id: "incentive", label: "Incentives" },
  { id: "festival", label: "Festival offers" },
  { id: "maintenance", label: "Maintenance" },
  { id: "system", label: "System updates" },
];

export const STREAM_LABEL: Record<AnnouncementStream, string> = {
  campaign: "Campaign",
  incentive: "Incentive",
  festival: "Festival offer",
  maintenance: "Maintenance",
  system: "System update",
};

export const ANNOUNCEMENT_FEED: StreamedAnnouncement[] = [];

export function selectAnnouncements(
  rows: StreamedAnnouncement[],
  stream: AnnouncementStream | "all",
) {
  const filtered = stream === "all" ? rows : rows.filter((row) => row.stream === stream);
  return [...filtered].sort((a, b) => Number(b.pinned) - Number(a.pinned));
}

export function loadAnnouncementFeed(): Promise<StreamedAnnouncement[]> {
  return Promise.resolve([]);
}
