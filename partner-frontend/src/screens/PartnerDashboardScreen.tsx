import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";
import type { EarningsSummary, PartnerOrderStatus } from "@/shared/types/partner";

import { PartnerBottomNav } from "../components/PartnerBottomNav";
import { SectionHeading } from "../components/PartnerPrimitives";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import {
  OrderStatusChips,
  QuickActionsGrid,
  QuickStatsGrid,
  RevenueCard,
  WelcomeCard,
  type DashboardShop,
  type DashboardSummaryCard,
  type QuickStat,
} from "../components/dashboard/DashboardCards";
import { Announcements, TodayPerformance } from "../components/dashboard/DashboardInsights";
import {
  DashboardSkeleton,
  MaintenanceEmptyState,
  NoOrdersEmptyState,
  OfflineEmptyState,
} from "../components/dashboard/DashboardStates";
import { LiveOrderCard, type LiveOrder } from "../components/dashboard/LiveOrderCard";
import { PullToRefresh } from "../components/dashboard/PullToRefresh";
import { partnerRoutes } from "../navigation/partner-routes";
import { fetchPartnerProfile } from "@/api/partner/partner-profile-api";
import { fetchDashboardSummary, setStoreOpen } from "@/api/partner/partner-dashboard-api";
import { fetchEarnings } from "@/api/partner/partner-earnings-api";
import { usePartnerOrders } from "../context/PartnerOrdersContext";
import { useOrderActionHandler } from "../hooks/use-order-action-handler";

const STATUS_TO_LIVE: Partial<Record<PartnerOrderStatus, LiveOrder["status"]>> = {
  new: "pending",
  accepted: "accepted",
  picked: "pickup",
  processing: "washing",
  ready: "ready",
};

/**
 * Partner dashboard — wired to the real partner API. Where no backend
 * endpoint exists yet (hourly analytics, announcements), we show an honest
 * "unavailable" state instead of fabricating data.
 */
export function PartnerDashboardScreen() {
  const navigate = useNavigate();
  const { orders, isLoading: ordersLoading, refresh: refreshOrders, testIncomingOrderAlarm } = usePartnerOrders();
  const { handleAction, sheetNode, overlay } = useOrderActionHandler();

  const [shop, setShop] = useState<DashboardShop | null>(null);
  const [summary, setSummary] = useState<DashboardSummaryCard | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStat[]>([]);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [profile, dashboard, earningsSummary] = await Promise.all([
        fetchPartnerProfile(),
        fetchDashboardSummary(),
        fetchEarnings().catch(() => null),
      ]);
      if (!profile.isVerified && profile.status !== "active") {
        navigate({ to: partnerRoutes.registrationSubmitted });
        return;
      }
      setShop({
        shopName: profile.businessName,
        partnerName: profile.ownerName,
        logoInitials: profile.businessName.slice(0, 2).toUpperCase(),
        isVerified: true,
        notifications: 0,
      });
      setSummary({
        totalOrders: profile.totalOrders,
        earnings: dashboard.todayEarnings,
        activeOrders: dashboard.newOrders + dashboard.inProcess + dashboard.readyForDelivery,
      });
      setQuickStats([
        { id: "new", label: "New Orders", value: dashboard.newOrders, tone: "primary" },
        { id: "processing", label: "Processing", value: dashboard.inProcess, tone: "primary" },
        { id: "ready", label: "Ready", value: dashboard.readyForDelivery, tone: "green" },
        { id: "completed", label: "Completed", value: dashboard.completedToday, tone: "green" },
      ]);
      setEarnings(earningsSummary);
      setIsOnline(dashboard.isStoreOpen);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    await Promise.all([load(), refreshOrders()]);
    toast.success("Dashboard updated");
  }, [load, refreshOrders]);

  const liveOrders = useMemo<LiveOrder[]>(
    () =>
      orders
        .filter((order) => order.stage !== "completed" && order.stage !== "cancelled")
        .slice(0, 8)
        .map((order) => ({
          id: order.id,
          code: order.code,
          customerName: order.customerName,
          pickupTime: order.pickupTime,
          services: order.services,
          amount: order.amount,
          status: STATUS_TO_LIVE[order.stage as PartnerOrderStatus] ?? "pending",
        })),
    [orders],
  );

  const findOrder = useCallback((id: string) => orders.find((order) => order.id === id), [orders]);

  const handleToggleOnline = useCallback(async () => {
    try {
      const next = !isOnline;
      await setStoreOpen(next);
      setIsOnline(next);
      toast.success(next ? "You're online" : "You're now offline");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update store status");
    }
  }, [isOnline]);

  const handleAccept = (order: LiveOrder) => {
    const full = findOrder(order.id);
    if (full) handleAction(full, "accept");
  };

  const handleReject = (order: LiveOrder) => {
    const full = findOrder(order.id);
    if (full) handleAction(full, "reject");
  };

  const handleView = (order: LiveOrder) => {
    navigate({ to: partnerRoutes.orderDetails, params: { orderId: order.id } });
  };

  const showSkeleton = isLoading || ordersLoading || !shop || !summary;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md md:max-w-3xl lg:max-w-6xl">
        {shop ? (
          <DashboardHeader shop={shop} isOnline={isOnline} onToggleOnline={handleToggleOnline} />
        ) : null}

        <PullToRefresh onRefresh={refresh}>
          {showSkeleton ? (
            <DashboardSkeleton />
          ) : error ? (
            <div className="px-4 py-16 text-center text-sm font-medium text-muted-foreground md:px-6">
              {error}
            </div>
          ) : (
            <div className="animate-soft-fade space-y-7 px-4 pb-32 pt-4 md:px-6 lg:pb-16">
              <WelcomeCard shop={shop} summary={summary} />

              <section>
                <div className="flex items-center justify-between">
                  <SectionHeading title="Quick Stats" />
                  <button
                    type="button"
                    onClick={testIncomingOrderAlarm}
                    className="flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-brand-dark transition-all hover:bg-primary/20 active:scale-95"
                    title="Test Zomato-style incoming order sound & popup"
                  >
                    <span className="size-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                    🔔 Test Order Ringtone
                  </button>
                </div>
                <div className="mt-4">
                  <QuickStatsGrid stats={quickStats} />
                </div>
              </section>

              <div className="grid gap-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                <section className="min-w-0">
                  <SectionHeading title="Revenue" />
                  <div className="mt-4">
                    <RevenueCard earnings={earnings} isLoading={isLoading} />
                  </div>
                </section>

                <section className="min-w-0">
                  <SectionHeading title="Order Status" />
                  <div className="card-soft mt-4 border border-border p-4">
                    <OrderStatusChips active="Washing" />
                    <p className="mt-3 text-[0.7rem] font-medium text-muted-foreground">
                      Live status across today's orders.
                    </p>
                  </div>
                </section>
              </div>

              <section>
                <SectionHeading
                  title="Live Orders"
                  action={
                    <button
                      type="button"
                      onClick={() => navigate({ to: partnerRoutes.orders })}
                      className="flex items-center gap-1 text-[0.68rem] font-bold text-brand-green"
                    >
                      View all <ArrowRight className="size-3.5" />
                    </button>
                  }
                />
                <div className="mt-4">
                  {!isOnline ? (
                    <OfflineEmptyState onGoOnline={() => void handleToggleOnline()} />
                  ) : liveOrders.length === 0 ? (
                    <NoOrdersEmptyState />
                  ) : (
                    <div className="grid gap-3 lg:grid-cols-2">
                      {liveOrders.map((order, index) => (
                        <LiveOrderCard
                          key={order.id}
                          order={order}
                          delay={index * 60}
                          onAccept={handleAccept}
                          onReject={handleReject}
                          onView={handleView}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section>
                <SectionHeading
                  title="Quick Actions"
                  action={<LayoutGrid className="size-4 text-muted-foreground" />}
                />
                <div className="mt-4">
                  <QuickActionsGrid />
                </div>
              </section>

              <section>
                <SectionHeading title="Today Performance" />
                <div className="mt-4">
                  <TodayPerformance />
                </div>
              </section>

              <section>
                <SectionHeading title="Announcements" />
                <div className="mt-4">
                  <Announcements />
                </div>
              </section>
            </div>
          )}
        </PullToRefresh>

        <PartnerBottomNav active="dashboard" />
      </div>
      {sheetNode}
      {overlay}
      <Toaster />
    </main>
  );
}
