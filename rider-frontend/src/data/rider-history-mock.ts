/**
 * Realistic mock data for the Rider Delivery History & Performance module
 * (Sprint 4.6). UI-only: no backend, no Firebase.
 */

export type HistoryOutcome = "completed" | "cancelled";
export type HistoryPayment = "COD" | "Online";

export type HistoryTimelineStep = {
  id: string;
  label: string;
  time: string;
  note?: string;
};

export type EarningsBreakdownRow = {
  id: string;
  label: string;
  amount: number;
};

export type DeliveryHistoryEntry = {
  id: string;
  orderId: string;
  customerName: string;
  partnerName: string;
  pickupAddress: string;
  deliveryAddress: string;
  date: string;
  isoDate: string;
  time: string;
  durationMinutes: number;
  distanceKm: number;
  earnings: number;
  tips: number;
  paymentType: HistoryPayment;
  outcome: HistoryOutcome;
  rating: number | null;
  feedback: string | null;
  cancellationReason?: string;
  timeline: HistoryTimelineStep[];
  breakdown: EarningsBreakdownRow[];
};

export type HistoryFilterId =
  | "today"
  | "yesterday"
  | "weekly"
  | "monthly"
  | "cancelled"
  | "completed"
  | "cod"
  | "online";

export type HistorySortId = "latest" | "oldest" | "earnings" | "distance";

export const HISTORY_FILTERS: { id: HistoryFilterId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "cod", label: "COD" },
  { id: "online", label: "Online" },
];

export const HISTORY_SORTS: { id: HistorySortId; label: string }[] = [
  { id: "latest", label: "Latest" },
  { id: "oldest", label: "Oldest" },
  { id: "earnings", label: "Highest Earnings" },
  { id: "distance", label: "Longest Distance" },
];

const TODAY = "2026-08-07";
const YESTERDAY = "2026-08-06";

function timeline(pickup: string, start: string, reached: string, done: string): HistoryTimelineStep[] {
  return [
    { id: "assigned", label: "Order assigned", time: pickup, note: "Auto-allocated by dispatch" },
    { id: "reached-partner", label: "Reached partner", time: start },
    { id: "picked-up", label: "Picked up", time: reached, note: "Verified 2 bags" },
    { id: "delivered", label: "Delivered", time: done, note: "OTP verified" },
  ];
}

export const DELIVERY_HISTORY: DeliveryHistoryEntry[] = [
  {
    id: "hist-1",
    orderId: "QP-48219",
    customerName: "Ananya Iyer",
    partnerName: "Sharma Dry Clean",
    pickupAddress: "Sharma Dry Clean, 12th Main, Indiranagar",
    deliveryAddress: "Flat 402, Lake View Residency, Indiranagar",
    date: "07 Aug 2026",
    isoDate: TODAY,
    time: "06:42 PM",
    durationMinutes: 26,
    distanceKm: 4.2,
    earnings: 86,
    tips: 40,
    paymentType: "Online",
    outcome: "completed",
    rating: 5,
    feedback: "Super quick and handled the garments carefully. Thank you!",
    timeline: timeline("06:04 PM", "06:16 PM", "06:24 PM", "06:42 PM"),
    breakdown: [
      { id: "base", label: "Base fare", amount: 45 },
      { id: "distance", label: "Distance (4.2 km)", amount: 26 },
      { id: "surge", label: "Peak hour surge", amount: 15 },
      { id: "tip", label: "Customer tip", amount: 40 },
    ],
  },
  {
    id: "hist-2",
    orderId: "QP-48204",
    customerName: "Rohit Malhotra",
    partnerName: "Fresh Fold Laundry",
    pickupAddress: "Fresh Fold Laundry, 5th Block, Koramangala",
    deliveryAddress: "House 27, 7th Cross, Koramangala",
    date: "07 Aug 2026",
    isoDate: TODAY,
    time: "03:18 PM",
    durationMinutes: 31,
    distanceKm: 5.6,
    earnings: 104,
    tips: 0,
    paymentType: "COD",
    outcome: "completed",
    rating: 4,
    feedback: "On time, polite rider.",
    timeline: timeline("02:38 PM", "02:51 PM", "02:59 PM", "03:18 PM"),
    breakdown: [
      { id: "base", label: "Base fare", amount: 45 },
      { id: "distance", label: "Distance (5.6 km)", amount: 39 },
      { id: "cod", label: "COD handling", amount: 20 },
    ],
  },
  {
    id: "hist-3",
    orderId: "QP-48180",
    customerName: "Meera Nair",
    partnerName: "Urban Steam Press",
    pickupAddress: "Urban Steam Press, HSR Layout Sector 2",
    deliveryAddress: "B-1104, Palm Meadows, HSR Layout",
    date: "06 Aug 2026",
    isoDate: YESTERDAY,
    time: "08:05 PM",
    durationMinutes: 22,
    distanceKm: 3.1,
    earnings: 72,
    tips: 20,
    paymentType: "Online",
    outcome: "completed",
    rating: 5,
    feedback: "Called before arriving, very professional.",
    timeline: timeline("07:32 PM", "07:44 PM", "07:50 PM", "08:05 PM"),
    breakdown: [
      { id: "base", label: "Base fare", amount: 45 },
      { id: "distance", label: "Distance (3.1 km)", amount: 19 },
      { id: "night", label: "Night allowance", amount: 8 },
      { id: "tip", label: "Customer tip", amount: 20 },
    ],
  },
  {
    id: "hist-4",
    orderId: "QP-48166",
    customerName: "Sahil Kapoor",
    partnerName: "Sharma Dry Clean",
    pickupAddress: "Sharma Dry Clean, 12th Main, Indiranagar",
    deliveryAddress: "Office 9, Trade Tower, Domlur",
    date: "06 Aug 2026",
    isoDate: YESTERDAY,
    time: "01:12 PM",
    durationMinutes: 18,
    distanceKm: 2.4,
    earnings: 0,
    tips: 0,
    paymentType: "COD",
    outcome: "cancelled",
    rating: null,
    feedback: null,
    cancellationReason: "Customer unavailable at drop location",
    timeline: [
      { id: "assigned", label: "Order assigned", time: "12:54 PM" },
      { id: "reached-partner", label: "Reached partner", time: "01:02 PM" },
      { id: "cancelled", label: "Cancelled", time: "01:12 PM", note: "Customer unreachable after 3 calls" },
    ],
    breakdown: [{ id: "comp", label: "Cancellation compensation", amount: 0 }],
  },
  {
    id: "hist-5",
    orderId: "QP-48120",
    customerName: "Divya Ranganathan",
    partnerName: "Crisp & Clean",
    pickupAddress: "Crisp & Clean, Jayanagar 4th Block",
    deliveryAddress: "22, 9th Main, Jayanagar 3rd Block",
    date: "04 Aug 2026",
    isoDate: "2026-08-04",
    time: "11:48 AM",
    durationMinutes: 35,
    distanceKm: 7.8,
    earnings: 132,
    tips: 30,
    paymentType: "Online",
    outcome: "completed",
    rating: 5,
    feedback: "Long distance but delivered before the promised slot.",
    timeline: timeline("11:05 AM", "11:18 AM", "11:26 AM", "11:48 AM"),
    breakdown: [
      { id: "base", label: "Base fare", amount: 45 },
      { id: "distance", label: "Distance (7.8 km)", amount: 62 },
      { id: "long", label: "Long trip bonus", amount: 25 },
      { id: "tip", label: "Customer tip", amount: 30 },
    ],
  },
  {
    id: "hist-6",
    orderId: "QP-47996",
    customerName: "Karthik Reddy",
    partnerName: "Fresh Fold Laundry",
    pickupAddress: "Fresh Fold Laundry, 5th Block, Koramangala",
    deliveryAddress: "Villa 6, Green Acres, BTM Layout",
    date: "01 Aug 2026",
    isoDate: "2026-08-01",
    time: "01:36 PM",
    durationMinutes: 29,
    distanceKm: 6.1,
    earnings: 118,
    tips: 0,
    paymentType: "COD",
    outcome: "completed",
    rating: 4,
    feedback: "Good service.",
    timeline: timeline("12:58 PM", "01:09 PM", "01:15 PM", "01:36 PM"),
    breakdown: [
      { id: "base", label: "Base fare", amount: 45 },
      { id: "distance", label: "Distance (6.1 km)", amount: 53 },
      { id: "cod", label: "COD handling", amount: 20 },
    ],
  },
  {
    id: "hist-7",
    orderId: "QP-47940",
    customerName: "Priya Menon",
    partnerName: "Urban Steam Press",
    pickupAddress: "Urban Steam Press, HSR Layout Sector 2",
    deliveryAddress: "A-302, Sunrise Enclave, Bellandur",
    date: "28 Jul 2026",
    isoDate: "2026-07-28",
    time: "07:22 PM",
    durationMinutes: 41,
    distanceKm: 9.4,
    earnings: 156,
    tips: 50,
    paymentType: "Online",
    outcome: "completed",
    rating: 5,
    feedback: "Braved the rain to deliver on time. Legend!",
    timeline: timeline("06:34 PM", "06:48 PM", "06:55 PM", "07:22 PM"),
    breakdown: [
      { id: "base", label: "Base fare", amount: 45 },
      { id: "distance", label: "Distance (9.4 km)", amount: 76 },
      { id: "rain", label: "Rain surge", amount: 35 },
      { id: "tip", label: "Customer tip", amount: 50 },
    ],
  },
];

export type PerformanceStat = {
  id: string;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  hint: string;
  tone: "primary" | "green" | "muted";
};

export const PERFORMANCE_STATS: PerformanceStat[] = [
  { id: "total", label: "Total Deliveries", value: 1268, hint: "Since Jan 2025", tone: "primary" },
  { id: "completion", label: "Completion Rate", value: 97.4, suffix: "%", decimals: 1, hint: "Target 95%", tone: "green" },
  { id: "acceptance", label: "Acceptance Rate", value: 92.1, suffix: "%", decimals: 1, hint: "Target 90%", tone: "green" },
  { id: "rating", label: "Average Rating", value: 4.8, decimals: 1, suffix: " ★", hint: "Last 500 trips", tone: "primary" },
  { id: "ontime", label: "On Time %", value: 95.6, suffix: "%", decimals: 1, hint: "Slot adherence", tone: "green" },
  { id: "distance", label: "Total Distance", value: 4862.5, suffix: " km", decimals: 1, hint: "Lifetime", tone: "muted" },
  { id: "hours", label: "Working Hours", value: 186, suffix: " hrs", hint: "This month", tone: "muted" },
];

export type Achievement = {
  id: string;
  title: string;
  body: string;
  progress: number;
  target: number;
  unlocked: boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "fast", title: "Fast Rider", body: "Average delivery under 25 minutes", progress: 25, target: 25, unlocked: true },
  { id: "top", title: "Top Performer", body: "Top 5% riders in your zone", progress: 1, target: 1, unlocked: true },
  { id: "d100", title: "100 Deliveries", body: "First century of trips", progress: 100, target: 100, unlocked: true },
  { id: "d500", title: "500 Deliveries", body: "Half-thousand club", progress: 500, target: 500, unlocked: true },
  { id: "d1000", title: "1000 Deliveries", body: "Four-digit legend", progress: 1000, target: 1000, unlocked: true },
  { id: "d2000", title: "2000 Deliveries", body: "Next milestone in progress", progress: 1268, target: 2000, unlocked: false },
];

const WEEK_ISO = [
  "2026-08-07",
  "2026-08-06",
  "2026-08-05",
  "2026-08-04",
  "2026-08-03",
  "2026-08-02",
  "2026-08-01",
];

/** Multi-select filters + search + sort applied client-side over the mock rows. */
export function selectHistory(
  rows: DeliveryHistoryEntry[],
  query: string,
  filters: HistoryFilterId[],
  sort: HistorySortId,
) {
  const term = query.trim().toLowerCase();

  const matched = rows.filter((row) => {
    if (
      term &&
      !`${row.orderId} ${row.customerName} ${row.partnerName}`.toLowerCase().includes(term)
    ) {
      return false;
    }

    return filters.every((filter) => {
      switch (filter) {
        case "today":
          return row.isoDate === TODAY;
        case "yesterday":
          return row.isoDate === YESTERDAY;
        case "weekly":
          return WEEK_ISO.includes(row.isoDate);
        case "monthly":
          return row.isoDate.startsWith("2026-08");
        case "completed":
          return row.outcome === "completed";
        case "cancelled":
          return row.outcome === "cancelled";
        case "cod":
          return row.paymentType === "COD";
        case "online":
          return row.paymentType === "Online";
        default:
          return true;
      }
    });
  });

  const sorted = [...matched];
  sorted.sort((a, b) => {
    switch (sort) {
      case "oldest":
        return a.isoDate.localeCompare(b.isoDate);
      case "earnings":
        return b.earnings + b.tips - (a.earnings + a.tips);
      case "distance":
        return b.distanceKm - a.distanceKm;
      default:
        return b.isoDate.localeCompare(a.isoDate);
    }
  });

  return sorted;
}

export function loadDeliveryHistory() {
  return new Promise<DeliveryHistoryEntry[]>((resolve) => {
    setTimeout(() => resolve(DELIVERY_HISTORY), 620);
  });
}

export function loadPerformance() {
  return new Promise<{ stats: PerformanceStat[]; achievements: Achievement[] }>((resolve) => {
    setTimeout(() => resolve({ stats: PERFORMANCE_STATS, achievements: ACHIEVEMENTS }), 560);
  });
}