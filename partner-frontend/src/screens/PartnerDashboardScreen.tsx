import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, LayoutGrid, Plus, ShoppingBag, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";
import type { EarningsSummary, PartnerOrderStatus } from "@/shared/types/partner";

import { SectionHeading } from "../components/PartnerPrimitives";
import { PartnerLayout } from "../components/layout/PartnerLayout";
import { ZomatoHubView } from "../components/dashboard/ZomatoHubView";
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

const STATUS_TO_LIVE: Record<string, LiveOrder["status"]> = {
  new: "pending",
  placed: "pending",
  pending: "pending",
  accepted: "accepted",
  pickup_pending: "pickup",
  pickup_driver_assigned: "pickup",
  picked_up: "pickup",
  picked: "pickup",
  at_partner: "pickup",
  washing: "washing",
  dry_cleaning: "washing",
  processing: "washing",
  ironing: "ironing",
  ready: "ready",
  delivery_assigned: "ready",
  out_for_delivery: "ready",
  completed: "delivered",
  delivered: "delivered",
  cancelled: "delivered",
};

export function PartnerDashboardScreen() {
  const navigate = useNavigate();
  const { orders, isLoading: ordersLoading, refresh: refreshOrders } = usePartnerOrders();
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
  }, [navigate]);

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
    <PartnerLayout
      activeTab="dashboard"
      title="Partner Dashboard"
      subtitle={shop ? `Welcome back, ${shop.partnerName} · ${shop.shopName}` : "Store Console"}
    >
      {/* Mobile Zomato Hub Experience (< md) */}
      <div className="md:hidden">
        <ZomatoHubView />
      </div>

      {/* Desktop Business Dashboard (>= md) */}
      <div className="hidden mx-auto w-full max-w-7xl px-4 py-4 md:block md:px-8 md:py-6">
        <PullToRefresh onRefresh={refresh}>
          {showSkeleton ? (
            <DashboardSkeleton />
          ) : error ? (
            <div className="px-4 py-16 text-center text-sm font-medium text-muted-foreground md:px-6">
              {error}
            </div>
          ) : (
            <div className="animate-soft-fade space-y-6 lg:space-y-8">
              {/* Operational Metric Cards */}
              <section>
                <div className="flex items-center justify-between">
                  <SectionHeading title="Operational Overview" />
                  <button
                    type="button"
                    onClick={() => navigate({ to: partnerRoutes.orders })}
                    className="flex items-center gap-1 text-xs font-bold text-brand-green hover:underline"
                  >
                    View Queue <ArrowRight className="size-3.5" />
                  </button>
                </div>
                <div className="mt-3.5">
                  <QuickStatsGrid stats={quickStats} />
                </div>
              </section>

              {/* Desktop Multi-column Grid: Revenue & Order Status */}
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <section className="min-w-0">
                  <SectionHeading title="Revenue Summary" />
                  <div className="mt-3.5">
                    <RevenueCard earnings={earnings} isLoading={isLoading} />
                  </div>
                </section>

                <section className="min-w-0">
                  <SectionHeading title="Order Status Flow" />
                  <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm mt-3.5">
                    <OrderStatusChips active="Washing" />
                    <p className="mt-3 text-xs font-semibold text-muted-foreground">
                      Real-time stage transitions across your active customer bookings.
                    </p>
                  </div>
                </section>
              </div>

              {/* Live Orders Section */}
              <section>
                <div className="flex items-center justify-between">
                  <SectionHeading title="Active Orders" />
                  <button
                    type="button"
                    onClick={() => navigate({ to: partnerRoutes.orders })}
                    className="flex items-center gap-1 text-xs font-bold text-brand-green hover:underline"
                  >
                    View all ({orders.length}) <ArrowRight className="size-3.5" />
                  </button>
                </div>
                <div className="mt-3.5">
                  {!isOnline ? (
                    <OfflineEmptyState onGoOnline={() => void handleToggleOnline()} />
                  ) : liveOrders.length === 0 ? (
                    <NoOrdersEmptyState />
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {liveOrders.map((order, index) => (
                        <LiveOrderCard
                          key={order.id}
                          order={order}
                          delay={index * 40}
                          onAccept={handleAccept}
                          onReject={handleReject}
                          onView={handleView}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Quick Actions Grid */}
              <section>
                <div className="flex items-center justify-between">
                  <SectionHeading title="Quick Shortcuts" />
                  <LayoutGrid className="size-4 text-muted-foreground" />
                </div>
                <div className="mt-3.5">
                  <QuickActionsGrid />
                </div>
              </section>

              {/* Performance Insights */}
              <div className="grid gap-6 md:grid-cols-2">
                <section>
                  <SectionHeading title="Performance Insights" />
                  <div className="mt-3.5">
                    <TodayPerformance />
                  </div>
                </section>

                <section>
                  <SectionHeading title="Platform Announcements" />
                  <div className="mt-3.5">
                    <Announcements />
                  </div>
                </section>
              </div>
            </div>
          )}
        </PullToRefresh>
      </div>

      {sheetNode}
      {overlay}
      <Toaster />
    </PartnerLayout>
  );
}
