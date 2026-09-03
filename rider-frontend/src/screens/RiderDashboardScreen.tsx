import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
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
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

import { RiderBottomNav } from "../components/RiderBottomNav";
import { RapidoDutyToggle } from "../components/common/RapidoDutyToggle";
import { SwipeToConfirm } from "../components/common/SwipeToConfirm";
import { IncomingOrderAlertModal } from "../components/alerts/IncomingOrderAlertModal";
import { stopOrderAlertRing } from "../lib/order-alert-sound";
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

  // ⚡ Optimistic sets to prevent 5s polling from re-showing accepted/declined offers
  const acceptedOrderIds = useRef<Set<string>>(new Set());
  const declinedOrderIds = useRef<Set<string>>(new Set());

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
        (o) =>
          (o.status === "assigned" || (o.stage as any) === "pickup_assigned") &&
          !acceptedOrderIds.current.has(o.id) &&
          !acceptedOrderIds.current.has(o.code) &&
          !declinedOrderIds.current.has(o.id) &&
          !declinedOrderIds.current.has(o.code)
      );
      setPendingOrders(assigned);
      if (assigned.length === 0) {
        stopOrderAlertRing();
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  // ⚡ Live Supabase Realtime WebSocket subscription for instant dispatch (0ms latency)
  useEffect(() => {
    const channel = supabase
      .channel("rider-live-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          void loadData();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadData]);

  useEffect(() => {
    void loadData();
    // Background polling fallback every 5s when online
    if (isOnline) {
      const timer = setInterval(() => {
        void loadData();
      }, 5000);
      return () => {
        clearInterval(timer);
        stopOrderAlertRing();
      };
    } else {
      stopOrderAlertRing();
    }
  }, [loadData, isOnline]);

  const status: RiderWorkStatus = !isOnline
    ? "offline"
    : data?.activeDelivery
      ? "on-delivery"
      : "online";

  const handleToggle = () => {
    const next = !isOnline;
    if (!next) {
      stopOrderAlertRing();
    }
    setOnline(next);
    toast.success(next ? "You are Online — Ready for Deliveries 🚀" : "You are Offline");
  };

  const handleAcceptOffer = async (order: RiderOrder) => {
    setActionBusy(true);
    stopOrderAlertRing(); // 🛑 Stop siren immediately!
    acceptedOrderIds.current.add(order.id);
    if (order.code) acceptedOrderIds.current.add(order.code);

    // ⚡ Instantaneous optimistic dismissal (0ms delay)
    setPendingOrders((prev) => prev.filter((o) => o.id !== order.id && o.code !== order.code));
    toast.success(`Trip Offer #${order.code || order.id} Accepted! 🚀`);

    try {
      await acceptRiderOrder(order.code || order.id);
      await loadData();
      navigate({
        to: riderRoutes.orderDetails,
        params: { orderId: order.code || order.id },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to accept trip offer");
      await loadData();
    } finally {
      setActionBusy(false);
      stopOrderAlertRing();
    }
  };

  const handleRejectOffer = async (order: RiderOrder) => {
    setActionBusy(true);
    stopOrderAlertRing(); // 🛑 Stop siren immediately!
    declinedOrderIds.current.add(order.id);
    if (order.code) declinedOrderIds.current.add(order.code);

    setPendingOrders((prev) => prev.filter((o) => o.id !== order.id && o.code !== order.code));
    toast.info(`Offer #${order.code || order.id} declined`);

    try {
      await rejectRiderOrder(order.code || order.id);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to decline offer");
      await loadData();
    } finally {
      setActionBusy(false);
      stopOrderAlertRing();
    }
  };

  const activePendingOffer = isOnline && pendingOrders.length > 0 ? pendingOrders[0] : null;

  return (
    <main className="relative min-h-screen bg-white pb-28 text-slate-900">
      <div className="mx-auto w-full max-w-md lg:max-w-3xl">
        {/* Sticky Mobile Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-400 font-black text-slate-950 text-sm shadow-sm">
                QP
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-sm font-black tracking-tight text-slate-900">
                  {data?.rider.name ?? "Delivery Captain"}
                </h1>
                <p className="truncate text-[11px] font-semibold text-slate-500">
                  ID: {data?.rider.riderId ?? "—"} · Hub: {data?.rider.city ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="SOS Emergency"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.location.href = "tel:112";
                  }
                }}
                className="flex h-8 items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 text-[11px] font-black text-rose-600 transition-all hover:bg-rose-100 active:scale-95 cursor-pointer"
              >
                SOS
              </button>
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => navigate({ to: riderRoutes.notifications })}
                className="relative flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-800 shadow-sm transition-all hover:bg-slate-50 active:scale-95 cursor-pointer"
              >
                <Bell className="size-4" strokeWidth={2.2} />
                {(data?.unreadNotifications ?? 0) > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-amber-500 ring-2 ring-white" />
                ) : null}
              </button>
            </div>
          </div>
        </header>

        {loading || !data ? (
          <div className="p-4">
            <RiderCardsSkeleton />
          </div>
        ) : (
          <div className="space-y-4 px-4 pt-3.5">
            {/* RAPIDO DUTY TOGGLE */}
            <RapidoDutyToggle
              isOnline={isOnline}
              onToggle={handleToggle}
              busy={actionBusy}
            />

            {/* HERO CARD: Today's Earnings */}
            <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    Today&apos;s Earnings
                  </p>
                  <p className="mt-1 flex items-center text-3xl font-black tracking-tight text-slate-950">
                    <IndianRupee className="size-6 text-amber-500" strokeWidth={2.6} />
                    {(data.kpis?.earningsToday ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate({ to: riderRoutes.wallet })}
                  className="mt-1 flex items-center gap-1 rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-black text-slate-950 shadow-sm hover:bg-amber-500 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Withdraw</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>

              {/* 3 Quick Stat Columns */}
              <div className="mt-3 grid grid-cols-3 divide-x divide-slate-100 text-center text-xs">
                <div className="px-2">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Trips</p>
                  <p className="mt-0.5 text-sm font-black text-slate-900">
                    {data.kpis?.deliveriesToday ?? 0}
                  </p>
                </div>
                <div className="px-2">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Online</p>
                  <p className="mt-0.5 text-sm font-black text-slate-900">
                    {data.kpis?.workingHours ?? 0}h
                  </p>
                </div>
                <div className="px-2">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Distance</p>
                  <p className="mt-0.5 text-sm font-black text-slate-900">
                    {data.kpis?.distanceKm ?? 0} km
                  </p>
                </div>
              </div>
            </section>

            {/* 🚀 NEW DELIVERY JOB OFFER CARD (Rapido Yellow Style) */}
            {activePendingOffer ? (
              <section className="overflow-hidden rounded-2xl border-2 border-amber-400 bg-white p-4 text-slate-900 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-900">
                    <Sparkles className="size-3 text-amber-600" />
                    New Laundry Trip Offer
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    #{activePendingOffer.code}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Guaranteed Payout</p>
                    <p className="flex items-center text-2xl font-black text-slate-950">
                      <IndianRupee className="size-5 text-amber-500" strokeWidth={2.5} />
                      {activePendingOffer.estimatedEarning || 55}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-right">
                    <p className="text-[9px] font-bold uppercase text-slate-400">Estimated Distance</p>
                    <p className="text-sm font-black text-slate-900">
                      {activePendingOffer.distanceKm || "2.4"} KM
                    </p>
                  </div>
                </div>

                {/* Pickup & Drop Points */}
                <div className="mt-3.5 space-y-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex items-start gap-2.5">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-slate-950 font-black text-[10px]">
                      P
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Store Pickup</p>
                      <p className="truncate text-xs font-black text-slate-900">
                        {activePendingOffer.partnerName || "Partner Outlet"}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {activePendingOffer.pickupAddress || "Pickup Location"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white font-black text-[10px]">
                      D
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Customer Drop</p>
                      <p className="truncate text-xs font-black text-slate-900">
                        {activePendingOffer.customerName || "Customer"}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {activePendingOffer.deliveryAddress || "Customer Address"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rapido Style Swipe to Accept */}
                <div className="mt-4 space-y-2">
                  <SwipeToConfirm
                    label={`Swipe to Accept (₹${activePendingOffer.estimatedEarning || 55})`}
                    onConfirm={() => handleAcceptOffer(activePendingOffer)}
                    busy={actionBusy}
                  />
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => handleRejectOffer(activePendingOffer)}
                    className="w-full py-2 text-center text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Decline offer
                  </button>
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

        {/* Full-Screen Rapido-Style Incoming Order Alert Modal */}
        <IncomingOrderAlertModal
          order={activePendingOffer}
          isOpen={Boolean(activePendingOffer)}
          onAccept={handleAcceptOffer}
          onReject={handleRejectOffer}
        />

        <RiderBottomNav active="dashboard" />
      </div>
      <Toaster />
    </main>
  );
}
