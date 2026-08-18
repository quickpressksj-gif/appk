import { useNavigate } from "@tanstack/react-router";
import { BadgeIndianRupee, CheckCircle2, Clock3, PackageCheck, TrendingUp } from "lucide-react";
import { useState } from "react";

import { Toaster } from "@/shared/ui/sonner";

import { PartnerTopBar } from "../components/PartnerTopBar";
import { PartnerBottomNav } from "../components/PartnerBottomNav";
import { PartnerCardsSkeleton } from "../components/PartnerSkeletons";
import { SectionHeading, StatCard } from "../components/PartnerPrimitives";
import { usePartnerResource } from "../hooks/use-partner-resource";
import { partnerRoutes } from "../navigation/partner-routes";
import { fetchEarnings } from "@/api/partner/partner-earnings-api";

const RANGES = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
] as const;

const PAYOUT_TONE: Record<string, string> = {
  paid: "bg-secondary/10 text-brand-green",
  processing: "bg-primary/15 text-brand-dark",
  failed: "bg-destructive/10 text-destructive",
};

export function EarningsScreen() {
  const navigate = useNavigate();
  const { data: earnings } = usePartnerResource(fetchEarnings);
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("week");

  const total = earnings ? earnings[range] : 0;
  const peak = earnings ? Math.max(...earnings.trend.map((p) => p.amount)) : 1;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md">
        <PartnerTopBar
          title="Earnings"
          onBack={() => navigate({ to: partnerRoutes.dashboard })}
        />

        {!earnings ? (
          <PartnerCardsSkeleton />
        ) : (
          <div className="px-5 pb-32 pt-4">
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
              {RANGES.map((item) => {
                const isActive = item.id === range;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRange(item.id)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold tracking-tight transition-all duration-300 active:scale-[0.96] ${
                      isActive
                        ? "border-primary bg-primary/15 text-brand-dark"
                        : "border-border bg-card text-muted-foreground hover:border-primary/60"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <section className="relative mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-brand-dark to-brand-green p-5 shadow-soft">
              <div className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-primary/25 blur-2xl" />
              <p className="relative text-[0.68rem] font-semibold uppercase tracking-widest text-background/70">
                {RANGES.find((r) => r.id === range)?.label} Earnings
              </p>
              <p className="relative mt-1 text-3xl font-black tracking-tight text-background">
                ₹{total.toLocaleString("en-IN")}
              </p>
              <p className="relative mt-2 flex items-center gap-1 text-[0.7rem] font-semibold text-background/80">
                <TrendingUp className="size-3.5" />
                Avg order ₹{earnings.avgOrderValue} · {earnings.completedOrders} orders
              </p>
            </section>

            <section className="card-soft mt-5 border border-border p-4">
              <SectionHeading title="Last 7 Days" />
              <div className="mt-5 flex items-end justify-between gap-2">
                {earnings.trend.map((point, index) => (
                  <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-28 w-full items-end justify-center">
                      <div
                        style={{
                          height: `${Math.round((point.amount / peak) * 100)}%`,
                        }}
                        className="w-full rounded-t-xl bg-primary/80 transition-all duration-500"
                      />
                    </div>
                    <span className="text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">
                      {point.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-5 grid grid-cols-2 gap-3">
              <StatCard
                icon={BadgeIndianRupee}
                label="Pending Payout"
                value={`₹${earnings.pendingPayout.toLocaleString("en-IN")}`}
                delay={0}
              />
              <StatCard
                icon={PackageCheck}
                label="Completed"
                value={`${earnings.completedOrders}`}
                tone="green"
                delay={45}
              />
            </section>

            <section className="mt-7">
              <SectionHeading title="Payout History" />
              <div className="card-soft mt-4 divide-y divide-border border border-border">
                {earnings.payouts.map((payout) => (
                  <div key={payout.id} className="flex items-center gap-3 px-4 py-3.5">
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${PAYOUT_TONE[payout.status]}`}
                    >
                      {payout.status === "paid" ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <Clock3 className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold tracking-tight text-foreground">
                        {payout.id}
                      </p>
                      <p className="truncate text-[0.68rem] font-medium text-muted-foreground">
                        {payout.date} · {payout.utr}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-black tracking-tight text-foreground">
                      ₹{payout.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        <PartnerBottomNav active="earnings" />
      </div>
      <Toaster />
    </main>
  );
}
