import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  Clock3,
  History,
  IndianRupee,
  LifeBuoy,
  MapPin,
  Navigation,
  Package,
  PackageCheck,
  PackageSearch,
  Route as RouteIcon,
  Sparkles,
  Star,
  Store,
  Truck,
  User,
  Wallet,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { RiderBottomNav } from "../components/RiderBottomNav";
import { DualSwipeActionButton } from "../components/common/DualSwipeActionButton";
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
import { useRiderLocation } from "../hooks/use-rider-location";
import { loadRiderDashboard } from "../data/rider-dashboard-adapter";
import type { RiderDashboardData, RiderWorkStatus } from "../data/rider-dashboard-mock";
import {
  acceptRiderOrder,
  fetchRiderOrders,
  rejectRiderOrder,
} from "@/api/rider/rider-orders-api";
import type { RiderOrder } from "@/shared/types/rider";
import { riderRoutes } from "../navigation/rider-routes";

const QUICK_ACTIONS = [
  { id: "orders", label: "Orders", icon: ClipboardList, to: riderRoutes.orders },
  { id: "earnings", label: "Earnings", icon: IndianRupee, to: riderRoutes.wallet },
  { id: "history", label: "History", icon: History, to: riderRoutes.history },
  { id: "wallet", label: "Payouts", icon: Wallet, to: riderRoutes.wallet },
  { id: "notifications", label: "Alerts", icon: Bell, to: riderRoutes.notifications },
  { id: "support", label: "Support", icon: LifeBuoy, to: riderRoutes.settings },
] as const;

const DELAYS = ["stagger-1", "stagger-2", "stagger-3", "stagger-4", "stagger-5", "stagger-6"];

export function RiderDashboardScreen() {
  const navigate = useNavigate();
  const { isOnline, setOnline } = useRiderContext();
  const [data, setData] = useState<RiderDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingOrders, setPendingOrders] = useState<RiderOrder[]>([]);
  const [actionBusy, setActionBusy] = useState(false);

  // 📍 Real-time GPS Location Ping & Tracking
  const locationState = useRiderLocation(isOnline);

  const loadData = useCallback(async () => {
    try {
      const [next, ordersList] = await Promise.all([
        loadRiderDashboard(),
        fetchRiderOrders().catch(() => [] as RiderOrder[]),
      ]);
      setData(next);
      const assigned = ordersList.filter(
        (o) => o.status === "assigned" || (o.stage as any) === "pickup_assigned"
      );
      setPendingOrders(assigned);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    // Refresh active orders every 8s when online
    if (isOnline) {
      const timer = setInterval(() => {
        void loadData();
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [loadData, isOnline]);

  const status: RiderWorkStatus = !isOnline
    ? "offline"
    : data?.activeDelivery
      ? "on-delivery"
      : "online";

  const handleToggle = () => {
    const next = !isOnline;
    setOnline(next);
    toast.success(next ? "You are Online — Ready for Deliveries 🚀" : "You are Offline");
  };

  const handleAcceptOffer = async (order: RiderOrder) => {
    setActionBusy(true);
    try {
      await acceptRiderOrder(order.code || order.id);
      toast.success(`Trip Offer #${order.code} Accepted! 🚀`);
      await loadData();
      navigate({
        to: riderRoutes.orderDetails,
        params: { orderId: order.code || order.id },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to accept trip offer");
    } finally {
      setActionBusy(false);
    }
  };

  const handleRejectOffer = async (order: RiderOrder) => {
    setActionBusy(true);
    try {
      await rejectRiderOrder(order.code || order.id);
      toast.info(`Offer #${order.code} declined`);
      setPendingOrders((prev) => prev.filter((o) => o.id !== order.id && o.code !== order.code));
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to decline offer");
    } finally {
      setActionBusy(false);
    }
  };

  const activePendingOffer = isOnline && pendingOrders.length > 0 ? pendingOrders[0] : null;

  return (
    <main className="relative min-h-screen bg-slate-50/50 pb-28 text-slate-900">
      <div className="mx-auto w-full max-w-md lg:max-w-3xl">
        {/* Sticky Mobile Header */}
        <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-black tracking-tight text-slate-900">
                {data?.rider.name ?? "Delivery Partner"}
              </h1>
              <p className="truncate text-xs font-semibold text-slate-500">
                ID: {data?.rider.riderId ?? "—"} · Hub: {data?.rider.city ?? "Kasganj"}
              </p>
            </div>
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => navigate({ to: riderRoutes.notifications })}
              className="relative flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.95]"
            >
              <Bell className="size-4.5" strokeWidth={2} />
              {(data?.unreadNotifications ?? 0) > 0 ? (
                <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              ) : null}
            </button>
          </div>
        </header>

        {loading || !data ? (
          <div className="p-4">
            <RiderCardsSkeleton />
          </div>
        ) : (
          <div className="space-y-4 px-4 pt-3.5">
            {/* HERO CARD: Today's Earnings & Online Toggle */}
            <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-5 text-white shadow-lg border border-slate-800">
              <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-emerald-500/15 blur-2xl" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Zap className="size-3.5 text-emerald-400 fill-emerald-400" />
                    <p className="text-[11px] font-bold uppercase tracking-wider">
                      Today&apos;s Earnings
                    </p>
                  </div>
                  <p className="mt-1 flex items-center text-3xl font-black tracking-tight text-white">
                    <IndianRupee className="size-6" strokeWidth={2.6} />
                    {(data.kpis?.earningsToday ?? 0).toLocaleString("en-IN")}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-300">
                    <span className="text-emerald-400 font-bold">
                      {data.kpis?.deliveriesToday ?? 0}
                    </span>{" "}
                    orders completed · {data.kpis?.workingHours ?? 0}h online
                  </p>
                </div>

                {/* Modern Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isOnline}
                  aria-label="Online status"
                  onClick={handleToggle}
                  className={`flex flex-col items-center gap-1 rounded-2xl p-2.5 transition-all active:scale-[0.95] ${
                    isOnline
                      ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                      : "bg-white/10 border border-white/15 text-slate-300"
                  }`}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    {isOnline ? "ONLINE" : "OFFLINE"}
                  </span>
                  <span
                    className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${
                      isOnline ? "bg-emerald-500" : "bg-white/30"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 size-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                        isOnline ? "left-[1.35rem]" : "left-0.5"
                      }`}
                    />
                  </span>
                </button>
              </div>
            </section>

            {/* 🚀 NEW DELIVERY JOB OFFER CARD (IF ANY NEW ASSIGNED ORDER) */}
            {activePendingOffer ? (
              <section className="animate-rise overflow-hidden rounded-3xl border-2 border-emerald-500/70 bg-gradient-to-b from-slate-900 to-slate-950 p-5 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                    <Sparkles className="size-3 text-emerald-400 animate-spin" />
                    New Laundry Trip Offer
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    #{activePendingOffer.code}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400">Trip Earnings</p>
                    <p className="flex items-center text-2xl font-black text-emerald-400">
                      <IndianRupee className="size-5" />
                      {activePendingOffer.estimatedEarning || 55}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-slate-400">Estimated Distance</p>
                    <p className="text-sm font-black text-white">
                      {activePendingOffer.distanceKm || "2.4"} KM
                    </p>
                  </div>
                </div>

                {/* Pickup & Drop Points */}
                <div className="mt-3.5 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-amber-400/20 text-amber-400">
                      <Store className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Store Pickup</p>
                      <p className="truncate text-xs font-bold text-white">
                        {activePendingOffer.partnerName || "Partner Outlet"}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">
                        {activePendingOffer.pickupAddress || "Kasganj Hub"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-emerald-400/20 text-emerald-400">
                      <MapPin className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Customer Drop-off
                      </p>
                      <p className="truncate text-xs font-bold text-white">
                        {activePendingOffer.customerName || "Customer"}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">
                        {activePendingOffer.deliveryAddress || "Customer Address"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dual Swipe Action */}
                <div className="mt-4 pt-2">
                  <DualSwipeActionButton
                    acceptLabel="Swipe Right to Accept Offer"
                    rejectLabel="Swipe Left to Reject"
                    onAccept={() => handleAcceptOffer(activePendingOffer)}
                    onReject={() => handleRejectOffer(activePendingOffer)}
                    loading={actionBusy}
                  />
                </div>
              </section>
            ) : null}

            {/* KPI METRIC GRID */}
            <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <KpiCard
                icon={PackageCheck}
                label="Orders Done"
                value={data.kpis?.deliveriesToday ?? 0}
                tone="green"
                delayClass={DELAYS[0]}
              />
              <KpiCard
                icon={IndianRupee}
                label="Total Payout"
                value={data.kpis?.earningsToday ?? 0}
                prefix="₹"
                delayClass={DELAYS[1]}
              />
              <KpiCard
                icon={RouteIcon}
                label="Distance"
                value={data.kpis?.distanceKm ?? 0}
                suffix=" km"
                decimals={1}
                tone="muted"
                delayClass={DELAYS[2]}
              />
              <KpiCard
                icon={Clock3}
                label="Duty Hours"
                value={data.kpis?.workingHours ?? 0}
                suffix=" h"
                decimals={1}
                tone="muted"
                delayClass={DELAYS[3]}
              />
              <KpiCard
                icon={Star}
                label="Tips Earned"
                value={data.kpis?.tips ?? 0}
                prefix="₹"
                tone="green"
                delayClass={DELAYS[4]}
              />
              <KpiCard
                icon={PackageSearch}
                label="Incentives"
                value={data.kpis?.incentives ?? 0}
                prefix="₹"
                delayClass={DELAYS[5]}
              />
            </section>

            {/* ACTIVE DELIVERY BANNER (IF ANY) */}
            {data.activeDelivery ? (
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Live Dispatch In Progress
                  </h2>
                </div>
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
              </section>
            ) : null}

            {/* QUICK ACTIONS */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Quick Hub Navigation
              </h2>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => navigate({ to: action.to })}
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 transition-all hover:bg-slate-100 hover:border-slate-200 active:scale-[0.94]"
                  >
                    <span className="flex size-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                      <action.icon className="size-4" strokeWidth={2.2} />
                    </span>
                    <span className="text-center text-[11px] font-bold text-slate-800">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* PERFORMANCE SECTION */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Performance & Rating
              </h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {data.performance.length > 0 ? (
                  data.performance.map((stat) => <PerformanceBar key={stat.id} stat={stat} />)
                ) : (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Star className="size-4.5 fill-current" />
                    </span>
                    <div>
                      <p className="text-xs font-black text-slate-900">5.0 Star Rating</p>
                      <p className="text-[11px] font-medium text-slate-500">
                        100% On-Time Acceptance & Safe Handling
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ANNOUNCEMENTS */}
            {data.announcements.length > 0 ? (
              <section className="space-y-2">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Fleet Announcements
                </h2>
                <div className="space-y-2">
                  {data.announcements.map((item) => (
                    <AnnouncementCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}

        <RiderBottomNav active="dashboard" />
      </div>
      <Toaster />
    </main>
  );
}
