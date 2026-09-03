import React from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, Navigation, ShieldCheck } from "lucide-react";

interface LocationPermissionModalProps {
  isOpen: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

export function LocationPermissionModal({
  isOpen,
  onAllow,
  onDeny,
}: LocationPermissionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-zinc-100 text-center space-y-5 animate-in slide-in-from-bottom duration-300">
        {/* Icon Badge */}
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-[#0c831f] shadow-inner">
          <MapPin className="size-8 stroke-[2.5]" />
        </div>

        {/* Header Text */}
        <div className="space-y-2">
          <h3 className="text-xl font-black tracking-tight text-zinc-950">
            Allow Location Access
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed px-2">
            Location helps QuickPress provide pickup and delivery services, determine service availability, improve order tracking and coordinate deliveries.
          </p>
        </div>

        {/* Key Feature Bullets */}
        <div className="rounded-2xl bg-zinc-50 p-3.5 text-left text-xs text-zinc-700 space-y-2 border border-zinc-100">
          <div className="flex items-center gap-2">
            <span className="flex size-4 items-center justify-center rounded-full bg-emerald-100 text-[#0c831f] text-[10px] font-bold">✓</span>
            <span>Pinpoint accurate doorstep laundry collection</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex size-4 items-center justify-center rounded-full bg-emerald-100 text-[#0c831f] text-[10px] font-bold">✓</span>
            <span>Live delivery captain GPS arrival on map</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={onAllow}
            className="w-full h-12 rounded-2xl bg-[#0c831f] hover:bg-emerald-800 text-white font-black text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Navigation className="size-4" />
            <span>Allow Location</span>
          </button>
          <button
            onClick={onDeny}
            className="w-full h-10 rounded-2xl text-zinc-500 hover:text-zinc-800 font-bold text-xs transition-colors cursor-pointer"
          >
            Not Now
          </button>
        </div>

        {/* Privacy Policy Link */}
        <div className="border-t border-zinc-100 pt-3">
          <Link
            to="/legal/$docSlug"
            params={{ docSlug: "privacy-policy" }}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0c831f] hover:underline"
          >
            <span>Learn how QuickPress uses your location</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
