import { Gift, Megaphone, Crown, TrendingUp } from "lucide-react";

import { announcements, performanceSeries } from "../../data/partner-dashboard-mock";

/* ------------------------------------------------------- Today performance */

type SeriesKey = "orders" | "revenue" | "processing";

const SERIES_META: Record<SeriesKey, { label: string; tone: string }> = {
  orders: { label: "Orders", tone: "var(--brand-dark)" },
  revenue: { label: "Revenue", tone: "var(--brand-green)" },
  processing: { label: "Processing", tone: "var(--primary)" },
};

export function TodayPerformance() {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {(Object.keys(SERIES_META) as SeriesKey[]).map((key, index) => (
        <PerformanceChart key={key} seriesKey={key} delay={index * 70} />
      ))}
    </div>
  );
}

function PerformanceChart({ seriesKey, delay }: { seriesKey: SeriesKey; delay: number }) {
  const data = performanceSeries[seriesKey];
  const meta = SERIES_META[seriesKey];
  const max = Math.max(...data);
  const total = data.reduce((sum, n) => sum + n, 0);

  return (
    <section
      className="card-soft animate-rise border border-border p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
          {meta.label}
        </p>
        <span className="flex items-center gap-1 text-[0.66rem] font-bold text-brand-green">
          <TrendingUp className="size-3.5" /> Today
        </span>
      </div>
      <p className="mt-1 text-xl font-black tracking-tight text-foreground">
        {seriesKey === "revenue" ? `₹${total.toLocaleString("en-IN")}` : total}
      </p>

      <div className="mt-4 flex h-24 items-end gap-1.5">
        {data.map((point, index) => (
          <div key={index} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span
              className="w-full rounded-t-md transition-all duration-700"
              style={{
                height: `${Math.max(8, (point / max) * 76)}px`,
                backgroundColor: meta.tone,
                opacity: 0.35 + (point / max) * 0.65,
                transitionDelay: `${index * 60}ms`,
              }}
            />
            <span className="truncate text-[0.52rem] font-semibold text-muted-foreground">
              {performanceSeries.labels[index]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- Announcements */

const KIND_META = {
  promotion: { icon: Gift, tone: "bg-primary/15 text-brand-dark", label: "Promotion" },
  membership: { icon: Crown, tone: "bg-secondary/10 text-brand-green", label: "Membership" },
  update: { icon: Megaphone, tone: "bg-muted text-muted-foreground", label: "Update" },
} as const;

export function Announcements() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {announcements.map((item, index) => {
        const meta = KIND_META[item.kind];
        return (
          <article
            key={item.id}
            className="card-soft animate-rise border border-border p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-2xl ${meta.tone}`}
              >
                <meta.icon className="size-4" strokeWidth={2.2} />
              </span>
              <span className="text-[0.6rem] font-black uppercase tracking-wider text-muted-foreground">
                {meta.label}
              </span>
            </div>
            <p className="mt-3 text-sm font-black tracking-tight text-foreground">{item.title}</p>
            <p className="mt-1 text-[0.72rem] font-medium leading-relaxed text-muted-foreground">
              {item.body}
            </p>
          </article>
        );
      })}
    </div>
  );
}
