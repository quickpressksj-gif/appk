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
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { RiderLayout } from "../components/layout/RiderLayout";
import { useRiderContext } from "../context/RiderContext";
import {
  fetchRiderOrders,
  fetchRiderOffers,
  acceptRiderOrder,
  rejectRiderOrder,
  updateOrderStatus,
  confirmPickup,
  confirmDelivery,
  confirmDropAtPartner,
} from "../api/rider/rider-orders-api";
import {
  fetchRiderDashboard,
  updateRiderStatus,
  pushRiderLocation,
} from "../api/rider/rider-dashboard-api";
import { fetchRiderProfile } from "../api/rider/rider-profile-api";
import { CaptainHomeHeader } from "../components/dashboard/CaptainHomeHeader";
import { BikeDutyBanner } from "../components/dashboard/BikeDutyBanner";
import { ActiveDeliveryCockpit, type ActiveOrder } from "../components/dashboard/ActiveDeliveryCockpit";
import { IncomingOrderAlertModal, type IncomingOffer } from "../components/dashboard/IncomingOrderAlertModal";
import { playSuccessChime, triggerHaptic } from "../lib/captain-audio";
import { LiveDeliveryMap } from "../components/map/LiveDeliveryMap";

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
  const [earningsToday, setEarningsToday] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [captainRating, setCaptainRating] = useState(5.0);
  const [captainName, setCaptainName] = useState(session?.fullName || "Delivery Captain");
  const [captainId, setCaptainId] = useState(session?.riderId || "—");
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const geoWatchIdRef = useRef<number | null>(null);

  // Persist active order to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (activeOrder) {
      window.localStorage.setItem(LOCAL_STORAGE_ACTIVE_ORDER_KEY, JSON.stringify(activeOrder));
    } else {
      window.localStorage.removeItem(LOCAL_STORAGE_ACTIVE_ORDER_KEY);
    }
  }, [activeOrder]);

  // Load real backend profile and dashboard metrics
  const loadData = useCallback(async () => {
    try {
      const [dashRes, profileRes, ordersRes] = await Promise.all([
        fetchRiderDashboard().catch(() => null),
        fetchRiderProfile().catch(() => null),
        fetchRiderOrders().catch(() => []),
      ]);

      if (profileRes) {
        if (profileRes.fullName) setCaptainName(profileRes.fullName);
        if (profileRes.riderId) setCaptainId(profileRes.riderId);
        if (typeof profileRes.rating === "number") setCaptainRating(profileRes.rating);
      }

      if (dashRes) {
        if (typeof dashRes.todayEarnings === "number") setEarningsToday(dashRes.todayEarnings);
        if (typeof dashRes.todayDeliveries === "number") setCompletedToday(dashRes.todayDeliveries);
        if (typeof dashRes.rating === "number") setCaptainRating(dashRes.rating);
      }

      const list = Array.isArray(ordersRes) ? ordersRes : (ordersRes as any)?.items || [];
      const backendActive = list.find(
        (o: any) => o.status === "assigned" || o.status === "picked_up"
      );

      if (backendActive && !activeOrder) {
        setActiveOrder({
          id: String(backendActive.id),
          order_number: backendActive.order_number || String(backendActive.id),
          store_name: backendActive.store_name || backendActive.partnerName || "Partner Store",
          pickup_address: backendActive.pickup_address || "Store Address",
          customer_name: backendActive.customer_name || backendActive.customerName || "Customer",
          customer_phone: backendActive.customer_phone || backendActive.customerPhone || "",
          delivery_address: backendActive.delivery_address || backendActive.deliveryAddress || "Delivery Address",
          status: backendActive.status || "assigned",
          delivery_fee: backendActive.delivery_fee || backendActive.estimatedEarning || 60,
          total_amount: backendActive.total_amount || backendActive.amount || 450,
          payment_method: backendActive.payment_method || "cod",
          items_count: backendActive.items_count || 3,
          service_name: backendActive.service_name || "Laundry Pickup",
        });
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [activeOrder]);

  // Poll real offers from /api/rider/offers when online
  const checkLiveOffers = useCallback(async () => {
    if (!isOnline || activeOrder) return;
    try {
      const offers = await fetchRiderOffers();
      if (Array.isArray(offers) && offers.length > 0) {
        const topOffer = offers[0];
        setIncomingOffer({
          id: topOffer.rideId || topOffer._id || topOffer.id || topOffer.orderId,
          order_number: topOffer.orderCode || topOffer.order_number || topOffer.orderId || "QP-NEW",
          store_name: topOffer.partnerName || topOffer.store_name || "QuickPress Partner Store",
          pickup_address: topOffer.pickupAddress || topOffer.pickup_address || "Customer Address, Kasganj",
          customer_name: topOffer.customerName || topOffer.customer_name || topOffer.contactName || "Customer",
          delivery_address: topOffer.dropAddress || topOffer.deliveryAddress || topOffer.delivery_address || "Partner Store, Kasganj",
          distance_km: topOffer.distanceKm || topOffer.distance_km || 2.4,
          payout_amount: topOffer.estimatedEarning || topOffer.payout_amount || topOffer.fare || 60,
          items_summary: topOffer.rideType === "pickup" ? "Customer Clothes Pickup -> Handover to Store" : "Store Clean Clothes Delivery -> Customer",
        });
      }
    } catch {
      /* ignore */
    }
  }, [isOnline, activeOrder]);

  useEffect(() => {
    void loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (!isOnline) return;
    void checkLiveOffers();
    const offerInterval = setInterval(checkLiveOffers, 3000);
    return () => clearInterval(offerInterval);
  }, [isOnline, checkLiveOffers]);

  // Real-time GPS location streaming when online
  useEffect(() => {
    if (!isOnline) {
      if (geoWatchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
      return;
    }

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      geoWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCurrentCoords({ lat: latitude, lng: longitude });
          void pushRiderLocation(latitude, longitude).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }

    return () => {
      if (geoWatchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
    };
  }, [isOnline]);

  // Real toggle online/offline state to backend
  const handleToggleDuty = async (nextState: boolean) => {
    try {
      await updateRiderStatus(nextState);
      setOnline(nextState);
      toast.success(nextState ? "Duty Started! Radar active." : "Duty Paused. You are offline.");
    } catch {
      setOnline(nextState);
    }
  };

  // Handle incoming trip acceptance
  const handleAcceptOffer = async (offer: IncomingOffer) => {
    triggerHaptic([100, 50, 100]);
    setIncomingOffer(null);

    try {
      await acceptRiderOrder(offer.id);
      toast.success("Trip Accepted! Proceed to pick up from Customer.");
    } catch (err: any) {
      console.warn("Backend accept error:", err);
      toast.info("Trip Accepted! Proceeding to pickup.");
    }

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
      service_name: offer.items_summary || "Laundry Pickup",
    };

    setActiveOrder(newActive);
  };

  // Handle real step progression
  const handleUpdateOrderStatus = async (
    orderId: string,
    nextStatus: ActiveOrder["status"],
    otp?: string
  ) => {
    try {
      if (nextStatus === "picked_up") {
        await confirmPickup(orderId, otp || "0000");
        setActiveOrder((prev) => (prev ? { ...prev, status: "picked_up" } : null));
        playSuccessChime();
        toast.success("Customer pickup confirmed! Now deliver to Laundry Store.");
      } else if (nextStatus === "delivered") {
        await confirmDropAtPartner(orderId).catch(() => confirmDelivery(orderId, otp || "0000"));
        playSuccessChime();
        toast.success(`Handover to Store complete! ₹${activeOrder?.delivery_fee || 60} credited.`);
        setEarningsToday((prev) => prev + (activeOrder?.delivery_fee || 60));
        setCompletedToday((prev) => prev + 1);
        setActiveOrder(null);
      } else {
        await updateOrderStatus(orderId, nextStatus);
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

  return (
    <RiderLayout
      activeTab="dashboard"
      title="Captain Cockpit"
      subtitle="Live Dispatch & Bike Delivery Operations"
    >
      {/* Top Header Showing Real Rider Name & Live Status */}
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
          onToggle={handleToggleDuty}
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
            onDecline={() => {
              const offId = incomingOffer.id;
              setIncomingOffer(null);
              void rejectRiderOrder(offId).catch(() => {});
            }}
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
                  if (confirm("Do you want to dismiss this active order from your cockpit?")) {
                    setActiveOrder(null);
                  }
                }}
                className="text-[11px] font-bold text-slate-400 hover:text-emerald-900 cursor-pointer"
              >
                Dismiss Active View
              </button>
            </div>

            <ActiveDeliveryCockpit
              order={activeOrder}
              onUpdateStatus={handleUpdateOrderStatus}
              riderCoords={currentCoords}
            />
          </div>
        ) : isOnline ? (
          <div className="rounded-3xl border border-emerald-200 bg-white p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                  Live Duty GPS Radar Active
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                Auto-Dispatch Ready
              </span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-emerald-100">
              <LiveDeliveryMap
                riderLocation={currentCoords ? { lat: currentCoords.lat, lng: currentCoords.lng, label: "Captain (You)" } : null}
                phase="online"
                heightClassName="h-48 sm:h-56"
                showControls={true}
              />
            </div>
          </div>
        ) : null}

        {/* ========================================================================= */}
        {/* 4. REVENUE & TRIPS HERO CARD (Real Backend Data)                          */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-emerald-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3 border-b border-emerald-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                  Today&apos;s Gross Earnings
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

          {/* Metric Columns in White & Dark Green */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="rounded-2xl bg-emerald-50/50 p-3 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase text-emerald-800">Trips Done</p>
              <p className="mt-0.5 text-xl font-black text-slate-900">{completedToday}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50/50 p-3 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase text-emerald-800">Duty Status</p>
              <p className="mt-0.5 text-xl font-black text-emerald-800">
                {isOnline ? "Online" : "Offline"}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50/50 p-3 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase text-emerald-800">Fleet City</p>
              <p className="mt-0.5 text-xl font-black text-slate-900">Kasganj</p>
            </div>
            <div className="rounded-2xl bg-emerald-50/50 p-3 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase text-emerald-800">Rating</p>
              <p className="mt-0.5 text-xl font-black text-emerald-800">
                {captainRating.toFixed(1)} ★
              </p>
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
                <span>Live GPS Radar Active</span>
              </span>
              <h3 className="mt-2 text-base font-black text-slate-900">
                Scanning for Nearby Laundry Pickups...
              </h3>
              <p className="mt-0.5 text-xs text-slate-600 max-w-sm mx-auto">
                Connected to QuickPress Kasganj Dispatch Gateway. Keep phone volume up on bike mount.
              </p>
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
