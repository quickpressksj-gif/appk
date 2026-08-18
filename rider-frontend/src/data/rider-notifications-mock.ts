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

export const RIDER_NOTIFICATIONS: RiderNotification[] = [
  {
    id: "ntf-01",
    category: "order",
    priority: "critical",
    title: "New delivery assigned",
    body: "Order #QP-48213 from Sparkle Laundry, Indiranagar. Pickup in 12 minutes.",
    time: "2 min ago",
    isoTime: "2026-08-07T19:44:00+05:30",
    group: "Today",
    read: false,
    actionLabel: "View order",
    actionTarget: "order",
    reference: "QP-48213",
  },
  {
    id: "ntf-02",
    category: "alert",
    priority: "high",
    title: "Pickup delay warning",
    body: "You are 6 minutes behind the pickup slot for #QP-48207. Update the partner if delayed.",
    time: "18 min ago",
    isoTime: "2026-08-07T19:28:00+05:30",
    group: "Today",
    read: false,
    actionLabel: "Open chat",
    actionTarget: "support",
    reference: "QP-48207",
  },
  {
    id: "ntf-03",
    category: "payment",
    priority: "normal",
    title: "₹1,240 credited to wallet",
    body: "Earnings for 7 Aug deliveries have been added to your wallet balance.",
    time: "1 hr ago",
    isoTime: "2026-08-07T18:40:00+05:30",
    group: "Today",
    read: false,
    actionLabel: "Open wallet",
    actionTarget: "wallet",
  },
  {
    id: "ntf-04",
    category: "promotion",
    priority: "normal",
    title: "Weekend surge is live",
    body: "Earn 1.4x on every delivery between 6 PM and 11 PM in Koramangala.",
    time: "3 hrs ago",
    isoTime: "2026-08-07T16:30:00+05:30",
    group: "Today",
    read: true,
    actionLabel: "See incentives",
    actionTarget: "wallet",
  },
  {
    id: "ntf-05",
    category: "order",
    priority: "normal",
    title: "Delivery completed",
    body: "Order #QP-48198 delivered to Ananya Rao. ₹156 added including a ₹30 tip.",
    time: "5 hrs ago",
    isoTime: "2026-08-07T14:12:00+05:30",
    group: "Today",
    read: true,
    actionLabel: "View trip",
    actionTarget: "order",
    reference: "QP-48198",
  },
  {
    id: "ntf-06",
    category: "system",
    priority: "normal",
    title: "App updated to v3.4",
    body: "Faster navigation handoff and a redesigned wallet. Restart the app to apply.",
    time: "Yesterday, 9:10 PM",
    isoTime: "2026-08-06T21:10:00+05:30",
    group: "Yesterday",
    read: true,
  },
  {
    id: "ntf-07",
    category: "payment",
    priority: "normal",
    title: "Withdrawal successful",
    body: "₹2,000 transferred to HDFC Bank ••••4821. UTR HDFC26080612.",
    time: "Yesterday, 6:02 PM",
    isoTime: "2026-08-06T18:02:00+05:30",
    group: "Yesterday",
    read: true,
    actionLabel: "View transactions",
    actionTarget: "wallet",
  },
  {
    id: "ntf-08",
    category: "support",
    priority: "high",
    title: "Support replied to ticket #SR-3391",
    body: "We have refunded the ₹40 COD mismatch to your wallet. Let us know if anything is off.",
    time: "Yesterday, 2:45 PM",
    isoTime: "2026-08-06T14:45:00+05:30",
    group: "Yesterday",
    read: false,
    actionLabel: "Open ticket",
    actionTarget: "support",
  },
  {
    id: "ntf-09",
    category: "alert",
    priority: "high",
    title: "Heavy rain in your zone",
    body: "Ride carefully. Rain surge of ₹15 per delivery is active until 10 PM.",
    time: "5 Aug, 7:20 PM",
    isoTime: "2026-08-05T19:20:00+05:30",
    group: "Earlier",
    read: true,
  },
  {
    id: "ntf-10",
    category: "system",
    priority: "normal",
    title: "Document expiring soon",
    body: "Your vehicle insurance expires on 28 Aug 2026. Upload the renewed copy to stay active.",
    time: "4 Aug, 11:05 AM",
    isoTime: "2026-08-04T11:05:00+05:30",
    group: "Earlier",
    read: false,
    actionLabel: "Update documents",
    actionTarget: "announcement",
  },
];

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-01",
    title: "New payout schedule from 15 Aug",
    body: "Weekly settlements move from Monday to Sunday midnight so money reaches your bank a day earlier. Instant withdrawal continues at a 1% fee.",
    date: "6 Aug 2026",
    tag: "Payout",
    pinned: true,
  },
  {
    id: "ann-02",
    title: "Helmet check mandatory in Bengaluru",
    body: "From 10 Aug, a helmet selfie is required before your first pickup of the day. It takes under 10 seconds and keeps your insurance active.",
    date: "5 Aug 2026",
    tag: "Safety",
    pinned: true,
  },
  {
    id: "ann-03",
    title: "Whitefield zone now live",
    body: "A new high-demand zone has opened with a ₹300 daily completion bonus for the first two weeks.",
    date: "3 Aug 2026",
    tag: "Zone",
    pinned: false,
  },
  {
    id: "ann-04",
    title: "In-app chat with customers",
    body: "You can now message customers and partners directly from the delivery screen with quick replies and canned messages.",
    date: "1 Aug 2026",
    tag: "Feature",
    pinned: false,
  },
  {
    id: "ann-05",
    title: "Updated cancellation policy",
    body: "Cancellations after pickup now need a reason and a photo. Genuine cases will not affect your acceptance rate.",
    date: "28 Jul 2026",
    tag: "Policy",
    pinned: false,
  },
];

export const QUICK_REPLIES: Record<ChatThread["kind"], string[]> = {
  customer: [
    "I'm on the way, arriving in 5 minutes.",
    "I'm at your gate, please come down.",
    "Traffic is heavy, running 10 minutes late.",
    "Could you share the exact flat number?",
  ],
  partner: [
    "Reaching the store in 5 minutes.",
    "Please keep the order packed and ready.",
    "I'm waiting at the pickup counter.",
    "Order weight looks higher than listed.",
  ],
  support: [
    "Customer is not answering calls.",
    "COD amount does not match the app.",
    "I need help with a wrong address.",
    "My earnings for this trip look incorrect.",
  ],
};

export const CHAT_THREADS: ChatThread[] = [
  {
    id: "thr-customer-48213",
    kind: "customer",
    name: "Ananya Rao",
    subtitle: "Customer · Order #QP-48213",
    orderId: "QP-48213",
    avatarInitials: "AR",
    lastMessage: "Please ring the bell twice, thanks!",
    lastTime: "19:46",
    unread: 2,
    online: true,
    messages: [
      {
        id: "m1",
        sender: "system",
        body: "Chat opened for order #QP-48213. Messages are stored for 24 hours.",
        time: "19:38",
        status: "read",
      },
      {
        id: "m2",
        sender: "customer",
        body: "Hi! Are you picking up my laundry order now?",
        time: "19:40",
        status: "read",
      },
      {
        id: "m3",
        sender: "rider",
        body: "Yes, collecting from the store. Should reach you by 8:05 PM.",
        time: "19:41",
        status: "read",
      },
      {
        id: "m4",
        sender: "customer",
        body: "Perfect. Flat 402, B block — the lift is under maintenance.",
        time: "19:45",
        status: "delivered",
      },
      {
        id: "m5",
        sender: "customer",
        body: "Please ring the bell twice, thanks!",
        time: "19:46",
        status: "delivered",
      },
    ],
  },
  {
    id: "thr-partner-sparkle",
    kind: "partner",
    name: "Sparkle Laundry",
    subtitle: "Partner · Indiranagar 100ft Road",
    orderId: "QP-48213",
    avatarInitials: "SL",
    lastMessage: "Order will be ready in 3 minutes.",
    lastTime: "19:35",
    unread: 0,
    online: true,
    messages: [
      {
        id: "m1",
        sender: "rider",
        body: "Reaching your store in 4 minutes for #QP-48213.",
        time: "19:31",
        status: "read",
      },
      {
        id: "m2",
        sender: "partner",
        body: "Order will be ready in 3 minutes.",
        time: "19:35",
        status: "read",
      },
    ],
  },
  {
    id: "thr-support-3391",
    kind: "support",
    name: "QuickPress Support",
    subtitle: "Ticket #SR-3391 · COD mismatch",
    orderId: "QP-48176",
    avatarInitials: "QS",
    lastMessage: "We have refunded ₹40 to your wallet.",
    lastTime: "Yesterday",
    unread: 1,
    online: false,
    messages: [
      {
        id: "m1",
        sender: "rider",
        body: "Customer paid ₹40 less than the COD amount on #QP-48176.",
        time: "14:20",
        status: "read",
      },
      {
        id: "m2",
        sender: "support",
        body: "Thanks for flagging. Checking the order invoice now.",
        time: "14:33",
        status: "read",
      },
      {
        id: "m3",
        sender: "support",
        body: "We have refunded ₹40 to your wallet.",
        time: "14:45",
        status: "delivered",
      },
    ],
  },
];

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

const EXTRA_ANNOUNCEMENTS: StreamedAnnouncement[] = [
  {
    id: "ann-06",
    stream: "campaign",
    title: "Monsoon Hero campaign is live",
    body: "Complete 30 deliveries this week and get a ₹500 bonus plus a free rain jacket from any partner store.",
    date: "7 Aug 2026",
    tag: "Feature",
    pinned: true,
  },
  {
    id: "ann-07",
    stream: "incentive",
    title: "Evening streak incentive doubled",
    body: "Five back-to-back deliveries between 7 PM and 10 PM now pay a ₹150 streak bonus instead of ₹75.",
    date: "6 Aug 2026",
    tag: "Payout",
    pinned: false,
  },
  {
    id: "ann-08",
    stream: "festival",
    title: "Independence Day festival offer",
    body: "1.5x surge on 15 Aug across all Bengaluru zones, plus a ₹200 bonus on your tenth delivery of the day.",
    date: "5 Aug 2026",
    tag: "Zone",
    pinned: false,
  },
  {
    id: "ann-09",
    stream: "maintenance",
    title: "Scheduled maintenance on 12 Aug",
    body: "The rider app will be read-only from 2:00 AM to 3:00 AM. Active trips continue to work offline.",
    date: "4 Aug 2026",
    tag: "Policy",
    pinned: false,
  },
];

/** Existing announcements mapped onto streams, plus Sprint 4.7 entries. */
const BASE_STREAM: Record<Announcement["tag"], AnnouncementStream> = {
  Policy: "system",
  Feature: "system",
  Zone: "campaign",
  Safety: "maintenance",
  Payout: "incentive",
};

export const ANNOUNCEMENT_FEED: StreamedAnnouncement[] = [
  ...EXTRA_ANNOUNCEMENTS,
  ...ANNOUNCEMENTS.map((item) => ({ ...item, stream: BASE_STREAM[item.tag] })),
];

export function selectAnnouncements(
  rows: StreamedAnnouncement[],
  stream: AnnouncementStream | "all",
) {
  const filtered = stream === "all" ? rows : rows.filter((row) => row.stream === stream);
  return [...filtered].sort((a, b) => Number(b.pinned) - Number(a.pinned));
}

export function loadAnnouncementFeed() {
  return new Promise<StreamedAnnouncement[]>((resolve) => {
    setTimeout(() => resolve(ANNOUNCEMENT_FEED), 540);
  });
}
