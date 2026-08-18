import { Gift, Megaphone, Crown, TrendingUp, BarChart3 } from "lucide-react";

/* ------------------------------------------------------- Today performance */

type SeriesKey = "orders" | "revenue" | "processing";

const SERIES_META: Record<SeriesKey, { label: string; tone: string }> = {
  orders: { label: "Orders", tone: "var(--brand-dark)" },
  revenue: { label: "Revenue", tone: "var(--brand-green)" },
  processing: { label: "Processing", tone: "var(--primary)" },
};

/**
 * No hourly analytics endpoint exists on the backend yet, so we show an
 * honest "unavailable" state instead of fabricating a chart.
 */
export function TodayPerformance() {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {(Object.keys(SERIES_META) as SeriesKey[]).map((key, index) => (
        <PerformanceUnavailable key={key} seriesKey={key} delay={index * 70} />
      ))}
    </div>
  );
}

function PerformanceUnavailable({ seriesKey, delay }: { seriesKey: SeriesKey; delay: number }) {
  const meta = SERIES_META[seriesKey];
  return (
    <section
      className="card-soft animate-rise flex flex-col items-center justify-center border border-border p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/60"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
        {meta.label}
      </p>
      <span className="mt-3 flex size-9 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <BarChart3 className="size-4" />
      </span>
      <p className="mt-2 text-[0.7rem] font-medium text-muted-foreground">Analytics unavailable</p>
    </section>
  );
}

/* ----------------------------------------------------------- Announcements */

const KIND_META = {
  promotion: { icon: Gift, tone: "bg-primary/15 text-brand-dark", label: "Promotion" },
  membership: { icon: Crown, tone: "bg-secondary/10 text-brand-green", label: "Membership" },
  update: { icon: Megaphone, tone: "bg-muted text-muted-foreground", label: "Update" },
} as const;

/**
 * No announcements endpoint exists on the backend yet.
 */
export function Announcements() {
  return (
    <div className="card-soft animate-rise flex flex-col items-center border border-border px-6 py-10 text-center">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Megaphone className="size-5" />
      </span>
      <p className="mt-3 text-xs font-semibold text-muted-foreground">No announcements right now.</p>
    </div>
  );
}
