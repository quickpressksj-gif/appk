import React from "react";
import { Power, Radio, ShieldCheck, Zap } from "lucide-react";
import { playOnlineChime, playOfflineChime } from "../../lib/order-alert-sound";

interface RapidoDutyToggleProps {
  isOnline: boolean;
  onToggle: () => void;
  busy?: boolean;
}

/**
 * 🛵 Rapido Captain Style High-Visibility Duty Toggle Bar
 * Pure White + Rapido Yellow palette with Web Audio synthesized sound feedback.
 */
export function RapidoDutyToggle({
  isOnline,
  onToggle,
  busy = false,
}: RapidoDutyToggleProps) {
  const handleClick = () => {
    if (busy) return;
    if (!isOnline) {
      playOnlineChime();
    } else {
      playOfflineChime();
    }
    onToggle();
  };

  return (
    <div className="w-full">
      <div
        className={`relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-sm ${
          isOnline
            ? "border-amber-400 bg-amber-400 text-slate-950 shadow-amber-400/20"
            : "border-slate-200 bg-white text-slate-900"
        }`}
      >
        <div className="flex items-center justify-between p-3.5 sm:p-4 gap-3">
          {/* Left: Status Badge & Pulse */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`relative flex size-11 shrink-0 items-center justify-center rounded-xl font-black transition-all ${
                isOnline
                  ? "bg-slate-950 text-amber-400 shadow-md"
                  : "bg-slate-100 text-slate-400 border border-slate-200"
              }`}
            >
              <Power className="size-5.5" strokeWidth={2.5} />
              {isOnline && (
                <span className="absolute -top-1 -right-1 flex size-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-3 rounded-full bg-emerald-500 border border-white" />
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-black uppercase tracking-wider ${
                    isOnline ? "text-slate-950" : "text-rose-600"
                  }`}
                >
                  {isOnline ? "YOU ARE ONLINE" : "YOU ARE OFFLINE"}
                </span>
                {isOnline && (
                  <span className="flex items-center gap-1 rounded-full bg-slate-950/10 px-2 py-0.5 text-[10px] font-extrabold text-slate-950">
                    <Radio className="size-2.5 animate-pulse text-emerald-700" />
                    LIVE RADAR
                  </span>
                )}
              </div>
              <p
                className={`truncate text-xs font-semibold ${
                  isOnline ? "text-slate-900" : "text-slate-500"
                }`}
              >
                {isOnline
                  ? "Searching nearby laundry orders..."
                  : "Go online to receive delivery trips"}
              </p>
            </div>
          </div>

          {/* Right: Tactile Big Toggle Switch */}
          <button
            type="button"
            disabled={busy}
            onClick={handleClick}
            aria-label={isOnline ? "Go Offline" : "Go Online"}
            className={`relative flex h-10 w-20 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 focus:outline-none ${
              isOnline
                ? "bg-slate-950 shadow-inner"
                : "bg-slate-200 hover:bg-slate-300"
            }`}
          >
            <span
              className={`flex size-8 items-center justify-center rounded-full font-black text-xs shadow-md transition-transform duration-300 ease-out ${
                isOnline
                  ? "translate-x-10 bg-amber-400 text-slate-950"
                  : "translate-x-0 bg-white text-slate-600"
              }`}
            >
              {isOnline ? "ON" : "OFF"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
