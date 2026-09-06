import { useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  IndianRupee,
  KeyRound,
  MapPin,
  Navigation,
  Package,
  PackageCheck,
  Phone,
  ShieldCheck,
  Truck,
  AlertTriangle,
  Banknote,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { playSuccessChime, triggerHaptic } from "../../lib/captain-audio";
import { LiveDeliveryMap } from "../map/LiveDeliveryMap";

export type ActiveOrder = {
  id: string;
  order_number?: string;
  code?: string;
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  store_name?: string;
  store_phone?: string;
  pickup_address?: string;
  status:
    | "assigned"
    | "picked_up"
    | "in_transit_to_store"
    | "ready_for_delivery"
    | "out_for_delivery"
    | "delivered"
    | "completed"
    | string;
  ride_type?: "pickup" | "delivery";
  delivery_fee?: number;
  total_amount?: number;
  payment_method?: "cod" | "online";
  items_count?: number;
  service_name?: string;
  pickup_otp?: string;
  delivery_otp?: string;
};

export function ActiveDeliveryCockpit({
  order,
  onUpdateStatus,
  riderCoords,
}: {
  order: ActiveOrder;
  onUpdateStatus: (orderId: string, nextStatus: ActiveOrder["status"], otp?: string) => Promise<void> | void;
  riderCoords?: { lat: number; lng: number } | null;
}) {
  const [otpInput, setOtpInput] = useState(order.pickup_otp || order.delivery_otp || "");
  const [busy, setBusy] = useState(false);

  // Determine if this is Leg 1 (Pickup) or Leg 2 (Delivery)
  const isDeliveryLeg =
    order.ride_type === "delivery" ||
    order.status === "ready_for_delivery" ||
    order.status === "out_for_delivery";

  // Sub-phases:
  // For Pickup: 'assigned' (at customer) -> 'picked_up' (en route to store)
  // For Delivery: 'assigned'/'ready_for_delivery' (at store) -> 'out_for_delivery' (at customer doorstep)
  const isAtCustomerPickup = !isDeliveryLeg && (order.status === "assigned" || (order.status as any) === "pending");
  const isEnRouteToStore = !isDeliveryLeg && !isAtCustomerPickup;

  const isCollectingFromStore = isDeliveryLeg && (order.status === "assigned" || order.status === "ready_for_delivery");
  const isAtCustomerDoorstep = isDeliveryLeg && !isCollectingFromStore;

  // Determine current destination
  let targetAddress = "Kasganj Hub";
  let targetName = "Destination";
  let targetPhone = "9876543210";
  let stepTitle = "DELIVERY TASK";
  let stepSubtitle = "Proceed with mission";

  if (!isDeliveryLeg) {
    if (isAtCustomerPickup) {
      stepTitle = "STEP 1/2: CUSTOMER LAUNDRY PICKUP";
      stepSubtitle = "Pick up clothes & verify OTP";
      targetName = order.customer_name || "Customer";
      targetAddress = order.delivery_address || order.pickup_address || "Customer Address, Kasganj";
      targetPhone = order.customer_phone || "9876543210";
    } else {
      stepTitle = "STEP 2/2: HANDOVER TO LAUNDRY STORE";
      stepSubtitle = "Drop dirty clothes bags at store";
      targetName = order.store_name || "QuickPress Partner Store";
      targetAddress = order.pickup_address || "Partner Store Hub, Kasganj";
      targetPhone = order.store_phone || "9876543210";
    }
  } else {
    if (isCollectingFromStore) {
      stepTitle = "STEP 1/2: STORE COLLECTION";
      stepSubtitle = "Collect cleaned packaged garments";
      targetName = order.store_name || "QuickPress Partner Store";
      targetAddress = order.pickup_address || "Partner Store Hub, Kasganj";
      targetPhone = order.store_phone || "9876543210";
    } else {
      stepTitle = "STEP 2/2: CUSTOMER DOORSTEP DELIVERY";
      stepSubtitle = "Handover clean clothes & verify OTP";
      targetName = order.customer_name || "Customer";
      targetAddress = order.delivery_address || "Customer Address, Kasganj";
      targetPhone = order.customer_phone || "9876543210";
    }
  }

  // 1-Tap Google Maps Navigation
  const handleOpenMaps = () => {
    triggerHaptic(50);
    const destination = encodeURIComponent(targetAddress);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(mapsUrl, "_blank");
  };

  // 1-Tap Call Phone
  const handleCall = () => {
    triggerHaptic(50);
    const cleanPhone = targetPhone.replace(/\D/g, "");
    window.location.href = `tel:${cleanPhone}`;
  };

  // Step 1 Pickup: Customer Pickup with OTP
  const handleConfirmPickup = async () => {
    if (busy) return;
    if (otpInput.trim().length !== 4 && otpInput.trim() !== "") {
      toast.error("Please enter a valid 4-digit Customer Pickup OTP");
      return;
    }
    setBusy(true);

    try {
      await onUpdateStatus(order.id, "picked_up", otpInput.trim() || "0000");
      playSuccessChime();
      toast.success("Clothes collected! Now proceed to deliver to Laundry Store.");
      setOtpInput("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update pickup status");
    } finally {
      setBusy(false);
    }
  };

  // Step 2 Pickup: Handover to Partner Store
  const handleConfirmStoreDrop = async () => {
    if (busy) return;
    setBusy(true);

    try {
      await onUpdateStatus(order.id, "delivered");
      playSuccessChime();
      toast.success(
        `Order handed over to Store! ₹${order.delivery_fee || 60} credited to your wallet.`
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to complete store handover");
    } finally {
      setBusy(false);
    }
  };

  // Step 1 Delivery: Start delivery from Store
  const handleStartDeliveryFromStore = async () => {
    if (busy) return;
    setBusy(true);

    try {
      await onUpdateStatus(order.id, "out_for_delivery");
      playSuccessChime();
      toast.success("Package collected from Store! Proceed to Customer Doorstep.");
      setOtpInput("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to start delivery");
    } finally {
      setBusy(false);
    }
  };

  // Step 2 Delivery: Complete Doorstep Delivery with OTP & COD Check
  const handleConfirmDoorstepDelivery = async () => {
    if (busy) return;
    if (otpInput.trim().length !== 4 && otpInput.trim() !== "") {
      toast.error("Please enter the 4-digit Customer Delivery OTP");
      return;
    }
    setBusy(true);

    try {
      await onUpdateStatus(order.id, "delivered", otpInput.trim() || "0000");
      playSuccessChime();
      toast.success(
        `Order delivered to Customer! ₹${order.delivery_fee || 60} payout credited to your wallet. 🎉`
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to complete doorstep delivery");
    } finally {
      setBusy(false);
    }
  };

  const currentRiderPoint = riderCoords
    ? { lat: riderCoords.lat, lng: riderCoords.lng, label: "Captain (You)" }
    : { lat: 27.8118, lng: 78.6477, label: "Captain (You)" };

  const targetPoint = {
    lat: currentRiderPoint.lat + (isAtCustomerPickup || isAtCustomerDoorstep ? 0.0075 : -0.0065),
    lng: currentRiderPoint.lng + (isAtCustomerPickup || isAtCustomerDoorstep ? 0.0065 : -0.0055),
    label: targetName,
    sublabel: targetAddress,
  };

  const isCOD = order.payment_method === "cod";

  return (
    <div className="w-full select-none">
      <div className="overflow-hidden rounded-3xl border-2 border-emerald-800 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Action Header Banner */}
        <div className="bg-emerald-900 px-5 py-4 sm:px-6 flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xs text-white">
              {isAtCustomerPickup || isCollectingFromStore ? (
                <Package className="size-5" />
              ) : (
                <Truck className="size-5" />
              )}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                {stepTitle}
              </p>
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white uppercase">
                {stepSubtitle}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="rounded-full bg-emerald-800 border border-emerald-700 px-3 py-1 text-xs font-black text-white">
              ₹{order.delivery_fee || 60} Payout
            </span>
            <p className="text-[10px] text-emerald-300 mt-1 font-semibold">
              Order #{order.order_number || order.id}
            </p>
          </div>
        </div>

        {/* COD CASH COLLECTION PROMPT (When Doorstep Delivery and Payment Method is COD) */}
        {isAtCustomerDoorstep && isCOD && (
          <div className="bg-amber-500 text-amber-950 px-5 py-3 border-b border-amber-600 flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-amber-950 text-amber-300 flex items-center justify-center shrink-0">
                <Banknote className="size-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider">
                  CASH ON DELIVERY (COD) ORDER
                </p>
                <p className="text-xs font-black">
                  Collect ₹{order.total_amount || 450} Cash from Customer before handing over clothes!
                </p>
              </div>
            </div>
            <span className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-950 text-amber-200 text-xs font-black">
              ₹{order.total_amount || 450}
            </span>
          </div>
        )}

        {/* Location & Contact Information */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-xs">
                {isAtCustomerPickup || isAtCustomerDoorstep ? (
                  <MapPin className="size-5" />
                ) : (
                  <Building2 className="size-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  {isAtCustomerPickup || isAtCustomerDoorstep
                    ? "Customer Location"
                    : "Partner Store Destination"}
                </span>
                <h4 className="text-base sm:text-lg font-black text-slate-900 truncate mt-0.5">
                  {targetName}
                </h4>
                <p className="text-xs sm:text-sm font-medium text-slate-700 mt-0.5 leading-relaxed">
                  {targetAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Real-time Interactive Leaflet Live Map */}
          <div className="overflow-hidden rounded-2xl border border-emerald-200">
            <LiveDeliveryMap
              riderLocation={currentRiderPoint}
              destinationLocation={targetPoint}
              phase={isAtCustomerPickup || isCollectingFromStore ? "pickup" : "delivery"}
              heightClassName="h-60 sm:h-72"
              onOpenNavigation={handleOpenMaps}
            />
          </div>

          {/* TWO GIANT 1-TAP ACTION BUTTONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1-Tap Google Maps GPS */}
            <button
              type="button"
              onClick={handleOpenMaps}
              className="flex h-[54px] items-center justify-center gap-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white font-black text-sm shadow-md transition-all cursor-pointer"
            >
              <Navigation className="size-5" />
              <span>START GOOGLE MAPS GPS</span>
            </button>

            {/* 1-Tap Call Phone */}
            <button
              type="button"
              onClick={handleCall}
              className="flex h-[54px] items-center justify-center gap-2.5 rounded-2xl border-2 border-emerald-800 bg-white hover:bg-emerald-50 active:scale-98 text-emerald-900 font-black text-sm shadow-xs transition-all cursor-pointer"
            >
              <Phone className="size-5 text-emerald-800" />
              <span>
                CALL {isAtCustomerPickup || isAtCustomerDoorstep ? "CUSTOMER" : "STORE"}
              </span>
            </button>
          </div>

          {/* Order Summary Info */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-950 font-bold">
              <Package className="size-4 text-emerald-800" />
              <span>
                {order.service_name || "Laundry & Dry Clean"} · {order.items_count || 3} Bags
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="rounded-md bg-white border border-emerald-200 text-emerald-800 px-2 py-0.5 font-black">
                {isCOD ? "COD Cash: ₹" + (order.total_amount || 450) : "Prepaid Online"}
              </span>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* STAGE A: LEG 1 - CUSTOMER PICKUP WITH 4-DIGIT OTP             */}
          {/* ------------------------------------------------------------- */}
          {isAtCustomerPickup && (
            <div className="space-y-3 pt-1">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="customer-otp-input"
                    className="flex items-center gap-1.5 text-xs font-black text-emerald-900 uppercase"
                  >
                    <KeyRound className="size-3.5 text-emerald-800" />
                    <span>Customer Pickup OTP</span>
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    Ask customer for 4-digit code
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="customer-otp-input"
                    type="tel"
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="Enter 4-Digit OTP"
                    className="h-12 w-full rounded-xl border-2 border-emerald-300 bg-white px-3 text-center text-lg font-black tracking-widest text-emerald-950 placeholder:text-slate-400 placeholder:text-xs placeholder:tracking-normal focus:border-emerald-800 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setOtpInput("1234");
                      toast.success("Auto-filled demo OTP: 1234");
                    }}
                    className="shrink-0 rounded-xl border border-emerald-300 bg-white px-3 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 active:scale-95 cursor-pointer"
                  >
                    Demo OTP
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmPickup}
                disabled={busy}
                className="flex h-[58px] w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white font-black text-base shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <PackageCheck className="size-6 text-emerald-300" />
                <span>CONFIRM LAUNDRY PICKUP (VERIFY OTP)</span>
              </button>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STAGE B: LEG 1 - DROP AT PARTNER STORE                        */}
          {/* ------------------------------------------------------------- */}
          {isEnRouteToStore && (
            <div className="space-y-3 pt-1">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3 text-xs text-emerald-900 font-semibold flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-800 shrink-0" />
                <span>Clothes collected from customer. Now deliver bags to Partner Store.</span>
              </div>

              <button
                type="button"
                onClick={handleConfirmStoreDrop}
                disabled={busy}
                className="flex h-[58px] w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white font-black text-base shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <Building2 className="size-6 text-emerald-300" />
                <span>DELIVER &amp; HANDOVER TO STORE</span>
              </button>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STAGE C: LEG 2 - COLLECT PACKAGED CLOTHES FROM STORE          */}
          {/* ------------------------------------------------------------- */}
          {isCollectingFromStore && (
            <div className="space-y-3 pt-1">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3 text-xs text-emerald-900 font-semibold flex items-center gap-2">
                <Sparkles className="size-4 text-emerald-800 shrink-0" />
                <span>Clean clothes ready at Store. Collect packages &amp; start delivery.</span>
              </div>

              <button
                type="button"
                onClick={handleStartDeliveryFromStore}
                disabled={busy}
                className="flex h-[58px] w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white font-black text-base shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <PackageCheck className="size-6 text-emerald-300" />
                <span>COLLECT PACKAGES &amp; START DELIVERY</span>
              </button>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STAGE D: LEG 2 - DOORSTEP DELIVERY WITH OTP & COD VERIFICATION*/}
          {/* ------------------------------------------------------------- */}
          {isAtCustomerDoorstep && (
            <div className="space-y-3 pt-1">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="customer-delivery-otp-input"
                    className="flex items-center gap-1.5 text-xs font-black text-emerald-900 uppercase"
                  >
                    <KeyRound className="size-3.5 text-emerald-800" />
                    <span>Customer Delivery OTP</span>
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    Ask customer for 4-digit handover code
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="customer-delivery-otp-input"
                    type="tel"
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="Enter 4-Digit OTP"
                    className="h-12 w-full rounded-xl border-2 border-emerald-300 bg-white px-3 text-center text-lg font-black tracking-widest text-emerald-950 placeholder:text-slate-400 placeholder:text-xs placeholder:tracking-normal focus:border-emerald-800 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setOtpInput("1234");
                      toast.success("Auto-filled demo OTP: 1234");
                    }}
                    className="shrink-0 rounded-xl border border-emerald-300 bg-white px-3 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50 active:scale-95 cursor-pointer"
                  >
                    Demo OTP
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmDoorstepDelivery}
                disabled={busy}
                className="flex h-[58px] w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white font-black text-base shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="size-6 text-emerald-300" />
                <span>CONFIRM DOORSTEP DELIVERY (VERIFY OTP)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
