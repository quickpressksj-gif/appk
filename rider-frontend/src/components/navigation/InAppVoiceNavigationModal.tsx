import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Compass,
  CornerDownRight,
  CornerUpRight,
  ExternalLink,
  Locate,
  MapPin,
  Mic,
  Navigation,
  Phone,
  Radio,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  voiceNavEngine,
  getDistanceKm,
  calculateBearing,
  ManeuverType,
  VoiceLanguage,
} from "../../lib/voice-navigation-engine";
import { triggerHaptic } from "../../lib/captain-audio";

export type InAppVoiceNavProps = {
  isOpen: boolean;
  onClose: () => void;
  riderCoords?: { lat: number; lng: number } | null;
  targetCoords: { lat: number; lng: number };
  targetName: string;
  targetAddress: string;
  targetPhone?: string;
  orderNumber?: string;
  phaseLabel: string;
  onArrived?: () => void;
};

export function InAppVoiceNavigationModal({
  isOpen,
  onClose,
  riderCoords,
  targetCoords,
  targetName,
  targetAddress,
  targetPhone,
  orderNumber,
  phaseLabel,
  onArrived,
}: InAppVoiceNavProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);

  const [isMuted, setIsMuted] = useState(voiceNavEngine.getMuted());
  const [language, setLanguage] = useState<VoiceLanguage>(voiceNavEngine.getLanguage());
  const [currentManeuver, setCurrentManeuver] = useState<ManeuverType>("straight");
  const [currentInstruction, setCurrentInstruction] = useState<string>("");
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [distanceMeters, setDistanceMeters] = useState<number>(0);
  const [etaMinutes, setEtaMinutes] = useState<number>(2);
  const [isArrived, setIsArrived] = useState<boolean>(false);
  const [userSpeedKmh, setUserSpeedKmh] = useState<number>(24);

  const currentRiderPos = riderCoords || { lat: 27.8118, lng: 78.6477 };

  // Trigger voice guidance when navigation modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Speak initial route guidance
    const startPrompt =
      language.startsWith("hi")
        ? `नेविगेशन शुरू हुआ। ${targetName} की तरफ चलें।`
        : `Navigation started to ${targetName}. Follow the route.`;

    voiceNavEngine.speak(startPrompt, true);

    const progress = voiceNavEngine.evaluateProgress(currentRiderPos, targetCoords, targetName);
    setDistanceKm(progress.distanceKm);
    setDistanceMeters(progress.distanceMeters);
    setEtaMinutes(progress.etaMinutes);
    setCurrentManeuver(progress.currentManeuver);
    setCurrentInstruction(progress.instruction);
    setIsArrived(progress.isArrived);
  }, [isOpen, targetCoords, targetName]);

  // Track rider coordinate changes and update map & voice guidance
  useEffect(() => {
    if (!isOpen) return;

    const progress = voiceNavEngine.evaluateProgress(currentRiderPos, targetCoords, targetName);
    setDistanceKm(progress.distanceKm);
    setDistanceMeters(progress.distanceMeters);
    setEtaMinutes(progress.etaMinutes);
    setCurrentManeuver(progress.currentManeuver);
    setCurrentInstruction(progress.instruction);
    setIsArrived(progress.isArrived);

    // Update rider marker position on Leaflet map
    if (riderMarkerRef.current) {
      riderMarkerRef.current.setLatLng([currentRiderPos.lat, currentRiderPos.lng]);
    }
  }, [riderCoords, isOpen]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    async function initNavigationMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;

      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [currentRiderPos.lat, currentRiderPos.lng],
          zoom: 16,
          zoomControl: false,
          attributionControl: false,
        });

        // Google Maps High-Resolution Navigation Tiles
        L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
          maxZoom: 20,
          subdomains: ["mt0", "mt1", "mt2", "mt3"],
        }).addTo(map);

        // Custom Rider Bike Icon
        const riderIcon = L.divIcon({
          className: "custom-nav-rider-icon",
          html: `
            <div class="relative flex items-center justify-center w-12 h-12">
              <div class="absolute w-12 h-12 rounded-full bg-emerald-500/30 animate-ping"></div>
              <div class="relative w-10 h-10 rounded-full bg-emerald-600 border-2 border-white shadow-xl flex items-center justify-center text-white text-lg">
                🛵
              </div>
            </div>
          `,
          iconSize: [48, 48],
          iconAnchor: [24, 24],
        });

        // Custom Destination Icon
        const destIcon = L.divIcon({
          className: "custom-nav-dest-icon",
          html: `
            <div class="relative flex items-center justify-center w-12 h-12">
              <div class="absolute w-12 h-12 rounded-full bg-rose-500/30 animate-pulse"></div>
              <div class="relative w-10 h-10 rounded-full bg-rose-600 border-2 border-white shadow-xl flex items-center justify-center text-white text-sm font-black">
                📍
              </div>
            </div>
          `,
          iconSize: [48, 48],
          iconAnchor: [24, 24],
        });

        const rMarker = L.marker([currentRiderPos.lat, currentRiderPos.lng], { icon: riderIcon }).addTo(map);
        riderMarkerRef.current = rMarker;

        L.marker([targetCoords.lat, targetCoords.lng], { icon: destIcon })
          .bindPopup(`<b class="text-sm font-bold text-slate-900">${targetName}</b><br/><span class="text-xs text-slate-600">${targetAddress}</span>`)
          .addTo(map);

        // Draw Route Polyline
        const routeLine = L.polyline(
          [
            [currentRiderPos.lat, currentRiderPos.lng],
            [
              (currentRiderPos.lat + targetCoords.lat) / 2 + 0.0008,
              (currentRiderPos.lng + targetCoords.lng) / 2 - 0.0006,
            ],
            [targetCoords.lat, targetCoords.lng],
          ],
          {
            color: "#059669",
            weight: 6,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
            dashArray: "1, 10",
          }
        ).addTo(map);
        routePolylineRef.current = routeLine;

        // Auto Fit Bounds to show full route
        const bounds = L.latLngBounds([
          [currentRiderPos.lat, currentRiderPos.lng],
          [targetCoords.lat, targetCoords.lng],
        ]);
        map.fitBounds(bounds, { padding: [60, 60] });

        mapInstanceRef.current = map;
      }
    }

    void initNavigationMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Toggle Mute / Unmute
  const handleToggleMute = () => {
    triggerHaptic(50);
    const nextMute = voiceNavEngine.toggleMute();
    setIsMuted(nextMute);
  };

  // Toggle Language (Hindi <-> English)
  const handleToggleLanguage = () => {
    triggerHaptic(50);
    const nextLang: VoiceLanguage = language.startsWith("hi") ? "en-IN" : "hi-IN";
    setLanguage(nextLang);
    voiceNavEngine.setLanguage(nextLang);
  };

  // Repeat current voice instruction
  const handleRepeatVoice = () => {
    triggerHaptic(40);
    voiceNavEngine.speak(currentInstruction, true);
  };

  // Re-center Map on Rider GPS
  const handleRecenter = () => {
    triggerHaptic(40);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([currentRiderPos.lat, currentRiderPos.lng], 17, {
        animate: true,
      });
    }
  };

  // 1-Tap Google Maps External App
  const handleOpenExternalMaps = () => {
    triggerHaptic(50);
    const destination = encodeURIComponent(targetAddress || `${targetCoords.lat},${targetCoords.lng}`);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(mapsUrl, "_blank");
  };

  // Call Phone
  const handleCall = () => {
    triggerHaptic(50);
    if (targetPhone) {
      const cleanPhone = targetPhone.replace(/\D/g, "");
      window.location.href = `tel:${cleanPhone}`;
    }
  };

  // Render Maneuver Icon
  const renderManeuverIcon = () => {
    switch (currentManeuver) {
      case "turn-right":
      case "slight-right":
        return <CornerUpRight className="w-10 h-10 text-emerald-400 animate-bounce" />;
      case "turn-left":
      case "slight-left":
        return <CornerDownRight className="w-10 h-10 text-emerald-400 rotate-180 animate-bounce" />;
      case "arrived":
        return <MapPin className="w-10 h-10 text-rose-400 animate-pulse" />;
      case "depart":
      case "straight":
      default:
        return <Navigation className="w-10 h-10 text-emerald-400 -rotate-45 animate-pulse" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col overflow-hidden text-white font-sans animate-in fade-in duration-200 select-none">
      {/* 1. TOP TURN-BY-TURN HUD BANNER */}
      <div className="relative z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 pt-3 pb-4 shadow-2xl">
        <div className="flex items-center justify-between gap-3 mb-2">
          {/* Phase Badge */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-300 transition-all border border-slate-700"
              title="Close HUD"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Radio className="w-3 h-3 animate-ping" />
                {phaseLabel}
              </span>
              <p className="text-xs text-slate-400 font-medium truncate max-w-[180px]">
                {orderNumber || "Active Mission"}
              </p>
            </div>
          </div>

          {/* Quick Voice Controls */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              onClick={handleToggleLanguage}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 active:scale-95 transition-all"
              title="Toggle Hindi / English Voice"
            >
              <span>{language.startsWith("hi") ? "🇮🇳 हिन्दी" : "🇬🇧 English"}</span>
            </button>

            {/* Mute Toggle */}
            <button
              onClick={handleToggleMute}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border active:scale-95 ${
                isMuted
                  ? "bg-rose-950/60 border-rose-700 text-rose-400"
                  : "bg-emerald-950/60 border-emerald-600 text-emerald-400 animate-pulse"
              }`}
              title={isMuted ? "Unmute Voice" : "Mute Voice"}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Big Maneuver Instruction Card */}
        <div className="flex items-center gap-4 bg-slate-950/80 rounded-2xl p-3.5 border border-emerald-500/30">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-inner">
            {renderManeuverIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight text-white">
                {distanceMeters > 1000 ? `${distanceKm} km` : `${distanceMeters} m`}
              </span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                {isArrived ? "Arrived" : "Next Maneuver"}
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-200 line-clamp-2 mt-0.5 leading-snug">
              {currentInstruction}
            </p>
          </div>

          {/* Repeat Voice Button */}
          <button
            onClick={handleRepeatVoice}
            className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-90 flex items-center justify-center text-slate-300 border border-slate-700 shrink-0"
            title="Repeat instruction"
          >
            <Mic className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* 2. CENTER MAP CANVAS */}
      <div className="relative flex-1 w-full bg-slate-900">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Re-center Button */}
        <div className="absolute right-4 bottom-6 z-[400] flex flex-col gap-2.5">
          <button
            onClick={handleRecenter}
            className="w-12 h-12 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700 text-emerald-400 shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
            title="Recenter GPS"
          >
            <Locate className="w-6 h-6" />
          </button>

          {/* External Google Maps Button */}
          <button
            onClick={handleOpenExternalMaps}
            className="w-12 h-12 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700 text-blue-400 shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
            title="Open Google Maps App"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
        </div>

        {/* Speedometer Badge */}
        <div className="absolute left-4 bottom-6 z-[400] bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl px-3.5 py-2 shadow-2xl flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <div>
            <div className="text-lg font-black text-white leading-none">{userSpeedKmh}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">km/h</div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM COCKPIT DRAWER */}
      <div className="relative z-20 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-4 pt-3.5 pb-6 shadow-2xl">
        {/* Destination & Target Summary */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-0.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{targetName}</span>
            </div>
            <p className="text-xs text-slate-300 truncate font-medium">{targetAddress}</p>
          </div>

          {/* Phone Call Button */}
          {targetPhone && (
            <button
              onClick={handleCall}
              className="w-11 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-900/40 shrink-0"
              title="Call Target"
            >
              <Phone className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Trip Stats Matrix */}
        <div className="grid grid-cols-3 gap-2.5 mb-3.5">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Remaining</div>
            <div className="text-base font-black text-white">{distanceKm} km</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Est. Time</div>
            <div className="text-base font-black text-emerald-400">{etaMinutes} mins</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Voice Guide</div>
            <div className="text-xs font-black text-slate-200 mt-1">
              {isMuted ? "Muted 🔇" : "Active 🔊"}
            </div>
          </div>
        </div>

        {/* Action Button: Arrived at Location */}
        {onArrived ? (
          <button
            onClick={() => {
              triggerHaptic([100, 50, 100]);
              onArrived();
              onClose();
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-black text-sm tracking-wider uppercase shadow-xl shadow-emerald-900/50 flex items-center justify-center gap-2 transition-all border border-emerald-400/30"
          >
            <Sparkles className="w-4 h-4" />
            Arrived at Destination • Proceed
          </button>
        ) : (
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 border border-slate-700"
          >
            Exit In-App Navigation
          </button>
        )}
      </div>
    </div>
  );
}
