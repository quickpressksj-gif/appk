import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock3,
  IndianRupee,
  MapPin,
  Package,
  Radio,
  Sparkles,
  Store,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import type { RiderOrder } from "@/shared/types/rider";
import {
  playAcceptSuccessChime,
  playDeclineChime,
  startOrderAlertRing,
  stopOrderAlertRing,
} from "../../lib/order-alert-sound";

interface IncomingOrderAlertModalProps {
  order: RiderOrder | null;
  isOpen: boolean;
  onAccept: (order: RiderOrder) => Promise<void> | void;
  onReject: (order: RiderOrder) => Promise<void> | void;
  countdownSeconds?: number;
}

export function IncomingOrderAlertModal({
  order,
  isOpen,
  onAccept,
  onReject,
  countdownSeconds = 45,
}: IncomingOrderAlertModalProps) {
  const [timeLeft, setTimeLeft] = useState(countdownSeconds);
  const [isMuted, setIsMuted] = useState(false);
  const [busy, setBusy] = useState(false);

  // Start sound & haptics when modal opens
  useEffect(() => {
    if (isOpen && order) {
      setTimeLeft(countdownSeconds);
      startOrderAlertRing(isMuted);
    } else {
      stopOrderAlertRing();
    }
    return () => {
      stopOrderAlertRing();
    };
  }, [isOpen, order]);

  // Handle mute toggling
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (next) {
      stopOrderAlertRing();
    } else {
      startOrderAlertRing(false);
    }
  };

  // Countdown timer loop
  useEffect(() => {
    if (!isOpen || !order) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          stopOrderAlertRing();
          playDeclineChime();
          void onReject(order);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, order, onReject]);

  if (!isOpen || !order) return null;

  const progressPercent = Math.max(0, (timeLeft / countdownSeconds) * 100);
  const isUrgent = timeLeft <= 10;
  const isWarning = timeLeft <= 20;

  const handleAcceptClick = async () => {
    setBusy(true);
    stopOrderAlertRing();
    playAcceptSuccessChime();
    try {
      await onAccept(order);
    } finally {
      setBusy(false);
    }
  };

  const handleRejectClick = async () => {
    setBusy(true);
    stopOrderAlertRing();
    playDeclineChime();
    try {
      await onReject(order);
    } finally {
      setBusy(false);
    }
  };

  const earning = order.estimatedEarning ?? 65;
  const distance = order.distanceKm ?? 2.8;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="incoming-order-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
    >
      {/* Pulse Rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="size-[36rem] rounded-full bg-emerald-500/10 animate-ping blur-2xl" />
        <div className="size-[28rem] rounded-full bg-emerald-500/15 animate-pulse blur-xl" />
      </div>

      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border-2 border-emerald-400 bg-white text-slate-900 shadow-2xl animate-scale-up">
        {/* Top Urgency Header Bar */}
        <div className="relative bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-3.5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-300 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-amber-400" />
              </span>
              <span
                id="incoming-order-title"
                className="text-xs font-black uppercase tracking-wider text-white"
              >
                New Trip Offer Assigned
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleMute}
                aria-label={isMuted ? "Unmute Alert Sound" : "Mute Alert Sound"}
                className="flex size-7 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all active:scale-90"
              >
                {isMuted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
              </button>

              <span className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-xs font-black text-amber-200">
                #{order.code || order.id}
              </span>
            </div>
          </div>

          {/* Countdown Progress Bar */}
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-emerald-950/40">
            <div
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                isUrgent ? "bg-rose-400" : isWarning ? "bg-amber-300" : "bg-emerald-300"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Earnings & Timer Highlight */}
          <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/70 p-4 border border-emerald-200/80">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                Estimated Trip Earnings
              </p>
              <p className="mt-0.5 flex items-center text-3xl font-black text-emerald-900 tracking-tight">
                <IndianRupee className="size-6 text-emerald-700" strokeWidth={2.6} />
                {earning}
              </p>
              <p className="mt-0.5 text-[11px] font-bold text-emerald-700">
                + Instant Wallet Credit upon delivery
              </p>
            </div>

            {/* Timer Bubble */}
            <div
              className={`flex flex-col items-center justify-center size-14 rounded-2xl border-2 font-mono transition-colors shadow-sm ${
                isUrgent
                  ? "border-rose-500 bg-rose-50 text-rose-600 animate-bounce"
                  : isWarning
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-emerald-500 bg-emerald-50 text-emerald-800"
              }`}
            >
              <span className="text-lg font-black leading-none">{timeLeft}s</span>
              <span className="text-[9px] font-bold uppercase tracking-wider">Left</span>
            </div>
          </div>

          {/* Trip Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-2">
              <p className="text-[9px] font-bold uppercase text-slate-500">Distance</p>
              <p className="mt-0.5 font-black text-slate-900">{distance} KM</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-2">
              <p className="text-[9px] font-bold uppercase text-slate-500">Est. Time</p>
              <p className="mt-0.5 font-black text-slate-900">{Math.round(distance * 4.5)} Mins</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-2">
              <p className="text-[9px] font-bold uppercase text-slate-500">Service</p>
              <p className="mt-0.5 truncate font-black text-slate-900">
                {order.itemsSummary || "Laundry"}
              </p>
            </div>
          </div>

          {/* Pickup & Drop Points */}
          <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5">
            {/* Pickup */}
            <div className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 border border-amber-200 font-bold">
                <Store className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                  Step 1: Store Pickup
                </p>
                <p className="truncate text-xs font-black text-slate-900">
                  {order.partnerName || "Kasganj Partner Hub"}
                </p>
                <p className="truncate text-[11px] text-slate-500 font-medium">
                  {order.pickupAddress || "Main Market, Kasganj"}
                </p>
              </div>
            </div>

            {/* Connecting line */}
            <div className="ml-3.5 h-3 w-0.5 bg-slate-300" />

            {/* Drop-off */}
            <div className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold">
                <MapPin className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                  Step 2: Customer Drop
                </p>
                <p className="truncate text-xs font-black text-slate-900">
                  {order.customerName || "Customer Delivery"}
                </p>
                <p className="truncate text-[11px] text-slate-500 font-medium">
                  {order.deliveryAddress || "Customer Home Address"}
                </p>
              </div>
            </div>
          </div>

          {/* Action CTAs: Rapido Style Swipe-to-Accept Slider */}
          <div className="pt-2 space-y-3">
            <RapidoSwipeAcceptSlider
              earning={earning}
              busy={busy}
              onAccept={handleAcceptClick}
            />

            {/* Reject Button */}
            <button
              type="button"
              disabled={busy}
              onClick={handleRejectClick}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 active:scale-[0.98] transition-all cursor-pointer"
            >
              <X className="size-3.5" />
              <span>Decline Offer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 🛵 Rapido / Uber Style Swipe-to-Accept Slider
 */
function RapidoSwipeAcceptSlider({
  earning,
  busy,
  onAccept,
}: {
  earning: number;
  busy: boolean;
  onAccept: () => void | Promise<void>;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const startXRef = React.useRef(0);

  const maxDrag = useMemo(() => {
    if (containerRef.current) {
      return containerRef.current.clientWidth - 60;
    }
    return 240;
  }, [containerRef.current?.clientWidth]);

  const handleStart = (clientX: number) => {
    if (busy || isSuccess) return;
    setIsDragging(true);
    startXRef.current = clientX - dragX;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || busy || isSuccess) return;
    const delta = clientX - startXRef.current;
    const clamped = Math.max(0, Math.min(maxDrag, delta));
    setDragX(clamped);
  };

  const handleEnd = () => {
    if (!isDragging || busy || isSuccess) return;
    setIsDragging(false);
    if (dragX >= maxDrag * 0.75) {
      // Swiped past 75% -> Accept
      setDragX(maxDrag);
      setIsSuccess(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate([40, 60, 100]);
        } catch {}
      }
      void onAccept();
    } else {
      // Snap back to start
      setDragX(0);
    }
  };

  // Touch event listeners
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();

  // Mouse event listeners
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX);
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };
    const onMouseUp = () => {
      if (isDragging) handleEnd();
    };
    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, maxDrag]);

  const progressPercent = maxDrag > 0 ? (dragX / maxDrag) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      className="relative flex h-14 w-full select-none items-center overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-1.5 shadow-lg shadow-emerald-700/30 border border-emerald-400/50 cursor-pointer"
    >
      {/* Fill progress track */}
      <div
        className="absolute inset-y-0 left-0 bg-emerald-500 transition-all duration-75 ease-out rounded-2xl"
        style={{ width: `${dragX + 54}px` }}
      />

      {/* Shimmering Centered Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className={`text-xs font-black uppercase tracking-widest text-white transition-opacity duration-300 ${
            progressPercent > 40 ? "opacity-30" : "opacity-100 animate-pulse"
          }`}
        >
          {isSuccess ? "TRIP ACCEPTED! 🚀" : `SWIPE TO ACCEPT (₹${earning}) ➔`}
        </span>
      </div>

      {/* Draggable Handle */}
      <div
        className={`relative z-10 flex size-11 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-md transition-transform ${
          isDragging ? "scale-105" : "transition-all duration-200"
        }`}
        style={{ transform: `translateX(${dragX}px)` }}
      >
        {isSuccess ? (
          <Check className="size-6 text-emerald-600 stroke-[3] animate-scale-up" />
        ) : (
          <ArrowRight className="size-6 stroke-[3] text-emerald-700 animate-pulse" />
        )}
      </div>
    </div>
  );
}
