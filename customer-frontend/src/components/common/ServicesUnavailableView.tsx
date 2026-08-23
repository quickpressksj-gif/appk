import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  Compass,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import { submitWaitlist } from "@/api/customer/services/partner-service";
import type { SavedLocation } from "@/api/customer/location";
import { changeLocation } from "@/api/customer/services/location-service";

export type ServicesUnavailableViewProps = {
  location?: SavedLocation | null;
  nearbyAreas?: string[];
  onRetry?: () => void | Promise<void>;
  isRetrying?: boolean;
  onSelectArea?: (area: string) => void;
};

export function ServicesUnavailableView({
  location,
  nearbyAreas = [],
  onRetry,
  isRetrying = false,
  onSelectArea,
}: ServicesUnavailableViewProps) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [waitlistState, setWaitlistState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [waitlistMsg, setWaitlistMsg] = useState("");

  const hasLocation = Boolean(location?.city || location?.area);
  const displayArea = location?.area || "Current Location";
  const displayCity = location?.city || "";
  const displayState = location?.state || "";

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setWaitlistState("loading");
    try {
      const res = await submitWaitlist({
        area: location?.area || "",
        city: location?.city || "",
        state: location?.state || "",
        pincode: (location as any)?.pincode || "",
        latitude: location?.latitude,
        longitude: location?.longitude,
        phone: phone.trim(),
      });
      setWaitlistState("success");
      setWaitlistMsg(
        res.message ||
          `We'll notify you as soon as QuickPress is live in ${displayArea || displayCity || "your area"}!`,
      );
    } catch {
      setWaitlistState("error");
      setWaitlistMsg("Unable to save request right now. Please try again.");
    }
  };

  const handleChooseArea = (areaName: string) => {
    if (onSelectArea) {
      onSelectArea(areaName);
    } else {
      const updated: SavedLocation = {
        area: areaName,
        city: areaName.includes("Kasganj") ? "Kasganj" : areaName,
        state: "Uttar Pradesh",
      };
      changeLocation(updated);
      if (onRetry) void onRetry();
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 md:max-w-lg md:py-12 animate-in fade-in duration-300">
      {/* Premium Hero Card */}
      <div className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8">
        {/* Subtle Icon Badge */}
        <div className="flex items-center justify-center">
          <div className="relative flex size-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 shadow-inner">
            <MapPin className="size-8 stroke-[2.2]" />
            <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] text-white">
              ✕
            </span>
          </div>
        </div>

        {/* Headings */}
        <div className="mt-5 text-center">
          <h2 className="text-xl font-black tracking-tight text-zinc-900 sm:text-2xl">
            Services aren&apos;t available here yet
          </h2>
          <p className="mt-2 text-xs font-medium leading-relaxed text-zinc-500 sm:text-sm">
            We couldn&apos;t find an active laundry partner serving your current location right now.
          </p>
        </div>

        {/* Current Location Pill Card */}
        <div className="mt-6 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4 transition-all">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-zinc-700 shadow-xs">
              <Compass className="size-4 text-amber-600" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                Current Location
              </p>
              {hasLocation ? (
                <>
                  <p className="mt-0.5 truncate text-sm font-black text-zinc-900">
                    {displayArea}
                  </p>
                  <p className="truncate text-xs font-medium text-zinc-500">
                    {[displayCity, displayState].filter(Boolean).join(", ")}
                  </p>
                </>
              ) : (
                <p className="mt-0.5 text-xs font-bold text-zinc-700">
                  Location permission not available
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Primary & Secondary Action CTAs */}
        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            onClick={() => void navigate({ to: "/location-search" })}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 text-sm font-black text-zinc-950 shadow-sm transition-all hover:bg-amber-300 active:scale-[0.98]"
          >
            <Search className="size-4 stroke-[2.5]" />
            <span>Change Location</span>
          </button>

          {onRetry ? (
            <button
              type="button"
              disabled={isRetrying}
              onClick={() => void onRetry()}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 text-xs font-bold text-zinc-800 transition-all hover:bg-zinc-50 active:scale-[0.98] disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${isRetrying ? "animate-spin text-amber-600" : ""}`} />
              <span>{isRetrying ? "Checking availability…" : "Try Again"}</span>
            </button>
          ) : null}
        </div>

        {/* Nearby Serviceable Areas (Real Data Only) */}
        {nearbyAreas && nearbyAreas.length > 0 ? (
          <div className="mt-8 border-t border-zinc-100 pt-6">
            <div className="flex items-center gap-1.5 text-xs font-black text-zinc-900">
              <Sparkles className="size-3.5 text-emerald-600" />
              <span>Try a nearby serviceable area</span>
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-500 font-medium">
              We have active verified laundry partners serving these locations:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {nearbyAreas.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => handleChooseArea(area)}
                  className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-800 shadow-2xs transition-all hover:border-emerald-500 hover:text-emerald-700 active:scale-95"
                >
                  <MapPin className="size-3 text-emerald-600" />
                  <span>{area}</span>
                  <ChevronRight className="size-3 text-zinc-400" />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Real Notify Me / Waitlist Section */}
        <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
              <Bell className="size-3.5" />
            </span>
            <span className="text-xs font-black text-emerald-950">
              Notify me when QuickPress arrives
            </span>
          </div>

          {waitlistState === "success" ? (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-white p-3 text-xs font-bold text-emerald-900 shadow-2xs">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              <p>{waitlistMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} className="mt-3">
              <p className="text-[11px] font-medium leading-normal text-emerald-900/80">
                Leave your mobile number. We&apos;ll message you when doorstep laundry pickup
                launches here.
              </p>
              <div className="mt-2.5 flex gap-2">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={waitlistState === "loading"}
                  className="flex shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-black text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                >
                  {waitlistState === "loading" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    "Notify Me"
                  )}
                </button>
              </div>
              {waitlistState === "error" ? (
                <p className="mt-1.5 text-[10px] font-bold text-rose-600">{waitlistMsg}</p>
              ) : null}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
