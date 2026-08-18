/**
 * Sprint 3.8 — Partner Notifications & Communication mock data (UI only).
 *
 * No backend, no Firebase Cloud Messaging, no persistence. Every value below is
 * static demo data used to exercise the Notification Center, Communication
 * Center, Chat and Announcements UI states (loading, populated, filtered,
 * empty, offline). Future integration points are marked with `TODO(api)` /
 * `TODO(fcm)`.
 */

export type NotificationCategory =
  | "new-order"
  | "order-update"
  | "pickup"
  | "delivery"
  | "payment"
  | "wallet"
  | "message"
  | "promotion"
  | "system";

export type NotificationPriority = "high" | "medium" | "low";

export type PartnerNotification = {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  time: string;
  timestamp: number;
  read: boolean;
  priority: NotificationPriority;
};

export type NotificationFilterId = "all" | "unread" | "orders" | "payments" | "promotions" | "system";

export const NOTIFICATION_CATEGORY_META: Record<
  NotificationCategory,
  { label: string; group: Exclude<NotificationFilterId, "all" | "unread">; tone: "primary" | "green" | "danger" | "muted" }
> = {
  "new-order": { label: "New Orders", group: "orders", tone: "green" },
  "order-update": { label: "Order Updates", group: "orders", tone: "primary" },
  pickup: { label: "Pickup Updates", group: "orders", tone: "primary" },
  delivery: { label: "Delivery Updates", group: "orders", tone: "primary" },
  payment: { label: "Payments", group: "payments", tone: "green" },
  wallet: { label: "Wallet", group: "payments", tone: "green" },
  message: { label: "Customer Messages", group: "system", tone: "primary" },
  promotion: { label: "Promotions", group: "promotions", tone: "muted" },
  system: { label: "System Notifications", group: "system", tone: "danger" },
};

export const NOTIFICATION_FILTERS: { id: NotificationFilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "orders", label: "Orders" },
  { id: "payments", label: "Payments" },
  { id: "promotions", label: "Promotions" },
  { id: "system", label: "System" },
];

const notifications: PartnerNotification[] = [
  {
    id: "ntf-01",
    category: "new-order",
    title: "New order #QP-48213",
    description: "Wash & Fold · 4.2 kg · Anaya Sharma · Pickup slot 5:00 – 7:00 PM today.",
    time: "2 min ago",
    timestamp: 2,
    read: false,
    priority: "high",
  },
  {
    id: "ntf-02",
    category: "pickup",
    title: "Pickup assigned to rider",
    description: "Rider Imran K. is on the way for order #QP-48208. ETA 18 minutes.",
    time: "14 min ago",
    timestamp: 14,
    read: false,
    priority: "high",
  },
  {
    id: "ntf-03",
    category: "payment",
    title: "Payment received ₹1,240",
    description: "UPI payment settled for order #QP-48199. Net of 12% platform fee.",
    time: "48 min ago",
    timestamp: 48,
    read: false,
    priority: "medium",
  },
  {
    id: "ntf-04",
    category: "order-update",
    title: "Order #QP-48187 moved to Ironing",
    description: "6 garments completed washing. Next stage due by 4:30 PM.",
    time: "1 hr ago",
    timestamp: 60,
    read: true,
    priority: "low",
  },
  {
    id: "ntf-05",
    category: "delivery",
    title: "Delivery completed",
    description: "Order #QP-48176 delivered to Rohit Verma. Rated 5★ by customer.",
    time: "2 hr ago",
    timestamp: 120,
    read: true,
    priority: "low",
  },
  {
    id: "ntf-06",
    category: "wallet",
    title: "Payout of ₹8,450 initiated",
    description: "Weekly settlement sent to HDFC •••• 4412. Expected within 24 hours.",
    time: "5 hr ago",
    timestamp: 300,
    read: false,
    priority: "medium",
  },
  {
    id: "ntf-07",
    category: "message",
    title: "Anaya Sharma sent a message",
    description: "“Please handle the silk saree separately, it stains easily.”",
    time: "6 hr ago",
    timestamp: 360,
    read: false,
    priority: "medium",
  },
  {
    id: "ntf-08",
    category: "promotion",
    title: "Monsoon Dry Clean campaign is live",
    description: "Opt in to feature your store with 15% off dry cleaning until 30 Sep.",
    time: "Yesterday",
    timestamp: 1440,
    read: true,
    priority: "low",
  },
  {
    id: "ntf-09",
    category: "system",
    title: "KYC document expiring soon",
    description: "Your GST certificate expires in 12 days. Re-upload to avoid payout holds.",
    time: "Yesterday",
    timestamp: 1500,
    read: false,
    priority: "high",
  },
  {
    id: "ntf-10",
    category: "system",
    title: "Scheduled maintenance on 12 Sep",
    description: "Partner app will be read-only from 2:00 AM to 3:30 AM IST.",
    time: "2 days ago",
    timestamp: 2880,
    read: true,
    priority: "medium",
  },
  {
    id: "ntf-11",
    category: "payment",
    title: "COD collection reconciled",
    description: "₹640 cash collected for order #QP-48120 adjusted against your wallet.",
    time: "3 days ago",
    timestamp: 4320,
    read: true,
    priority: "low",
  },
  {
    id: "ntf-12",
    category: "promotion",
    title: "Festival offer slots open",
    description: "Reserve a Diwali banner slot before 20 Oct to boost store visibility.",
    time: "4 days ago",
    timestamp: 5760,
    read: true,
    priority: "low",
  },
];

/* ------------------------------ Communication ----------------------------- */

export type ThreadKind = "customer" | "order" | "support" | "broadcast";

export type ChatMessageStatus = "sent" | "delivered" | "read";

export type ChatMessage = {
  id: string;
  from: "partner" | "them";
  type: "text" | "image";
  text: string;
  imageLabel?: string;
  time: string;
  status: ChatMessageStatus;
};

export type PartnerThread = {
  id: string;
  kind: ThreadKind;
  name: string;
  subtitle: string;
  avatarInitials: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  online: boolean;
  messages: ChatMessage[];
};

export const THREAD_TABS: { id: ThreadKind; label: string }[] = [
  { id: "customer", label: "Customers" },
  { id: "order", label: "Orders" },
  { id: "support", label: "Support" },
  { id: "broadcast", label: "Admin" },
];

const threads: PartnerThread[] = [
  {
    id: "thr-anaya",
    kind: "customer",
    name: "Anaya Sharma",
    subtitle: "Premium member · 24 orders",
    avatarInitials: "AS",
    lastMessage: "Please handle the silk saree separately.",
    lastTime: "6 hr",
    unread: 2,
    online: true,
    messages: [
      {
        id: "m1",
        from: "them",
        type: "text",
        text: "Hi! I just placed order #QP-48213 for a wash & fold pickup.",
        time: "10:12 AM",
        status: "read",
      },
      {
        id: "m2",
        from: "partner",
        type: "text",
        text: "Thank you Anaya! Our rider will reach between 5 and 7 PM today.",
        time: "10:14 AM",
        status: "read",
      },
      {
        id: "m3",
        from: "them",
        type: "image",
        text: "",
        imageLabel: "silk-saree-stain.jpg",
        time: "10:18 AM",
        status: "read",
      },
      {
        id: "m4",
        from: "them",
        type: "text",
        text: "Please handle the silk saree separately, it stains easily.",
        time: "10:18 AM",
        status: "delivered",
      },
    ],
  },
  {
    id: "thr-rohit",
    kind: "customer",
    name: "Rohit Verma",
    subtitle: "Repeat customer · 9 orders",
    avatarInitials: "RV",
    lastMessage: "Delivered on time, thanks a lot!",
    lastTime: "1 d",
    unread: 0,
    online: false,
    messages: [
      {
        id: "m1",
        from: "them",
        type: "text",
        text: "Delivered on time, thanks a lot!",
        time: "Yesterday",
        status: "read",
      },
      {
        id: "m2",
        from: "partner",
        type: "text",
        text: "Glad you liked it Rohit. See you next week!",
        time: "Yesterday",
        status: "read",
      },
    ],
  },
  {
    id: "thr-order-48208",
    kind: "order",
    name: "Order #QP-48208",
    subtitle: "Dry Clean · Rider Imran K.",
    avatarInitials: "48",
    lastMessage: "Rider reached the pickup location.",
    lastTime: "22 min",
    unread: 1,
    online: true,
    messages: [
      {
        id: "m1",
        from: "them",
        type: "text",
        text: "Pickup started. I am 2 km away from your store.",
        time: "3:40 PM",
        status: "read",
      },
      {
        id: "m2",
        from: "partner",
        type: "text",
        text: "Noted. The bags are tagged and ready at the counter.",
        time: "3:41 PM",
        status: "delivered",
      },
      {
        id: "m3",
        from: "them",
        type: "text",
        text: "Rider reached the pickup location.",
        time: "3:58 PM",
        status: "sent",
      },
    ],
  },
  {
    id: "thr-order-48187",
    kind: "order",
    name: "Order #QP-48187",
    subtitle: "Wash & Iron · 6 garments",
    avatarInitials: "87",
    lastMessage: "Customer requested express delivery.",
    lastTime: "2 hr",
    unread: 0,
    online: false,
    messages: [
      {
        id: "m1",
        from: "them",
        type: "text",
        text: "Customer requested express delivery for this order.",
        time: "1:20 PM",
        status: "read",
      },
    ],
  },
  {
    id: "thr-support",
    kind: "support",
    name: "QuickPress Support",
    subtitle: "Ticket #SUP-2291 · Payout query",
    avatarInitials: "QP",
    lastMessage: "We have escalated your settlement query.",
    lastTime: "4 hr",
    unread: 1,
    online: true,
    messages: [
      {
        id: "m1",
        from: "partner",
        type: "text",
        text: "My weekly settlement of ₹8,450 is still showing as initiated.",
        time: "11:02 AM",
        status: "read",
      },
      {
        id: "m2",
        from: "them",
        type: "text",
        text: "We have escalated your settlement query to the payouts team.",
        time: "11:35 AM",
        status: "delivered",
      },
    ],
  },
  {
    id: "thr-broadcast",
    kind: "broadcast",
    name: "Admin Broadcast",
    subtitle: "Platform announcements",
    avatarInitials: "AD",
    lastMessage: "Scheduled maintenance on 12 Sep, 2:00 AM IST.",
    lastTime: "2 d",
    unread: 0,
    online: false,
    messages: [
      {
        id: "m1",
        from: "them",
        type: "text",
        text: "Scheduled maintenance on 12 Sep, 2:00 AM to 3:30 AM IST. Orders stay read-only.",
        time: "2 days ago",
        status: "read",
      },
      {
        id: "m2",
        from: "them",
        type: "text",
        text: "New payout cycle: settlements now run every Tuesday and Friday.",
        time: "2 days ago",
        status: "read",
      },
    ],
  },
];

/* ------------------------------ Announcements ----------------------------- */

export type AnnouncementKind = "platform" | "maintenance" | "campaign" | "festival";

export type PartnerAnnouncement = {
  id: string;
  kind: AnnouncementKind;
  title: string;
  body: string;
  date: string;
  tag: string;
};

export const ANNOUNCEMENT_KIND_LABEL: Record<AnnouncementKind, string> = {
  platform: "Platform Update",
  maintenance: "Maintenance",
  campaign: "Campaign",
  festival: "Festival Offer",
};

const announcements: PartnerAnnouncement[] = [
  {
    id: "ann-1",
    kind: "platform",
    title: "Partner app v3.8 released",
    body: "Notification Center, in-app messaging and announcements are now available on every partner device.",
    date: "Today",
    tag: "New",
  },
  {
    id: "ann-2",
    kind: "maintenance",
    title: "Scheduled maintenance · 12 Sep",
    body: "Partner services will be read-only from 2:00 AM to 3:30 AM IST. Existing orders remain unaffected.",
    date: "10 Sep",
    tag: "Action needed",
  },
  {
    id: "ann-3",
    kind: "campaign",
    title: "Monsoon Dry Clean campaign",
    body: "Opt in for a 15% dry-cleaning discount and get featured in the customer app carousel until 30 Sep.",
    date: "08 Sep",
    tag: "Opt in",
  },
  {
    id: "ann-4",
    kind: "festival",
    title: "Diwali banner slots open",
    body: "Reserve a festival banner slot before 20 Oct. Partners in last year's campaign saw 2.4x order volume.",
    date: "05 Sep",
    tag: "Limited",
  },
];

export type PartnerNotificationsData = {
  notifications: PartnerNotification[];
  threads: PartnerThread[];
  announcements: PartnerAnnouncement[];
};

/**
 * TODO(api): replace with GET /api/partner/notifications, /api/partner/threads
 * and /api/partner/announcements.
 * TODO(fcm): subscribe to Firebase Cloud Messaging topics and merge live
 * pushes into this dataset.
 */
export async function fetchPartnerNotificationsData(): Promise<PartnerNotificationsData> {
  await new Promise((resolve) => setTimeout(resolve, 650));
  return {
    notifications: notifications.map((item) => ({ ...item })),
    threads: threads.map((thread) => ({ ...thread, messages: [...thread.messages] })),
    announcements,
  };
}

export function matchesNotificationFilter(
  notification: PartnerNotification,
  filter: NotificationFilterId,
) {
  if (filter === "all") return true;
  if (filter === "unread") return !notification.read;
  return NOTIFICATION_CATEGORY_META[notification.category].group === filter;
}

export function unreadCount(items: PartnerNotification[]) {
  return items.filter((item) => !item.read).length;
}