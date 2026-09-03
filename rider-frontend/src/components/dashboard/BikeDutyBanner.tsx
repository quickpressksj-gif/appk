import { Power, MapPin, Radio, ShieldCheck } from "lucide-react";
import { playDutyToggleSound } from "../../lib/captain-audio";

export function BikeDutyBanner({
  isOnline,
  onToggle,
  captainName = "Captain",
  captainId = "CP-9821",
}: {
  isOnline: boolean;
  onToggle: (nextState: boolean) => void;
  captainName?: string;
  captainId?: string;
}) {
  const handleToggle = () => {
    const next = !isOnline;
    playDutyToggleSound(next);
    onToggle(next);
  };

  return (
    <div className="w-full select-none">
      <div
        className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 shadow-md transition-all duration-300 ${
          isOnline
            ? "bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 text-white shadow-emerald-900/20"
            : "bg-slate-900 text-white shadow-slate-900/30"
        }`}
      >
        {/* Background decorative glow */}
        <div
          className={`pointer-events-none absolute -right-8 -top-8 size-44 rounded-full blur-2xl transition-all ${
            isOnline ? "bg-emerald-400/30" : "bg-slate-700/20"
          }`}
        />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status info */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black tracking-wider uppercase shadow-xs ${
                  isOnline
                    ? "bg-white text-emerald-800"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}
              >
                <span
                  className={`size-2 rounded-full ${
                    isOnline ? "bg-emerald-600 animate-ping" : "bg-slate-500"
                  }`}
                />
                <span>{isOnline ? "ON DUTY · LIVE" : "OFF DUTY"}</span>
              </span>

              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-200/90">
                <MapPin className="size-3.5" />
                <span>Kasganj 5km Radar</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              {isOnline ? "Ready for Laundry Pickups" : "You are currently offline"}
            </h2>

            <p className="text-xs font-medium text-emerald-100/80">
              {isOnline
                ? "Keep phone volume up. Orders will alert you with siren."
                : "Switch duty ON to start receiving trip requests on your bike."}
            </p>
          </div>

          {/* Big Thumb Button (Designed for easy tap while on bike) */}
          <button
            type="button"
            onClick={handleToggle}
            className={`flex h-[54px] sm:h-[58px] items-center justify-center gap-3 rounded-2xl px-6 font-black text-sm tracking-wide shadow-lg transition-all active:scale-95 cursor-pointer ${
              isOnline
                ? "bg-white text-emerald-900 hover:bg-emerald-50 active:bg-emerald-100"
                : "bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:bg-emerald-600"
            }`}
          >
            <Power className="size-5 stroke-[2.8]" />
            <span className="text-base uppercase">
              {isOnline ? "Go Offline" : "Go Online Now"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
