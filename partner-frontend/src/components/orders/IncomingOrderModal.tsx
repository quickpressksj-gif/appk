import { Bell, Check, Clock, MapPin, Package, Phone, User, Volume2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ManagedOrder } from "../../data/partner-orders-mock";
import { stopOrderAlarm } from "../../lib/order-alarm";

type IncomingOrderModalProps = {
  order: ManagedOrder | null;
  onAccept: (orderId: string) => Promise<void>;
  onReject: (orderId: string, reason: string) => Promise<void>;
  onDismiss: () => void;
};

const REJECT_REASONS = [
  "Store is currently closed",
  "Capacity full / High order volume",
  "Service unavailable / Machine maintenance",
  "Out of service area",
  "Other issue",
];

export function IncomingOrderModal({
  order,
  onAccept,
  onReject,
  onDismiss,
}: IncomingOrderModalProps) {
  const [countdown, setCountdown] = useState(60);
  const [rejecting, setRejecting] = useState(false);
  const [selectedReason, setSelectedReason] = useState(REJECT_REASONS[0]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!order) return;
    setCountdown(60);
    setRejecting(false);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto-reject on 60-second window expiry
          stopOrderAlarm();
          void onReject(order.id, "Auto-rejected: Acceptance window expired (60s)");
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [order, onReject, onDismiss]);

  if (!order) return null;

  const handleAccept = async () => {
    stopOrderAlarm();
    onDismiss();
    try {
      await onAccept(order.id);
    } catch {
      // Handled in caller
    }
  };

  const handleReject = async () => {
    stopOrderAlarm();
    onDismiss();
    try {
      await onReject(order.id, selectedReason);
    } catch {
      // Handled in caller
    }
  };

  const progressPercent = (countdown / 60) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-t-[2rem] sm:rounded-3xl border border-border/60 bg-card shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        {/* Animated Sound Ring Banner */}
        <div className="relative overflow-hidden bg-primary px-6 py-4 text-primary-foreground">
          <div className="absolute -right-6 -top-6 size-28 rounded-full bg-white/20 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-2xl bg-black/20 text-white shadow-inner animate-bounce">
                <Bell className="size-5 fill-current" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-primary-foreground/90 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-red-500 animate-ping inline-block" />
                  New Incoming Order
                </p>
                <h3 className="text-lg font-black tracking-tight text-white">
                  Order #{order.code}
                </h3>
              </div>
            </div>

            {/* Countdown Badge */}
            <div className="flex flex-col items-end">
              <span className="flex items-center gap-1 rounded-full bg-black/30 px-3 py-1 text-xs font-black text-white">
                <Clock className="size-3.5" /> {countdown}s left
              </span>
              <span className="text-[10px] font-semibold text-primary-foreground/80 mt-0.5">
                Auto-alert active
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/20">
            <div
              className={`h-full transition-all duration-1000 ${
                countdown < 15 ? "bg-red-500" : countdown < 30 ? "bg-amber-400" : "bg-emerald-400"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Order Details Body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5 space-y-4">
          
          {/* Customer & Location */}
          <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span className="text-sm font-bold text-foreground">{order.customerName}</span>
              </div>
              {order.customerPhone ? (
                <a
                  href={`tel:${order.customerPhone}`}
                  className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  <Phone className="size-3.5" />
                  {order.customerPhone}
                </a>
              ) : null}
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground pt-1 border-t border-border/40">
              <MapPin className="size-3.5 shrink-0 mt-0.5 text-primary" />
              <span className="line-clamp-2">{order.pickupAddress || "Customer Pickup Address"}</span>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Order Items ({order.items.length || order.itemCount})</span>
              <span>Price</span>
            </p>
            <div className="divide-y divide-border/40 rounded-2xl border border-border/60 bg-card p-3">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 first:pt-0 last:pb-0 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-brand-dark">
                        {item.qty}×
                      </span>
                      <span className="font-semibold text-foreground">{item.name}</span>
                    </div>
                    <span className="font-bold text-foreground">₹{item.price * item.qty}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between py-1 text-sm">
                  <span className="font-semibold text-foreground">{order.services.join(", ") || "Laundry Services"}</span>
                  <span className="font-bold text-foreground">₹{order.amount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Grand Total & Payment Method */}
          <div className="flex items-center justify-between rounded-2xl bg-muted/60 p-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Payment Mode</p>
              <span className={`inline-block mt-0.5 rounded-md px-2 py-0.5 text-xs font-black ${
                order.paymentMode === "online" ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"
              }`}>
                {order.paymentMode === "online" ? "ONLINE (PAID)" : "CASH ON DELIVERY"}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Total Amount</p>
              <p className="text-2xl font-black text-foreground">₹{order.amount}</p>
            </div>
          </div>

          {/* Reject Reason Form (if clicked Reject) */}
          {rejecting ? (
            <div className="space-y-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 animate-in fade-in">
              <p className="text-xs font-bold text-destructive">Select reason for rejection:</p>
              <div className="space-y-1.5">
                {REJECT_REASONS.map((r, i) => (
                  <label key={i} className="flex items-center gap-2.5 text-xs font-medium text-foreground cursor-pointer">
                    <input
                      type="radio"
                      name="rejectReason"
                      value={r}
                      checked={selectedReason === r}
                      onChange={() => setSelectedReason(r)}
                      className="accent-destructive size-3.5"
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejecting(false)}
                  className="flex-1 rounded-xl border border-border bg-card py-2 text-xs font-bold text-foreground"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => void handleReject()}
                  disabled={isProcessing}
                  className="flex-1 rounded-xl bg-destructive py-2 text-xs font-black text-white hover:brightness-110"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Action Buttons */}
        {!rejecting ? (
          <div className="border-t border-border/80 bg-card p-4 sm:p-6 flex gap-3">
            <button
              type="button"
              onClick={() => setRejecting(true)}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl border border-border/80 bg-muted/60 py-4 text-sm font-bold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive hover:border-destructive active:scale-[0.98]"
            >
              <X className="size-4" /> Reject
            </button>
            <button
              type="button"
              onClick={() => void handleAccept()}
              disabled={isProcessing}
              className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/30 transition-all hover:bg-emerald-500 active:scale-[0.98]"
            >
              <Check className="size-5 stroke-[3]" />
              {isProcessing ? "Accepting..." : "ACCEPT ORDER"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
