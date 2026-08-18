import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@shared/ui/sonner";
import { usePartnerRealtime } from "@shared/hooks/use-partner-realtime";

import { PartnerBottomNav } from "../components/PartnerBottomNav";
import { SectionHeading } from "../components/PartnerPrimitives";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import {
  OrderStatusChips,
  QuickActionsGrid,
  QuickStatsGrid,
  RevenueCard,
  WelcomeCard,
} from "../components/dashboard/DashboardCards";
import { Announcements, TodayPerformance } from "../components/dashboard/DashboardInsights";
import {
  DashboardSkeleton,
  MaintenanceEmptyState,
  NoOrdersEmptyState,
  OfflineEmptyState,
} from "../components/dashboard/DashboardStates";
import { LiveOrderCard } from "../components/dashboard/LiveOrderCard";
import { RealtimeStatusPill } from "../components/RealtimeStatusPill";
import { PullToRefresh } from "../components/dashboard/PullToRefresh";
import { partnerRoutes } from "../navigation/partner-routes";
import {
  dashboardShop,
  dashboardSummary,
  liveOrders as seedOrders,
  quickStats,
  type LiveOrder,
} from "../data/partner-dashboard-mock";

/**
 * Sprint 3.2 — Premium QuickPress Partner dashboard.
 * UI/UX only: all data is local mock data, no API or Firebase integration.
 */
/** Map a realtime order status onto the dashboard card status vocabulary. */
function mapRealtimeStatus(status: string, fallback: LiveOrder["status"]): LiveOrder["status"] {
  switch (status) {
    case "created":
      return "pending";
    case "accepted":
    case "assigned":
    case "reached_shop":
      return "accepted";
    case "picked":
      return "pickup";
    case "washing":
      return "washing";
    case "ironing":
      return "ironing";
    case "ready":
    case "out_for_delivery":
      return "ready";
    case "delivered":
      return "delivered";
    default:
      return fallback;
  }
}

export function PartnerDashboardScreen() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [maintenance] = useState(false);
  const [orders, setOrders] = useState<LiveOrder[]>(seedOrders);

  /* Sprint 5.5 — live partner feed (incoming orders + status changes). */
  const { incoming, updates, acceptOrder, rejectOrder } = usePartnerRealtime(
    dashboardShop.partnerId ?? null,
    dashboardShop.city ?? null,
  );

  useEffect(() => {
    if (incoming.length === 0) return;
    setOrders((prev) => {
      const known = new Set(prev.map((order) => order.code));
      const fresh = incoming
        .filter((order) => !known.has(order.orderId))
        .map<LiveOrder>((order) => ({
          id: order.orderId,
          code: order.orderId,
          customerName: "New customer",
          pickupTime: "Awaiting schedule",
          services: ["Incoming order"],
          amount: order.amount ?? 0,
          status: "pending",
        }));
      return fresh.length === 0 ? prev : [...fresh, ...prev];
    });
  }, [incoming]);

  useEffect(() => {
    if (updates.length === 0) return;
    const latest = updates[0];
    if (!latest) return;
    setOrders((prev) =>
      prev.map((order) =>
        order.code === latest.orderId || order.id === latest.orderId
          ? { ...order, status: mapRealtimeStatus(latest.status, order.status) }
          : order,
      ),
    );
  }, [updates]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const refresh = async () => {
    setIsLoading(true);
    // TODO(api): refetch dashboard summary + live orders
    await new Promise((resolve) => setTimeout(resolve, 800));
    setOrders(seedOrders);
    setIsLoading(false);
    toast.success("Dashboard updated");
  };

  const handleAccept = (order: LiveOrder) => {
    setOrders((prev) =>
      prev.map((item) => (item.id === order.id ? { ...item, status: "accepted" } : item)),
    );
    // Acknowledged server-side; UI already moved (optimistic) either way.
    void acceptOrder(order.code);
    toast.success(`Order ${order.code} accepted`);
  };

  const handleReject = (order: LiveOrder) => {
    setOrders((prev) => prev.filter((item) => item.id !== order.id));
    void rejectOrder(order.code);
    toast.error(`Order ${order.code} rejected`);
  };

  const handleView = (order: LiveOrder) => {
    navigate({ to: partnerRoutes.orderDetails, params: { orderId: order.id } });
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md md:max-w-3xl lg:max-w-6xl">
        <DashboardHeader
          shop={dashboardShop}
          isOnline={isOnline}
          onToggleOnline={() => {
            setIsOnline((prev) => {
              toast.success(prev ? "You're now offline" : "You're online");
              return !prev;
            });
          }}
        />

        <PullToRefresh onRefresh={refresh}>
          {isLoading ? (
            <DashboardSkeleton />
          ) : (
            <div className="animate-soft-fade space-y-7 px-4 pb-32 pt-4 md:px-6 lg:pb-16">
              <WelcomeCard shop={dashboardShop} summary={dashboardSummary} />

              <section>
                <SectionHeading title="Quick Stats" />
                <div className="mt-4">
                  <QuickStatsGrid stats={quickStats} />
                </div>
              </section>

              <div className="grid gap-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                <section className="min-w-0">
                  <SectionHeading title="Today Revenue" />
                  <div className="mt-4">
                    <RevenueCard />
                  </div>
                </section>

                <section className="min-w-0">
                  <SectionHeading title="Order Status" />
                  <div className="card-soft mt-4 border border-border p-4">
                    <OrderStatusChips active="Washing" />
                    <p className="mt-3 text-[0.7rem] font-medium text-muted-foreground">
                      Most of today's orders are currently in the washing stage.
                    </p>
                  </div>
                </section>
              </div>

              <section>
                <SectionHeading
                  title="Live Orders"
                  action={
                    <div className="flex items-center gap-2">
                      <RealtimeStatusPill />
                        <button
                        type="button"
                        onClick={() => navigate({ to: partnerRoutes.orders })}
                        className="flex items-center gap-1 text-[0.68rem] font-bold text-brand-green"
                      >
                        View all <ArrowRight className="size-3.5" />
                      </button>
                    </div>
                  }
                />
                <div className="mt-4">
                  {maintenance ? (
                    <MaintenanceEmptyState />
                  ) : !isOnline ? (
                    <OfflineEmptyState onGoOnline={() => setIsOnline(true)} />
                  ) : orders.length === 0 ? (
                    <NoOrdersEmptyState />
                  ) : (
                    <div className="grid gap-3 lg:grid-cols-2">
                      {orders.map((order, index) => (
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
      <Toaster />
    </main>
  );
}
