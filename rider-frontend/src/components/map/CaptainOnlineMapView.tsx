import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Crosshair,
  Layers,
  MapPin,
  Radio,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { LiveDeliveryMap, type GoogleMapLayerType } from "../map/LiveDeliveryMap";
import { useLanguage } from "../../lib/i18n";
import { triggerHaptic } from "../../lib/captain-audio";
import { toast } from "sonner";

interface CaptainOnlineMapViewProps {
  currentCoords: { lat: number; lng: number } | null;
  todayEarnings?: number;
  todayDeliveries?: number;
  captainName?: string;
  onRecenter?: () => void;
  onOpenWorkZoneInfo?: () => void;
}

export const CaptainOnlineMapView: React.FC<CaptainOnlineMapViewProps> = ({
  currentCoords,
  todayEarnings = 0,
  todayDeliveries = 0,
  captainName = "Captain",
  onRecenter,
  onOpenWorkZoneInfo,
}) => {
  const { t } = useLanguage();
  const [mapLayer, setMapLayer] = useState<GoogleMapLayerType>("roadmap");
  const [earningsExpanded, setEarningsExpanded] = useState(false);
  const [commissionExpanded, setCommissionExpanded] = useState(true);

  const handleToggleLayer = () => {
    triggerHaptic(40);
    setMapLayer((prev) => {
      if (prev === "roadmap") return "satellite";
      if (prev === "satellite") return "traffic";
      return "roadmap";
    });
  };

  return (
    <div
      className="flex flex-col flex-1 w-full h-full bg-white text-neutral-900 select-none overflow-y-auto"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px) + 76px, 90px)" }}
    >
      {/* 1. Live Today's Earnings Strip */}
      <div className="w-full">
        <button
          type="button"
          onClick={() => setEarningsExpanded(!earningsExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 bg-[#E8EFFF] text-neutral-900 border-b border-blue-100 hover:bg-blue-100/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#00C853] animate-pulse" />
            <span className="text-sm font-black tracking-tight text-neutral-900">
              {t("dash.todayEarnings", "Today's Earnings")}
            </span>
          </div>
          <div className="flex items-center gap-1 font-black text-base text-neutral-950">
            <span>₹{todayEarnings.toFixed(0)}</span>
            <ChevronDown
              className={`w-4 h-4 text-neutral-700 transition-transform duration-200 ${
                earningsExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* Collapsible Earnings Details */}
        {earningsExpanded && (
          <div className="p-4 bg-white border-b border-neutral-200 space-y-2.5 text-xs animate-in slide-in-from-top-2 duration-200">
            <div className="flex justify-between items-center text-neutral-600 font-medium">
              <span>Completed Deliveries & Rides</span>
              <span className="font-black text-neutral-950">{todayDeliveries} Orders</span>
            </div>
            <div className="flex justify-between items-center text-neutral-600 font-medium">
              <span>Platform Commission</span>
              <span className="font-black text-[#00C853]">0% (Zero Fee!)</span>
            </div>
            <div className="flex justify-between items-center text-neutral-900 font-bold border-t border-neutral-100 pt-2 text-sm">
              <span>Net Captain Payout</span>
              <span className="font-black text-neutral-950">₹{todayEarnings.toFixed(0)}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/wallet";
              }}
              className="w-full mt-2 py-2 bg-neutral-950 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
            >
              <span>View Wallet & 72-Hour Payout Schedule</span>
              <span>➔</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. FIXED MAP BOX (Card View with Radar & Map Controls) */}
      <div className="p-3.5 sm:p-4">
        <div className="relative w-full h-[320px] sm:h-[350px] rounded-3xl overflow-hidden border border-neutral-200/90 shadow-sm bg-neutral-100">
          {/* Live Map Component */}
          <LiveDeliveryMap
            key={mapLayer}
            riderLocation={
              currentCoords
                ? { lat: currentCoords.lat, lng: currentCoords.lng, label: "You (Captain)" }
                : null
            }
            phase="online"
            heightClassName="h-full w-full"
            showControls={true}
          />

          {/* Floating Top Status Indicator: Pure White Pill with Pulsing Green Dot */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md text-neutral-900 rounded-full shadow-md border border-neutral-200 pointer-events-auto">
            <div className="relative flex items-center justify-center w-2.5 h-2.5">
              <span className="absolute w-2.5 h-2.5 rounded-full bg-[#00C853] animate-ping opacity-75" />
              <span className="relative w-2 h-2 rounded-full bg-[#00C853]" />
            </div>
            <span className="text-[11px] font-black tracking-wide text-neutral-900">
              {t("dash.searching", "Searching nearby rides...")}
            </span>
          </div>

          {/* Floating Recenter & Layer controls on map */}
          <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleToggleLayer}
              className="p-2.5 bg-white/95 hover:bg-white text-neutral-800 rounded-2xl shadow-md border border-neutral-200 active:scale-95 transition-transform"
              title={`Layer: ${mapLayer}`}
            >
              <Layers className="w-4 h-4 text-neutral-700" />
            </button>

            {onRecenter && (
              <button
                type="button"
                onClick={onRecenter}
                className="p-2.5 bg-white/95 hover:bg-white text-neutral-800 rounded-2xl shadow-md border border-neutral-200 active:scale-95 transition-transform"
                title="Recenter Map"
              >
                <Crosshair className="w-4 h-4 text-neutral-700" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Live Radar Dispatch Status Banner */}
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#00C853] text-white shadow-xs">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-black text-emerald-950">Radar Radar Connected</p>
              <p className="text-[11px] text-emerald-700 font-medium">
                High demand zone in Kasganj · Instant auto-dispatch on
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
            Live
          </span>
        </div>
      </div>

      {/* 4. Commission Saved Card (Zero Commission Benefit) */}
      <div className="px-4 py-2">
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-3.5 bg-white">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black text-neutral-950">₹0</span>
              <span className="text-sm font-black text-neutral-700">Commission saved</span>
            </div>
            <button
              type="button"
              onClick={() => setCommissionExpanded(!commissionExpanded)}
              className="text-neutral-500 hover:text-neutral-800 p-1"
            >
              {commissionExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {commissionExpanded && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#EDE8FA] border-t border-purple-100">
              <span className="text-xs font-black text-neutral-800">
                ₹{todayEarnings.toFixed(0)} / ₹500 Earnings
              </span>

              <button
                type="button"
                onClick={() =>
                  toast.info(
                    "Zero Commission Benefit: 100% of the customer fare goes straight into your bank account!"
                  )
                }
                className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-neutral-50 text-neutral-900 text-xs font-black rounded-full border border-purple-200 shadow-xs active:scale-95 transition-all"
              >
                <span>Know more</span>
                <span>➔</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. Bottom Work Zone Banner Card */}
      <div className="px-4 mt-2">
        <div
          onClick={onOpenWorkZoneInfo}
          className="relative flex items-center justify-between p-4 bg-gradient-to-r from-[#DFF8F4] to-[#CFF3ED] border border-[#A7E8DC] rounded-3xl shadow-sm cursor-pointer hover:shadow-md transition-all overflow-hidden"
        >
          {/* Left Text & Yellow Button */}
          <div className="space-y-2 z-10">
            <div>
              <p className="text-xs font-black text-neutral-800 leading-tight">
                Earn more in
              </p>
              <h4 className="text-base font-black text-neutral-950 tracking-tight">
                Work Zone
              </h4>
            </div>

            <button
              type="button"
              className="px-4 py-1.5 bg-[#FFC400] hover:bg-[#FBBF24] text-neutral-950 font-black text-xs rounded-xl shadow-xs active:scale-95 transition-transform"
            >
              Know More
            </button>
          </div>

          {/* Right 3D Isometric Work Zone Graphic */}
          <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
            <div className="absolute inset-0 bg-[#00C853]/15 rounded-2xl transform rotate-12 border border-[#00C853]/30" />
            <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#14B8A6] text-white shadow-lg border-2 border-white">
              <div
                className="w-8 h-8 rounded-full border-2 border-white border-dashed animate-spin flex items-center justify-center"
                style={{ animationDuration: "8s" }}
              >
                <div className="w-3 h-3 rounded-full bg-white shadow-xs" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Brand watermark footer (Exact match to Customer Panel) */}
      <section className="mt-10 select-none bg-muted/60 px-5 pb-10 pt-10 border-t border-border/70">
        <h2 className="text-[2.6rem] font-black leading-[0.95] tracking-tight text-muted-foreground/35">
          India&rsquo;s freshest
          <br />
          laundry app <span className="text-primary/35">🧺</span>
        </h2>
        <div className="mt-8 h-px w-full bg-border/70" />
        <p className="mt-6 text-3xl font-black tracking-tight text-muted-foreground/25">
          QuickPress
        </p>
        <p className="mt-6 text-[11px] font-medium tracking-wide text-muted-foreground/70">
          Made In India · Crafted by Utter Pradesh 🚩
        </p>
      </section>
    </div>
  );
};
