import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Bike,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  Navigation,
  Phone,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { fetchHandoverStatus } from "@/api/rider/rider-orders-api";
import { playSuccessChime, speakText, triggerHaptic } from "@/lib/captain-audio";

interface RiderHandoverWaitingCardProps {
  orderId: string;
  orderCode?: string;
  handoverOtp?: string;
  pickupPayout?: number;
  onHandoverCompleted?: () => void;
}

export const RiderHandoverWaitingCard: React.FC<RiderHandoverWaitingCardProps> = ({
  orderId,
  orderCode,
  handoverOtp: initialOtp,
  pickupPayout: initialPayout = 28.0,
  onHandoverCompleted,
}) => {
  const [handoverOtp, setHandoverOtp] = useState<string>(initialOtp || "----");
  const [pickupPayout, setPickupPayout] = useState<number>(initialPayout);
  const [transferRider, setTransferRider] = useState<{
    id: string;
    name: string;
    phone: string;
    vehicleNumber?: string;
  } | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(true);

  useEffect(() => {
    let timer: any;

    const pollStatus = async () => {
      try {
        const data = await fetchHandoverStatus(orderId);
        if (data && data.ok) {
          if (data.handoverOtp) setHandoverOtp(data.handoverOtp);
          if (data.pickupLegPayout) setPickupPayout(data.pickupLegPayout);
          if (data.transferRider) setTransferRider(data.transferRider);

          // If status moved past handover or completed
          if (
            data.status === "out_for_delivery" ||
            data.status === "delivered" ||
            (data as any).handoverCompleted
          ) {
            setIsCompleted(true);
            setIsPolling(false);
            playSuccessChime();
            triggerHaptic();
            speakText("Handover successfully completed. Pickup payment credited to your wallet.");
            toast.success("Handover confirmed! Pickup payout added to your wallet.");
            if (onHandoverCompleted) onHandoverCompleted();
          }
        }
      } catch {
        // silent fail on poll
      }
    };

    pollStatus();
    timer = setInterval(pollStatus, 4000);

    return () => clearInterval(timer);
  }, [orderId, onHandoverCompleted]);

  const copyOtp = () => {
    navigator.clipboard.writeText(handoverOtp);
    toast.success("Handover OTP copied to clipboard!");
    triggerHaptic();
  };

  if (isCompleted) {
    return (
      <div className="bg-emerald-50 border-2 border-emerald-500 rounded-3xl p-6 text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div>
          <h3 className="text-lg font-black text-emerald-950">Package Handover Verified!</h3>
          <p className="text-xs text-emerald-800 mt-1">
            Custody has been transferred to Captain {transferRider?.name || "Partner"}.
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-left">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-[11px] text-slate-500 font-semibold">Pickup Leg Earning</p>
              <p className="text-base font-black text-slate-900">₹{pickupPayout.toFixed(2)}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            Credited to Wallet
          </span>
        </div>
      </div>
    );
  }

  const otpDigits = handoverOtp.padEnd(4, "-").slice(0, 4).split("");

  return (
    <div className="bg-white border-2 border-amber-400 rounded-3xl p-5 space-y-4 shadow-2xl relative overflow-hidden">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-amber-900">
            {transferRider ? "Replacement Captain Assigned" : "Searching Replacement Captain"}
          </span>
        </div>
        <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
          #{orderCode || orderId.slice(-6)}
        </span>
      </div>

      {/* Handover OTP Highlight Card */}
      <div className="bg-gradient-to-b from-amber-50 to-orange-50/50 border border-amber-200 rounded-2xl p-4 text-center space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wide">
          <KeyRound className="w-4 h-4 text-amber-600" />
          Physical Handover Verification OTP
        </div>

        <div className="flex items-center justify-center gap-3 py-2">
          {otpDigits.map((digit, i) => (
            <div
              key={i}
              className="w-12 h-14 rounded-xl bg-white border-2 border-amber-400/80 shadow-md flex items-center justify-center text-2xl font-black text-slate-900 font-mono tracking-tighter"
            >
              {digit}
            </div>
          ))}
        </div>

        <p className="text-[11px] text-amber-900 font-medium">
          Show this 4-digit code to the incoming Captain when they arrive. Do not hand over items without OTP
          verification.
        </p>

        <button
          type="button"
          onClick={copyOtp}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-white/80 px-3 py-1.5 rounded-full border border-amber-200 hover:bg-white active:scale-95 transition-all mx-auto"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy Code
        </button>
      </div>

      {/* Transfer Rider Details or Searching State */}
      {transferRider ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">Incoming Captain</p>
              <p className="text-sm font-bold text-slate-900">{transferRider.name}</p>
              {transferRider.vehicleNumber && (
                <p className="text-[11px] font-mono text-slate-600">{transferRider.vehicleNumber}</p>
              )}
            </div>
          </div>
          {transferRider.phone && (
            <a
              href={`tel:${transferRider.phone}`}
              className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 hover:bg-emerald-600 active:scale-95 transition-all"
            >
              <Phone className="w-5 h-5" />
            </a>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-amber-600 animate-spin shrink-0" />
          <div className="text-xs text-slate-700 leading-relaxed">
            Dispatching priority transfer offer to nearest online QuickPress Captains...
          </div>
        </div>
      )}

      {/* Payout Security Notice */}
      <div className="flex items-center justify-between text-xs bg-slate-100/70 p-3 rounded-xl">
        <div className="flex items-center gap-2 text-slate-600">
          <Wallet className="w-4 h-4 text-emerald-600" />
          <span>Pickup Leg Earning:</span>
        </div>
        <span className="font-black text-emerald-700 text-sm">₹{pickupPayout.toFixed(2)}</span>
      </div>
    </div>
  );
};
