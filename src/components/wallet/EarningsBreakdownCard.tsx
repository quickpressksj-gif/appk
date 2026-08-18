import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BadgeIndianRupee, PackageCheck, Percent, TrendingUp } from "lucide-react";

import type { EarningsBreakdown } from "@shared/types/payment";

import { formatInr } from "../../data/partner-wallet-mock";

const STAT_ITEMS = (earnings: EarningsBreakdown) => [
  { icon: TrendingUp, label: "Today", value: earnings.today },
  { icon: TrendingUp, label: "This Week", value: earnings.week },
  { icon: TrendingUp, label: "This Month", value: earnings.month },
  { icon: BadgeIndianRupee, label: "Lifetime", value: earnings.lifetime },
];

/** Sprint 5.6 — real earnings breakdown with a 7-day trend chart. */
export function EarningsBreakdownCard({ earnings }: { earnings: EarningsBreakdown }) {
  return (
    <section className="card-soft animate-slide-up mt-5 border border-border p-4">
      <p className="text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
        Earnings Breakdown
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {STAT_ITEMS(earnings).map((item) => (
          <div key={item.label} className="rounded-2xl bg-muted px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <item.icon className="size-3.5" />
              <p className="text-[0.6rem] font-bold uppercase tracking-widest">{item.label}</p>
            </div>
            <p className="mt-0.5 text-base font-black tracking-tight text-foreground">
              {formatInr(item.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl border border-border px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <PackageCheck className="size-3.5" />
            <p className="text-[0.58rem] font-bold uppercase tracking-widest">Orders</p>
          </div>
          <p className="mt-0.5 text-sm font-black tracking-tight text-foreground">{earnings.orders}</p>
        </div>
        <div className="rounded-2xl border border-border px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <BadgeIndianRupee className="size-3.5" />
            <p className="text-[0.58rem] font-bold uppercase tracking-widest">Avg / Order</p>
          </div>
          <p className="mt-0.5 text-sm font-black tracking-tight text-foreground">
            {formatInr(Math.round(earnings.averagePerOrder))}
          </p>
        </div>
        <div className="rounded-2xl border border-border px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Percent className="size-3.5" />
            <p className="text-[0.58rem] font-bold uppercase tracking-widest">Commission</p>
          </div>
          <p className="mt-0.5 text-sm font-black tracking-tight text-foreground">
            {earnings.commissionRate}%
          </p>
        </div>
      </div>

      <p className="mt-3 text-[0.68rem] font-semibold text-muted-foreground">
        7-day earnings trend
      </p>
      <div className="mt-2 h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={earnings.series} margin={{ left: 0, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="partnerEarningsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                borderRadius: "0.75rem",
                border: "1px solid var(--border)",
                background: "var(--popover)",
                color: "var(--popover-foreground)",
                fontSize: "12px",
              }}
              formatter={(value: number) => formatInr(value)}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="var(--primary)"
              strokeWidth={2.5}
              fill="url(#partnerEarningsFill)"
              name="Earnings"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-[0.66rem] font-semibold text-muted-foreground">
        Pending settlement · {formatInr(earnings.pendingSettlement)}
      </p>
    </section>
  );
}
