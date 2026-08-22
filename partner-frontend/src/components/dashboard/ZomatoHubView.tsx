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
  Headphones,
  HelpCircle,
  History,
  Layers,
  Menu,
  MessageSquare,
  Package,
  Phone,
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
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { partnerRoutes } from "../../navigation/partner-routes";
import { fetchDashboardSummary, setStoreOpen } from "../../api/partner/partner-dashboard-api";
import { fetchEarnings } from "../../api/partner/partner-earnings-api";
import { fetchPartnerProfile } from "../../api/partner/partner-profile-api";
import { usePartnerOrders } from "../../context/PartnerOrdersContext";
import { useOrderActionHandler } from "../../hooks/use-order-action-handler";

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
  const { handleAction, busy } = useOrderActionHandler();

  const [activeFeedPill, setActiveFeedPill] = useState("feed");
  const [shopName, setShopName] = useState("QuickPress Laundry Store");
  const [locationName, setLocationName] = useState("Bengaluru");
  const [isOnline, setIsOnline] = useState(true);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayOrdersCount, setTodayOrdersCount] = useState(0);
  const [earningsData, setEarningsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        setLocationName(profile.city ? `${profile.city}` : "Bengaluru");
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
      toast.success(next ? "Store is now Online" : "Store is now Closed");
    } catch {
      setIsOnline(!isOnline);
      toast.error("Failed to update store status");
    }
  };

  // Find incoming new orders that need instant action
  const newIncomingOrders = orders.filter((o) => o.stage === "new");
  const activeProcessingOrders = orders.filter(
    (o) => o.stage === "accepted" || o.stage === "picked" || o.stage === "processing" || o.stage === "ready"
  );

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
              <ChevronRight className="size-4 text-zinc-400 shrink-0" />
            </div>
            <p className="text-[11px] font-medium text-zinc-500">{locationName}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleStore}
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-black text-zinc-700 active:scale-95"
            >
              <span className={`size-2 rounded-full ${isOnline ? "bg-emerald-500 animate-ping" : "bg-zinc-400"}`} />
              <span>{isOnline ? "Online" : "Offline"}</span>
              <span className="text-[10px] text-zinc-400">›</span>
            </button>

            <Link
              to={partnerRoutes.notifications}
              className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 transition-transform active:scale-95"
            >
              <Bell className="size-4" />
            </Link>

            <Link
              to={partnerRoutes.profile}
              className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-800"
            >
              <Menu className="size-5" />
            </Link>
          </div>
        </div>

        {/* Real Filter Carousel */}
        <div className="no-scrollbar -mx-4 mt-3 flex items-center gap-2 overflow-x-auto px-4 pb-1">
          {FEED_PILLS.map((pill) => {
            const isActive = activeFeedPill === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setActiveFeedPill(pill.id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-black transition-all active:scale-95 ${
                  isActive
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1. MY FEED FILTER VIEW (Default Operational Flow)                          */}
      {/* ========================================================================= */}
      {activeFeedPill === "feed" && (
        <div className="space-y-4 px-4 pt-3">
          {/* 🚨 REAL LIVE ORDER ALERT BANNER (If new incoming orders exist) */}
          {newIncomingOrders.length > 0 ? (
            <div className="animate-bounce-subtle rounded-2xl border-2 border-amber-500 bg-amber-500/10 p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-amber-500 text-zinc-950 font-black animate-pulse">
                    <Volume2 className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-black uppercase text-amber-900 tracking-wider">
                      🚨 New Order Received! ({newIncomingOrders.length})
                    </h3>
                    <p className="text-[11px] font-bold text-zinc-800">
                      Order #{newIncomingOrders[0].code} · {newIncomingOrders[0].customerName}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-black text-zinc-950">₹{newIncomingOrders[0].amount}</span>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-amber-300/60 pt-2.5">
                <span className="text-[11px] font-semibold text-zinc-600">
                  {newIncomingOrders[0].items.length} items booked
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAction(newIncomingOrders[0], "reject")}
                    className="rounded-full bg-white px-3 py-1 text-xs font-black text-red-600 border border-red-200 active:scale-95"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(newIncomingOrders[0], "accept")}
                    className="rounded-full bg-emerald-600 px-4 py-1 text-xs font-black text-white shadow-sm active:scale-95"
                  >
                    Accept Order ✓
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Today so far Card */}
          <div>
            <h2 className="text-base font-black tracking-tight text-zinc-900">Today so far</h2>
            <div className="mt-2 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      Total sales
                    </p>
                    <p className="mt-0.5 text-2xl font-black text-zinc-900">
                      ₹{todayEarnings > 0 ? todayEarnings.toLocaleString("en-IN") : "0"}
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

                <button
                  type="button"
                  onClick={handleToggleStore}
                  className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 border border-emerald-200 text-xs font-black text-emerald-700 active:scale-95"
                >
                  <span className={`size-2 rounded-full ${isOnline ? "bg-emerald-500 animate-ping" : "bg-zinc-400"}`} />
                  <span>{isOnline ? "● Live" : "Closed"}</span>
                </button>
              </div>

              {/* Order Flow Progress */}
              <div className="mt-5 grid grid-cols-4 gap-2 pt-3 border-t border-zinc-100 text-center">
                <div className="rounded-xl bg-zinc-50 p-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">New</p>
                  <p className="text-sm font-black text-zinc-900">{counts.new || 0}</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Accepted</p>
                  <p className="text-sm font-black text-zinc-900">{counts.accepted || 0}</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Wash/Prep</p>
                  <p className="text-sm font-black text-zinc-900">{counts.processing || 0}</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Ready</p>
                  <p className="text-sm font-black text-zinc-900">{counts.ready || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Orders Queue (Real Operational Queue) */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black tracking-tight text-zinc-900">
                Active Order Queue ({activeProcessingOrders.length})
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
              {activeProcessingOrders.length === 0 ? (
                <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 text-center shadow-sm">
                  <ShoppingBag className="mx-auto size-8 text-zinc-300" />
                  <p className="mt-2 text-xs font-bold text-zinc-600">No processing orders right now</p>
                  <p className="text-[10px] text-zinc-400">New customer bookings will appear here instantly.</p>
                </div>
              ) : (
                activeProcessingOrders.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-block rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-black text-zinc-800">
                          #{order.code}
                        </span>
                        <p className="mt-1 text-sm font-black text-zinc-900">{order.customerName}</p>
                        <p className="text-xs text-zinc-500">
                          {order.items.length} items · ₹{order.amount}
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-800">
                        {order.stage}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5">
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="flex items-center gap-1 text-xs font-bold text-zinc-600"
                      >
                        <Phone className="size-3.5" />
                        <span>{order.customerPhone}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          navigate({
                            to: partnerRoutes.orderDetails,
                            params: { orderId: order.id },
                          })
                        }
                        className="rounded-full bg-zinc-950 px-3.5 py-1 text-xs font-black text-white active:scale-95"
                      >
                        Manage Order →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SALES FILTER VIEW                                                      */}
      {/* ========================================================================= */}
      {activeFeedPill === "sales" && (
        <div className="space-y-4 px-4 pt-3">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500">
              Gross Sales Performance
            </h3>
            <p className="mt-1 text-3xl font-black text-zinc-900">
              ₹{earningsData ? earningsData.week.toLocaleString("en-IN") : "0"}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-emerald-700">
              Avg Order Value: ₹{earningsData?.avgOrderValue || 0}
            </p>

            {/* Daily Trend Bars */}
            <div className="mt-5 flex h-36 items-end justify-between gap-2 border-b border-zinc-100 pb-2">
              {(earningsData?.trend || []).map((t: any) => (
                <div key={t.label} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[9px] font-bold text-zinc-600">₹{t.amount}</span>
                  <div
                    style={{ height: `${Math.max(15, Math.min(100, (t.amount / 500) * 100))}%` }}
                    className="w-full max-w-[28px] rounded-t-lg bg-amber-400"
                  />
                  <span className="text-[9px] font-bold uppercase text-zinc-400">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FUNNEL FILTER VIEW                                                     */}
      {/* ========================================================================= */}
      {activeFeedPill === "funnel" && (
        <div className="space-y-4 px-4 pt-3">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500">
              Order Fulfillment Funnel
            </h3>
            <div className="mt-4 space-y-3.5">
              <div>
                <div className="flex justify-between text-xs font-bold">
                  <span>Orders Received</span>
                  <span>100% ({orders.length})</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-zinc-100">
                  <div className="h-full rounded-full bg-blue-500 w-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold">
                  <span>Accepted & Washed</span>
                  <span>95%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-zinc-100">
                  <div className="h-full rounded-full bg-amber-500 w-[95%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold">
                  <span>Delivered On-Time</span>
                  <span>98.5%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-zinc-100">
                  <div className="h-full rounded-full bg-emerald-500 w-[98.5%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SERVICE QUALITY FILTER VIEW                                            */}
      {/* ========================================================================= */}
      {activeFeedPill === "quality" && (
        <div className="space-y-4 px-4 pt-3">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500">
              Customer Experience & Quality
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-amber-50 p-3 text-center border border-amber-100">
                <Star className="mx-auto size-5 text-amber-500 fill-current" />
                <p className="mt-1 text-lg font-black text-zinc-900">4.9 / 5.0</p>
                <p className="text-[10px] font-bold text-zinc-500">Customer Rating</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 text-center border border-emerald-100">
                <CheckCircle2 className="mx-auto size-5 text-emerald-600" />
                <p className="mt-1 text-lg font-black text-zinc-900">98.5%</p>
                <p className="text-[10px] font-bold text-zinc-500">On-time Dispatch</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. OPERATIONS FILTER VIEW                                                 */}
      {/* ========================================================================= */}
      {activeFeedPill === "operations" && (
        <div className="space-y-4 px-4 pt-3">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500">
              Operational Configuration
            </h3>
            <div className="mt-3 divide-y divide-zinc-100 text-xs">
              <div className="flex justify-between py-2.5">
                <span className="text-zinc-500">Working Hours:</span>
                <span className="font-bold text-zinc-900">08:00 AM - 09:00 PM</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-zinc-500">Pickup Radius:</span>
                <span className="font-bold text-zinc-900">8.0 KM</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-zinc-500">Auto Accept Orders:</span>
                <span className="font-bold text-emerald-600">Enabled ✓</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
