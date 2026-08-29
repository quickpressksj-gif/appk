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

  const displayPhoto =
    data.photo ||
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
        {/* Soft Glowing Ambient Background */}
        <div className="pointer-events-none absolute -top-16 left-1/2 size-48 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-colors"
        >
          <X className="size-4" />
        </button>

        <div className="relative flex flex-col items-center text-center">
          {/* Badge Icon */}
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-200 ring-4 ring-emerald-500/10">
            <ShieldCheck className="size-8 stroke-[2.2]" />
          </div>

          <h3 className="mt-3 text-lg font-black tracking-tight text-slate-900">
            Store Owner UIDAI e-KYC Verified
          </h3>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            Official government identity record fetched successfully
          </p>

          <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800">
            <CheckCircle2 className="size-3.5 text-emerald-600" />
            Digitally Signed by UIDAI Registry
          </span>

          {/* Digital Aadhaar Card Preview (White / Crisp Theme) */}
          <div className="mt-5 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-left shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="relative flex size-12 items-center justify-center overflow-hidden rounded-xl bg-white border border-slate-200 shadow-xs">
                  {displayPhoto ? (
                    <img
                      src={displayPhoto}
                      alt="UIDAI Verified"
                      className="size-full object-cover"
                    />
                  ) : (
                    <UserRound className="size-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">{data.fullName}</h4>
                  <p className="text-xs font-semibold text-slate-500">
                    {data.gender} • DOB: {data.dob}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 border border-emerald-300">
                100% GENUINE
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-start gap-2 text-slate-700">
                <MapPin className="size-4 shrink-0 mt-0.5 text-amber-500" />
                <span className="leading-snug font-semibold text-slate-700">
                  {data.address || `${data.city}, ${data.state} - ${data.pincode}`}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 text-xs text-slate-500 font-semibold">
                <span>Owner Aadhaar Number</span>
                <span className="font-mono font-black text-slate-900 tracking-wider">
                  {data.maskedAadhaar}
                </span>
              </div>
            </div>
          </div>

          {/* Auto-fill Action Button */}
          <button
            type="button"
            onClick={onConfirm}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3.5 text-xs font-black text-slate-950 shadow-md shadow-amber-400/20 transition-all hover:bg-amber-300 active:scale-[0.98]"
          >
            <Sparkles className="size-4 fill-slate-950" />
            <span>Auto-Fill Owner & Address Details</span>
          </button>
        </div>
      </div>
    </div>
  );
}
