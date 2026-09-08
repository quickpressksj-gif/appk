import { useNavigate } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import {
  Bike,
  CheckCircle2,
  ChevronRight,
  Clock,
  History,
  MapPin,
  Navigation,
  Package,
  RotateCw,
  Shirt,
  X,
  XCircle,
} from "lucide-react";
import { RiderBottomNav } from "../components/RiderBottomNav";
import {
  acceptRiderOrder,
  fetchRiderHistory,
  fetchRiderOffers,
  rejectRiderOrder,
} from "../api/rider/rider-orders-api";
import type { RiderHistoryEntry } from "../shared/types/rider";
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
  type?: string;
  rideType?: string;
  isTransfer?: boolean;
  isReassigned?: boolean;
  isReassignedBonus?: boolean;
  extraBonusPercent?: number;
  extraBonusAmount?: number;
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

  type OrdersTab = "queue" | "history";
  const [activeTab, setActiveTab] = useState<OrdersTab>(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get("tab") === "history") return "history";
      } catch {}
    }
    return "queue";
  });
  const [historyItems, setHistoryItems] = useState<RiderHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"all" | "completed" | "cancelled">("all");

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const items = await fetchRiderHistory();
      setHistoryItems(items);
    } catch {
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Sync tab with URL search parameter if changed
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "history") {
        setActiveTab("history");
      }
    } catch {}
  }, []);

  // Fetch history automatically whenever activeTab is history
  useEffect(() => {
    if (activeTab === "history" && historyItems.length === 0) {
      loadHistory();
    }
  }, [activeTab]);

  const formatHistoryDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const today = new Date();
      const isToday =
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
      const timePart = d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      if (isToday) return `Today, ${timePart}`;
      return `${d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}, ${timePart}`;
    } catch {
      return dateStr;
    }
  };

  const filteredHistory = historyItems.filter((item) => {
    if (historyFilter === "completed") return item.outcome === "completed";
    if (historyFilter === "cancelled") return item.outcome === "cancelled" || item.outcome === "failed";
    return true;
  });

  const loadOffers = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const rawOffers = await fetchRiderOffers();
      if (Array.isArray(rawOffers) && rawOffers.length > 0) {
        const formatted: OrderOfferItem[] = rawOffers.map((r: any) => ({
          id: r.offerId || r.id || r._id,
          orderId: r.orderId || r.rideId || r.id,
          type: r.type || r.rideType || "bike",
          rideType: r.rideType || (r.type === "delivery" || r.type === "handover_delivery" ? "delivery" : "pickup"),
          isTransfer: Boolean(r.isTransfer),
          isReassigned: Boolean(r.isReassigned),
          isReassignedBonus: Boolean(r.isReassignedBonus),
          extraBonusPercent: Number(r.extraBonusPercent || 0),
          extraBonusAmount: Number(r.extraBonusAmount || 0),
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
        setOffers((prev) => {
          if (prev.length === 0 && formatted.length > 0) {
            try {
              unlockAudioContext();
              triggerHaptic([200, 100, 200, 100, 400]);
              playOrderAlertSound();
              speakOrderAlert(formatted[0].fare || 45, formatted[0].pickupTitle, formatted[0].dropTitle);
            } catch {}
          }
          return formatted;
        });
      } else {
        setOffers([]);
      }
    } catch {
      if (!isBackground) setOffers([]);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
    const timer = setInterval(() => {
      if (!activeOrder) {
        loadOffers(true);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [activeOrder]);

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
  const handleAccept = async (offer: OrderOfferItem) => {
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
      customerName: offer.customerName || "Customer",
      customerPhone: offer.customerPhone || "",
      pickupAddress: offer.pickupAddress || offer.pickupTitle || "Kasganj Pickup Location",
      pickupTitle: offer.pickupTitle || "Pickup Location",
      dropAddress: offer.dropAddress || offer.dropTitle || "QuickPress Partner Hub, Kasganj",
      dropTitle: offer.dropTitle || "Partner Hub",
      distanceMeters: Math.round((offer.pickupDistanceKm || 1.2) * 1000),
      pickupDistanceKm: offer.pickupDistanceKm || 1.2,
      dropDistanceKm: offer.dropDistanceKm || 2.5,
      fare: offer.fare || 45.0,
      startOtp: "4829",
      rideType: offer.rideType || (offer.type === "delivery" || offer.type === "handover_delivery" ? "delivery" : "pickup"),
    };

    // Save to persistent storage and state
    try {
      localStorage.setItem(ACTIVE_ORDER_STORAGE_KEY, JSON.stringify(newActiveOrder));
    } catch {}
    setActiveOrder(newActiveOrder);

    // Call Real Backend API to claim trip
    try {
      const res = await acceptRiderOrder(targetId);
      if (res.ok && res.order) {
        const ord = res.order as any;
        const pickupOtp =
          (typeof ord.otp?.pickup === "object" ? ord.otp?.pickup?.code : ord.otp?.pickup) ||
          ord.pickupOtp ||
          "4829";
        const updatedActiveOrder: ActiveOrderData = {
          ...newActiveOrder,
          orderCode: ord.code || ord.orderCode || targetId.slice(-6).toUpperCase(),
          startOtp: String(pickupOtp || "4829"),
          fare: Number(ord.estimatedEarning ?? ord.fare ?? newActiveOrder.fare),
        };
        setActiveOrder(updatedActiveOrder);
        try {
          localStorage.setItem(ACTIVE_ORDER_STORAGE_KEY, JSON.stringify(updatedActiveOrder));
        } catch {}
      } else if (res.ok === false) {
        // If conflict or already claimed by another captain
        toast.error("Trip could not be claimed or is no longer available.");
        try {
          localStorage.removeItem(ACTIVE_ORDER_STORAGE_KEY);
        } catch {}
        setActiveOrder(null);
        loadOffers(false);
      }
    } catch {}
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
      {/* 1. Header with Tab Switcher */}
      <div
        className="sticky top-0 z-30 px-4 pb-2.5 bg-white border-b border-neutral-100 shadow-2xs"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px) + 12px, 16px)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-neutral-950 tracking-tight flex items-center gap-2">
              <span>{activeTab === "queue" ? `${totalOrders} Orders Queue` : "Ride History"}</span>
              {activeTab === "queue" && totalOrders > 0 && (
                <span className="flex h-2.5 w-2.5 rounded-full bg-[#00C853] animate-pulse" />
              )}
            </h1>
            <p className="text-[11px] font-medium text-neutral-500">
              {activeTab === "queue"
                ? "Live customer ride dispatches"
                : "Completed & past delivery records"}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (activeTab === "queue") loadOffers();
                else loadHistory();
              }}
              disabled={isLoading || historyLoading}
              className="p-2 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 rounded-full active:scale-95 transition-all"
              title="Refresh"
            >
              <RotateCw
                className={`w-4 h-4 ${
                  isLoading || historyLoading ? "animate-spin text-[#00C853]" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Segmented Tab Switcher */}
        <div className="flex items-center p-1 mt-2.5 bg-neutral-100/90 rounded-2xl border border-neutral-200/60">
          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            className={`flex-1 py-1.5 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "queue"
                ? "bg-white text-neutral-950 shadow-xs"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <span>⚡ Live Orders</span>
            {totalOrders > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#00C853] text-white text-[10px] font-black">
                {totalOrders}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("history");
              if (historyItems.length === 0) {
                loadHistory();
              }
            }}
            className={`flex-1 py-1.5 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "history"
                ? "bg-white text-neutral-950 shadow-xs"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <History className="w-3.5 h-3.5 text-neutral-600" />
            <span>Ride History</span>
            {historyItems.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-neutral-200 text-neutral-800 text-[10px] font-bold">
                {historyItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === "queue" ? (
        totalOrders > 0 ? (
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
                          className={`${
                            offers[0]?.rideType === "delivery" ||
                            offers[0]?.type === "delivery" ||
                            offers[0]?.isTransfer
                              ? "text-blue-600"
                              : "text-[#00C853]"
                          } transition-all duration-1000 ease-linear`}
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
                    // Inactive Dot (Upcoming queued order)
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                  )}
                  {idx < offers.length - 1 && (
                    <div className="w-0.5 h-36 bg-neutral-200 border-dashed" />
                  )}
                </div>
              ))}
            </div>

            {/* Right Order Offer Cards List */}
            <div className="flex-1 space-y-3.5 pb-8">
              {offers.map((offer, idx) => {
                const isTop = idx === 0;
                const isDelivery =
                  offer.rideType === "delivery" ||
                  offer.type === "delivery" ||
                  offer.isTransfer ||
                  offer.type === "handover_delivery" ||
                  offer.dropTitle?.toLowerCase().includes("customer") ||
                  offer.pickupTitle?.toLowerCase().includes("store") ||
                  offer.pickupTitle?.toLowerCase().includes("partner") ||
                  offer.pickupTitle?.toLowerCase().includes("hub");

                return (
                  <div
                    key={offer.id}
                    className={`rounded-3xl p-4 transition-all duration-200 border ${
                      isDelivery
                        ? isTop
                          ? "bg-gradient-to-br from-blue-50/95 via-white to-blue-50/50 border-blue-400 shadow-lg shadow-blue-500/15 ring-2 ring-blue-500/30"
                          : "bg-blue-50/40 border-blue-200/70 opacity-85"
                        : isTop
                        ? "bg-white border-neutral-200/90 shadow-md shadow-neutral-100 ring-2 ring-[#00C853]/10"
                        : "bg-neutral-50/80 border-neutral-200/60 opacity-80"
                    }`}
                  >
                    {/* Header: Service Type + Cash / Fare Badge */}
                    <div
                      className={`flex items-center justify-between pb-3 border-b ${
                        isDelivery ? "border-blue-200/70" : "border-neutral-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex items-center justify-center w-7 h-7 rounded-xl font-bold text-xs ${
                            isDelivery
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {isDelivery ? (
                            <Package className="w-4 h-4" />
                          ) : offer.type === "laundry" ? (
                            <Shirt className="w-4 h-4" />
                          ) : (
                            <Bike className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span
                            className={`text-xs font-black uppercase tracking-wider ${
                              isDelivery ? "text-blue-950" : "text-neutral-600"
                            }`}
                          >
                            {isDelivery
                              ? "QuickPress Delivery"
                              : offer.type === "laundry"
                              ? "QuickPress Laundry"
                              : "Captain Courier"}
                          </span>
                          {isDelivery && (
                            <span className="text-[10px] font-bold text-blue-700">
                              📦 स्टोर से डिलीवरी (Doorstep)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* 20% Reassignment Extra Bonus Tag */}
                        {(offer.isReassignedBonus || (offer.extraBonusPercent && offer.extraBonusPercent > 0)) && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-full text-[10px] font-black shadow-xs animate-pulse">
                            <span>🔥 +20% BONUS</span>
                          </div>
                        )}

                        {/* Cash Fare Payout */}
                        <div
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                            isDelivery
                              ? "bg-blue-100/90 text-blue-950 border-blue-300"
                              : "bg-[#E6F8EE] text-[#00C853] border-[#00C853]/30"
                          }`}
                        >
                          <span>💵 Cash</span>
                          <span>₹{offer.fare?.toFixed(0) || "45"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Route Details: Pickup & Drop Points */}
                    <div className="py-3.5 space-y-3">
                      {/* Pickup Point */}
                      <div className="flex items-start gap-2.5 text-xs">
                        <div
                          className={`flex items-center justify-center w-4 h-4 rounded-full font-black text-[9px] shrink-0 mt-0.5 ${
                            isDelivery
                              ? "bg-blue-200 text-blue-900"
                              : "bg-emerald-100 text-[#00C853]"
                          }`}
                        >
                          P
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-neutral-900 truncate">
                            {offer.pickupTitle || "Pickup Hub"}
                          </p>
                          <p className="text-[11px] text-neutral-500 font-medium truncate">
                            {offer.pickupAddress}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-neutral-400 shrink-0">
                          {offer.pickupDistanceKm || 0.5} km
                        </span>
                      </div>

                      {/* Dashed Connecting Line */}
                      <div className="ml-2 w-0.5 h-3 bg-neutral-200" />

                      {/* Drop Point */}
                      <div className="flex items-start gap-2.5 text-xs">
                        <div
                          className={`flex items-center justify-center w-4 h-4 rounded-full font-black text-[9px] shrink-0 mt-0.5 ${
                            isDelivery
                              ? "bg-blue-600 text-white"
                              : "bg-rose-100 text-rose-600"
                          }`}
                        >
                          D
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-neutral-900 truncate">
                            {offer.dropTitle || "Customer Drop Location"}
                          </p>
                          <p className="text-[11px] text-neutral-500 font-medium truncate">
                            {offer.dropAddress}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-neutral-400 shrink-0">
                          {offer.dropDistanceKm || 2.5} km
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons: [ Reject ] [ Accept ] */}
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

                      {/* Attention Accept Button: Blue for delivery, Yellow for pickup */}
                      <button
                        type="button"
                        onClick={() => handleAccept(offer)}
                        className={`flex-1 flex items-center justify-center gap-2 h-12.5 font-black text-base rounded-2xl shadow-md active:scale-98 transition-all ${
                          isDelivery
                            ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-500/25"
                            : "bg-[#FFC400] hover:bg-[#FBBF24] active:bg-[#F59E0B] text-neutral-950 shadow-amber-500/25"
                        }`}
                      >
                        <span>{isDelivery ? "Accept Delivery 📦" : "Accept"}</span>
                        {isTop && (
                          <span
                            className={`flex items-center justify-center min-w-[28px] h-6.5 px-1.5 text-xs font-black rounded-full border shadow-xs ${
                              isDelivery
                                ? "bg-white text-blue-700 border-blue-300"
                                : "bg-white text-neutral-950 border-neutral-300"
                            }`}
                          >
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
                onClick={() => loadOffers()}
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
        )
      ) : (
        // RIDE HISTORY TAB CONTENT
        <div className="flex-1 px-4 py-3 space-y-3.5">
          {/* Summary Metric Strip */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/60 border border-emerald-200/80 rounded-2xl flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#00C853] text-white flex items-center justify-center font-black shadow-xs">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-emerald-800">Total Rides Completed</p>
                <p className="text-base font-black text-emerald-950">
                  {historyItems.filter((i) => i.outcome === "completed").length} Trips
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-emerald-800">Total Earnings</p>
              <p className="text-base font-black text-emerald-950">
                ₹{historyItems
                  .filter((i) => i.outcome === "completed")
                  .reduce((acc, i) => acc + (i.amount || 0), 0)
                  .toFixed(0)}
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: "all", label: `All Trips (${historyItems.length})` },
              {
                id: "completed",
                label: `Completed (${historyItems.filter((i) => i.outcome === "completed").length})`,
              },
              {
                id: "cancelled",
                label: `Cancelled (${historyItems.filter((i) => i.outcome === "cancelled" || i.outcome === "failed").length})`,
              },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setHistoryFilter(f.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                  historyFilter === f.id
                    ? "bg-neutral-900 text-white shadow-xs"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* History Cards List */}
          {historyLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-neutral-500">
              <RotateCw className="w-6 h-6 animate-spin text-[#00C853]" />
              <p className="text-xs font-semibold">Loading Ride History...</p>
            </div>
          ) : filteredHistory.length > 0 ? (
            <div className="space-y-3 pb-8">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-2xs space-y-3 hover:shadow-xs transition-shadow"
                >
                  {/* Top: Order Code + Date + Outcome Badge */}
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-neutral-900 font-mono">
                        #{item.code}
                      </span>
                      <span className="text-[11px] font-medium text-neutral-400">·</span>
                      <span className="text-[11px] font-medium text-neutral-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        <span>{formatHistoryDate(item.date)}</span>
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        item.outcome === "completed"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}
                    >
                      {item.outcome === "completed" ? "Completed ✅" : "Cancelled ❌"}
                    </span>
                  </div>

                  {/* Route Details */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[9px] shrink-0 mt-0.5">
                        P
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                          PICKUP
                        </p>
                        <p className="font-bold text-neutral-800 truncate">
                          {item.pickupAddress || item.partnerName || "Kasganj Hub"}
                        </p>
                      </div>
                    </div>

                    <div className="ml-2 w-0.5 h-3 bg-neutral-200" />

                    <div className="flex items-start gap-2.5">
                      <div className="flex items-center justify-center w-4 h-4 rounded-full bg-rose-100 text-rose-700 font-bold text-[9px] shrink-0 mt-0.5">
                        D
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                          DROP
                        </p>
                        <p className="font-bold text-neutral-800 truncate">
                          {item.dropAddress || item.customerName || "Customer Address"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Customer, Distance & Payout */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-neutral-100 text-xs">
                    <div className="flex items-center gap-2 text-neutral-600 font-medium">
                      <span>👤 {item.customerName}</span>
                      <span>·</span>
                      <span className="font-bold text-neutral-700">{item.distanceKm} km</span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-base font-black font-mono ${
                          item.outcome === "completed" ? "text-[#00C853]" : "text-neutral-400"
                        }`}
                      >
                        {item.outcome === "completed" ? `+₹${item.amount.toFixed(0)}` : "₹0"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Empty History State
            <div className="flex flex-col items-center justify-center py-14 text-center space-y-3">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-neutral-100 text-neutral-500 font-bold text-xl">
                <History className="w-7 h-7 text-neutral-400" />
              </div>
              <h3 className="text-sm font-black text-neutral-950">No Ride History Found</h3>
              <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
                {historyFilter !== "all"
                  ? `No ${historyFilter} rides found in your records.`
                  : "Trips you complete will appear here with live earnings, route details, and timestamps."}
              </p>
              <button
                type="button"
                onClick={loadHistory}
                disabled={historyLoading}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs rounded-xl shadow-2xs active:scale-95"
              >
                {historyLoading ? "Refreshing..." : "🔄 Refresh History"}
              </button>
            </div>
          )}

          {/* Brand Watermark Footer in History Tab */}
          <section className="mt-8 select-none bg-muted/60 px-5 pb-10 pt-8 border-t border-border/70 rounded-3xl">
            <h2 className="text-[2.2rem] font-black leading-[0.95] tracking-tight text-muted-foreground/35">
              India&rsquo;s freshest
              <br />
              laundry app <span className="text-primary/35">🧺</span>
            </h2>
            <div className="mt-6 h-px w-full bg-border/70" />
            <p className="mt-5 text-2xl font-black tracking-tight text-muted-foreground/25">
              QuickPress
            </p>
            <p className="mt-4 text-[11px] font-medium tracking-wide text-muted-foreground/70">
              Made In India · Crafted by Utter Pradesh 🚩
            </p>
          </section>
        </div>
      )}

      {/* 3. Strictly 2-Tab Bottom Navigation */}
      <RiderBottomNav active="orders" ordersBadgeCount={totalOrders} />
    </div>
  );
}
