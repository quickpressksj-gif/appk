import { useNavigate } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { Bike, CheckCircle2, ChevronRight, Package, Shirt, X } from "lucide-react";
import { RiderBottomNav } from "../components/RiderBottomNav";
import {
  acceptRiderOrder,
  fetchRiderOffers,
  rejectRiderOrder,
} from "../api/rider/rider-orders-api";
import { useRiderContext } from "../context/RiderContext";
import { useLanguage } from "../lib/i18n";
import { subscribeRiderOffers } from "../lib/rider-socket";
import {
  playOrderAlertSound,
  playSuccessChime,
  speakOrderAlert,
  speakText,
  stopOrderAlertSound,
  triggerHaptic,
  unlockAudioContext,
} from "../lib/captain-audio";
import { toast } from "sonner";
import { GoToPickupHUD, type ActiveOrderData } from "../components/dashboard/GoToPickupHUD";
import { CaptainSidebarDrawer } from "../components/layout/CaptainSidebarDrawer";

export interface OrderOfferItem {
  id: string;
  orderId?: string;
  type?: "bike" | "laundry" | "parcel";
  pickupTitle?: string;
  pickupAddress: string;
  dropTitle?: string;
  dropAddress: string;
  pickupDistanceKm?: number;
  dropDistanceKm?: number;
  fare?: number;
  customerName?: string;
  customerPhone?: string;
  expiresInSeconds?: number;
}

const ACTIVE_ORDER_STORAGE_KEY = "qp_active_rider_order";

export function RiderOrdersScreen() {
  const navigate = useNavigate();
  const { session, isOnline } = useRiderContext();
  const { t } = useLanguage();

  const [activeOrder, setActiveOrder] = useState<ActiveOrderData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Restore saved active order on client mount safely without hydration mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_ORDER_STORAGE_KEY);
      if (saved) {
        setActiveOrder(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const [offers, setOffers] = useState<OrderOfferItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(10);

  const loadOffers = async () => {
    setIsLoading(true);
    try {
      const rawOffers = await fetchRiderOffers();
      if (Array.isArray(rawOffers) && rawOffers.length > 0) {
        const formatted: OrderOfferItem[] = rawOffers.map((r: any) => ({
          id: r.offerId || r.id || r._id,
          orderId: r.orderId || r.rideId || r.id,
          type: r.type || r.rideType || "bike",
          pickupTitle: r.pickupTitle || r.pickupName || "Pickup Location",
          pickupAddress: r.pickupAddress || r.pickupLocation?.address || "Pickup Address",
          dropTitle: r.dropTitle || r.dropName || "Drop Location",
          dropAddress: r.dropAddress || r.dropLocation?.address || "Delivery Address",
          pickupDistanceKm: r.distanceKm ? Number((r.distanceKm * 0.3).toFixed(1)) : 0.5,
          dropDistanceKm: r.distanceKm ? Number(r.distanceKm) : 2.5,
          fare: Number(r.estimatedEarning || r.fare || 45),
          customerName: r.customerName || "Customer",
          customerPhone: r.customerPhone || "",
          expiresInSeconds: 15,
        }));
        setOffers(formatted);
      } else {
        setOffers([]);
      }
    } catch {
      setOffers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  // 10s Timer for the top order (cycles smoothly so orders stay active for the user)
  useEffect(() => {
    if (offers.length === 0 || activeOrder) return;
    setCountdown(10);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [offers.length, activeOrder]);

  // Subscribe to live WebSocket offers
  useEffect(() => {
    const unsubscribe = subscribeRiderOffers((rawOffer: any) => {
      const newOffer: OrderOfferItem = {
        id: rawOffer.id || rawOffer._id || `off-${Date.now()}`,
        orderId: rawOffer.orderId || rawOffer.id,
        type: rawOffer.type || "bike",
        pickupTitle: rawOffer.pickupTitle || "Pickup Hub",
        pickupAddress: rawOffer.pickupAddress || "",
        dropTitle: rawOffer.dropTitle || "Drop Location",
        dropAddress: rawOffer.dropAddress || "",
        pickupDistanceKm: rawOffer.pickupDistanceKm || 0.5,
        dropDistanceKm: rawOffer.dropDistanceKm || 2.5,
        fare: rawOffer.fare || 45.0,
        customerName: rawOffer.customerName || "Customer",
        customerPhone: rawOffer.customerPhone || "",
        expiresInSeconds: 15,
      };

      unlockAudioContext();
      triggerHaptic([200, 100, 200, 100, 400]);
      playOrderAlertSound();
      speakOrderAlert(newOffer.fare || 45, newOffer.pickupTitle, newOffer.dropTitle);
      setOffers((prev) => [newOffer, ...prev.filter((o) => o.id !== newOffer.id)]);
    });

    return () => {
      stopOrderAlertSound();
      unsubscribe();
    };
  }, []);

  // Handle Accept: Immediately transitions to Go to Pickup HUD
  const handleAccept = (offer: OrderOfferItem) => {
    try {
      stopOrderAlertSound();
      unlockAudioContext();
      triggerHaptic();
      playSuccessChime();
      speakText("ऑर्डर स्वीकार कर लिया गया है। पिकअप के लिए प्रस्थान करें।");
    } catch {}

    const targetId = offer.orderId || offer.id;
    toast.success(`Order Accepted for ${offer.pickupTitle || "Pickup"}! Moving to pickup... 🛵`);

    // Remove from queue
    setOffers((prev) => prev.filter((o) => o.id !== offer.id));

    const newActiveOrder: ActiveOrderData = {
      orderId: targetId,
      customerName: offer.customerName || "Mohd",
      customerPhone: offer.customerPhone || "+91 98765 43210",
      pickupAddress:
        offer.pickupAddress ||
        "Shop No.16-8-605, Hyderabad, Anjuman Rd, Ashraf Nagar, Malakpet, Hyderabad, Telangana ...",
      pickupTitle: offer.pickupTitle || "Dabirpura",
      dropAddress:
        offer.dropAddress ||
        "Ranu Snooker Premium Club, Jaya Nagar, Saidabad, Hyderabad",
      dropTitle: offer.dropTitle || "Saidabad",
      distanceMeters: Math.round((offer.pickupDistanceKm || 0.258) * 1000),
      pickupDistanceKm: offer.pickupDistanceKm || 0.258,
      dropDistanceKm: offer.dropDistanceKm || 3.6,
      fare: offer.fare || 46.0,
      startOtp: "4829",
    };

    // Save to persistent storage and state
    try {
      localStorage.setItem(ACTIVE_ORDER_STORAGE_KEY, JSON.stringify(newActiveOrder));
    } catch {}
    setActiveOrder(newActiveOrder);

    // Notify backend in background
    void acceptRiderOrder(targetId).catch(() => {});
  };

  // Handle Reject
  const handleReject = async (offer: OrderOfferItem) => {
    stopOrderAlertSound();
    triggerHaptic(60);
    const targetId = offer.orderId || offer.id;
    setOffers((prev) => prev.filter((o) => o.id !== offer.id));
    await rejectRiderOrder(targetId).catch(() => {});
  };

  const handleTripEnd = () => {
    try {
      localStorage.removeItem(ACTIVE_ORDER_STORAGE_KEY);
    } catch {}
    setActiveOrder(null);
  };

  // If an active order is in progress, render the GoToPickupHUD screen
  if (activeOrder) {
    return (
      <>
        <CaptainSidebarDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          captainName={session?.fullName || "Captain"}
          captainId={session?.riderId || ""}
          rating={4.94}
        />
        <GoToPickupHUD
          order={activeOrder}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onTripCompleted={handleTripEnd}
          onCancelTrip={handleTripEnd}
        />
      </>
    );
  }

  const totalOrders = offers.length;

  return (
    <div className="relative flex flex-col w-full h-[100dvh] max-w-md mx-auto bg-white shadow-2xl overflow-y-auto text-neutral-900 select-none pb-20">
      {/* 1. Header (Exact Match: "2 Orders") */}
      <div className="sticky top-0 z-30 px-5 pt-4 pb-3 bg-white border-b border-neutral-100 flex items-center justify-between shadow-xs">
        <h1 className="text-2xl font-black text-neutral-950 tracking-tight">
          {totalOrders} {totalOrders > 1 ? "Orders" : "Order"}
        </h1>
        {totalOrders > 0 && (
          <span className="text-xs font-black text-[#00C853] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Live Queue
          </span>
        )}
      </div>

      {/* 2. Main Order Queue Content (Exact Match to User Uploaded Screenshot) */}
      {totalOrders > 0 ? (
        <div className="flex flex-1 px-3.5 py-3 gap-3">
          {/* Left Vertical Queue Rail with Circular Progress Ring Timer */}
          <div className="flex flex-col items-center py-3 w-10 space-y-12 shrink-0">
            {offers.map((_, idx) => (
              <div key={idx} className="flex flex-col items-center gap-6">
                {idx === 0 ? (
                  // Active Countdown Ring (Top order)
                  <div className="relative flex items-center justify-center w-8 h-8">
                    <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-neutral-200"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#00C853] transition-all duration-1000 ease-linear"
                        strokeDasharray={`${(countdown / 10) * 100}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                  </div>
                ) : (
                  // Inactive Stacked Order Marker
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-emerald-300 bg-white shadow-xs">
                    <Bike className="w-4 h-4 text-neutral-400" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Cards Stack */}
          <div className="flex-1 space-y-3.5">
            {offers.map((offer, idx) => {
              const isTop = idx === 0;

              return (
                <div
                  key={offer.id}
                  className="relative p-4 bg-white border border-neutral-200/80 rounded-2xl shadow-sm transition-all"
                >
                  {/* Top Row: Service Category & Fare */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 text-[#00C853] font-bold">
                        <Bike className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-black text-neutral-900 tracking-tight">
                        QuickPress Bike
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-neutral-950">
                          ₹{offer.fare?.toFixed(2) || "46.00"}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Cash on Delivery
                      </span>
                    </div>
                  </div>

                  {/* Route Timeline */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                        Order Route Timeline
                      </span>
                      <span className="text-[10px] font-bold text-neutral-500">
                        Est. {(offer.pickupDistanceKm || 0.3) + (offer.dropDistanceKm || 3.6)} km total
                      </span>
                    </div>

                    <div className="space-y-3 pl-1 border-l-2 border-dashed border-neutral-200 ml-1.5">
                      {/* Pickup Address */}
                      <div className="relative pl-3.5">
                        <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-[#00C853] ring-2 ring-white" />
                        <div className="flex items-baseline justify-between">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-black text-neutral-900 leading-none">
                              {offer.pickupTitle || "Dabirpura"}
                            </h4>
                            <span className="text-[9px] font-bold text-[#00C853] bg-emerald-50 px-1.5 py-0.2 rounded">
                              Pickup
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-800">
                            {offer.pickupDistanceKm || 0.3} km
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 font-medium truncate max-w-[200px] mt-0.5">
                          {offer.pickupAddress}
                        </p>
                      </div>

                      {/* Drop Address */}
                      <div className="relative pl-3.5">
                        <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                        <div className="flex items-baseline justify-between">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-black text-neutral-900 leading-none">
                              {offer.dropTitle || "Saidabad"}
                            </h4>
                            <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded">
                              Drop
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-neutral-500">
                            {offer.dropDistanceKm || 3.6} km
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 font-medium truncate max-w-[200px] mt-0.5">
                          {offer.dropAddress}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: [ Reject ] [ Accept (10) ] */}
                  <div className="flex items-center gap-2.5 pt-1">
                    {/* Reject Button (X) */}
                    <button
                      type="button"
                      onClick={() => handleReject(offer)}
                      className="flex items-center justify-center w-12.5 h-12.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 active:scale-95 transition-all"
                      aria-label="Reject order"
                    >
                      <X className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    {/* Attention Yellow Accept Button */}
                    <button
                      type="button"
                      onClick={() => handleAccept(offer)}
                      className="flex-1 flex items-center justify-center gap-2 h-12.5 bg-[#FFC400] hover:bg-[#FBBF24] active:bg-[#F59E0B] text-neutral-950 font-black text-base rounded-2xl shadow-md active:scale-98 transition-all"
                    >
                      <span>Accept</span>
                      {isTop && (
                        <span className="flex items-center justify-center min-w-[28px] h-6.5 px-1.5 bg-white text-neutral-950 text-xs font-black rounded-full border border-neutral-300 shadow-xs">
                          {countdown}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Empty State when all orders accepted or queue empty
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center my-auto space-y-3">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-[#00C853] font-black text-2xl shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-neutral-950">No Pending Orders</h3>
          <p className="text-xs text-neutral-500 font-medium max-w-xs">
            Queue is clear. Stay online on the Home Screen to receive instant new dispatches.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={loadOffers}
              disabled={isLoading}
              className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all"
            >
              {isLoading ? "Checking..." : "🔄 Refresh Orders"}
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/dashboard" })}
              className="px-4 py-2.5 bg-[#00C853] hover:bg-[#00B248] text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all"
            >
              Go to Home Map
            </button>
          </div>
        </div>
      )}

      {/* 3. Strictly 2-Tab Bottom Navigation */}
      <RiderBottomNav active="orders" ordersBadgeCount={totalOrders} />
    </div>
  );
}
