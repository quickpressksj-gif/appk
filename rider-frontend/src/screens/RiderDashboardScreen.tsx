import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Bike,
  CheckCircle2,
  Clock3,
  IndianRupee,
  MapPin,
  Navigation,
  PackageCheck,
  Phone,
  Power,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { RiderLayout } from "../components/layout/RiderLayout";
import { useRiderContext } from "../context/RiderContext";
import { fetchRiderOrders } from "../api/rider/rider-orders-api";
import { fetchRiderDashboard } from "../api/rider/rider-dashboard-api";

export function RiderDashboardScreen() {
  const navigate = useNavigate();
  const { session, isOnline, setOnline } = useRiderContext();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [earningsToday, setEarningsToday] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);

  const captainName = session?.fullName || "Delivery Captain";
  const captainId = session?.riderId || "CP-9821";
  const initials = captainName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "CP";

  const loadData = useCallback(async () => {
    try {
      const [ordersRes, dashRes] = await Promise.all([
        fetchRiderOrders().catch(() => []),
        fetchRiderDashboard().catch(() => ({ todayEarnings: 0, todayDeliveries: 0 })),
      ]);
      const list = Array.isArray(ordersRes) ? ordersRes : (ordersRes as any)?.items || [];
      setOrders(list);
      setEarningsToday(dashRes.todayEarnings || 0);
      setCompletedToday(dashRes.todayDeliveries || list.filter((o: any) => o.status === "delivered").length);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    const interval = setInterval(() => {
      void loadData();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const activeOrders = orders.filter(
    (o) => o.status === "assigned" || o.status === "picked_up" || o.status === "out_for_delivery"
  );

  return (
    <RiderLayout
      activeTab="dashboard"
      title="Captain Cockpit"
      subtitle="Live Dispatch Radar & Order Operations"
    >
      <div className="mx-auto w-full max-w-4xl space-y-4 p-4 sm:p-6 select-none">
        {/* ========================================================================= */}
        {/* 1. HERO CAPTAIN IDENTITY CARD (Partner WelcomeCard Style)                  */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm">
          {/* Subtle brand ambient glow */}
          <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-emerald-500/10 blur-2xl" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {/* Captain Avatar */}
              <div className="flex size-14 sm:size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-black text-xl shadow-md">
                {initials}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800 border border-amber-200/80">
                    Active Captain
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                    <ShieldCheck className="size-3.5" />
                    Verified
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 mt-1">
                  {captainName}
                </h2>
                <p className="text-xs font-semibold text-slate-500">
                  ID: {captainId} · QuickPress Logistics Fleet
                </p>
              </div>
            </div>

            {/* Live Duty Toggle Button */}
            <button
              type="button"
              onClick={() => {
                const next = !isOnline;
                setOnline(next);
                toast.success(next ? "You are now ON DUTY. Radar active!" : "You are now OFF DUTY.");
              }}
              className={`flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95 ${
                isOnline
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-slate-900 text-white hover:bg-black"
              }`}
            >
              <Power className="size-4 stroke-[2.5]" />
              <span>{isOnline ? "ON DUTY (LIVE)" : "OFF DUTY"}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. REVENUE & EARNINGS HERO CARD (Partner RevenueCard Style)                */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Today&apos;s Gross Earnings
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-200">
                  +100% On-Time
                </span>
              </div>
              <p className="mt-1 flex items-center text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
                <IndianRupee className="size-7 sm:size-8 text-emerald-600" strokeWidth={2.6} />
                {earningsToday.toLocaleString("en-IN")}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate({ to: "/wallet" })}
              className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2.5 text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <span>Payouts &amp; Bank</span>
              <ArrowRight className="size-4" />
            </button>
          </div>

          {/* 4 Stat Columns */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="rounded-2xl bg-slate-50/80 p-3 border border-slate-100">
              <p className="text-[10px] font-bold uppercase text-slate-400">Completed Trips</p>
              <p className="mt-0.5 text-lg font-black text-slate-900">{completedToday}</p>
            </div>
            <div className="rounded-2xl bg-slate-50/80 p-3 border border-slate-100">
              <p className="text-[10px] font-bold uppercase text-slate-400">Active Tasks</p>
              <p className="mt-0.5 text-lg font-black text-emerald-700">{activeOrders.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50/80 p-3 border border-slate-100">
              <p className="text-[10px] font-bold uppercase text-slate-400">Tips Received</p>
              <p className="mt-0.5 text-lg font-black text-slate-900">₹0</p>
            </div>
            <div className="rounded-2xl bg-slate-50/80 p-3 border border-slate-100">
              <p className="text-[10px] font-bold uppercase text-slate-400">Rating</p>
              <p className="mt-0.5 text-lg font-black text-amber-600">5.0 ★</p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. LIVE RADAR DISPATCH COCKPIT (When Online & No Active Order)             */}
        {/* ========================================================================= */}
        {isOnline && activeOrders.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/50 via-white to-white p-8 text-center shadow-sm">
            {/* Concentric Pulsing Radar Rings */}
            <div className="relative mx-auto my-3 flex size-32 items-center justify-center">
              <div
                className="absolute size-32 rounded-full border border-emerald-400/30 bg-emerald-400/10 animate-ping"
                style={{ animationDuration: "2.6s" }}
              />
              <div
                className="absolute size-24 rounded-full border border-emerald-400/50 bg-emerald-400/15 animate-ping"
                style={{ animationDuration: "1.8s" }}
              />
              <div className="relative flex size-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
                <Navigation className="size-7 animate-pulse" />
              </div>
            </div>

            <div className="mt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-800">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Radar Active</span>
              </span>
              <h3 className="mt-2 text-base sm:text-lg font-black text-slate-950">
                Searching For Nearby Laundry Pickups...
              </h3>
              <p className="mt-0.5 text-xs font-medium text-slate-500 max-w-sm mx-auto">
                Scanning Kasganj &amp; surrounding area (5 km). Orders will appear here with instant audio siren.
              </p>
            </div>
          </div>
        ) : null}

        {/* Offline Warning Card */}
        {!isOnline && activeOrders.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xs">
            <p className="text-sm font-black text-slate-900">You Are Currently Offline</p>
            <p className="text-xs font-medium text-slate-500 mt-1 max-w-sm mx-auto">
              Switch duty ON to start receiving pickup tasks from local laundry stores.
            </p>
            <button
              type="button"
              onClick={() => setOnline(true)}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
            >
              <Power className="size-3.5" />
              <span>Go Online Now</span>
            </button>
          </div>
        ) : null}

        {/* ========================================================================= */}
        {/* 4. ACTIVE ASSIGNED ORDERS QUEUE                                            */}
        {/* ========================================================================= */}
        {activeOrders.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Active Orders In Progress ({activeOrders.length})
              </h3>
            </div>

            <div className="space-y-3">
              {activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="overflow-hidden rounded-3xl border-2 border-emerald-500 bg-white p-5 shadow-md"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-900">
                      <Sparkles className="size-3 text-emerald-600" />
                      Active Trip
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      #{order.order_number || order.id}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="size-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Pickup</p>
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {order.pickup_address || "Store Outlet"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <MapPin className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Drop</p>
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {order.delivery_address || order.customer_name || "Customer Destination"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/orders" })}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-700 cursor-pointer"
                    >
                      Open Task Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* ========================================================================= */}
        {/* 5. QUICK ACTIONS TILES (Partner QuickActionsGrid Style)                    */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
            Quick Hub Operations
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => navigate({ to: "/orders" })}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
                <PackageCheck className="size-5" />
              </div>
              <span className="text-xs font-bold text-slate-800">Assigned Orders</span>
            </button>

            <button
              type="button"
              onClick={() => navigate({ to: "/wallet" })}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
                <Wallet className="size-5" />
              </div>
              <span className="text-xs font-bold text-slate-800">Weekly Payouts</span>
            </button>

            <button
              type="button"
              onClick={() => navigate({ to: "/profile" })}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
                <Bike className="size-5" />
              </div>
              <span className="text-xs font-bold text-slate-800">Vehicle &amp; KYC</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") window.location.href = "tel:112";
              }}
              className="flex flex-col items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50/80 p-3.5 hover:bg-rose-100 active:scale-95 transition-all cursor-pointer"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
                <Phone className="size-5" />
              </div>
              <span className="text-xs font-bold text-rose-700">SOS Helpline</span>
            </button>
          </div>
        </div>
      </div>
    </RiderLayout>
  );
}
