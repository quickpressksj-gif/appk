import { CheckCircle2, ShieldCheck, Sparkles, UserRound, MapPin, X } from "lucide-react";
import React from "react";

export interface AadhaarExtractedData {
  aadhaar: string;
  maskedAadhaar: string;
  fullName: string;
  gender: string;
  dob: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  photo?: string;
}

interface AadhaarKycModalProps {
  isOpen: boolean;
  data: AadhaarExtractedData | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function AadhaarKycModal({
  isOpen,
  data,
  onConfirm,
  onClose,
}: AadhaarKycModalProps) {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-emerald-500/40 bg-zinc-950 p-6 text-white shadow-2xl">
        {/* Glowing Background Accent */}
        <div className="absolute -top-16 left-1/2 size-48 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
        >
          <X className="size-4" />
        </button>

        <div className="relative flex flex-col items-center text-center">
          {/* Badge */}
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 shadow-lg ring-2 ring-emerald-400/30">
            <ShieldCheck className="size-8 stroke-[2.2]" />
          </div>

          <h3 className="mt-3 text-lg font-black tracking-tight text-white">
            Store Owner UIDAI e-KYC Verified
          </h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            Official government identity record fetched successfully
          </p>

          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[0.68rem] font-bold text-emerald-400">
            <CheckCircle2 className="size-3.5" />
            Digitally Signed by UIDAI Registry
          </span>

          {/* Digital Aadhaar Card Preview */}
          <div className="mt-5 w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 text-left shadow-inner">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="relative flex size-12 items-center justify-center overflow-hidden rounded-xl bg-zinc-800 border border-zinc-700">
                  {data.photo ? (
                    <img src={data.photo} alt="UIDAI Photo" className="size-full object-cover" />
                  ) : (
                    <UserRound className="size-6 text-zinc-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">{data.fullName}</h4>
                  <p className="text-[0.7rem] text-zinc-400">
                    {data.gender} • DOB: {data.dob}
                  </p>
                </div>
              </div>
              <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[0.62rem] font-bold text-emerald-400">
                100% Genuine
              </span>
            </div>

            <div className="mt-3 space-y-1.5 text-[0.72rem]">
              <div className="flex items-start gap-2 text-zinc-300">
                <MapPin className="size-3.5 shrink-0 mt-0.5 text-amber-400" />
                <span className="leading-snug text-zinc-200">
                  {data.address || `${data.city}, ${data.state} - ${data.pincode}`}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-800/80 pt-2 text-[0.68rem] text-zinc-400">
                <span>Owner Aadhaar</span>
                <span className="font-mono font-bold text-zinc-200">{data.maskedAadhaar}</span>
              </div>
            </div>
          </div>

          {/* Auto-fill Action Button */}
          <button
            type="button"
            onClick={onConfirm}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3.5 text-xs font-black text-black shadow-lg shadow-amber-400/20 transition-transform hover:bg-amber-300 active:scale-[0.98]"
          >
            <Sparkles className="size-4 fill-black" />
            <span>Auto-Fill Owner & Address Details</span>
          </button>
        </div>
      </div>
    </div>
  );
}
