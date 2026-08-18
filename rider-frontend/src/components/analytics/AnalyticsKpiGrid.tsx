import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { useCountUp } from "../../hooks/use-count-up";
import { formatMetric, type AnalyticsMetric } from "../../data/rider-analytics-mock";

/** Single animated KPI tile with a counter animation and trend delta. */
export function AnalyticsMetricCard({
  metric,
  delay = 0,
}: {
  metric: AnalyticsMetric;
  delay?: number;
}) {
  const animated = useCountUp(metric.value, 900, metric.decimals);
  const TrendIcon = metric.trend > 0 ? ArrowUpRight : metric.trend < 0 ? ArrowDownRight : Minus;
  const trendTone =
    metric.trend > 0
      ? "bg-secondary/15 text-brand-green"
      : metric.trend < 0
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground";

  return (
    <div
      className="card-soft animate-rise border border-border p-4 transition-all duration-300 hover:border-primary/60"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.64rem] font-bold uppercase tracking-widest text-muted-foreground">
          {metric.label}
        </p>
        <span
          className={`flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[0.6rem] font-black ${trendTone}`}
        >
          <TrendIcon className="size-3" />
          {metric.trend === 0 ? "—" : `${Math.abs(metric.trend).toFixed(1)}%`}
        </span>
      </div>
      <p className="mt-2 text-xl font-black tracking-tight text-foreground tabular-nums">
        {formatMetric(metric, animated)}
      </p>
      <p className="mt-1 text-[0.68rem] font-medium text-muted-foreground">{metric.hint}</p>
    </div>
  );
}

/** Responsive KPI grid — 2 columns on mobile, 3 on tablet and up. */
export function AnalyticsKpiGrid({ metrics }: { metrics: AnalyticsMetric[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {metrics.map((metric, index) => (
        <AnalyticsMetricCard key={metric.id} metric={metric} delay={index * 50} />
      ))}
    </div>
  );
}
