import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  BarChart3,
  Bell,
  Bike,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Globe,
  Headphones,
  HelpCircle,
  History,
  Layers,
  Menu,
  MessageSquare,
  Package,
  Phone,
  PhoneCall,
  Play,
  RotateCcw,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  UserCheck,
  Users,
  Volume2,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { partnerRoutes } from "../../navigation/partner-routes";
import { fetchDashboardSummary, setStoreOpen } from "../../api/partner/partner-dashboard-api";
import { fetchEarnings } from "../../api/partner/partner-earnings-api";
import { fetchPartnerProfile } from "../../api/partner/partner-profile-api";
import { usePartnerOrders } from "../../context/PartnerOrdersContext";
import { useOrderActionHandler } from "../../hooks/use-order-action-handler";
import { useLanguage } from "../../lib/i18n";
import type { ManagedOrder, PartnerOrderFilterTab } from "../../data/partner-orders-mock";
import { STAGE_LABEL, isOrderMatchingTab } from "../../data/partner-orders-mock";
import { OrderTimeline } from "../orders/OrderTimeline";

function getStageTimelineIndex(stage: string): number {
  switch (stage) {
    case "new":
      return 0;
    case "accepted":
      return 1;
    case "pickup_pending":
    case "pickup_driver_assigned":
    case "picked_up":
    case "picked":
    case "at_partner":
      return 2;
    case "washing":
    case "dry_cleaning":
    case "processing":
    case "ironing":
      return 3;
    case "ready":
    case "delivery_assigned":
    case "out_for_delivery":
      return 4;
    case "completed":
    case "delivered":
      return 5;
    default:
      return 0;
  }
}

const FEED_PILLS = [
  { id: "feed", label: "My Feed" },
  { id: "sales", label: "Sales" },
  { id: "funnel", label: "Funnel" },
  { id: "quality", label: "Service quality" },
  { id: "operations", label: "Operations" },
];

export function ZomatoHubView() {
  const navigate = useNavigate();
  const { orders, counts, refresh: refreshOrders } = usePartnerOrders();
  const { handleAction, sheetNode, overlay, busy } = useOrderActionHandler();
  const { openLanguageModal, language, t } = useLanguage();

  const [activeFilterTab, setActiveFilterTab] = useState<PartnerOrderFilterTab>("all");
  const [shopName, setShopName] = useState("QuickPress Laundry Store");
  const [locationName, setLocationName] = useState("Bengaluru");
  const [isOnline, setIsOnline] = useState(true);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayOrdersCount, setTodayOrdersCount] = useState(0);
  const [earningsData, setEarningsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedManageOrder, setSelectedManageOrder] = useState<ManagedOrder | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetchPartnerProfile().catch(() => null),
      fetchDashboardSummary().catch(() => null),
      fetchEarnings().catch(() => null),
    ]).then(([profile, summary, earnings]) => {
      if (!alive) return;
      if (profile) {
        setShopName(profile.businessName || profile.ownerName || "QuickPress Laundry Store");
        setLocationName(profile.city ? `${profile.city}` : "Kasganj");
      }
      if (summary) {
        setIsOnline(summary.isStoreOpen);
        setTodayOrdersCount(
          summary.newOrders + summary.inProcess + summary.readyForDelivery + summary.completedToday
        );
        setTodayEarnings(summary.todayEarnings);
      }
      if (earnings) {
        setEarningsData(earnings);
      }
      setIsLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const handleToggleStore = async () => {
    try {
      const next = !isOnline;
      setIsOnline(next);
      await setStoreOpen(next);
    } catch {
      setIsOnline(!isOnline);
      toast.error("Failed to update store status");
    }
  };

  const FILTER_TABS: { id: PartnerOrderFilterTab; label: string; count: number }[] = useMemo(() => [
    { id: "all", label: "All", count: orders.length },
    { id: "active", label: "Active", count: orders.filter((o) => isOrderMatchingTab(o, "active")).length },
    { id: "pickup", label: "Pickup", count: orders.filter((o) => isOrderMatchingTab(o, "pickup")).length },
    { id: "processing", label: "Processing", count: orders.filter((o) => isOrderMatchingTab(o, "processing")).length },
    { id: "ready", label: "Ready", count: orders.filter((o) => isOrderMatchingTab(o, "ready")).length },
    { id: "dispatch", label: "Dispatch", count: orders.filter((o) => isOrderMatchingTab(o, "dispatch")).length },
    { id: "out_for_delivery", label: "Out for Delivery", count: orders.filter((o) => isOrderMatchingTab(o, "out_for_delivery")).length },
    { id: "delivered", label: "Delivered", count: orders.filter((o) => isOrderMatchingTab(o, "delivered")).length },
  ], [orders]);

  const displayedOrders = useMemo(() => {
    return orders.filter((order) => isOrderMatchingTab(order, activeFilterTab));
  }, [orders, activeFilterTab]);

  return (
    <div className="min-h-screen bg-[#F4F5F7] pb-28 text-zinc-900">
      {/* Top Header: Showing data for */}
      <header className="sticky top-0 z-20 bg-white px-4 pt-3.5 pb-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-wider text-zinc-400 uppercase">
              SHOWING DATA FOR
            </p>
            <div className="flex items-center gap-1.5">
              <h1 className="truncate text-base font-black tracking-tight text-zinc-900">
                {shopName}
              </h1>
              <ChevronRight className="size-4 text-zinc-400" />
            </div>
            <p className="text-xs font-semibold text-zinc-500">{locationName}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleStore}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition-colors ${
                isOnline
                  ? "border border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border border-zinc-200 bg-zinc-100 text-zinc-600"
              }`}
            >
              <span
                className={`size-2 rounded-full ${
                  isOnline ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
                }`}
              />
              <span>{isOnline ? "Online" : "Offline"}</span>
              <ChevronRight className="size-3" />
            </button>

            <button
              type="button"
              onClick={openLanguageModal}
              className="flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-900 active:scale-95 transition-all cursor-pointer hover:bg-amber-100"
              title="Change Language"
            >
              <Globe className="size-3.5 text-amber-700" />
              <span className="uppercase">{language}</span>
            </button>

            <Link
              to={partnerRoutes.notifications}
              className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 active:scale-95"
            >
              <Bell className="size-4" />
            </Link>

            <Link
              to={partnerRoutes.settings}
              className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 active:scale-95"
            >
              <Menu className="size-4" />
            </Link>
          </div>
        </div>

        {/* Canonical Order Status Filter Pills Bar */}
        <div className="no-scrollbar mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilterTab(tab.id)}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black transition-all active:scale-95 ${
                  isActive
                    ? "bg-zinc-950 text-white shadow-xs"
                    : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[9px] font-black ${
                    isActive ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1. OPERATIONAL DASHBOARD VIEW                                             */}
      {/* ========================================================================= */}
      <div className="space-y-4 px-4 pt-3">
        {/* Today So Far Card */}
        <div>
          <h2 className="text-xs font-black tracking-wider text-zinc-500 uppercase">
            Today so far
          </h2>
          <div className="mt-1.5 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-baseline gap-6">
                <div>
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    Total sales
                  </p>
                  <p className="mt-0.5 text-2xl font-black text-zinc-900">
                    ₹{todayEarnings.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    Total orders
                  </p>
                  <p className="mt-0.5 text-2xl font-black text-zinc-900">
                    {todayOrdersCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Flow Progress */}
            <div className="mt-5 grid grid-cols-4 gap-2 pt-3 border-t border-zinc-100 text-center">
              <div className="rounded-xl bg-zinc-50 p-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">New</p>
                <p className="text-sm font-black text-zinc-900">{counts.new || 0}</p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Accepted</p>
                <p className="text-sm font-black text-zinc-900">
                  {(counts.accepted || 0) + (counts.pickup_pending || 0)}
                </p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Processing</p>
                <p className="text-sm font-black text-zinc-900">
                  {(counts.washing || 0) + (counts.dry_cleaning || 0) + (counts.ironing || 0)}
                </p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Ready</p>
                <p className="text-sm font-black text-zinc-900">{counts.ready || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Queue according to selected filter */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black tracking-tight text-zinc-900">
              Orders Queue · {activeFilterTab.toUpperCase()} ({displayedOrders.length})
            </h2>
            <button
              type="button"
              onClick={() => navigate({ to: partnerRoutes.orders })}
              className="text-xs font-black text-emerald-700 hover:underline flex items-center gap-1"
            >
              View all orders <ArrowRight className="size-3.5" />
            </button>
          </div>

          <div className="mt-2.5 space-y-3">
            {displayedOrders.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 text-center shadow-sm">
                <ShoppingBag className="mx-auto size-8 text-zinc-300" />
                <p className="mt-2 text-xs font-bold text-zinc-600">No orders in "{activeFilterTab}" status</p>
                <p className="text-[10px] text-zinc-400">Incoming customer orders will appear here in real-time.</p>
              </div>
            ) : (
              displayedOrders.map((order) => {
                const stepIdx = getStageTimelineIndex(order.stage);
                const isNew = order.stage === "new";

                return (
                  <div
                    key={order.id}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest("button, a, input")) return;
                      navigate({ to: partnerRoutes.orderDetails, params: { orderId: order.id } });
                    }}
                    className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm space-y-3 transition-all hover:border-emerald-300 cursor-pointer"
                  >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="inline-block rounded-md bg-zinc-900 px-2 py-0.5 text-[10px] font-black text-white">
                              #{order.code}
                            </span>
                            {order.services && order.services.length > 0 ? (
                              <span className="truncate rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700">
                                {order.services.join(", ")}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm font-black text-zinc-900 truncate">
                            {order.customerName}
                          </p>
                          <p className="text-xs font-semibold text-zinc-500">
                            {order.itemCount} items · <span className="font-bold text-zinc-900">₹{order.amount}</span>
                            {order.pickupTime ? ` · ${order.pickupTime}` : ""}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                            isNew
                              ? "bg-amber-500/15 text-amber-800 border border-amber-500/30"
                              : order.stage === "ready"
                                ? "bg-emerald-500/15 text-emerald-800 border border-emerald-500/30"
                                : "bg-blue-500/15 text-blue-800 border border-blue-500/30"
                          }`}
                        >
                          {STAGE_LABEL[order.stage] || order.stage}
                        </span>
                      </div>

                      {/* Live Horizontal Timeline Stepper */}
                      <div className="rounded-xl bg-zinc-50/80 p-2.5 border border-zinc-100/90">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase">
                          {[
                            { key: "placed", label: "Placed" },
                            { key: "accepted", label: "Accepted" },
                            { key: "pickup", label: "Pickup" },
                            { key: "washing", label: "Cleaning" },
                            { key: "ready", label: "Ready" },
                          ].map((step, idx) => {
                            const isDone = idx <= stepIdx;
                            const isCurrent = idx === stepIdx;
                            return (
                              <div key={step.key} className="flex flex-1 flex-col items-center relative">
                                {idx > 0 && (
                                  <div
                                    className={`absolute top-2 -left-1/2 w-full h-[2px] -z-0 transition-colors ${
                                      idx <= stepIdx ? "bg-emerald-500" : "bg-zinc-200"
                                    }`}
                                  />
                                )}
                                <div
                                  className={`relative z-10 flex size-4.5 items-center justify-center rounded-full text-[9px] font-black transition-all ${
                                    isCurrent
                                      ? "bg-emerald-600 text-white ring-2 ring-emerald-600/30 shadow-xs"
                                      : isDone
                                        ? "bg-emerald-500 text-white"
                                        : "bg-zinc-200 text-zinc-400"
                                  }`}
                                >
                                  {isDone ? "✓" : idx + 1}
                                </div>
                                <span
                                  className={`mt-1 text-[9px] tracking-tight ${
                                    isCurrent
                                      ? "text-emerald-800 font-black"
                                      : isDone
                                        ? "text-zinc-700 font-bold"
                                        : "text-zinc-400 font-medium"
                                  }`}
                                >
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5 gap-2">
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="flex items-center gap-1 rounded-xl bg-zinc-50 px-2.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 active:scale-95 border border-zinc-200"
                        >
                          <Phone className="size-3.5 text-emerald-600" />
                          <span>{order.customerPhone || "Call"}</span>
                        </a>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              navigate({
                                to: partnerRoutes.orderDetails,
                                params: { orderId: order.id },
                              })
                            }
                            className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-200 active:scale-95 transition-all"
                          >
                            Details
                          </button>

                          {isNew ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAction(order, "reject")}
                                className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-600 border border-rose-200 active:scale-95"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAction(order, "accept")}
                                className="rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-black text-white shadow-xs active:scale-95"
                              >
                                Accept ✓
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedManageOrder(order)}
                              className="rounded-full bg-zinc-950 px-3.5 py-1.5 text-xs font-black text-white active:scale-95 shadow-xs flex items-center gap-1"
                            >
                              <span>Update Stage</span>
                              <ArrowRight className="size-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      {/* ========================================================================= */}
      {/* 📱 QUICK MANAGE ORDER POPUP MODAL (Opens directly on Home Page!)          */}
      {/* ========================================================================= */}
      {selectedManageOrder ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            onClick={() => setSelectedManageOrder(null)}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity"
          />
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-zinc-200 bg-white p-5 shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-zinc-100 px-2 py-0.5 text-xs font-black text-zinc-800">
                    #{selectedManageOrder.code}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-700">
                    {STAGE_LABEL[selectedManageOrder.stage] || selectedManageOrder.stage}
                  </span>
                </div>
                <h3 className="mt-1 text-base font-black text-zinc-900">
                  {selectedManageOrder.customerName}
                </h3>
                <p className="text-xs text-zinc-500 font-medium">{selectedManageOrder.customerPhone}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedManageOrder(null)}
                className="flex size-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 active:scale-95"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Booked Items Summary */}
            <div className="mt-4 rounded-2xl bg-zinc-50 p-3.5 border border-zinc-100">
              <p className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                Booked Items ({selectedManageOrder.items.length})
              </p>
              <div className="mt-2 divide-y divide-zinc-200/60 text-xs font-bold text-zinc-800">
                {selectedManageOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between py-1.5 first:pt-0 last:pb-0">
                    <span>{item.qty}× {item.name}</span>
                    <span>₹{item.qty * item.price}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 flex justify-between border-t border-dashed border-zinc-300 pt-2 text-xs font-black text-zinc-900">
                <span>Total Amount:</span>
                <span className="text-emerald-700">₹{selectedManageOrder.amount}</span>
              </div>
            </div>

            {/* Dispatch OTP Card for Ready Order */}
            {(selectedManageOrder.stage === "ready" || (selectedManageOrder as any).dispatchOtp) && (
              <div className="mt-4 rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                    🚚 Dispatch OTP for Handover
                  </span>
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black text-white">
                    Share with Rider
                  </span>
                </div>
                <div className="my-2.5 flex items-center justify-center gap-2">
                  {((selectedManageOrder as any).dispatchOtp || "").split("").map((digit: string, i: number) => (
                    <span
                      key={i}
                      className="flex size-10 items-center justify-center rounded-xl border border-emerald-300 bg-white font-mono text-xl font-black text-emerald-950 shadow-xs"
                    >
                      {digit}
                    </span>
                  ))}
                </div>
                <p className="text-center text-[10px] font-bold text-zinc-600">
                  Provide this 4-digit code to the delivery rider when handing over clean laundry bags.
                </p>
              </div>
            )}

            {/* Real Order Timeline */}
            <div className="mt-4 rounded-2xl bg-zinc-50 p-4 border border-zinc-100">
              <p className="text-[11px] font-black uppercase tracking-wider text-zinc-400 mb-3">
                Order Timeline
              </p>
              <OrderTimeline order={selectedManageOrder} />
            </div>

            {/* Stage Action Buttons */}
            <div className="mt-4 space-y-2">
              {selectedManageOrder.stage === "new" ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleAction(selectedManageOrder, "reject");
                      setSelectedManageOrder(null);
                    }}
                    className="flex-1 rounded-2xl border border-red-200 py-3 text-xs font-black text-red-600 active:scale-95"
                  >
                    Reject Order
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleAction(selectedManageOrder, "accept");
                      setSelectedManageOrder(null);
                    }}
                    className="flex-1 rounded-2xl bg-emerald-600 py-3 text-xs font-black text-white shadow-sm active:scale-95"
                  >
                    Accept Order ✓
                  </button>
                </div>
              ) : selectedManageOrder.stage === "accepted" || selectedManageOrder.stage === "pickup_pending" ? (
                <button
                  type="button"
                  onClick={() => {
                    handleAction(selectedManageOrder, "picked_up");
                    setSelectedManageOrder(null);
                  }}
                  className="w-full rounded-2xl bg-amber-500 py-3 text-xs font-black text-zinc-950 shadow-sm active:scale-95"
                >
                  Mark Clothes Picked Up & Start Wash →
                </button>
              ) : selectedManageOrder.stage === "washing" || selectedManageOrder.stage === "dry_cleaning" || selectedManageOrder.stage === "ironing" ? (
                <button
                  type="button"
                  onClick={() => {
                    handleAction(selectedManageOrder, "mark_ready");
                    setSelectedManageOrder(null);
                  }}
                  className="w-full rounded-2xl bg-emerald-600 py-3 text-xs font-black text-white shadow-sm active:scale-95"
                >
                  Mark Order Ready for Delivery ✓
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    navigate({
                      to: partnerRoutes.orderDetails,
                      params: { orderId: selectedManageOrder.id },
                    });
                    setSelectedManageOrder(null);
                  }}
                  className="w-full rounded-2xl bg-zinc-950 py-3 text-xs font-black text-white active:scale-95"
                >
                  View Full Order Details →
                </button>
              )}

              {/* Call Customer Quick Action */}
              <div className="flex gap-2 pt-1">
                <a
                  href={`tel:${selectedManageOrder.customerPhone}`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-zinc-200 bg-white py-2.5 text-xs font-bold text-zinc-800 active:scale-95"
                >
                  <PhoneCall className="size-3.5 text-emerald-600" />
                  <span>Call Customer</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigate({
                      to: partnerRoutes.orderDetails,
                      params: { orderId: selectedManageOrder.id },
                    });
                    setSelectedManageOrder(null);
                  }}
                  className="flex flex-1 items-center justify-center gap-1 rounded-2xl border border-zinc-200 bg-white py-2.5 text-xs font-bold text-zinc-800 active:scale-95"
                >
                  <span>Full Details</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Action Sheets and Overlays */}
      {sheetNode}
      {overlay}
    </div>
  );
}
