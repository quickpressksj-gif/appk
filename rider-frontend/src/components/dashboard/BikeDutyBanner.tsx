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
        className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 shadow-md transition-all duration-300 border-2 ${
          isOnline
            ? "bg-emerald-900 border-emerald-800 text-white shadow-emerald-950/20"
            : "bg-white border-emerald-800 text-emerald-950 shadow-emerald-900/10"
        }`}
      >
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status info */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black tracking-wider uppercase shadow-2xs ${
                  isOnline
                    ? "bg-emerald-800 text-white border border-emerald-700"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                }`}
              >
                <span
                  className={`size-2 rounded-full ${
                    isOnline ? "bg-emerald-300 animate-ping" : "bg-emerald-700"
                  }`}
                />
                <span>{isOnline ? "ON DUTY · LIVE" : "OFF DUTY"}</span>
              </span>

              <span
                className={`flex items-center gap-1 text-xs font-semibold ${
                  isOnline ? "text-emerald-200" : "text-emerald-800"
                }`}
              >
                <MapPin className="size-3.5 text-emerald-400" />
                <span>Kasganj 5km Radar</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              {isOnline ? "Ready for Laundry Pickups" : "You are currently offline"}
            </h2>

            <p
              className={`text-xs font-medium ${
                isOnline ? "text-emerald-200" : "text-emerald-700"
              }`}
            >
              {isOnline
                ? "Keep phone volume up. New orders will alert you with siren."
                : "Switch duty ON to start receiving pickup requests on your bike."}
            </p>
          </div>

          {/* Big Thumb Button — Pure White & Dark Green */}
          <button
            type="button"
            onClick={handleToggle}
            className={`flex h-[54px] sm:h-[58px] items-center justify-center gap-3 rounded-2xl px-6 font-black text-sm tracking-wide shadow-md transition-all active:scale-95 cursor-pointer ${
              isOnline
                ? "bg-white text-emerald-950 hover:bg-emerald-50 active:bg-emerald-100"
                : "bg-emerald-800 text-white hover:bg-emerald-900 active:bg-emerald-950"
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
