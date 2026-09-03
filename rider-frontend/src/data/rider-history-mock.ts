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

export const DELIVERY_HISTORY: DeliveryHistoryEntry[] = [];


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

export const PERFORMANCE_STATS: PerformanceStat[] = [];

export type Achievement = {
  id: string;
  title: string;
  body: string;
  progress: number;
  target: number;
  unlocked: boolean;
};

export const ACHIEVEMENTS: Achievement[] = [];

const WEEK_ISO: string[] = [];

/** Multi-select filters + search + sort applied client-side over the history rows. */
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

export async function loadDeliveryHistory(): Promise<DeliveryHistoryEntry[]> {
  try {
    const { fetchRiderHistory } = await import("@/api/rider/rider-orders-api");
    const history = await fetchRiderHistory();
    return history.map((item) => ({
      id: item.id,
      orderId: item.code,
      customerName: item.customerName,
      partnerName: item.partnerName,
      pickupAddress: "Pickup Store",
      deliveryAddress: "Customer Location",
      date: item.date ? new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Today",
      isoDate: item.date ? new Date(item.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      time: item.date ? new Date(item.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "12:00 PM",
      durationMinutes: 20,
      distanceKm: item.distanceKm || 2.5,
      earnings: item.amount || 0,
      tips: 0,
      paymentType: "Online",
      outcome: item.outcome || "completed",
      rating: 5,
      feedback: null,
      timeline: [],
      breakdown: [{ id: "base", label: "Delivery Pay", amount: item.amount || 0 }],
    }));
  } catch {
    return [];
  }
}

export function loadPerformance() {
  return Promise.resolve({ stats: PERFORMANCE_STATS, achievements: ACHIEVEMENTS });
}