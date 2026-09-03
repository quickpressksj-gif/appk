import { useState } from "react";
import {
  ArrowRight,
  Bike,
  Building2,
  CheckCircle2,
  ChevronRight,
  IndianRupee,
  MapPin,
  Navigation,
  Package,
  PackageCheck,
  Phone,
  ShieldCheck,
  Sparkles,
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
  status: "assigned" | "arrived_store" | "picked_up" | "out_for_delivery" | "delivered";
  delivery_fee?: number;
  total_amount?: number;
  payment_method?: "cod" | "online";
  items_count?: number;
  service_name?: string;
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
  const [showOtpBox, setShowOtpBox] = useState(false);

  const isPickupPhase =
    order.status === "assigned" ||
    order.status === "arrived_store" ||
    (order.status as any) === "pending";

  const targetAddress = isPickupPhase
    ? order.pickup_address || "QuickPress Partner Store, Kasganj"
    : order.delivery_address || "Customer Address, Kasganj";

  const targetName = isPickupPhase
    ? order.store_name || "QuickPress Laundry Store"
    : order.customer_name || "Customer";

  const targetPhone = isPickupPhase
    ? order.store_phone || "9876543210"
    : order.customer_phone || "9876543210";

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

  // Step progression handler
  const handleMainAction = async () => {
    if (busy) return;
    setBusy(true);

    try {
      if (order.status === "assigned") {
        await onUpdateStatus(order.id, "arrived_store");
        playSuccessChime();
        toast.success("Marked: Arrived at Store! Now collect laundry bags.");
      } else if (order.status === "arrived_store") {
        await onUpdateStatus(order.id, "picked_up");
        playSuccessChime();
        toast.success("Order picked up successfully! Now proceed to customer delivery.");
      } else if (order.status === "picked_up") {
        await onUpdateStatus(order.id, "out_for_delivery");
        playSuccessChime();
        toast.success("Out for Delivery! Navigating to customer destination.");
      } else if (order.status === "out_for_delivery") {
        await onUpdateStatus(order.id, "delivered");
        playSuccessChime();
        toast.success("🎉 Order delivered successfully! ₹" + (order.delivery_fee || 55) + " added to your wallet.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update order status");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full select-none">
      <div className="overflow-hidden rounded-3xl border-2 border-emerald-500 bg-white shadow-xl">
        {/* Phase Header Bar */}
        <div
          className={`flex items-center justify-between p-4 sm:p-5 text-white ${
            isPickupPhase
              ? "bg-gradient-to-r from-amber-600 to-amber-700"
              : "bg-gradient-to-r from-emerald-600 to-teal-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-white/20 text-xs font-black">
              {isPickupPhase ? "1" : "2"}
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-white/80">
                {isPickupPhase ? "STEP 1 OF 2" : "STEP 2 OF 2"}
              </p>
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                {isPickupPhase ? "REACH STORE & PICKUP" : "DELIVER TO CUSTOMER"}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black text-white backdrop-blur-xs">
              ₹{order.delivery_fee || 55} Payout
            </span>
            <p className="text-[10px] text-white/80 mt-0.5">
              Order #{order.order_number || order.id}
            </p>
          </div>
        </div>

        {/* Location & Contact Information */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-2">
            <div className="flex items-start gap-3">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                  isPickupPhase
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {isPickupPhase ? (
                  <Building2 className="size-5" />
                ) : (
                  <MapPin className="size-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    {isPickupPhase ? "Pickup Location" : "Drop Destination"}
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-black text-slate-950 truncate">
                  {targetName}
                </h4>
                <p className="text-xs sm:text-sm font-medium text-slate-600 mt-0.5 leading-relaxed">
                  {targetAddress}
                </p>
              </div>
            </div>
          </div>

          {/* TWO GIANT 1-TAP BIKE BUTTONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1-Tap Google Maps */}
            <button
              type="button"
              onClick={handleOpenMaps}
              className="flex h-[54px] items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-md hover:bg-emerald-700 active:scale-98 transition-all cursor-pointer"
            >
              <Navigation className="size-5" />
              <span>START GOOGLE MAPS GPS</span>
            </button>

            {/* 1-Tap Call Phone */}
            <button
              type="button"
              onClick={handleCall}
              className="flex h-[54px] items-center justify-center gap-2.5 rounded-2xl border-2 border-slate-300 bg-white text-slate-900 font-black text-sm shadow-xs hover:bg-slate-50 active:scale-98 transition-all cursor-pointer"
            >
              <Phone className="size-5 text-emerald-600" />
              <span>CALL {isPickupPhase ? "STORE" : "CUSTOMER"}</span>
            </button>
          </div>

          {/* Order Details Summary */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600 font-semibold">
              <Package className="size-4 text-slate-400" />
              <span>{order.service_name || "Laundry & Dry Clean"} · {order.items_count || 2} Bags</span>
            </div>

            {order.payment_method === "cod" ? (
              <span className="rounded-md bg-amber-100 text-amber-900 px-2 py-0.5 font-bold">
                💵 Collect ₹{order.total_amount || 450} Cash
              </span>
            ) : (
              <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 font-bold">
                ✓ Paid Online
              </span>
            )}
          </div>

          {/* GIANT ACTION PROGRESSION BUTTON */}
          <div>
            {order.status === "assigned" && (
              <button
                type="button"
                onClick={handleMainAction}
                disabled={busy}
                className="flex h-[58px] w-full items-center justify-center gap-2.5 rounded-2xl bg-slate-900 hover:bg-black active:scale-98 text-white font-black text-base shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <MapPin className="size-5 text-amber-400" />
                <span>📍 I HAVE ARRIVED AT STORE</span>
              </button>
            )}

            {order.status === "arrived_store" && (
              <button
                type="button"
                onClick={handleMainAction}
                disabled={busy}
                className="flex h-[58px] w-full items-center justify-center gap-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 font-black text-base shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <PackageCheck className="size-5.5" />
                <span>📦 CONFIRM ORDER PICKUP</span>
              </button>
            )}

            {order.status === "picked_up" && (
              <button
                type="button"
                onClick={handleMainAction}
                disabled={busy}
                className="flex h-[58px] w-full items-center justify-center gap-2.5 rounded-2xl bg-slate-900 hover:bg-black active:scale-98 text-white font-black text-base shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <Truck className="size-5 text-emerald-400" />
                <span>🚀 START DELIVERY TO CUSTOMER</span>
              </button>
            )}

            {order.status === "out_for_delivery" && (
              <button
                type="button"
                onClick={handleMainAction}
                disabled={busy}
                className="flex h-[58px] w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-base shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="size-5.5" />
                <span>✅ CONFIRM DELIVERED TO CUSTOMER</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
