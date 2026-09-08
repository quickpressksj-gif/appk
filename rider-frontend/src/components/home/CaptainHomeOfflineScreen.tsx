import React, { useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp, Phone, Sparkles, Sun, Zap } from "lucide-react";
import { useLanguage } from "../../lib/i18n";
import { toast } from "sonner";

interface CaptainHomeOfflineScreenProps {
  todayEarnings: number;
  todayDeliveries: number;
  captainName?: string;
  onGoOnline: () => void;
  onOpenWorkZoneInfo?: () => void;
}

export const CaptainHomeOfflineScreen: React.FC<CaptainHomeOfflineScreenProps> = ({
  todayEarnings = 0,
  todayDeliveries = 0,
  captainName = "Captain",
  onGoOnline,
  onOpenWorkZoneInfo,
}) => {
  const { t } = useLanguage();
  const [earningsExpanded, setEarningsExpanded] = useState(false);
  const [commissionExpanded, setCommissionExpanded] = useState(true);

  // Time-aware greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div
      className="flex flex-col flex-1 w-full h-full bg-white text-neutral-900 select-none overflow-y-auto"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px) + 76px, 90px)" }}
    >
      {/* 1. Today's Earnings Strip (Screenshot: Light Blue / Lavender Bar) */}
      <div className="w-full">
        <button
          type="button"
          onClick={() => setEarningsExpanded(!earningsExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 bg-[#E8EFFF] text-neutral-900 border-b border-blue-100 hover:bg-blue-100/60 transition-colors"
        >
          <span className="text-sm font-black tracking-tight text-neutral-900">
            {t("dash.todayEarnings", "Today's Earnings")}
          </span>
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

      {/* 2. Commission Saved Card (Screenshot: White Card with Lavender Bottom Bar) */}
      <div className="p-4">
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          {/* Top Section */}
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

          {/* Bottom Lavender Bar with "Know more ->" pill (Exact match to screenshot) */}
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
                <span className="text-xs">→</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Center Hero Graphic & Action Trigger (Screenshot: Hands holding phone + Toggle Green) */}
      <div className="flex flex-col items-center justify-center text-center my-auto px-6 py-6">
        {/* Animated Graphic Card */}
        <div
          onClick={onGoOnline}
          className="relative flex items-center justify-center w-48 h-48 mb-6 rounded-full bg-blue-50/60 cursor-pointer hover:scale-105 active:scale-95 transition-all group"
        >
          {/* Yellow sun aura */}
          <div className="absolute top-2 left-6 w-4 h-4 bg-amber-400 rounded-full blur-xs opacity-90" />
          <div className="absolute top-4 right-8 w-3 h-3 bg-amber-300 rounded-full blur-xs opacity-80" />

          {/* Smartphone Illustration */}
          <div className="relative flex flex-col items-center justify-center w-24 h-40 bg-white border-4 border-neutral-800 rounded-3xl shadow-xl overflow-hidden p-2 group-hover:border-[#00C853] transition-colors">
            {/* Top speaker notch */}
            <div className="w-6 h-1.5 bg-neutral-800 rounded-full mb-3" />

            {/* Toggle Switch on Phone Screen */}
            <div className="relative flex items-center justify-end w-14 h-7 bg-[#00C853] rounded-full p-1 shadow-inner animate-pulse">
              <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </div>

            {/* Tap finger indicator */}
            <div className="absolute bottom-3 text-neutral-400 text-[9px] font-black uppercase tracking-tighter">
              TAP ON
            </div>
          </div>
        </div>

        {/* Time-Aware Greeting (Screenshot: Good Afternoon, Captain 🌤️) */}
        <h3 className="text-sm font-bold text-neutral-600 flex items-center justify-center gap-1.5">
          <span>
            {greeting}, {captainName.split(" ")[0]}
          </span>
          <span>🌤️</span>
        </h3>

        {/* Bold CTA Title (Screenshot: Go ON DUTY to start earning) */}
        <h2 className="text-lg font-black text-neutral-950 tracking-tight mt-1 max-w-xs leading-tight">
          Go ON DUTY to start earning
        </h2>
      </div>

      {/* 4. Bottom Work Zone Banner Card (Screenshot: Mint-green gradient banner with Know More) */}
      <div className="px-4 mt-6">
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

            {/* Yellow [ Know More ] Button (Screenshot) */}
            <button
              type="button"
              className="px-4 py-1.5 bg-[#FFC400] hover:bg-[#FBBF24] text-neutral-950 font-black text-xs rounded-xl shadow-xs active:scale-95 transition-transform"
            >
              Know More
            </button>
          </div>

          {/* Right 3D Isometric Work Zone Graphic (Screenshot) */}
          <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
            {/* Hexagon Area */}
            <div className="absolute inset-0 bg-[#00C853]/15 rounded-2xl transform rotate-12 border border-[#00C853]/30" />
            {/* Target / Radar Icon Badge */}
            <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#14B8A6] text-white shadow-lg border-2 border-white">
              <div className="w-8 h-8 rounded-full border-2 border-white border-dashed animate-spin flex items-center justify-center" style={{ animationDuration: "8s" }}>
                <div className="w-3 h-3 rounded-full bg-white shadow-xs" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Brand watermark footer (Matching Customer Panel watermark) */}
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
