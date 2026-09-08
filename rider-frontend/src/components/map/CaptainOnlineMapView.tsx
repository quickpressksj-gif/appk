import React, { useState } from "react";
import { Crosshair, Layers, Navigation } from "lucide-react";
import { LiveDeliveryMap, type GoogleMapLayerType } from "../map/LiveDeliveryMap";
import { useLanguage } from "../../lib/i18n";
import { triggerHaptic } from "../../lib/captain-audio";

interface CaptainOnlineMapViewProps {
  currentCoords: { lat: number; lng: number } | null;
  onRecenter?: () => void;
  onOpenWorkZoneInfo?: () => void;
}

export const CaptainOnlineMapView: React.FC<CaptainOnlineMapViewProps> = ({
  currentCoords,
  onRecenter,
  onOpenWorkZoneInfo,
}) => {
  const { t } = useLanguage();
  const [mapLayer, setMapLayer] = useState<GoogleMapLayerType>("roadmap");

  const handleToggleLayer = () => {
    triggerHaptic(40);
    setMapLayer((prev) => {
      if (prev === "roadmap") return "satellite";
      if (prev === "satellite") return "traffic";
      return "roadmap";
    });
  };

  return (
    <div className="relative flex-1 w-full h-full min-h-[500px] overflow-hidden select-none bg-white">
      {/* Live Fullscreen Google Map */}
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
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-md text-neutral-900 rounded-full shadow-lg border border-neutral-200 pointer-events-auto">
        <div className="relative flex items-center justify-center w-3 h-3">
          <span className="absolute w-3 h-3 rounded-full bg-[#00C853] animate-ping opacity-75" />
          <span className="relative w-2 h-2 rounded-full bg-[#00C853]" />
        </div>
        <span className="text-xs font-black tracking-wide text-neutral-900">
          {t("dash.searching", "Searching nearby rides...")}
        </span>
      </div>

      {/* Bottom Floating Bar: Work Zone Banner */}
      <div className="absolute bottom-4 left-3.5 right-3.5 z-20 pointer-events-auto">
        <div
          onClick={onOpenWorkZoneInfo}
          className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-neutral-200 shadow-xl cursor-pointer hover:bg-neutral-50 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">
              📍
            </div>
            <div>
              <p className="text-xs font-black text-neutral-900 leading-tight">
                {t("dash.workZone", "More orders inside Work Zone")}
              </p>
              <p className="text-[11px] text-neutral-500 font-medium">
                {t("dash.workZoneSub", "Stay within 2.5 km of Hub for faster dispatches")}
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-[#00C853] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Active
          </span>
        </div>
      </div>
    </div>
  );
};
