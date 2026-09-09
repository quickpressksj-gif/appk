import { useNavigate } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import {
  Bike,
  CheckCircle2,
  ChevronRight,
  Clock,
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
  orderCode?: string;
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
  amount?: number;
  customerName?: string;
  customerPhone?: string;
  partnerName?: string;
  partnerPhone?: string;
  partnerAddress?: string;
  pickupOtp?: string;
  deliveryOtp?: string;
  dispatchOtp?: string;
  pickupCoords?: { lat: number; lng: number };
  dropCoords?: { lat: number; lng: number };
  customerCoords?: { lat: number; lng: number };
  partnerCoords?: { lat: number; lng: number };
  paymentMode?: string;
  items?: any[];
  placedAt?: string;
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

  const loadOffers = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const rawOffers = await fetchRiderOffers();
      if (Array.isArray(rawOffers) && rawOffers.length > 0) {
        const formatted: OrderOfferItem[] = rawOffers.map((r: any) => {
          const c_lat = r.customerCoords?.lat ?? r.pickupCoords?.lat ?? r.pickupLocation?.latitude ?? r.pickupLocation?.lat ?? r.customerLocation?.lat;
          const c_lng = r.customerCoords?.lng ?? r.pickupCoords?.lng ?? r.pickupLocation?.longitude ?? r.pickupLocation?.lng ?? r.customerLocation?.lng;
          const p_lat = r.partnerCoords?.lat ?? r.dropCoords?.lat ?? r.partnerLocation?.latitude ?? r.partnerLocation?.lat ?? r.dropLocation?.lat;
          const p_lng = r.partnerCoords?.lng ?? r.dropCoords?.lng ?? r.partnerLocation?.longitude ?? r.partnerLocation?.lng ?? r.dropLocation?.lng;

          const custCoords = c_lat != null && c_lng != null ? { lat: Number(c_lat), lng: Number(c_lng) } : undefined;
          const partCoords = p_lat != null && p_lng != null ? { lat: Number(p_lat), lng: Number(p_lng) } : undefined;

          const pOtp = r.pickupOtp || (typeof r.otp?.pickup === "object" ? r.otp?.pickup?.code : r.otp?.pickup);
          const dOtp = r.deliveryOtp || (typeof r.otp?.delivery === "object" ? r.otp?.delivery?.code : r.otp?.delivery);
          const dispOtp = r.dispatchOtp || (typeof r.otp?.dispatch === "object" ? r.otp?.dispatch?.code : r.otp?.dispatch);

          return {
            id: r.offerId || r.id || r._id,
            orderId: r.orderId || r.rideId || r.id,
            orderCode: r.orderCode || r.code || (r.orderId ? String(r.orderId).slice(-6).toUpperCase() : undefined),
            type: r.type || r.rideType || "bike",
            rideType: r.rideType || (r.type === "delivery" || r.type === "handover_delivery" ? "delivery" : "pickup"),
            isTransfer: Boolean(r.isTransfer),
            isReassigned: Boolean(r.isReassigned),
            isReassignedBonus: Boolean(r.isReassignedBonus),
            extraBonusPercent: Number(r.extraBonusPercent || 0),
            extraBonusAmount: Number(r.extraBonusAmount || 0),
            pickupTitle: r.pickupTitle || r.pickupName || (r.rideType === "delivery" ? (r.partnerName || "Partner Store") : "Customer Pickup"),
            pickupAddress: r.pickupAddress || r.pickupLocation?.address || "Pickup Address",
            dropTitle: r.dropTitle || r.dropName || (r.rideType === "delivery" ? (r.customerName || "Customer Delivery") : (r.partnerName || "Partner Store")),
            dropAddress: r.dropAddress || r.dropLocation?.address || "Delivery Address",
            pickupDistanceKm: r.distanceKm ? Number((r.distanceKm * 0.3).toFixed(1)) : 0.5,
            dropDistanceKm: r.distanceKm ? Number(r.distanceKm) : 2.5,
            fare: Number(r.estimatedEarning || r.fare || 45),
            amount: Number(r.amount || r.total_amount || 0),
            paymentMode: r.paymentMode || r.payment_method || "cod",
            customerName: r.customerName || "Customer",
            customerPhone: r.customerPhone || "",
            partnerName: r.partnerName || "QuickPress Partner Store",
            partnerPhone: r.partnerPhone || "",
            partnerAddress: r.partnerAddress || "",
            pickupOtp: pOtp ? String(pOtp) : undefined,
            deliveryOtp: dOtp ? String(dOtp) : undefined,
            dispatchOtp: dispOtp ? String(dispOtp) : undefined,
            customerCoords: custCoords,
            partnerCoords: partCoords,
            pickupCoords: r.rideType === "delivery" ? partCoords : custCoords,
            dropCoords: r.rideType === "delivery" ? custCoords : partCoords,
            items: r.items || [],
            placedAt: r.placedAt || r.createdAt,
            expiresInSeconds: 120, // 2 minutes SLA
          };
        });
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

  // 2-minute SLA Timer (120s) for the top incoming offer
  useEffect(() => {
    if (offers.length === 0 || activeOrder) return;
    setCountdown(120);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadOffers(true);
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [offers.length, activeOrder]);

  // Subscribe to live WebSocket offers
  useEffect(() => {
    const unsubscribe = subscribeRiderOffers((rawOffer: any) => {
      const c_lat = rawOffer.customerCoords?.lat ?? rawOffer.pickupCoords?.lat ?? rawOffer.pickupLocation?.latitude ?? rawOffer.pickupLocation?.lat;
      const c_lng = rawOffer.customerCoords?.lng ?? rawOffer.pickupCoords?.lng ?? rawOffer.pickupLocation?.longitude ?? rawOffer.pickupLocation?.lng;
      const p_lat = rawOffer.partnerCoords?.lat ?? rawOffer.dropCoords?.lat ?? rawOffer.partnerLocation?.latitude ?? rawOffer.partnerLocation?.lat;
      const p_lng = rawOffer.partnerCoords?.lng ?? rawOffer.dropCoords?.lng ?? rawOffer.partnerLocation?.longitude ?? rawOffer.partnerLocation?.lng;

      const custCoords = c_lat != null && c_lng != null ? { lat: Number(c_lat), lng: Number(c_lng) } : undefined;
      const partCoords = p_lat != null && p_lng != null ? { lat: Number(p_lat), lng: Number(p_lng) } : undefined;

      const newOffer: OrderOfferItem = {
        id: rawOffer.id || rawOffer._id || `off-${Date.now()}`,
        orderId: rawOffer.orderId || rawOffer.id,
        orderCode: rawOffer.orderCode || rawOffer.code || (rawOffer.orderId ? String(rawOffer.orderId).slice(-6).toUpperCase() : undefined),
        type: rawOffer.type || "bike",
        rideType: rawOffer.rideType || (rawOffer.type === "delivery" || rawOffer.type === "handover_delivery" ? "delivery" : "pickup"),
        pickupTitle: rawOffer.pickupTitle || (rawOffer.rideType === "delivery" ? (rawOffer.partnerName || "Partner Store") : "Customer Pickup"),
        pickupAddress: rawOffer.pickupAddress || "",
        dropTitle: rawOffer.dropTitle || (rawOffer.rideType === "delivery" ? (rawOffer.customerName || "Customer Delivery") : (rawOffer.partnerName || "Partner Store")),
        dropAddress: rawOffer.dropAddress || "",
        pickupDistanceKm: rawOffer.pickupDistanceKm || 0.5,
        dropDistanceKm: rawOffer.dropDistanceKm || 2.5,
        fare: Number(rawOffer.fare || rawOffer.estimatedEarning || 45.0),
        amount: Number(rawOffer.amount || rawOffer.total_amount || 0),
        paymentMode: rawOffer.paymentMode || rawOffer.payment_method || "cod",
        customerName: rawOffer.customerName || "Customer",
        customerPhone: rawOffer.customerPhone || "",
        partnerName: rawOffer.partnerName || "QuickPress Partner Store",
        partnerPhone: rawOffer.partnerPhone || "",
        partnerAddress: rawOffer.partnerAddress || "",
        pickupOtp: rawOffer.pickupOtp ? String(rawOffer.pickupOtp) : undefined,
        deliveryOtp: rawOffer.deliveryOtp ? String(rawOffer.deliveryOtp) : undefined,
        dispatchOtp: rawOffer.dispatchOtp ? String(rawOffer.dispatchOtp) : undefined,
        customerCoords: custCoords,
        partnerCoords: partCoords,
        pickupCoords: rawOffer.rideType === "delivery" ? partCoords : custCoords,
        dropCoords: rawOffer.rideType === "delivery" ? custCoords : partCoords,
        items: rawOffer.items || [],
        placedAt: rawOffer.placedAt || rawOffer.createdAt,
        expiresInSeconds: 120,
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
      orderCode: offer.orderCode || targetId.slice(-6).toUpperCase(),
      customerName: offer.customerName || "Customer",
      customerPhone: offer.customerPhone || "",
      partnerName: offer.partnerName || "QuickPress Partner Store",
      partnerPhone: offer.partnerPhone || "",
      partnerAddress: offer.partnerAddress || offer.dropAddress,
      pickupAddress: offer.pickupAddress || offer.pickupTitle || "Customer Pickup Location",
      pickupTitle: offer.pickupTitle || "Pickup Location",
      dropAddress: offer.dropAddress || offer.dropTitle || "QuickPress Partner Hub",
      dropTitle: offer.dropTitle || "Partner Hub",
      distanceMeters: Math.round((offer.pickupDistanceKm || 1.2) * 1000),
      pickupDistanceKm: offer.pickupDistanceKm || 1.2,
      dropDistanceKm: offer.dropDistanceKm || 2.5,
      fare: offer.fare || 45.0,
      amount: offer.amount || offer.fare || 45.0,
      paymentMode: offer.paymentMode || "cod",
      items: offer.items || [],
      placedAt: offer.placedAt || new Date().toISOString(),
      startOtp: offer.pickupOtp || "",
      deliveryOtp: offer.deliveryOtp || "",
      dispatchOtp: offer.dispatchOtp || "",
      customerCoords: offer.customerCoords,
      partnerCoords: offer.partnerCoords,
      pickupCoords: offer.pickupCoords,
      dropCoords: offer.dropCoords,
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
          newActiveOrder.startOtp;
        const deliveryOtp =
          (typeof ord.otp?.delivery === "object" ? ord.otp?.delivery?.code : ord.otp?.delivery) ||
          ord.deliveryOtp ||
          newActiveOrder.deliveryOtp;
        const dispatchOtp =
          (typeof ord.otp?.dispatch === "object" ? ord.otp?.dispatch?.code : ord.otp?.dispatch) ||
          ord.dispatchOtp ||
          newActiveOrder.dispatchOtp;

        const c_loc = ord.pickupLocation || ord.customerLocation || ord.deliveryLocation;
        const p_loc = ord.partnerLocation || ord.storeLocation;
        const c_lat = ord.customerCoords?.lat ?? c_loc?.latitude ?? c_loc?.lat;
        const c_lng = ord.customerCoords?.lng ?? c_loc?.longitude ?? c_loc?.lng;
        const p_lat = ord.partnerCoords?.lat ?? p_loc?.latitude ?? p_loc?.lat;
        const p_lng = ord.partnerCoords?.lng ?? p_loc?.longitude ?? p_loc?.lng;

        const custCoords = c_lat != null && c_lng != null ? { lat: Number(c_lat), lng: Number(c_lng) } : newActiveOrder.customerCoords;
        const partCoords = p_lat != null && p_lng != null ? { lat: Number(p_lat), lng: Number(p_lng) } : newActiveOrder.partnerCoords;

        const updatedActiveOrder: ActiveOrderData = {
          ...newActiveOrder,
          orderCode: ord.code || ord.orderCode || targetId.slice(-6).toUpperCase(),
          startOtp: pickupOtp ? String(pickupOtp) : newActiveOrder.startOtp,
          deliveryOtp: deliveryOtp ? String(deliveryOtp) : newActiveOrder.deliveryOtp,
          dispatchOtp: dispatchOtp ? String(dispatchOtp) : newActiveOrder.dispatchOtp,
          customerCoords: custCoords,
          partnerCoords: partCoords,
          pickupCoords: ord.rideType === "delivery" ? partCoords : custCoords,
          dropCoords: ord.rideType === "delivery" ? custCoords : partCoords,
          customerName: ord.customerName || newActiveOrder.customerName,
          customerPhone: ord.customerPhone || newActiveOrder.customerPhone,
          partnerName: ord.partnerName || newActiveOrder.partnerName,
          partnerPhone: ord.partnerPhone || newActiveOrder.partnerPhone,
          partnerAddress: ord.partnerAddress || newActiveOrder.partnerAddress,
          pickupAddress: ord.pickupAddress || newActiveOrder.pickupAddress,
          dropAddress: ord.deliveryAddress || ord.dropAddress || newActiveOrder.dropAddress,
          paymentMode: ord.paymentMode || ord.payment?.mode || newActiveOrder.paymentMode,
          amount: Number(ord.amount ?? ord.totalAmount ?? newActiveOrder.amount),
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
      {/* 1. Header with Live Orders Title */}
      <div
        className="sticky top-0 z-30 px-4 pb-3 bg-white border-b border-neutral-100 shadow-2xs"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px) + 12px, 16px)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-neutral-950 tracking-tight flex items-center gap-2">
              <span>{t("orders.liveQueue", "Live Order Queue")}</span>
              {totalOrders > 0 && (
                <span className="flex h-2.5 w-2.5 rounded-full bg-[#00C853] animate-pulse" />
              )}
            </h1>
            <p className="text-[11px] font-medium text-neutral-500">
              {totalOrders > 0
                ? `${totalOrders} ${t("orders.pendingDispatches", "active order(s) available")}`
                : t("orders.waitingNotice", "Stay in your Work Zone to receive instant dispatches")}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => loadOffers()}
              disabled={isLoading}
              className="p-2 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 rounded-full active:scale-95 transition-all"
              title="Refresh Queue"
            >
              <RotateCw
                className={`w-4 h-4 ${isLoading ? "animate-spin text-[#00C853]" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>

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
                          className={`${
                            offers[0]?.rideType === "delivery" ||
                            offers[0]?.type === "delivery" ||
                            offers[0]?.isTransfer
                              ? "text-blue-600"
                              : "text-[#00C853]"
                          } transition-all duration-1000 ease-linear`}
                          strokeDasharray={`${(countdown / 120) * 100}, 100`}
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
                    {/* 2-Minute SLA Banner */}
                    {isTop && (
                      <div className="mb-3 flex items-center justify-between rounded-xl bg-amber-50 px-3 py-1.5 text-[11px] font-black text-amber-900 border border-amber-300">
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-3.5 text-amber-600 animate-pulse" />
                          <span>2-Minute Captain SLA</span>
                        </span>
                        <span className="font-mono text-xs font-black text-amber-800">
                          ⏱️ {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")} remaining
                        </span>
                      </div>
                    )}

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
        )}

      {/* 3. Strictly 2-Tab Bottom Navigation */}
      <RiderBottomNav active="orders" ordersBadgeCount={totalOrders} />
    </div>
  );
}
