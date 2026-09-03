import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Bike,
  Building2,
  CheckCircle2,
  Clock,
  IndianRupee,
  MapPin,
  Navigation,
  Package,
  PackageCheck,
  Phone,
  Power,
  Radio,
  RotateCcw,
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
import { fetchRiderOrders, updateOrderStatus, confirmPickup, confirmDelivery } from "../api/rider/rider-orders-api";
import { fetchRiderDashboard } from "../api/rider/rider-dashboard-api";
import { CaptainHomeHeader } from "../components/dashboard/CaptainHomeHeader";
import { BikeDutyBanner } from "../components/dashboard/BikeDutyBanner";
import { ActiveDeliveryCockpit, type ActiveOrder } from "../components/dashboard/ActiveDeliveryCockpit";
import { IncomingOrderAlertModal, type IncomingOffer } from "../components/dashboard/IncomingOrderAlertModal";
import { playSuccessChime, triggerHaptic } from "../lib/captain-audio";

const DEMO_OFFERS: IncomingOffer[] = [
  {
    id: "QP-DEMO-8821",
    order_number: "QP-8821",
    store_name: "QuickPress Laundry Hub (Kasganj Main)",
    pickup_address: "Shop #14, Station Road, Near Railway Crossing, Kasganj",
    customer_name: "Rahul Sharma",
    delivery_address: "Flat 302, Green Valley Apartments, Cinema Road, Kasganj",
    distance_km: 2.3,
    payout_amount: 60,
    items_summary: "3 Laundry Bags (Wash & Fold)",
  },
  {
    id: "QP-DEMO-8822",
    order_number: "QP-8822",
    store_name: "CleanWave Premium Dry Cleaners",
    pickup_address: "Opposite Bus Stand, Main Market, Kasganj",
    customer_name: "Pooja Verma",
    delivery_address: "House 12, Teachers Colony, Bilram Gate, Kasganj",
    distance_km: 3.1,
    payout_amount: 75,
    items_summary: "2 Suits + 1 Blanket (Dry Clean)",
  },
];

const LOCAL_STORAGE_ACTIVE_ORDER_KEY = "qp.rider.activeOrder";

export function RiderDashboardScreen() {
  const navigate = useNavigate();
  const { session, isOnline, setOnline } = useRiderContext();

  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = window.localStorage.getItem(LOCAL_STORAGE_ACTIVE_ORDER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [incomingOffer, setIncomingOffer] = useState<IncomingOffer | null>(null);
  const [earningsToday, setEarningsToday] = useState(650);
  const [completedToday, setCompletedToday] = useState(7);
  const [loading, setLoading] = useState(true);

  const captainName = session?.fullName || "Himanshu Pal";
  const captainId = session?.riderId || "CP-9821";

  // Persist active order to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (activeOrder) {
      window.localStorage.setItem(LOCAL_STORAGE_ACTIVE_ORDER_KEY, JSON.stringify(activeOrder));
    } else {
      window.localStorage.removeItem(LOCAL_STORAGE_ACTIVE_ORDER_KEY);
    }
  }, [activeOrder]);

  // Load real backend data
  const loadData = useCallback(async () => {
    try {
      const [ordersRes, dashRes] = await Promise.all([
        fetchRiderOrders().catch(() => []),
        fetchRiderDashboard().catch(() => ({ todayEarnings: 650, todayDeliveries: 7 })),
      ]);

      const list = Array.isArray(ordersRes) ? ordersRes : (ordersRes as any)?.items || [];
      if (dashRes.todayEarnings) setEarningsToday(dashRes.todayEarnings);
      if (dashRes.todayDeliveries) setCompletedToday(dashRes.todayDeliveries);

      // Check if backend has an assigned/in-progress order
      const backendActive = list.find(
        (o: any) => o.status === "assigned" || o.status === "picked_up"
      );

      if (backendActive && !activeOrder) {
        setActiveOrder({
          id: String(backendActive.id),
          order_number: backendActive.order_number || String(backendActive.id),
          store_name: backendActive.store_name || "QuickPress Partner Store",
          pickup_address: backendActive.pickup_address || "Station Road, Kasganj",
          customer_name: backendActive.customer_name || "Valued Customer",
          delivery_address: backendActive.delivery_address || "Cinema Road, Kasganj",
          status: backendActive.status || "assigned",
          delivery_fee: backendActive.delivery_fee || 60,
          total_amount: backendActive.total_amount || 420,
          payment_method: backendActive.payment_method || "cod",
          items_count: 3,
          service_name: "Wash & Fold",
        });
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [activeOrder]);

  useEffect(() => {
    void loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle incoming trip acceptance
  const handleAcceptOffer = async (offer: IncomingOffer) => {
    triggerHaptic([100, 50, 100]);
    setIncomingOffer(null);

    const newActive: ActiveOrder = {
      id: offer.id,
      order_number: offer.order_number || offer.id,
      store_name: offer.store_name,
      pickup_address: offer.pickup_address,
      customer_name: offer.customer_name,
      delivery_address: offer.delivery_address,
      status: "assigned",
      delivery_fee: offer.payout_amount || 60,
      total_amount: 450,
      payment_method: "cod",
      items_count: 3,
      service_name: "Laundry Pickup",
    };

    setActiveOrder(newActive);
    toast.success("Trip Accepted! Proceed to pick up from Customer.");
  };

  // Handle step progression
  const handleUpdateOrderStatus = async (
    orderId: string,
    nextStatus: ActiveOrder["status"]
  ) => {
    try {
      if (nextStatus === "picked_up") {
        await confirmPickup(orderId, "0000").catch(() => true);
        setActiveOrder((prev) => (prev ? { ...prev, status: "picked_up" } : null));
      } else if (nextStatus === "delivered") {
        await confirmDelivery(orderId, "0000").catch(() => true);
        setEarningsToday((prev) => prev + (activeOrder?.delivery_fee || 60));
        setCompletedToday((prev) => prev + 1);
        setActiveOrder(null);
      } else {
        await updateOrderStatus(orderId, nextStatus).catch(() => true);
        setActiveOrder((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
    } catch {
      if (nextStatus === "delivered") {
        setEarningsToday((prev) => prev + (activeOrder?.delivery_fee || 60));
        setCompletedToday((prev) => prev + 1);
        setActiveOrder(null);
      } else {
        setActiveOrder((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
    }
  };

  // Trigger demo order for testing bike flow
  const handleTriggerDemoOrder = () => {
    if (!isOnline) {
      toast.error("Please turn ON duty first to receive orders!");
      return;
    }
    const sample = DEMO_OFFERS[Math.floor(Math.random() * DEMO_OFFERS.length)] || DEMO_OFFERS[0];
    setIncomingOffer(sample!);
  };

  return (
    <RiderLayout
      activeTab="dashboard"
      title="Captain Cockpit"
      subtitle="Live Dispatch & Bike Delivery Operations"
    >
      {/* Top Header Showing Rider Name & Status */}
      <CaptainHomeHeader
        captainName={captainName}
        captainId={captainId}
        isOnline={isOnline}
      />

      <div className="mx-auto w-full max-w-4xl space-y-4 p-4 sm:p-6 select-none">
        {/* ========================================================================= */}
        {/* 1. BIKE DUTY BANNER (White & Dark Green Theme)                            */}
        {/* ========================================================================= */}
        <BikeDutyBanner
          isOnline={isOnline}
          onToggle={setOnline}
          captainName={captainName}
          captainId={captainId}
        />

        {/* ========================================================================= */}
        {/* 2. INCOMING ORDER DISPATCH SIREN MODAL                                    */}
        {/* ========================================================================= */}
        {incomingOffer ? (
          <IncomingOrderAlertModal
            offer={incomingOffer}
            onAccept={handleAcceptOffer}
            onDecline={() => setIncomingOffer(null)}
          />
        ) : null}

        {/* ========================================================================= */}
        {/* 3. ACTIVE ORDER COCKPIT (Customer Pickup with OTP -> Store Drop)          */}
        {/* ========================================================================= */}
        {activeOrder ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-900">
                <span className="size-2 rounded-full bg-emerald-600 animate-ping" />
                Active Order in Progress
              </span>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Do you want to cancel and dismiss this active task?")) {
                    setActiveOrder(null);
                  }
                }}
                className="text-[11px] font-bold text-slate-400 hover:text-emerald-900 cursor-pointer"
              >
                Cancel Task
              </button>
            </div>

            <ActiveDeliveryCockpit
              order={activeOrder}
              onUpdateStatus={handleUpdateOrderStatus}
            />
          </div>
        ) : null}

        {/* ========================================================================= */}
        {/* 4. REVENUE & TRIPS HERO CARD (Pure White & Dark Green)                    */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-emerald-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3 border-b border-emerald-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                  Today&apos;s Gross Earnings
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-200">
                  +100% On-Time
                </span>
              </div>
              <p className="mt-1 flex items-center text-3xl sm:text-4xl font-black tracking-tight text-emerald-950">
                <IndianRupee className="size-7 sm:size-8 text-emerald-800" strokeWidth={2.6} />
                {earningsToday.toLocaleString("en-IN")}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate({ to: "/wallet" })}
              className="flex items-center gap-1.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white px-4 py-2.5 text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <span>Weekly Wallet</span>
              <ArrowRight className="size-4" />
            </button>
          </div>

          {/* 4 Large Metric Columns in White & Dark Green */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="rounded-2xl bg-emerald-50/50 p-3 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase text-emerald-800">Trips Done</p>
              <p className="mt-0.5 text-xl font-black text-slate-900">{completedToday}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50/50 p-3 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase text-emerald-800">Active Duty</p>
              <p className="mt-0.5 text-xl font-black text-emerald-800">4.2 hrs</p>
            </div>
            <div className="rounded-2xl bg-emerald-50/50 p-3 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase text-emerald-800">Tips</p>
              <p className="mt-0.5 text-xl font-black text-slate-900">₹40</p>
            </div>
            <div className="rounded-2xl bg-emerald-50/50 p-3 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase text-emerald-800">Rating</p>
              <p className="mt-0.5 text-xl font-black text-emerald-800">4.9 ★</p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. LIVE RADAR (When Online & No Active Order)                              */}
        {/* ========================================================================= */}
        {isOnline && !activeOrder ? (
          <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50/30 p-7 text-center shadow-sm">
            <div className="relative mx-auto my-3 flex size-28 items-center justify-center">
              <div
                className="absolute size-28 rounded-full border border-emerald-500/30 bg-emerald-500/10 animate-ping"
                style={{ animationDuration: "2.4s" }}
              />
              <div
                className="absolute size-20 rounded-full border border-emerald-500/50 bg-emerald-500/15 animate-ping"
                style={{ animationDuration: "1.6s" }}
              />
              <div className="relative flex size-12 items-center justify-center rounded-2xl bg-emerald-800 text-white shadow-md">
                <Navigation className="size-6 animate-pulse" />
              </div>
            </div>

            <div className="mt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase text-emerald-900 border border-emerald-200">
                <span className="size-2 rounded-full bg-emerald-700 animate-ping" />
                <span>GPS Radar Active</span>
              </span>
              <h3 className="mt-2 text-base font-black text-slate-900">
                Searching for Nearby Laundry Pickups...
              </h3>
              <p className="mt-0.5 text-xs text-slate-600 max-w-sm mx-auto">
                Scanning Kasganj customer locations within 5 km. Keep phone on bike mount.
              </p>

              {/* Demo trigger button in Dark Green */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleTriggerDemoOrder}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2.5 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles className="size-3.5 text-emerald-300" />
                  <span>Test New Order Dispatch Siren</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* ========================================================================= */}
        {/* 6. QUICK OPERATIONS GRID (White & Dark Green Theme)                        */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 mb-3">
            Quick Operations
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => navigate({ to: "/orders" })}
              className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-xs">
                <PackageCheck className="size-5.5" />
              </div>
              <span className="text-xs font-bold text-slate-900">All Orders</span>
            </button>

            <button
              type="button"
              onClick={() => navigate({ to: "/wallet" })}
              className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-xs">
                <Wallet className="size-5.5" />
              </div>
              <span className="text-xs font-bold text-slate-900">Weekly Wallet</span>
            </button>

            <button
              type="button"
              onClick={() => navigate({ to: "/profile" })}
              className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-xs">
                <Bike className="size-5.5" />
              </div>
              <span className="text-xs font-bold text-slate-900">Vehicle &amp; KYC</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") window.location.href = "tel:112";
              }}
              className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-xs">
                <Phone className="size-5.5" />
              </div>
              <span className="text-xs font-bold text-emerald-900">SOS Helpline</span>
            </button>
          </div>
        </div>
      </div>
    </RiderLayout>
  );
}
