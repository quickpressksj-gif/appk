import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Skeleton } from "@/shared/ui/skeleton";
import type { SeriesPoint } from "../api/client";

const axis = {
  stroke: "var(--muted-foreground)",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  borderRadius: "0.75rem",
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  fontSize: "12px",
};

function Frame({ children, loading }: { children: React.ReactElement; loading: boolean }) {
  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueAreaChart({ data, loading }: { data: SeriesPoint[] | undefined; loading: boolean }) {
  return (
    <Frame loading={loading || !data}>
      <AreaChart data={data ?? []} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.55} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} width={54} tickFormatter={(v: number) => `₹${Math.round(v / 1000)}k`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--primary)"
          strokeWidth={2.5}
          fill="url(#revFill)"
          name="Revenue"
        />
      </AreaChart>
    </Frame>
  );
}

export function OrdersBarChart({ data, loading }: { data: SeriesPoint[] | undefined; loading: boolean }) {
  return (
    <Frame loading={loading || !data}>
      <BarChart data={data ?? []} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} width={44} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="value" name="Orders" fill="var(--secondary)" radius={[6, 6, 0, 0]} />
        <Bar dataKey="secondary" name="Cancelled" fill="var(--primary)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </Frame>
  );
}

export function GrowthLineChart({ data, loading }: { data: SeriesPoint[] | undefined; loading: boolean }) {
  return (
    <Frame loading={loading || !data}>
      <LineChart data={data ?? []} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} width={56} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="value" name="Orders" stroke="var(--secondary)" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="secondary" name="New customers" stroke="var(--primary)" strokeWidth={2.5} dot={false} />
      </LineChart>
    </Frame>
  );
}