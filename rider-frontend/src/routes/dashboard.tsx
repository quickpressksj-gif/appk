import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Navigation,
  Sparkles,
  IndianRupee,
  ArrowRight,
  LogOut,
  Power,
  Clock3,
  PackageCheck,
  Star,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { QuickPressCaptainLogo } from "../components/QuickPressCaptainLogo";
import { useRiderContext } from "../context/RiderContext";
import { readSession } from "../api/core/session-store";
import { fetchRiderOrders } from "../api/rider/rider-orders-api";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Captain Cockpit — QuickPress" },
      {
        name: "description",
        content: "QuickPress Captain live duty dashboard and order dispatch radar.",
      },
    ],
  }),
  component: CaptainDashboardScreen,
});

export function CaptainDashboardScreen() {
  const navigate = useNavigate();
  const { session, isOnline, setOnline, signOut } = useRiderContext();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const captainName = session?.fullName || "Delivery Captain";
  const captainId = session?.riderId || "CP-9821";

  // Load real orders from backend
  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchRiderOrders().catch(() => []);
      const items = Array.isArray(data) ? data : (data as any)?.items || [];
      setOrders(items);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
    const interval = setInterval(() => {
      void loadOrders();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const handleToggleDuty = () => {
    // Play Web Audio chime
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(isOnline ? 440 : 880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      /* ignore */
    }

    setOnline(!isOnline);
  };

  const handleSignOut = () => {
    signOut();
    void navigate({ to: "/auth" });
  };

  return (
    <main className="relative min-h-dvh bg-white text-slate-900 flex flex-col justify-between max-w-md mx-auto selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <QuickPressCaptainLogo variant="icon-only" size="sm" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-black tracking-tight text-slate-950">
                {captainName}
              </h1>
              <p className="truncate text-[11px] font-semibold text-slate-500">
                ID: {captainId} · QuickPress Captain
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "tel:112";
                }
              }}
              className="flex h-8 items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 text-[11px] font-black text-rose-600 active:scale-95 transition-all cursor-pointer"
            >
              SOS
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-rose-600 active:scale-95 transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Cockpit Content */}
      <div className="flex-1 space-y-3.5 px-4 py-3 overflow-y-auto">
        {/* DUTY TOGGLE SWITCH (Rapido Style) */}
        <div
          onClick={handleToggleDuty}
          className={`flex items-center justify-between rounded-2xl p-4 transition-all cursor-pointer select-none shadow-xs ${
            isOnline
              ? "border-2 border-emerald-500 bg-emerald-500 text-white shadow-emerald-500/20"
              : "border border-slate-200 bg-slate-900 text-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex size-11 items-center justify-center rounded-xl font-black ${
                isOnline ? "bg-white text-emerald-700" : "bg-slate-800 text-slate-300"
              }`}
            >
              <Power className="size-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-sm font-black tracking-tight">
                {isOnline ? "YOU ARE ON DUTY" : "YOU ARE OFF DUTY"}
              </p>
              <p className="text-[11px] opacity-85 font-medium">
                {isOnline ? "Receiving nearby laundry orders" : "Tap to go online & start earning"}
              </p>
            </div>
          </div>

          <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider backdrop-blur-xs">
            {isOnline ? "ONLINE" : "OFFLINE"}
          </span>
        </div>

        {/* TODAY'S EARNINGS BAR */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Today&apos;s Earnings
              </p>
              <p className="mt-0.5 flex items-center text-3xl font-black text-slate-950">
                <IndianRupee className="size-6 text-emerald-600" strokeWidth={2.6} />
                0
              </p>
            </div>

            <button
              type="button"
              className="mt-1 flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
            >
              <span>Payouts</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="mt-3 grid grid-cols-4 divide-x divide-slate-100 text-center text-xs">
            <div className="px-1">
              <p className="text-[10px] font-bold uppercase text-slate-400">Orders</p>
              <p className="mt-0.5 text-sm font-black text-slate-900">0</p>
            </div>
            <div className="px-1">
              <p className="text-[10px] font-bold uppercase text-slate-400">Payout</p>
              <p className="mt-0.5 text-sm font-black text-emerald-700">₹0</p>
            </div>
            <div className="px-1">
              <p className="text-[10px] font-bold uppercase text-slate-400">Tips</p>
              <p className="mt-0.5 text-sm font-black text-slate-900">₹0</p>
            </div>
            <div className="px-1">
              <p className="text-[10px] font-bold uppercase text-slate-400">Hours</p>
              <p className="mt-0.5 text-sm font-black text-slate-900">0h</p>
            </div>
          </div>
        </section>

        {/* 📍 LIVE RADAR SEARCHING (When Online) */}
        {isOnline ? (
          <section className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/50 via-white to-white p-6 text-center shadow-2xs">
            {/* Concentric Radar Waves */}
            <div className="relative mx-auto my-3 flex size-28 items-center justify-center">
              <div
                className="absolute size-28 rounded-full border border-emerald-400/40 bg-emerald-400/10 animate-ping"
                style={{ animationDuration: "2.5s" }}
              />
              <div
                className="absolute size-20 rounded-full border border-emerald-400/60 bg-emerald-400/15 animate-ping"
                style={{ animationDuration: "1.8s" }}
              />
              <div className="relative flex size-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
                <Navigation className="size-5.5 animate-pulse" />
              </div>
            </div>

            <div className="mt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Radar Scanning</span>
              </span>
              <h3 className="mt-2 text-sm font-black text-slate-950">
                Searching Nearby Laundry Orders...
              </h3>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                Scanning within 5 km for pickup &amp; delivery tasks.
              </p>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-center">
            <p className="text-xs font-black text-slate-700">You Are Currently Offline</p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              Tap duty toggle above to start receiving laundry pickups.
            </p>
          </section>
        )}

        {/* Assigned Orders (if any) */}
        {orders.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Live Assigned Orders ({orders.length})
            </h2>
            {orders.map((o) => (
              <div
                key={o.id}
                className="rounded-2xl border-2 border-emerald-500 bg-white p-3.5 shadow-xs flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-black text-slate-950">
                    Order #{o.order_number || o.id}
                  </p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="size-3 text-emerald-600" />
                    <span>{o.pickup_address || "Store Pickup"}</span>
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs"
                >
                  View Details
                </button>
              </div>
            ))}
          </section>
        ) : null}

        {/* Trust & Safe Badge */}
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-black text-sm">
            ★
          </span>
          <div>
            <p className="text-xs font-black text-slate-900">5.0 Star Rated Captain</p>
            <p className="text-[11px] font-medium text-slate-500">
              100% On-Time Acceptance &amp; Safe Laundry Handling
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-3 text-center">
        <p className="text-[11px] font-medium text-slate-400">QuickPress Captain © 2024</p>
      </footer>
    </main>
  );
}
