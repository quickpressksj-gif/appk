import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  ChefHat,
  ChevronRight,
  ClipboardList,
  DollarSign,
  FileSpreadsheet,
  Headphones,
  HelpCircle,
  History,
  Info,
  Layers,
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
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { partnerRoutes } from "../../navigation/partner-routes";
import { fetchDashboardSummary, setStoreOpen } from "../../api/partner/partner-dashboard-api";
import { fetchEarnings } from "../../api/partner/partner-earnings-api";
import { fetchPartnerProfile } from "../../api/partner/partner-profile-api";
import { usePartnerOrders } from "../../context/PartnerOrdersContext";

const FEED_PILLS = [
  { id: "feed", label: "My Feed" },
  { id: "sales", label: "Sales" },
  { id: "funnel", label: "Funnel" },
  { id: "quality", label: "Service quality" },
  { id: "operations", label: "Operations" },
];

export function ZomatoHubView() {
  const navigate = useNavigate();
  const { orders } = usePartnerOrders();
  const [activeFeedPill, setActiveFeedPill] = useState("feed");
  const [shopName, setShopName] = useState("QuickPress Laundry Store");
  const [locationName, setLocationName] = useState("Bengaluru");
  const [isOnline, setIsOnline] = useState(true);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayOrdersCount, setTodayOrdersCount] = useState(0);
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
        setLocationName(profile.city ? `${profile.city}` : "Store Location");
      }
      if (summary) {
        setIsOnline(summary.isStoreOpen);
        setTodayOrdersCount(summary.newOrders + summary.inProcess + summary.readyForDelivery + summary.completedToday);
        setTodayEarnings(summary.todayEarnings);
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

  const activeOrdersCount = orders.filter(
    (o) => o.stage !== "completed" && o.stage !== "cancelled"
  ).length;

  return (
    <div className="min-h-screen bg-[#F4F5F7] pb-28 text-zinc-900">
      {/* Top Header: Showing data for */}
      <header className="sticky top-0 z-20 bg-white px-4 pt-3 pb-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
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

          <div className="flex items-center gap-2">
            <Link
              to={partnerRoutes.notifications}
              className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 transition-transform active:scale-95"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </Link>

            <div className="flex size-9 items-center justify-center rounded-full bg-blue-600 text-white font-black text-xs shadow-sm">
              <Sparkles className="size-4 fill-current" />
            </div>

            <Link
              to={partnerRoutes.profile}
              className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-800"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Feed Horizontal Scrollable Pills */}
        <div className="no-scrollbar -mx-4 mt-3 flex items-center gap-2 overflow-x-auto px-4 pb-1">
          {FEED_PILLS.map((pill) => {
            const isActive = activeFeedPill === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setActiveFeedPill(pill.id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all active:scale-95 ${
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

      <div className="space-y-4 px-4 pt-3">
        {/* Banner Carousel Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-100 via-amber-50 to-orange-100 p-4 border border-amber-200/70 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="inline-block rounded bg-amber-600/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-800">
                Partner Insights
              </span>
              <h3 className="mt-1 text-sm font-black tracking-tight text-zinc-900 leading-snug">
                WHY TOP BRANDS SWITCHED THEIR PACKAGING & TIMING
              </h3>
              <p className="mt-0.5 text-[10px] font-semibold text-zinc-600">
                Watch laundry experts table ft. QuickPress
              </p>
              <button
                type="button"
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-zinc-950 px-3.5 py-1 text-[11px] font-black text-white shadow-sm active:scale-95"
              >
                <Play className="size-3 fill-current" />
                <span>Watch now</span>
              </button>
            </div>
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-amber-200/60 text-amber-700 font-bold">
              🧺
            </div>
          </div>
        </div>

        {/* Today so far Card */}
        <div>
          <h2 className="text-base font-black tracking-tight text-zinc-900">Today so far</h2>
          <div className="mt-2 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[11px] font-bold text-zinc-500">Total sales</p>
                  <p className="mt-0.5 text-xl font-black text-zinc-900">
                    ₹{todayEarnings > 0 ? todayEarnings.toLocaleString("en-IN") : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-zinc-500">Total orders</p>
                  <p className="mt-0.5 text-xl font-black text-zinc-900">
                    {todayOrdersCount > 0 ? todayOrdersCount : "-"}
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

            {/* Timeline message */}
            <div className="mt-6 text-center">
              <p className="text-xs font-semibold text-zinc-500">
                {activeOrdersCount > 0
                  ? `${activeOrdersCount} live order${activeOrdersCount === 1 ? "" : "s"} currently in progress`
                  : "Orders will be coming your way soon"}
              </p>
            </div>

            {/* 24-Hour Timeline Scale */}
            <div className="mt-6 pt-3 border-t border-zinc-100">
              <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400">
                <span>12am</span>
                <span>4am</span>
                <span>8am</span>
                <span>12pm</span>
                <span>4pm</span>
                <span>8pm</span>
              </div>
              <div className="mt-1 h-1 w-full rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(10, activeOrdersCount * 25))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick links Grid */}
        <div>
          <h2 className="text-base font-black tracking-tight text-zinc-900">Quick links</h2>
          <div className="mt-2.5 grid grid-cols-4 gap-2.5">
            {[
              {
                id: "manager",
                label: "QuickPress manager",
                icon: Store,
                to: partnerRoutes.shop,
              },
              {
                id: "orders",
                label: "Order history",
                icon: History,
                to: partnerRoutes.orders,
              },
              {
                id: "chat",
                label: "Chat with us",
                icon: MessageSquare,
                to: partnerRoutes.help,
              },
              {
                id: "complaints",
                label: "Complaints",
                icon: Headphones,
                to: partnerRoutes.help,
              },
              {
                id: "reviews",
                label: "Customer reviews",
                icon: Star,
                to: partnerRoutes.customers,
              },
              {
                id: "services",
                label: "Rate card & menu",
                icon: Layers,
                to: partnerRoutes.services,
              },
              {
                id: "payouts",
                label: "Payouts & banks",
                icon: Wallet,
                to: partnerRoutes.earnings,
              },
              {
                id: "settings",
                label: "Store settings",
                icon: Settings,
                to: partnerRoutes.settings,
              },
            ].map((link) => (
              <Link
                key={link.id}
                to={link.to}
                className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200/70 bg-white p-3 text-center shadow-xs transition-all active:scale-95"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-50 text-zinc-900">
                  <link.icon className="size-5" />
                </div>
                <p className="mt-2 text-[10px] font-extrabold leading-tight text-zinc-800 line-clamp-2">
                  {link.label}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Operational Highlights */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500">
              Live Operations
            </h3>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              Optimal
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 divide-x divide-zinc-100">
            <div className="pr-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">On-time pickup</p>
              <p className="mt-0.5 text-base font-black text-zinc-900">98.5%</p>
            </div>
            <div className="pl-3">
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Customer rating</p>
              <p className="mt-0.5 text-base font-black text-zinc-900">★ 4.9 / 5.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
