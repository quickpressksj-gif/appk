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
  stroke: "#9CA3AF",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const customTooltipStyle = {
  borderRadius: "0.75rem",
  border: "1px solid #E5E7EB",
  background: "#FFFFFF",
  color: "#111827",
  fontSize: "12px",
  fontWeight: "bold",
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  padding: "8px 12px",
};

function Frame({ children, loading }: { children: React.ReactElement; loading: boolean }) {
  if (loading) return <div className="h-64 w-full rounded-2xl bg-zinc-100 animate-pulse" />;
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
            <stop offset="0%" stopColor="#16A34A" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#16A34A" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} width={54} tickFormatter={(v: number) => `₹${Math.round(v / 1000)}k`} />
        <Tooltip contentStyle={customTooltipStyle} formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#16A34A"
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
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} width={44} />
        <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
        <Bar dataKey="value" name="Delivered" fill="#16A34A" radius={[6, 6, 0, 0]} />
        <Bar dataKey="secondary" name="Cancelled" fill="#F59E0B" radius={[6, 6, 0, 0]} />
      </BarChart>
    </Frame>
  );
}

export function GrowthLineChart({ data, loading }: { data: SeriesPoint[] | undefined; loading: boolean }) {
  return (
    <Frame loading={loading || !data}>
      <LineChart data={data ?? []} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} width={56} />
        <Tooltip contentStyle={customTooltipStyle} />
        <Line type="monotone" dataKey="value" name="Orders" stroke="#16A34A" strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="secondary" name="New customers" stroke="#0284C7" strokeWidth={2.5} dot={false} />
      </LineChart>
    </Frame>
  );
}