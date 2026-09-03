import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  IndianRupee,
  MapPin,
  Navigation,
  Sparkles,
  X,
} from "lucide-react";
import { playOrderAlertSound, stopOrderAlertSound, playSuccessChime } from "../../lib/captain-audio";

export type IncomingOffer = {
  id: string;
  order_number?: string;
  store_name: string;
  pickup_address: string;
  customer_name: string;
  delivery_address: string;
  distance_km: number;
  payout_amount: number;
  items_summary?: string;
};

export function IncomingOrderAlertModal({
  offer,
  onAccept,
  onDecline,
}: {
  offer: IncomingOffer;
  onAccept: (offer: IncomingOffer) => void;
  onDecline: () => void;
}) {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    // Start loud siren
    playOrderAlertSound();

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          stopOrderAlertSound();
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      stopOrderAlertSound();
    };
  }, [onDecline]);

  const handleAcceptTrip = () => {
    stopOrderAlertSound();
    playSuccessChime();
    onAccept(offer);
  };

  const handleDeclineTrip = () => {
    stopOrderAlertSound();
    onDecline();
  };

  const progressPercent = (countdown / 30) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border-4 border-emerald-500 overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Countdown Header Bar */}
        <div className="bg-slate-950 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-3 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                NEW TRIP ALERT
              </span>
            </div>

            <span className="font-mono text-sm font-black text-amber-400">
              00:{countdown < 10 ? `0${countdown}` : countdown}
            </span>
          </div>

          {/* Progress timer bar */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Offer Details */}
        <div className="p-6 space-y-4">
          {/* Guaranteed Earning Highlight */}
          <div className="flex items-center justify-between rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                Guaranteed Trip Payout
              </p>
              <p className="flex items-center text-3xl font-black text-emerald-900 mt-0.5">
                <IndianRupee className="size-6 text-emerald-600" />
                {offer.payout_amount || 55}
              </p>
            </div>

            <div className="text-right">
              <span className="rounded-full bg-emerald-200/80 px-3 py-1 text-xs font-black text-emerald-950">
                {offer.distance_km || 2.4} km Trip
              </span>
              <p className="text-[10px] font-semibold text-emerald-700 mt-1">Estimated 18 mins</p>
            </div>
          </div>

          {/* Route Details */}
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
              <Building2 className="size-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Step 1: Pickup Store</p>
                <p className="text-sm font-black text-slate-900">{offer.store_name}</p>
                <p className="text-xs text-slate-600 mt-0.5">{offer.pickup_address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
              <MapPin className="size-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Step 2: Customer Drop</p>
                <p className="text-sm font-black text-slate-900">{offer.customer_name}</p>
                <p className="text-xs text-slate-600 mt-0.5">{offer.delivery_address}</p>
              </div>
            </div>
          </div>

          {/* Big Action Buttons */}
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleAcceptTrip}
              className="flex h-[56px] w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-base shadow-lg transition-all cursor-pointer"
            >
              <CheckCircle2 className="size-6" />
              <span>ACCEPT TRIP NOW</span>
            </button>

            <button
              type="button"
              onClick={handleDeclineTrip}
              className="flex h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 font-bold text-xs transition-all cursor-pointer"
            >
              <X className="size-4" />
              <span>Pass to Next Captain</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
