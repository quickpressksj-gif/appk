import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompactInr } from "../../data/partner-analytics-mock";

const PIE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const axisProps = {
  stroke: "var(--color-muted-foreground)",
  tickLine: false,
  axisLine: false,
  fontSize: 11,
} as const;

const tooltipStyle = {
  contentStyle: {
    borderRadius: "0.9rem",
    border: "1px solid var(--color-border)",
    background: "var(--color-card)",
    color: "var(--color-foreground)",
    fontSize: "0.72rem",
    fontWeight: 700,
  },
} as const;

/** Card shell shared by every chart on the analytics screen. */
export function ChartCard({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card-soft animate-slide-up border border-border p-4">
      <h3 className="text-sm font-black tracking-tight text-foreground">{title}</h3>
      {caption ? (
        <p className="mt-0.5 text-[0.7rem] font-medium text-muted-foreground">{caption}</p>
      ) : null}
      <div className="mt-4 h-56 w-full">{children}</div>
    </section>
  );
}

export function RevenueAreaChart({ data }: { data: { label: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={(value: number) => formatCompactInr(value)} />
        <Tooltip
          {...tooltipStyle}
          formatter={(value: number) => [formatCompactInr(value), "Revenue"]}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-chart-1)"
          strokeWidth={2.4}
          fill="url(#revenueFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function OrdersBarChart({ data }: { data: { label: string; orders: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -22 }}>
        <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip {...tooltipStyle} formatter={(value: number) => [`${value}`, "Orders"]} />
        <Bar dataKey="orders" fill="var(--color-chart-2)" radius={[8, 8, 4, 4]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ServiceSplitChart({ data }: { data: { name: string; revenue: number }[] }) {
  return (
    <div className="flex h-full flex-col gap-3 md:flex-row md:items-center">
      <div className="h-40 w-full md:h-full md:w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="revenue"
              nameKey="name"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={3}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              {...tooltipStyle}
              formatter={(value: number, name: string) => [formatCompactInr(value), name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid w-full grid-cols-1 gap-1.5 md:w-1/2">
        {data.map((entry, index) => (
          <li key={entry.name} className="flex min-w-0 items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-[0.72rem] font-bold text-foreground">
              {entry.name}
            </span>
            <span className="shrink-0 text-[0.72rem] font-black text-muted-foreground">
              {formatCompactInr(entry.revenue)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CustomerGrowthChart({
  data,
}: {
  data: { label: string; total: number; repeat: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -22 }}>
        <CartesianGrid strokeDasharray="3 6" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip {...tooltipStyle} />
        <Line
          type="monotone"
          dataKey="total"
          name="Active"
          stroke="var(--color-chart-1)"
          strokeWidth={2.4}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="repeat"
          name="Repeat"
          stroke="var(--color-chart-3)"
          strokeWidth={2.4}
          strokeDasharray="5 4"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}