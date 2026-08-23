import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  ClipboardList,
  Clock3,
  History,
  IndianRupee,
  LifeBuoy,
  Navigation,
  PackageCheck,
  PackageSearch,
  Route as RouteIcon,
  Star,
  Truck,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { RiderBottomNav } from "../components/RiderBottomNav";
import {
  ActiveDeliveryCard,
  AnnouncementCard,
  FeedbackCard,
  KpiCard,
  PerformanceBar,
  StatusBadge,
} from "../components/RiderDashboardComponents";
import { RiderEmptyState, SectionHeading } from "../components/RiderPrimitives";
import { RiderCardsSkeleton } from "../components/RiderSkeletons";
import { useRiderContext } from "../context/RiderContext";
import { loadRiderDashboard } from "../data/rider-dashboard-adapter";
import type { RiderDashboardData, RiderWorkStatus } from "../data/rider-dashboard-mock";
import { riderRoutes } from "../navigation/rider-routes";

const QUICK_ACTIONS = [
  { id: "orders", label: "Orders", icon: ClipboardList, to: riderRoutes.orders },
  { id: "earnings", label: "Earnings", icon: IndianRupee, to: riderRoutes.wallet },
  { id: "history", label: "History", icon: History, to: riderRoutes.history },
  { id: "wallet", label: "Wallet", icon: Wallet, to: riderRoutes.wallet },
  { id: "notifications", label: "Alerts", icon: Bell, to: riderRoutes.notifications },
  { id: "support", label: "Support", icon: LifeBuoy, to: riderRoutes.settings },
] as const;

const DELAYS = ["stagger-1", "stagger-2", "stagger-3", "stagger-4", "stagger-5", "stagger-6"];

export function RiderDashboardScreen() {
  const navigate = useNavigate();
  const { isOnline, setOnline } = useRiderContext();
  const [data, setData] = useState<RiderDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void loadRiderDashboard().then((next) => {
      if (!active) return;
      setData(next);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const status: RiderWorkStatus = !isOnline ? "offline" : (data?.activeDelivery ? "on-delivery" : "online");

  const handleToggle = () => {
    const next = !isOnline;
    setOnline(next);
    toast.success(next ? "You are online — receiving orders" : "You are offline");
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md lg:max-w-3xl">
        <header className="sticky top-0 z-30">
          <div className="glass-panel flex items-center gap-3 px-4 py-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
              <Truck className="size-5" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black tracking-tight text-foreground">
                {data?.rider.name ?? "QuickPress Rider"}
              </p>
              <p className="flex items-center gap-1.5 text-[0.66rem] font-semibold text-muted-foreground">
                {data?.rider.riderId ?? "—"} · {data?.rider.city ?? "—"}
                <StatusBadge status={status} />
              </p>
            </div>
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => navigate({ to: riderRoutes.notifications })}
              className="relative flex size-10 items-center justify-center rounded-2xl bg-muted text-foreground transition-all duration-300 hover:bg-accent active:scale-[0.94]"
            >
              <Bell className="size-5" />
              {(data?.unreadNotifications ?? 0) > 0 ? (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-secondary" />
              ) : null}
            </button>
          </div>
        </header>

        {loading || !data ? (
          <RiderCardsSkeleton />
        ) : (
          <div className="px-5 pb-32 pt-4">
            <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-brand-dark to-brand-green p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.66rem] font-semibold uppercase tracking-widest text-background/70">
                    Today&apos;s Earnings
                  </p>
                  <p className="mt-1 flex items-center text-3xl font-black tracking-tight text-background">
                    <IndianRupee className="size-6" strokeWidth={2.6} />
                    {(data.kpis?.earningsToday ?? 0).toLocaleString("en-IN")}
                  </p>
                  <p className="mt-1 text-[0.7rem] font-medium text-background/70">
                    {data.kpis?.deliveriesToday ?? 0} deliveries · {data.kpis?.workingHours ?? 0}h online · ₹
                    {data.kpis?.tips ?? 0} tips
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isOnline}
                  aria-label="Online status"
                  onClick={handleToggle}
                  className="flex flex-col items-center gap-1.5 rounded-2xl bg-background/15 px-3 py-2.5 backdrop-blur"
                >
                  <span className="text-[0.58rem] font-black uppercase tracking-widest text-background">
                    {isOnline ? "Online" : "Offline"}
                  </span>
                  <span
                    className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${
                      isOnline ? "bg-secondary" : "bg-background/40"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 size-5 rounded-full bg-background shadow-soft transition-all duration-300 ${
                        isOnline ? "left-[1.4rem]" : "left-0.5"
                      }`}
                    />
                  </span>
                </button>
              </div>
            </section>

            <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
              <KpiCard icon={PackageCheck} label="Deliveries" value={data.kpis?.deliveriesToday ?? 0} tone="green" delayClass={DELAYS[0]} />
              <KpiCard icon={IndianRupee} label="Earnings" value={data.kpis?.earningsToday ?? 0} prefix="₹" delayClass={DELAYS[1]} />
              <KpiCard icon={RouteIcon} label="Distance" value={data.kpis?.distanceKm ?? 0} suffix=" km" decimals={1} tone="muted" delayClass={DELAYS[2]} />
              <KpiCard icon={Clock3} label="Hours" value={data.kpis?.workingHours ?? 0} suffix=" h" decimals={1} tone="muted" delayClass={DELAYS[3]} />
              <KpiCard icon={Star} label="Tips" value={data.kpis?.tips ?? 0} prefix="₹" tone="green" delayClass={DELAYS[4]} />
              <KpiCard icon={PackageSearch} label="Incentives" value={data.kpis?.incentives ?? 0} prefix="₹" delayClass={DELAYS[5]} />
            </section>

            <section className="mt-6">
              <SectionHeading title="Active Delivery" />
              <div className="mt-3">
                {data.activeDelivery ? (
                  <ActiveDeliveryCard
                    delivery={data.activeDelivery}
                    onNavigate={() =>
                      navigate({
                        to: riderRoutes.navigate,
                        params: { orderId: data.activeDelivery!.orderId },
                      })
                    }
                    onOpen={() =>
                      navigate({
                        to: riderRoutes.orderDetails,
                        params: { orderId: data.activeDelivery!.orderId },
                      })
                    }
                  />
                ) : (
                  <RiderEmptyState
                    icon={Navigation}
                    title="No active delivery"
                    body="Stay online — new orders in your zone will appear here instantly."
                  />
                )}
              </div>
            </section>

            <section className="mt-6">
              <SectionHeading title="Quick Actions" />
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => navigate({ to: action.to })}
                    className="card-soft ripple flex flex-col items-center gap-2 border border-border px-1 py-3 transition-all duration-300 active:scale-[0.96]"
                  >
                    <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
                      <action.icon className="size-4" strokeWidth={2.2} />
                    </span>
                    <span className="text-center text-[0.6rem] font-bold leading-tight tracking-tight text-foreground">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-6">
              <SectionHeading title="Performance" />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {data.performance.length > 0 ? (
                  data.performance.map((stat) => <PerformanceBar key={stat.id} stat={stat} />)
                ) : (
                  <RiderEmptyState
                    icon={Star}
                    title="Performance insights not available yet"
                    body="This dashboard will show your rating, acceptance and completion once the analytics service is live."
                  />
                )}
              </div>
            </section>

            <section className="mt-6">
              <SectionHeading title="Recent Feedback" />
              <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
                {data.feedback.length > 0 ? (
                  data.feedback.map((item) => (
                    <FeedbackCard key={item.id} customer={item.customer} rating={item.rating} comment={item.comment} />
                  ))
                ) : (
                  <RiderEmptyState
                    icon={Star}
                    title="No feedback yet"
                    body="Customer feedback will appear here once it is available from the backend."
                  />
                )}
              </div>
            </section>

            <section className="mt-6">
              <SectionHeading title="Announcements" />
              <div className="mt-3 space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
                {data.announcements.length > 0 ? (
                  data.announcements.map((item) => <AnnouncementCard key={item.id} item={item} />)
                ) : (
                  <RiderEmptyState
                    icon={Bell}
                    title="No announcements"
                    body="Company announcements will show up here when available."
                  />
                )}
              </div>
            </section>
          </div>
        )}

        <RiderBottomNav active="dashboard" />
      </div>
      <Toaster />
    </main>
  );
}
