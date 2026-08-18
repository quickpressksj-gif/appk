/**
 * Sprint 3.10 — Partner Settings, Business Preferences & Account Management.
 * UI-only mock layer. No Firebase / MongoDB / Cloudinary here by design.
 *
 * TODO(backend): every loader/mutator below maps 1:1 to a REST endpoint.
 * See PARTNER_SPRINT_3_10_SETTINGS_REPORT.md → "Future backend integration points".
 */

export type ThemeMode = "light" | "dark" | "system";
export type LanguageCode = "en" | "hi";

export type PartnerAccount = {
  partnerName: string;
  shopName: string;
  mobile: string;
  email: string;
  photoInitials: string;
  photoUrl: string | null;
};

export type HolidayEntry = {
  id: string;
  date: string;
  label: string;
};

export type BusinessPreferences = {
  openingTime: string;
  closingTime: string;
  weeklyOff: string[];
  holidays: HolidayEntry[];
  vacationMode: boolean;
  vacationFrom: string;
  vacationTo: string;
  temporaryClosure: boolean;
  temporaryClosureMinutes: number;
  autoAcceptOrders: boolean;
  autoRejectTimeoutMinutes: number;
  pickupRadiusKm: number;
  deliveryRadiusKm: number;
};

export type NotificationChannelId =
  | "newOrders"
  | "orderUpdates"
  | "customerMessages"
  | "payments"
  | "wallet"
  | "promotions"
  | "system";

export type NotificationPreferences = Record<NotificationChannelId, boolean>;

export type PartnerDevice = {
  id: string;
  name: string;
  platform: string;
  lastActive: string;
  current: boolean;
};

export type LoginSession = {
  id: string;
  location: string;
  ip: string;
  startedAt: string;
  current: boolean;
};

export type PrivacyPreferences = {
  showProfileToCustomers: boolean;
  shareUsageAnalytics: boolean;
  personalisedMarketing: boolean;
};

export type SecuritySettings = {
  twoFactorEnabled: boolean;
  devices: PartnerDevice[];
  sessions: LoginSession[];
  privacy: PrivacyPreferences;
};

export type DocumentStatus = "verified" | "pending" | "rejected";

export type PartnerDocument = {
  id: "gst" | "pan" | "aadhaar" | "bank";
  label: string;
  value: string;
  status: DocumentStatus;
  updatedOn: string;
  hint: string;
};

export type AppInfo = {
  version: string;
  buildNumber: string;
  releasedOn: string;
  channel: string;
};

export type PartnerSettingsData = {
  account: PartnerAccount;
  business: BusinessPreferences;
  notifications: NotificationPreferences;
  theme: ThemeMode;
  language: LanguageCode;
  security: SecuritySettings;
  documents: PartnerDocument[];
  appInfo: AppInfo;
};

export const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const NOTIFICATION_CHANNELS: {
  id: NotificationChannelId;
  label: string;
  description: string;
}[] = [
  { id: "newOrders", label: "New Orders", description: "Alert the moment an order arrives" },
  { id: "orderUpdates", label: "Order Updates", description: "Pickup, processing and delivery" },
  {
    id: "customerMessages",
    label: "Customer Messages",
    description: "Chat replies from your customers",
  },
  { id: "payments", label: "Payments", description: "Settlements and payment failures" },
  { id: "wallet", label: "Wallet", description: "Credits, debits and withdrawals" },
  { id: "promotions", label: "Promotions", description: "Offers and campaign reminders" },
  { id: "system", label: "System Notifications", description: "Policy and app announcements" },
];

export const THEME_OPTIONS: { id: ThemeMode; label: string; description: string }[] = [
  { id: "light", label: "Light", description: "Bright surfaces, best in daylight" },
  { id: "dark", label: "Dark", description: "Low-glare surfaces for night shifts" },
  { id: "system", label: "System", description: "Follow your device appearance" },
];

export const LANGUAGE_OPTIONS: {
  id: LanguageCode;
  label: string;
  native: string;
  available: boolean;
}[] = [
  { id: "en", label: "English", native: "English", available: true },
  { id: "hi", label: "Hindi", native: "हिन्दी", available: true },
];

export const LEGAL_LINKS = [
  {
    id: "privacy",
    label: "Privacy Policy",
    summary: "How QuickPress collects, stores and protects partner data.",
    body: "QuickPress Partner collects only the business information required to operate your storefront: shop profile, KYC documents, order history and payout details. Data is encrypted in transit, retained for the statutory period and never sold to third parties. You may request an export or deletion of your data at any time from Contact Support.",
  },
  {
    id: "terms",
    label: "Terms & Conditions",
    summary: "Platform usage rules, order obligations and cancellations.",
    body: "By operating on QuickPress you agree to honour accepted orders, maintain the published business hours, and keep service pricing accurate. Repeated cancellations, late pickups or quality complaints may lead to a temporary reduction in order allocation. Commission and settlement cycles are described in the Partner Agreement.",
  },
  {
    id: "agreement",
    label: "Partner Agreement",
    summary: "Commission slabs, settlement cycle and service standards.",
    body: "The Partner Agreement covers your commission slab, the T+2 settlement cycle, penalty structure for SLA breaches, insurance coverage on garments in transit, and the notice period required to exit the platform. A signed copy is available from your onboarding manager.",
  },
  {
    id: "help",
    label: "Help Center",
    summary: "Guides for orders, payouts, services and account issues.",
    body: "Browse step-by-step guides for accepting orders, managing services, raising payout disputes and updating KYC documents. Most partner questions are answered here before you need to contact support.",
  },
  {
    id: "support",
    label: "Contact Support",
    summary: "Partner helpline · support@quickpress.in · 9 AM to 9 PM",
    body: "Reach the partner desk on 1800-102-9090 or write to support@quickpress.in. Priority partners get a callback within 30 minutes during business hours. Please keep your Partner ID handy for faster resolution.",
  },
] as const;

export type LegalLinkId = (typeof LEGAL_LINKS)[number]["id"];

const MOCK_SETTINGS: PartnerSettingsData = {
  account: {
    partnerName: "Rahul Verma",
    shopName: "QuickPress Laundry · Koramangala",
    mobile: "+91 98450 21188",
    email: "rahul.verma@quickpress.in",
    photoInitials: "RV",
    photoUrl: null,
  },
  business: {
    openingTime: "08:00",
    closingTime: "21:00",
    weeklyOff: ["Sunday"],
    holidays: [
      { id: "h1", date: "2026-08-15", label: "Independence Day" },
      { id: "h2", date: "2026-10-20", label: "Diwali" },
    ],
    vacationMode: false,
    vacationFrom: "2026-09-01",
    vacationTo: "2026-09-07",
    temporaryClosure: false,
    temporaryClosureMinutes: 60,
    autoAcceptOrders: true,
    autoRejectTimeoutMinutes: 10,
    pickupRadiusKm: 5,
    deliveryRadiusKm: 8,
  },
  notifications: {
    newOrders: true,
    orderUpdates: true,
    customerMessages: true,
    payments: true,
    wallet: true,
    promotions: false,
    system: true,
  },
  theme: "system",
  language: "en",
  security: {
    twoFactorEnabled: false,
    devices: [
      {
        id: "d1",
        name: "Redmi Note 13 Pro",
        platform: "Android 14 · Partner App 3.10",
        lastActive: "Active now",
        current: true,
      },
      {
        id: "d2",
        name: "Shop Counter Tablet",
        platform: "Android 12 · Partner App 3.8",
        lastActive: "2 hours ago",
        current: false,
      },
      {
        id: "d3",
        name: "Chrome · Windows",
        platform: "Partner Web",
        lastActive: "Yesterday, 8:40 PM",
        current: false,
      },
    ],
    sessions: [
      {
        id: "s1",
        location: "Koramangala, Bengaluru",
        ip: "103.21.58.14",
        startedAt: "Today, 7:05 AM",
        current: true,
      },
      {
        id: "s2",
        location: "HSR Layout, Bengaluru",
        ip: "49.207.11.92",
        startedAt: "Yesterday, 6:12 PM",
        current: false,
      },
    ],
    privacy: {
      showProfileToCustomers: true,
      shareUsageAnalytics: true,
      personalisedMarketing: false,
    },
  },
  documents: [
    {
      id: "gst",
      label: "GST Certificate",
      value: "29ABCDE1234F1Z5",
      status: "verified",
      updatedOn: "12 Mar 2026",
      hint: "GSTIN linked to your shop address",
    },
    {
      id: "pan",
      label: "PAN Card",
      value: "ABCDE1234F",
      status: "verified",
      updatedOn: "12 Mar 2026",
      hint: "Used for TDS and settlement reporting",
    },
    {
      id: "aadhaar",
      label: "Aadhaar",
      value: "XXXX XXXX 4821",
      status: "pending",
      updatedOn: "02 Jun 2026",
      hint: "Re-verification requested by compliance",
    },
    {
      id: "bank",
      label: "Bank Details",
      value: "HDFC ····8823 · IFSC HDFC0001234",
      status: "verified",
      updatedOn: "28 Apr 2026",
      hint: "Payout account for weekly settlements",
    },
  ],
  appInfo: {
    version: "3.10.0",
    buildNumber: "31000",
    releasedOn: "06 Aug 2026",
    channel: "Production",
  },
};

/** Deep clone so screen-level edits never mutate the module singleton. */
export async function fetchPartnerSettings(): Promise<PartnerSettingsData> {
  await new Promise((resolve) => setTimeout(resolve, 520));
  return structuredClone(MOCK_SETTINGS);
}

/** TODO(backend): PATCH /api/partner/settings */
export async function savePartnerSettings(
  patch: Partial<PartnerSettingsData>,
): Promise<{ ok: true; patch: Partial<PartnerSettingsData> }> {
  await new Promise((resolve) => setTimeout(resolve, 260));
  return { ok: true, patch };
}

export function formatTime12h(value: string): string {
  const [rawHour, rawMinute] = value.split(":");
  const hour = Number(rawHour ?? "0");
  const minute = rawMinute ?? "00";
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${minute} ${suffix}`;
}

export function formatHolidayDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function documentStatusTone(status: DocumentStatus): {
  label: string;
  className: string;
} {
  if (status === "verified") {
    return { label: "Verified", className: "bg-secondary/10 text-brand-green" };
  }
  if (status === "pending") {
    return { label: "Pending", className: "bg-primary/15 text-brand-dark" };
  }
  return { label: "Rejected", className: "bg-destructive/10 text-destructive" };
}
