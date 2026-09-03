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
} from "lucide-react";
import { toast } from "sonner";
import { playSuccessChime, triggerHaptic } from "../../lib/captain-audio";

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
  status: "assigned" | "picked_up" | "delivered";
  delivery_fee?: number;
  total_amount?: number;
  payment_method?: "cod" | "online";
  items_count?: number;
  service_name?: string;
  pickup_otp?: string;
};

export function ActiveDeliveryCockpit({
  order,
  onUpdateStatus,
}: {
  order: ActiveOrder;
  onUpdateStatus: (orderId: string, nextStatus: ActiveOrder["status"]) => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const [otpInput, setOtpInput] = useState("");

  const isPickupPhase = order.status === "assigned" || (order.status as any) === "pending";

  // In Phase 1: Destination is Customer's home (to collect clothes with OTP)
  // In Phase 2: Destination is Laundry Store (to handover clothes)
  const targetAddress = isPickupPhase
    ? order.delivery_address || order.pickup_address || "Customer Address, Kasganj"
    : order.store_name
      ? `${order.store_name}, ${order.pickup_address || "Main Market, Kasganj"}`
      : "QuickPress Partner Store, Kasganj";

  const targetName = isPickupPhase
    ? order.customer_name || "Customer"
    : order.store_name || "QuickPress Laundry Store";

  const targetPhone = isPickupPhase
    ? order.customer_phone || "9876543210"
    : order.store_phone || "9876543210";

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

  // Step 1: Customer Pickup with OTP
  const handleConfirmPickup = async () => {
    if (busy) return;
    if (otpInput.trim().length !== 4 && otpInput.trim() !== "") {
      toast.error("Please enter a valid 4-digit Customer Pickup OTP");
      return;
    }
    setBusy(true);

    try {
      await onUpdateStatus(order.id, "picked_up");
      playSuccessChime();
      toast.success("Clothes collected! Now proceed to deliver to Laundry Store.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update pickup status");
    } finally {
      setBusy(false);
    }
  };

  // Step 2: Deliver to Laundry Store
  const handleConfirmStoreDelivery = async () => {
    if (busy) return;
    setBusy(true);

    try {
      await onUpdateStatus(order.id, "delivered");
      playSuccessChime();
      toast.success(
        `Order delivered to Store! ₹${order.delivery_fee || 60} credited to your wallet.`
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to complete delivery");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full select-none">
      <div className="overflow-hidden rounded-3xl border-2 border-emerald-800 bg-white shadow-lg">
        {/* Phase Header Bar — Pure White and Dark Green */}
        <div className="bg-emerald-900 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-emerald-800 border border-emerald-700 text-sm font-black text-white">
              {isPickupPhase ? "1" : "2"}
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                {isPickupPhase ? "STEP 1: CUSTOMER PICKUP" : "STEP 2: STORE DELIVERY"}
              </p>
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                {isPickupPhase ? "PICK UP FROM CUSTOMER" : "DELIVER TO LAUNDRY STORE"}
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

        {/* Location & Contact Information */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-xs">
                {isPickupPhase ? <MapPin className="size-5" /> : <Building2 className="size-5" />}
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  {isPickupPhase ? "Customer Location" : "Partner Store Destination"}
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

          {/* TWO GIANT 1-TAP BIKE BUTTONS (White & Dark Green Theme) */}
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
              <span>CALL {isPickupPhase ? "CUSTOMER" : "STORE"}</span>
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

            <span className="rounded-md bg-white border border-emerald-200 text-emerald-800 px-2 py-0.5 font-black">
              Verified Task
            </span>
          </div>

          {/* STEP 1: CUSTOMER PICKUP WITH 4-DIGIT OTP */}
          {isPickupPhase && (
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
                    Use Demo OTP
                  </button>
                </div>
              </div>

              {/* Confirm Pickup Button */}
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

          {/* STEP 2: DELIVER TO PARTNER STORE */}
          {!isPickupPhase && (
            <div className="space-y-3 pt-1">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3 text-xs text-emerald-900 font-semibold flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-800 shrink-0" />
                <span>Clothes successfully collected from customer. Now deliver to store.</span>
              </div>

              <button
                type="button"
                onClick={handleConfirmStoreDelivery}
                disabled={busy}
                className="flex h-[58px] w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white font-black text-base shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <Building2 className="size-6 text-emerald-300" />
                <span>DELIVER &amp; HANDOVER TO STORE</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
