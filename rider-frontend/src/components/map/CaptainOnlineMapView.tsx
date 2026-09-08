import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Crosshair,
  Flame,
  Headphones,
  Layers,
  MapPin,
  Moon,
  Navigation,
  Radio,
  ShieldAlert,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { LiveDeliveryMap, type GoogleMapLayerType, type SurgeHotspot, KASGANJ_SURGE_HOTSPOTS } from "./LiveDeliveryMap";
import { useLanguage } from "../../lib/i18n";
import { triggerHaptic } from "../../lib/captain-audio";
import { toast } from "sonner";
import { CaptainSupportModal } from "../support/CaptainSupportModal";

interface CaptainOnlineMapViewProps {
  currentCoords: { lat: number; lng: number } | null;
  todayEarnings?: number;
  todayDeliveries?: number;
  captainName?: string;
  pendingOrdersCount?: number;
  onRecenter?: () => void;
  onOpenWorkZoneInfo?: () => void;
  onOpenOrders?: () => void;
}

export const CaptainOnlineMapView: React.FC<CaptainOnlineMapViewProps> = ({
  currentCoords,
  todayEarnings = 0,
  todayDeliveries = 0,
  captainName = "Captain",
  pendingOrdersCount = 0,
  onRecenter,
  onOpenWorkZoneInfo,
  onOpenOrders,
}) => {
  const { t } = useLanguage();
  const [mapLayer, setMapLayer] = useState<GoogleMapLayerType>("roadmap");
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const [selectedSurge, setSelectedSurge] = useState<SurgeHotspot | null>(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Toggle map layer (Day Roadmap -> Night Dark -> Satellite)
  const handleToggleLayer = () => {
    triggerHaptic(40);
    setMapLayer((prev) => {
      if (prev === "roadmap") return "night";
      if (prev === "night") return "satellite";
      return "roadmap";
    });
  };

  const handleSurgeClick = (surge: SurgeHotspot) => {
    setSelectedSurge(surge);
    triggerHaptic(50);
    toast.info(`${surge.name}: ${surge.multiplier} Surge (+₹${surge.bonus}/ride) 🔥`);
  };

  return (
    <div className="relative flex flex-col flex-1 w-full h-full bg-slate-950 text-white select-none overflow-hidden font-sans">
      {/* 1. FULL-BLEED RAPIDO MAP CANVAS */}
      <div className="absolute inset-0 size-full z-0">
        <LiveDeliveryMap
          riderLocation={
            currentCoords
              ? { lat: currentCoords.lat, lng: currentCoords.lng, label: "You (Rapido Captain)" }
              : null
          }
          phase="online"
          heightClassName="h-full w-full"
          showControls={false}
          showSurgePins={true}
          isRapidoTheme={true}
          activeLayerOverride={mapLayer}
          onLayerChange={setMapLayer}
          onSurgeClick={handleSurgeClick}
        />
      </div>

      {/* 2. FLOATING RAPIDO TOP HUD BAR */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-col gap-2 pointer-events-none">
        {/* Main Signature Rapido Yellow & Dark Navy HUD Pill */}
        <div className="pointer-events-auto flex items-center justify-between p-2.5 bg-[#0F172A]/95 backdrop-blur-md rounded-2xl border-2 border-[#FFC400] shadow-2xl text-xs">
          {/* Duty Status & Radar Wave */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex items-center justify-center size-8 rounded-xl bg-emerald-500/20 text-[#00C853] shrink-0 border border-emerald-500/40">
              <span className="absolute size-3 rounded-full bg-[#00C853] animate-ping opacity-75" />
              <span className="relative size-2.5 rounded-full bg-[#00C853]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-[#FFC400] tracking-wide text-xs uppercase">
                  ON DUTY
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                  Radar Active
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium truncate max-w-[170px] sm:max-w-[220px]">
                {t("dash.searching", "Searching nearby rides in Kasganj...")}
              </p>
            </div>
          </div>

          {/* Today's Quick Earnings Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                window.location.href = "/wallet";
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFC400] hover:bg-[#FBBF24] text-slate-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition-all"
            >
              <Wallet className="size-3.5 text-slate-950" />
              <span>₹{todayEarnings.toFixed(0)}</span>
            </button>
          </div>
        </div>

        {/* Selected Surge Micro-Banner (If a surge pin is tapped) */}
        {selectedSurge && (
          <div className="pointer-events-auto animate-in slide-in-from-top-2 duration-200 flex items-center justify-between px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-xl shadow-lg font-bold text-xs">
            <div className="flex items-center gap-2">
              <Flame className="size-4 text-slate-950" />
              <span>
                {selectedSurge.name}: <strong>+{selectedSurge.multiplier} Surge</strong> (+₹{selectedSurge.bonus}/ride)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSurge(null)}
              className="p-1 hover:bg-black/10 rounded-full active:scale-90"
            >
              <X className="size-3.5 text-slate-950" />
            </button>
          </div>
        )}
      </div>

      {/* 3. FLOATING RAPIDO CONTROLS (Right Edge) */}
      <div className="absolute top-20 right-3 z-20 flex flex-col gap-2 pointer-events-auto">
        {/* Recenter on Captain (Rapido Yellow Crosshair) */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic(40);
            if (onRecenter) onRecenter();
            toast.info("Map centered at Captain GPS 📍");
          }}
          className="flex size-11 items-center justify-center rounded-2xl bg-[#0F172A]/90 backdrop-blur-md text-[#FFC400] shadow-2xl border border-zinc-700 hover:bg-[#0F172A] active:scale-90 transition-transform cursor-pointer"
          title="Recenter on Captain"
        >
          <Crosshair className="size-5.5" />
        </button>

        {/* Day / Night / Satellite Mode Switcher */}
        <button
          type="button"
          onClick={handleToggleLayer}
          className="flex size-11 items-center justify-center rounded-2xl bg-[#0F172A]/90 backdrop-blur-md text-white shadow-2xl border border-zinc-700 hover:bg-[#0F172A] active:scale-90 transition-transform cursor-pointer"
          title={`Map View: ${mapLayer}`}
        >
          {mapLayer === "night" ? (
            <Moon className="size-5 text-indigo-400" />
          ) : mapLayer === "satellite" ? (
            <Layers className="size-5 text-emerald-400" />
          ) : (
            <Sun className="size-5 text-amber-400" />
          )}
        </button>

        {/* 24/7 SOS / Support Action */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic(40);
            setIsSupportModalOpen(true);
          }}
          className="flex size-11 items-center justify-center rounded-2xl bg-[#0F172A]/90 backdrop-blur-md text-red-400 shadow-2xl border border-red-500/40 hover:bg-[#0F172A] active:scale-90 transition-transform cursor-pointer"
          title="24/7 SOS Helpline"
        >
          <ShieldAlert className="size-5 text-red-400" />
        </button>
      </div>

      {/* 4. RAPIDO SLIDING BOTTOM SHEET DRAWER */}
      <div
        className="absolute left-0 right-0 z-30 pointer-events-auto transition-all duration-300 ease-in-out"
        style={{
          bottom: "max(env(safe-area-inset-bottom, 0px) + 70px, 80px)",
        }}
      >
        <div className="mx-3 rounded-3xl bg-[#0F172A]/95 backdrop-blur-xl border border-zinc-700/80 shadow-2xl text-white overflow-hidden">
          {/* Drawer Pull-Handle & Header Strip */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic(30);
              setIsDrawerExpanded(!isDrawerExpanded);
            }}
            className="w-full flex flex-col items-center pt-2 pb-1.5 px-4 hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            <div className="w-10 h-1 rounded-full bg-zinc-600 mb-2" />
            <div className="w-full flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-[#FFC400] text-sm">
                  ₹{todayEarnings.toFixed(0)}
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">
                  · {todayDeliveries} {todayDeliveries === 1 ? "Trip" : "Trips"} Today
                </span>
                <span className="text-[10px] font-black text-[#00C853] bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800">
                  0% Commission
                </span>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-bold text-[#FFC400]">
                <span>{isDrawerExpanded ? "Collapse" : "Live Details"}</span>
                {isDrawerExpanded ? (
                  <ChevronDown className="size-3.5" />
                ) : (
                  <ChevronUp className="size-3.5" />
                )}
              </div>
            </div>
          </button>

          {/* Quick Action Button: Live Orders Queue */}
          <div className="px-3.5 pb-3 pt-1.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(40);
                if (onOpenOrders) onOpenOrders();
                else window.location.href = "/orders";
              }}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#FFC400] hover:bg-[#FBBF24] text-slate-950 font-black text-xs rounded-2xl shadow-lg active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-slate-950 fill-current" />
                <span>Switch to Live Orders Queue</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-950 text-white px-2.5 py-0.5 rounded-full text-[11px]">
                <span>{pendingOrdersCount} Incoming</span>
                <span>➔</span>
              </div>
            </button>
          </div>

          {/* Expanded Drawer Details (Rapido Metrics + Hotspot Advisory) */}
          {isDrawerExpanded && (
            <div className="px-4 pb-4 space-y-3 text-xs border-t border-zinc-800 pt-3 animate-in fade-in duration-200">
              {/* Daily Target Progress Bar */}
              <div className="p-3 bg-white/5 rounded-2xl border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-300">
                  <span className="flex items-center gap-1">
                    <Target className="size-3.5 text-[#FFC400]" />
                    <span>Daily Target: 5 Rides for ₹100 Bonus</span>
                  </span>
                  <span className="font-mono text-[#FFC400] font-bold">
                    {Math.min(5, todayDeliveries)}/5 Done
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-[#00C853] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (todayDeliveries / 5) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Kasganj Hotspot Advisory */}
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/30 flex items-start gap-2.5">
                <Flame className="size-4 text-[#FFC400] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-black text-[#FFC400]">
                    High Demand Hotspot Area Active
                  </p>
                  <p className="text-[10px] text-zinc-300 mt-0.5">
                    Kasganj Junction Station & Gandhi Murti are experiencing surge demand. Stay within 3 km for instant ride matching!
                  </p>
                </div>
              </div>

              {/* Quick Links */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = "/wallet";
                  }}
                  className="p-2.5 bg-zinc-800/80 hover:bg-zinc-800 rounded-xl text-center font-bold text-[11px] text-zinc-200 border border-zinc-700 active:scale-95 transition-all"
                >
                  💰 View Full Passbook
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = "/incentives";
                  }}
                  className="p-2.5 bg-zinc-800/80 hover:bg-zinc-800 rounded-xl text-center font-bold text-[11px] text-amber-300 border border-zinc-700 active:scale-95 transition-all"
                >
                  🎯 View All Slabs
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. 24/7 SUPPORT & SOS MODAL */}
      <CaptainSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </div>
  );
};
