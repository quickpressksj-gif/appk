import { useEffect, useMemo, useState } from "react";
import { BarChart3, LineChart, Loader2 } from "lucide-react";

import type { TrendSeries } from "../../data/rider-analytics-mock";

function niceValue(value: number, unit: string) {
  if (unit === "₹") return `₹${Math.round(value).toLocaleString("en-IN")}`;
  const body = value >= 100 ? Math.round(value).toString() : value.toFixed(1);
  return `${body}${unit}`;
}

/** Lightweight inline SVG chart (UI only, no chart library, no data source). */
export function TrendChartCard({
  series,
  delay = 0,
}: {
  series: TrendSeries;
  delay?: number;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 420 + delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const { max, min, path, area, bars } = useMemo(() => {
    const values = series.points.map((point) => point.value);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const span = maxValue - minValue || 1;
    const width = 100;
    const height = 46;
    const step = series.points.length > 1 ? width / (series.points.length - 1) : width;

    const coords = series.points.map((point, index) => {
      const x = index * step;
      const y = height - ((point.value - minValue) / span) * (height - 6) - 3;
      return { x, y };
    });

    const line = coords
      .map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x.toFixed(2)} ${coord.y.toFixed(2)}`)
      .join(" ");

    const barWidth = width / (series.points.length * 1.6);
    const barsList = series.points.map((point, index) => {
      const barHeight = ((point.value - minValue) / span) * (height - 8) + 4;
      const gap = width / series.points.length;
      return {
        x: index * gap + (gap - barWidth) / 2,
        y: height - barHeight,
        width: barWidth,
        height: barHeight,
        label: point.label,
        value: point.value,
      };
    });

    return {
      max: maxValue,
      min: minValue,
      path: line,
      area: `${line} L${width} ${height} L0 ${height} Z`,
      bars: barsList,
    };
  }, [series]);

  const Icon = series.kind === "line" ? LineChart : BarChart3;

  return (
    <div
      className="card-soft animate-rise border border-border p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-primary/15 text-brand-dark">
          <Icon className="size-4" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black tracking-tight text-foreground">
            {series.title}
          </p>
          <p className="truncate text-[0.68rem] font-medium text-muted-foreground">
            {series.subtitle}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[0.6rem] font-black text-muted-foreground">
          max {niceValue(max, series.unit)}
        </span>
      </div>

      {!ready ? (
        <div className="mt-4 flex h-28 items-center justify-center rounded-2xl bg-muted/60">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
          <span className="ml-2 text-[0.68rem] font-semibold text-muted-foreground">
            Preparing chart…
          </span>
        </div>
      ) : (
        <div className="animate-chart-in mt-4">
          <svg
            viewBox="0 0 100 46"
            preserveAspectRatio="none"
            role="img"
            aria-label={`${series.title} chart`}
            className="h-28 w-full overflow-visible"
          >
            {[0, 15.3, 30.6, 46].map((y) => (
              <line
                key={y}
                x1="0"
                x2="100"
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeWidth="0.3"
                className="text-border"
              />
            ))}

            {series.kind === "line" ? (
              <>
                <path d={area} fill="currentColor" className="text-primary/15" />
                <path
                  d={path}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-chart-draw text-brand-green"
                  pathLength={1}
                />
              </>
            ) : (
              bars.map((bar) => (
                <rect
                  key={bar.label}
                  x={bar.x}
                  y={bar.y}
                  width={bar.width}
                  height={bar.height}
                  rx="1.2"
                  fill="currentColor"
                  className="text-primary/70"
                />
              ))
            )}
          </svg>

          <div className="mt-2 flex items-center justify-between">
            {series.points.map((point) => (
              <span
                key={point.label}
                className="flex-1 text-center text-[0.58rem] font-bold uppercase tracking-wide text-muted-foreground"
              >
                {point.label}
              </span>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between text-[0.62rem] font-semibold text-muted-foreground">
            <span>low {niceValue(min, series.unit)}</span>
            <span>
              latest {niceValue(series.points[series.points.length - 1]?.value ?? 0, series.unit)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function TrendChartGrid({ trends }: { trends: TrendSeries[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {trends.map((series, index) => (
        <TrendChartCard key={series.id} series={series} delay={index * 70} />
      ))}
    </div>
  );
}
