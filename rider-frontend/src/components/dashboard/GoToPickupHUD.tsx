import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bike,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Crosshair,
  DollarSign,
  ExternalLink,
  KeyRound,
  Layers,
  MapPin,
  Menu,
  MessageSquare,
  Navigation,
  Phone,
  PhoneCall,
  Send,
  ShieldCheck,
  Timer,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  playArrivalChime,
  playSuccessChime,
  speakArrival,
  speakTripComplete,
  speakText,
  triggerHaptic,
  unlockAudioContext,
} from "../../lib/captain-audio";
import { InAppVoiceNavigationModal } from "../navigation/InAppVoiceNavigationModal";

export interface ActiveOrderData {
  orderId: string;
  customerName: string;
  customerPhone?: string;
  pickupAddress: string;
  pickupTitle?: string;
  dropAddress: string;
  dropTitle?: string;
  distanceMeters?: number;
  pickupDistanceKm?: number;
  dropDistanceKm?: number;
  fare: number;
  startOtp?: string;
  pickupCoords?: { lat: number; lng: number };
  dropCoords?: { lat: number; lng: number };
}

interface GoToPickupHUDProps {
  order: ActiveOrderData;
  onOpenDrawer?: () => void;
  onTripCompleted?: () => void;
  onCancelTrip?: () => void;
}

type TripStage = "en_route_pickup" | "arrived_pickup" | "in_trip" | "completed";

export const GoToPickupHUD: React.FC<GoToPickupHUDProps> = ({
  order,
  onOpenDrawer,
  onTripCompleted,
  onCancelTrip,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);

  const [stage, setStage] = useState<TripStage>("en_route_pickup");
  const [distanceMeters, setDistanceMeters] = useState(order.distanceMeters || 258);
  const [waitingSeconds, setWaitingSeconds] = useState(300); // 5 mins free waiting
  const [isWaitingTimerActive, setIsWaitingTimerActive] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", ""]);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [acceptedTime] = useState(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  const [arrivedTime, setArrivedTime] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [completedTime, setCompletedTime] = useState<string | null>(null);
  const [showVoiceNavModal, setShowVoiceNavModal] = useState(false);

  const [chatMessages, setChatMessages] = useState<Array<{ sender: "rider" | "customer"; text: string; time: string }>>([
    { sender: "customer", text: "Please come to the main gate near medical shop.", time: "Just now" },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [sliderProgress, setSliderProgress] = useState(0);

  // Default coordinate (Kasganj Hub or order coordinates)
  const captainCoords = { lat: 27.8083, lng: 78.6477 };
  const pickupCoords = order.pickupCoords || { lat: 27.8095, lng: 78.6490 };
  const dropCoords = order.dropCoords || { lat: 27.8150, lng: 78.6520 };

  // Free waiting timer when arrived at pickup
  useEffect(() => {
    if (stage !== "arrived_pickup" || !isWaitingTimerActive) return;
    const interval = setInterval(() => {
      setWaitingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [stage, isWaitingTimerActive]);

  // Format MM:SS
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  };

  // Initialize Leaflet Map once on mount
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;
      try {
        const leafletModule = await import("leaflet");
        const L = leafletModule.default || leafletModule;
        await import("leaflet/dist/leaflet.css");

        if (!isMounted || !mapContainerRef.current) return;

        // If map already exists, remove it before creating fresh instance
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove();
          } catch {}
          mapInstanceRef.current = null;
        }

        const center = pickupCoords;
        const map = L.map(mapContainerRef.current, {
          center: [center.lat, center.lng],
          zoom: 16,
          zoomControl: false,
          attributionControl: false,
        });

        // Google Maps High-Resolution Roadmap Tiles
        L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
          maxZoom: 20,
          subdomains: ["mt0", "mt1", "mt2", "mt3"],
        }).addTo(map);

        mapInstanceRef.current = map;

        // Render markers initially
        updateMapLayers(L, map, stage);
      } catch (err) {
        console.warn("Leaflet map initialization notice:", err);
      }
    }

    void initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map layers when stage changes
  const updateMapLayers = (L: any, map: any, currentStage: TripStage) => {
    if (!map || !L) return;
    try {
      // Clear previous overlay layers
      map.eachLayer((layer: any) => {
        if (layer.options && !layer.options.subdomains) {
          map.removeLayer(layer);
        }
      });

      // 1. Captain Location Marker (Blue directional arrow in circle)
      const captainIcon = L.divIcon({
        className: "custom-captain-icon",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
            <div style="position: absolute; width: 40px; height: 40px; border-radius: 9999px; background-color: rgba(37, 99, 235, 0.3); animation: ping 1.8s infinite;"></div>
            <div style="position: relative; display: flex; width: 34px; height: 34px; align-items: center; justify-content: center; border-radius: 9999px; background-color: #2563EB; color: white; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.5); border: 2.5px solid white;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      L.marker([captainCoords.lat, captainCoords.lng], { icon: captainIcon }).addTo(map);

      // 2. Customer Destination Target Pin (Green pin with User icon and glowing ring)
      const pickupIcon = L.divIcon({
        className: "custom-pickup-icon",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 48px; height: 48px;">
            <div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background-color: rgba(0, 200, 83, 0.25); animation: pulse 2s infinite;"></div>
            <div style="position: relative; display: flex; width: 34px; height: 34px; align-items: center; justify-content: center; border-radius: 9999px; background-color: #00C853; color: white; box-shadow: 0 4px 12px rgba(0, 200, 83, 0.4); border: 2.5px solid white;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      const dest = currentStage === "in_trip" ? dropCoords : pickupCoords;
      L.marker([dest.lat, dest.lng], { icon: pickupIcon }).addTo(map);

      // 3. Dashed Green Route Line (Matching Screenshot)
      const routePoints = [
        [captainCoords.lat, captainCoords.lng],
        [(captainCoords.lat + dest.lat) / 2 + 0.0005, (captainCoords.lng + dest.lng) / 2 - 0.0004],
        [dest.lat, dest.lng],
      ];

      L.polyline(routePoints, {
        color: "#00C853",
        weight: 4,
        dashArray: "6, 8",
        opacity: 0.9,
      }).addTo(map);

      map.fitBounds(
        [
          [captainCoords.lat, captainCoords.lng],
          [dest.lat, dest.lng],
        ],
        { padding: [60, 60], maxZoom: 17 }
      );
    } catch (e) {
      console.warn("Error updating map layers:", e);
    }
  };

  // Trigger layer update on stage change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    void (async () => {
      const leafletModule = await import("leaflet");
      const L = leafletModule.default || leafletModule;
      updateMapLayers(L, mapInstanceRef.current, stage);
    })();
  }, [stage]);

  // Recenter GPS
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([captainCoords.lat, captainCoords.lng], 16);
    toast.info("Map centered on your location 📍");
  };

  // Open External Google Maps Navigation
  const handleOpenGoogleMaps = () => {
    const dest = stage === "in_trip" ? dropCoords : pickupCoords;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=two-wheeler`;
    window.open(url, "_blank");
  };

  // Action Handlers
  const handleMarkArrived = () => {
    unlockAudioContext();
    triggerHaptic();
    playArrivalChime();
    speakArrival(order.pickupTitle || "पिकअप स्थान");
    setStage("arrived_pickup");
    setIsWaitingTimerActive(true);
    setArrivedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    toast.success("You have arrived at Pickup location! 📍 Customer notified.");
  };

  const handleStartTrip = () => {
    const enteredOtp = otpDigits.join("");
    const requiredOtp = order.startOtp || "4829";

    // Allow quick match or 4-digit input
    if (enteredOtp.length < 4 && enteredOtp !== requiredOtp) {
      toast.error(`Please enter 4-digit OTP (e.g. ${requiredOtp})`);
      return;
    }

    unlockAudioContext();
    triggerHaptic();
    playSuccessChime();
    speakText("ट्रिप शुरू हो गई है। सुरक्षित ड्राइव करें।");
    setStage("in_trip");
    setIsWaitingTimerActive(false);
    setStartTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    toast.success("Trip Started! 🛵 Heading to Drop location.");
  };

  const handleCompleteTrip = () => {
    unlockAudioContext();
    triggerHaptic();
    playSuccessChime();
    speakTripComplete(order.fare);
    setStage("completed");
    setCompletedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    toast.success(`🎉 Trip Completed! Collected ₹${order.fare.toFixed(2)}`);
  };

  const handleSendChat = (text: string) => {
    if (!text.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { sender: "rider", text: text.trim(), time: "Now" },
    ]);
    setInputMsg("");
    triggerHaptic();
    toast.success("Message sent to customer 💬");
  };

  return (
    <div className="relative flex flex-col w-full h-[100dvh] max-w-md mx-auto bg-white shadow-2xl overflow-hidden text-neutral-900 select-none">
      {/* 1. Top Navigation Bar (Exact Match: ☰ Go to Pickup Zone 📞) */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-100 shadow-xs">
        {/* Hamburger Menu Button */}
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex items-center justify-center w-10 h-10 -ml-1 text-neutral-900 rounded-full hover:bg-neutral-100 active:scale-95 transition-transform"
          aria-label="Open Navigation Drawer"
        >
          <Menu className="w-6 h-6 stroke-[2.4]" />
        </button>

        {/* Screen Title */}
        <h1 className="text-base font-black text-neutral-950 tracking-tight">
          {stage === "en_route_pickup" && "Go to Pickup Zone"}
          {stage === "arrived_pickup" && "At Pickup Location"}
          {stage === "in_trip" && "Heading to Drop Zone"}
          {stage === "completed" && "Trip Completed"}
        </h1>

        {/* Support / Call Customer Button (Black circle with Yellow telephone icon) */}
        <button
          type="button"
          onClick={() => setShowCallModal(true)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-950 text-[#FBBF24] hover:bg-neutral-800 shadow-sm active:scale-95 transition-all"
          aria-label="Call Customer"
        >
          <Phone className="w-5 h-5 fill-[#FBBF24] stroke-none" />
        </button>
      </header>

      {/* 1.1 ORDER TIMELINE STEP PROGRESS BAR */}
      <div className="z-25 bg-neutral-50 px-3.5 py-2 border-b border-neutral-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-1.5">
          <button
            type="button"
            onClick={() => setShowTimelineModal(true)}
            className="flex items-center gap-1.5 text-xs font-black text-neutral-900 hover:text-[#00C853] transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-[#00C853]" />
            <span>Order Timeline</span>
            <span className="text-[10px] text-[#00C853] font-bold bg-[#00C853]/10 px-1.5 py-0.2 rounded-full">
              View
            </span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>
          <span className="text-[10px] font-bold text-neutral-500 bg-white px-2 py-0.5 rounded-full border border-neutral-200">
            Trip #{order.orderId || "101"} · ₹{order.fare.toFixed(2)}
          </span>
        </div>

        {/* 4 Step Progress Line */}
        <div className="grid grid-cols-4 gap-1 items-center pt-0.5">
          {/* Step 1: Accepted */}
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-[#00C853] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3 h-3 stroke-[3]" />
            </div>
            <span className="text-[10px] font-black text-[#00C853] truncate">Accept</span>
          </div>

          {/* Step 2: Pickup */}
          <div className="flex items-center gap-1">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black ${
                stage === "en_route_pickup"
                  ? "bg-blue-600 text-white ring-2 ring-blue-200 animate-pulse"
                  : "bg-[#00C853] text-white"
              }`}
            >
              {stage === "en_route_pickup" ? "2" : "✓"}
            </div>
            <span
              className={`text-[10px] font-black truncate ${
                stage === "en_route_pickup" ? "text-blue-600" : "text-[#00C853]"
              }`}
            >
              Pickup
            </span>
          </div>

          {/* Step 3: In-Trip */}
          <div className="flex items-center gap-1">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black ${
                stage === "in_trip"
                  ? "bg-emerald-600 text-white ring-2 ring-emerald-200 animate-pulse"
                  : stage === "completed"
                  ? "bg-[#00C853] text-white"
                  : "bg-neutral-200 text-neutral-600"
              }`}
            >
              {stage === "completed" ? "✓" : "3"}
            </div>
            <span
              className={`text-[10px] font-black truncate ${
                stage === "in_trip" ? "text-emerald-700" : stage === "completed" ? "text-[#00C853]" : "text-neutral-400"
              }`}
            >
              In-Trip
            </span>
          </div>

          {/* Step 4: Drop */}
          <div className="flex items-center gap-1">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black ${
                stage === "completed"
                  ? "bg-[#00C853] text-white"
                  : "bg-neutral-200 text-neutral-600"
              }`}
            >
              {stage === "completed" ? "✓" : "4"}
            </div>
            <span
              className={`text-[10px] font-black truncate ${
                stage === "completed" ? "text-[#00C853]" : "text-neutral-400"
              }`}
            >
              Drop
            </span>
          </div>
        </div>
      </div>

      {/* 2. Live Fullscreen Map Area with Floating Elements */}
      <div className="relative flex-1 w-full overflow-hidden bg-neutral-100">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Distance Pill (Over destination pin: "258 meters away") */}
        {stage === "en_route_pickup" && (
          <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-12 z-20 pointer-events-none animate-bounce duration-1000">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#059669] text-white font-black text-xs rounded-full shadow-lg border border-emerald-400/40">
              <span>{distanceMeters} meters away</span>
            </div>
          </div>
        )}

        {/* Floating Yellow/Amber Navigation CTA Button ("▲ Go to pickup") */}
        {stage === "en_route_pickup" && (
          <div className="absolute top-[48%] left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
            <button
              type="button"
              onClick={handleOpenGoogleMaps}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-neutral-950 font-black text-sm rounded-full shadow-xl border border-amber-300 active:scale-95 transition-all"
            >
              <Navigation className="w-4 h-4 fill-neutral-950 stroke-none" />
              <span>Go to pickup</span>
            </button>
          </div>
        )}

        {/* Floating In-Trip Speed & Heading Banner */}
        {stage === "in_trip" && (
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-neutral-200">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-black text-sm">
                ⚡
              </div>
              <div>
                <p className="text-xs font-black text-neutral-900">Dropping at {order.dropTitle || "Saidabad"}</p>
                <p className="text-[11px] text-neutral-500 font-medium">{order.dropDistanceKm || 3.6} km remaining</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-black text-emerald-600">32 km/h</span>
              <p className="text-[10px] text-neutral-400">GPS Speed</p>
            </div>
          </div>
        )}

        {/* Official Google Maps Watermark Badge (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-xs rounded-lg shadow-sm border border-slate-200 pointer-events-none text-[11px] font-bold">
          <span className="text-[#4285F4]">G</span>
          <span className="text-[#EA4335]">o</span>
          <span className="text-[#FBBC05]">o</span>
          <span className="text-[#4285F4]">g</span>
          <span className="text-[#34A853]">l</span>
          <span className="text-[#EA4335]">e</span>
          <span className="text-slate-600 font-semibold ml-0.5">Maps</span>
        </div>

        {/* Floating Map Controls (Bottom Right GPS Recenter & Voice GPS Buttons) */}
        <div className="absolute right-4 bottom-4 z-20 flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => setShowVoiceNavModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#00C853] hover:bg-[#00B248] text-white font-black text-xs rounded-full shadow-lg border border-emerald-400 active:scale-95 transition-all"
            title="In-App Voice Turn-by-Turn GPS"
          >
            <Navigation className="w-3.5 h-3.5 fill-white" />
            <span>Voice GPS</span>
          </button>
          <button
            type="button"
            onClick={handleRecenter}
            className="flex items-center justify-center w-10 h-10 bg-white text-blue-600 rounded-full shadow-lg border border-neutral-200 active:scale-90 transition-transform hover:bg-neutral-50"
            aria-label="Recenter Map"
          >
            <Crosshair className="w-5 h-5 text-blue-600" />
          </button>
        </div>
      </div>

      {/* 3. Status Pill Banner: ✔ Customer Verified Location + ⏱️ Order Timeline Trigger */}
      <div className="z-20 flex items-center justify-between py-2 px-4 bg-[#F8FAFC] border-t border-neutral-100 text-xs font-black text-neutral-800">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-[#00C853] shrink-0" />
          <span>Customer Verified Location</span>
        </div>
        <button
          type="button"
          onClick={() => setShowTimelineModal(true)}
          className="flex items-center gap-1 text-[11px] font-black text-[#00C853] hover:text-[#00B248] bg-[#00C853]/10 px-2.5 py-1 rounded-full border border-[#00C853]/20 active:scale-95 transition-all"
        >
          <Clock className="w-3 h-3 text-[#00C853]" />
          <span>Timeline</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* 4. Customer Information Card (Exact Match to Red Box in Screenshot) */}
      <div className="relative z-20 bg-white px-4 pt-3 pb-3 border-t border-neutral-200 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          {/* Green Location Pin & Customer Details */}
          <div className="flex items-start gap-2.5 flex-1 pr-12">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-[#00C853] shrink-0 mt-0.5">
              <MapPin className="w-5 h-5 fill-[#00C853] text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-neutral-950 leading-tight">
                  {order.customerName || "Customer"}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowTimelineModal(true)}
                  className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md hover:bg-blue-100"
                >
                  ⏱️ Timeline
                </button>
              </div>
              <p className="text-xs font-medium text-neutral-600 leading-snug mt-1 line-clamp-2">
                {stage === "in_trip"
                  ? order.dropAddress || "Delivery Address"
                  : order.pickupAddress || "Pickup Location"}
              </p>
            </div>
          </div>

          {/* Floating Royal Blue Chat Button 💬 */}
          <button
            type="button"
            onClick={() => setShowChatModal(true)}
            className="absolute right-4 top-3.5 flex items-center justify-center w-12 h-12 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-lg active:scale-95 transition-all"
            aria-label="Open Chat with Customer"
          >
            <MessageSquare className="w-6 h-6 fill-white" />
          </button>
        </div>
      </div>

      {/* 5. Bottom Action Controls depending on Stage */}
      <div className="relative z-20 bg-white p-4 pt-2 border-t border-neutral-100 space-y-2">
        {/* STAGE 1: Royal Blue [ → ARRIVED ] Button (Exact Match to Screenshot) */}
        {stage === "en_route_pickup" && (
          <button
            type="button"
            onClick={handleMarkArrived}
            className="w-full h-13.5 flex items-center bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-black text-base tracking-wider rounded-xl shadow-lg shadow-blue-500/25 active:scale-[0.99] transition-all overflow-hidden"
          >
            {/* Left Arrow Icon Box */}
            <div className="flex items-center justify-center w-14 h-full bg-blue-600/60 border-r border-blue-400/30">
              <ArrowRight className="w-6 h-6 stroke-[3]" />
            </div>
            {/* Center Label */}
            <div className="flex-1 text-center pr-14">
              <span>ARRIVED</span>
            </div>
          </button>
        )}

        {/* STAGE 2: Arrived at Pickup -> Waiting Timer + 4-Digit OTP + START TRIP */}
        {stage === "arrived_pickup" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Waiting Timer Card */}
            <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-black text-amber-900">
                <Timer className="w-4 h-4 text-amber-600 animate-spin duration-3000" />
                <span>Free Waiting Time</span>
              </div>
              <span className="text-sm font-black text-amber-950 font-mono">
                {formatTimer(waitingSeconds)}
              </span>
            </div>

            {/* 4-Digit Start OTP Input */}
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-neutral-800">
                  Enter Customer Start OTP
                </label>
                <span className="text-[10px] font-bold text-neutral-400">
                  Demo OTP: {order.startOtp || "4829"}
                </span>
              </div>

              <div className="flex gap-2 justify-center">
                {[0, 1, 2, 3].map((idx) => (
                  <input
                    key={idx}
                    type="tel"
                    maxLength={1}
                    value={otpDigits[idx]}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const next = [...otpDigits];
                      next[idx] = val;
                      setOtpDigits(next);
                      if (val && idx < 3) {
                        const nextEl = document.getElementById(`trip-otp-${idx + 1}`);
                        nextEl?.focus();
                      }
                    }}
                    id={`trip-otp-${idx}`}
                    className="w-12 h-11 text-center font-black text-lg bg-white border border-neutral-300 rounded-lg focus:border-[#00C853] focus:outline-none shadow-xs"
                  />
                ))}
              </div>
            </div>

            {/* Bright Green [ → START TRIP ] Slider */}
            <button
              type="button"
              onClick={handleStartTrip}
              className="w-full h-13.5 flex items-center bg-[#00C853] hover:bg-[#00B248] text-white font-black text-base tracking-wider rounded-xl shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition-all overflow-hidden"
            >
              <div className="flex items-center justify-center w-14 h-full bg-emerald-600/50 border-r border-emerald-400/30">
                <ArrowRight className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="flex-1 text-center pr-14">
                <span>START TRIP</span>
              </div>
            </button>
          </div>
        )}

        {/* STAGE 3: In Trip -> Red [ → COMPLETE TRIP ] Button */}
        {stage === "in_trip" && (
          <button
            type="button"
            onClick={handleCompleteTrip}
            className="w-full h-13.5 flex items-center bg-[#EF4444] hover:bg-[#DC2626] text-white font-black text-base tracking-wider rounded-xl shadow-lg shadow-red-500/25 active:scale-[0.99] transition-all overflow-hidden"
          >
            <div className="flex items-center justify-center w-14 h-full bg-red-600/50 border-r border-red-400/30">
              <ArrowRight className="w-6 h-6 stroke-[3]" />
            </div>
            <div className="flex-1 text-center pr-14">
              <span>COMPLETE TRIP</span>
            </div>
          </button>
        )}

        {/* STAGE 4: Trip Completed & Payment Collected */}
        {stage === "completed" && (
          <div className="space-y-3 animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
              <span className="text-3xl">🎉</span>
              <h3 className="text-lg font-black text-emerald-950">Trip Completed!</h3>
              <p className="text-2xl font-black text-[#00C853]">₹{order.fare.toFixed(2)}</p>
              <p className="text-xs font-semibold text-emerald-800">Payment Credited to Wallet</p>
            </div>

            <button
              type="button"
              onClick={onTripCompleted}
              className="w-full h-13 flex items-center justify-center bg-[#00C853] hover:bg-[#00B248] text-white font-black text-sm tracking-wide rounded-xl shadow-lg shadow-emerald-500/25 active:scale-98 transition-all"
            >
              <span>Ready for Next Order 🚀</span>
            </button>
          </div>
        )}
      </div>

      {/* 6. Quick Chat Slide-Up Modal */}
      {showChatModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[75vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#00C853]" />
                <h3 className="text-sm font-black text-neutral-900">Chat with {order.customerName || "Mohd"}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowChatModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto min-h-[160px]">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === "rider" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs font-bold ${
                      msg.sender === "rider"
                        ? "bg-[#2563EB] text-white rounded-br-none"
                        : "bg-neutral-100 text-neutral-900 rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-neutral-400 mt-0.5 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Quick Reply Chips */}
            <div className="flex gap-2 p-2 px-3 overflow-x-auto border-t border-neutral-100 bg-neutral-50">
              {["I am on my way 🛵", "I have arrived at pickup 📍", "Please come down 👍", "Traffic delay ⏳"].map(
                (quick, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendChat(quick)}
                    className="px-3 py-1 bg-white border border-neutral-200 rounded-full text-[11px] font-bold text-neutral-700 whitespace-nowrap active:scale-95 shadow-xs"
                  >
                    {quick}
                  </button>
                )
              )}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat(inputMsg);
              }}
              className="flex items-center gap-2 p-3 border-t border-neutral-100 bg-white"
            >
              <input
                type="text"
                placeholder="Type a message..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="flex-1 h-10 px-3.5 bg-neutral-100 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#2563EB]"
              />
              <button
                type="submit"
                className="w-10 h-10 flex items-center justify-center bg-[#2563EB] text-white rounded-xl active:scale-95 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. Call Customer Confirmation Modal */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <PhoneCall className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-black text-neutral-900">Call {order.customerName || "Mohd"}?</h3>
              <p className="text-xs text-neutral-500 mt-1">{order.customerPhone || "+91 98765 43210"}</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCallModal(false)}
                className="flex-1 h-11 bg-neutral-100 font-bold text-xs rounded-xl text-neutral-700 hover:bg-neutral-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCallModal(false);
                  window.open(`tel:${order.customerPhone || "+919876543210"}`);
                  toast.success(`Calling ${order.customerName}... 📞`);
                }}
                className="flex-1 h-11 bg-[#00C853] hover:bg-[#00B248] text-white font-black text-xs rounded-xl shadow-md shadow-emerald-500/25"
              >
                Call Now 📞
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Full Interactive Order Timeline Slide-Up Sheet */}
      {showTimelineModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Modal Header */}
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-[#00C853]">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-neutral-950 leading-tight">
                    Live Order Timeline
                  </h3>
                  <p className="text-[11px] font-semibold text-neutral-500">
                    Trip #{order.orderId || "101"} · QuickPress Bike
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTimelineModal(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-neutral-100 text-neutral-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Fare & OTP Banner */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-50 border-b border-neutral-100 text-xs">
              <div className="flex items-center gap-1.5 font-black text-neutral-900">
                <span className="text-sm font-black text-emerald-600">₹{order.fare.toFixed(2)}</span>
                <span className="text-[10px] text-neutral-500 font-semibold">(Cash on Delivery)</span>
              </div>
              <div className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full font-black text-[11px]">
                <KeyRound className="w-3 h-3 text-amber-600" />
                <span>Start OTP: {order.startOtp || "4829"}</span>
              </div>
            </div>

            {/* Vertical Timeline Stepper */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {/* Event 1: Order Placed */}
              <div className="relative flex gap-3.5 items-start">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#00C853] text-white shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div className="w-0.5 h-12 bg-[#00C853]" />
                </div>
                <div className="flex-1 -mt-0.5">
                  <div className="flex items-baseline justify-between">
                    <h4 className="text-xs font-black text-neutral-900">Order Placed</h4>
                    <span className="text-[10px] font-bold text-neutral-400">09:40 PM</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Order initiated by {order.customerName || "Customer"}
                  </p>
                </div>
              </div>

              {/* Event 2: Order Accepted */}
              <div className="relative flex gap-3.5 items-start">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#00C853] text-white shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div className="w-0.5 h-12 bg-[#00C853]" />
                </div>
                <div className="flex-1 -mt-0.5">
                  <div className="flex items-baseline justify-between">
                    <h4 className="text-xs font-black text-neutral-900">Order Accepted</h4>
                    <span className="text-[10px] font-bold text-emerald-600">{acceptedTime}</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Captain accepted the delivery offer
                  </p>
                </div>
              </div>

              {/* Event 3: Arrived at Pickup */}
              <div className="relative flex gap-3.5 items-start">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${
                      stage === "en_route_pickup"
                        ? "bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse"
                        : "bg-[#00C853] text-white"
                    }`}
                  >
                    {stage === "en_route_pickup" ? (
                      <Bike className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                    )}
                  </div>
                  <div
                    className={`w-0.5 h-14 ${
                      stage === "en_route_pickup" ? "bg-neutral-200" : "bg-[#00C853]"
                    }`}
                  />
                </div>
                <div className="flex-1 -mt-0.5">
                  <div className="flex items-baseline justify-between">
                    <h4
                      className={`text-xs font-black ${
                        stage === "en_route_pickup" ? "text-blue-600" : "text-neutral-900"
                      }`}
                    >
                      {stage === "en_route_pickup" ? "En Route to Pickup" : "Arrived at Pickup"}
                    </h4>
                    <span className="text-[10px] font-bold text-neutral-400">
                      {arrivedTime || "In Progress"}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 font-semibold mt-0.5">
                    {order.pickupTitle || "Dabirpura"} ({order.distanceMeters || 258}m)
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">
                    {order.pickupAddress}
                  </p>
                </div>
              </div>

              {/* Event 4: Trip Started / OTP Verified */}
              <div className="relative flex gap-3.5 items-start">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${
                      stage === "arrived_pickup"
                        ? "bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse"
                        : stage === "in_trip" || stage === "completed"
                        ? "bg-[#00C853] text-white"
                        : "bg-neutral-200 text-neutral-500"
                    }`}
                  >
                    {stage === "in_trip" || stage === "completed" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <KeyRound className="w-3 h-3" />
                    )}
                  </div>
                  <div
                    className={`w-0.5 h-14 ${
                      stage === "in_trip" || stage === "completed" ? "bg-[#00C853]" : "bg-neutral-200"
                    }`}
                  />
                </div>
                <div className="flex-1 -mt-0.5">
                  <div className="flex items-baseline justify-between">
                    <h4
                      className={`text-xs font-black ${
                        stage === "arrived_pickup"
                          ? "text-amber-600"
                          : stage === "in_trip"
                          ? "text-emerald-700"
                          : "text-neutral-900"
                      }`}
                    >
                      OTP Verification & Start Trip
                    </h4>
                    <span className="text-[10px] font-bold text-neutral-400">
                      {startTime || "Pending"}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Customer OTP: <span className="font-mono font-bold text-neutral-900">{order.startOtp || "4829"}</span>
                  </p>
                </div>
              </div>

              {/* Event 5: Heading to Destination */}
              <div className="relative flex gap-3.5 items-start">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${
                      stage === "in_trip"
                        ? "bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse"
                        : stage === "completed"
                        ? "bg-[#00C853] text-white"
                        : "bg-neutral-200 text-neutral-500"
                    }`}
                  >
                    {stage === "completed" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <MapPin className="w-3 h-3" />
                    )}
                  </div>
                  <div
                    className={`w-0.5 h-12 ${
                      stage === "completed" ? "bg-[#00C853]" : "bg-neutral-200"
                    }`}
                  />
                </div>
                <div className="flex-1 -mt-0.5">
                  <div className="flex items-baseline justify-between">
                    <h4 className="text-xs font-black text-neutral-900">
                      Heading to Drop Location
                    </h4>
                    <span className="text-[10px] font-bold text-neutral-400">
                      {stage === "in_trip" ? "Live" : stage === "completed" ? "Completed" : "Upcoming"}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 font-semibold mt-0.5">
                    {order.dropTitle || "Saidabad"} ({order.dropDistanceKm || 3.6} km)
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">
                    {order.dropAddress}
                  </p>
                </div>
              </div>

              {/* Event 6: Delivered & Completed */}
              <div className="relative flex gap-3.5 items-start">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${
                      stage === "completed"
                        ? "bg-[#00C853] text-white ring-4 ring-emerald-100"
                        : "bg-neutral-200 text-neutral-400"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
                <div className="flex-1 -mt-0.5">
                  <div className="flex items-baseline justify-between">
                    <h4
                      className={`text-xs font-black ${
                        stage === "completed" ? "text-[#00C853]" : "text-neutral-500"
                      }`}
                    >
                      Trip Completed
                    </h4>
                    <span className="text-[10px] font-bold text-neutral-400">
                      {completedTime || "Estimated"}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Collect ₹{order.fare.toFixed(2)} & credit to wallet
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Close */}
            <div className="p-4 border-t border-neutral-100 bg-white">
              <button
                type="button"
                onClick={() => setShowTimelineModal(false)}
                className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white font-black text-xs rounded-xl active:scale-98 transition-all"
              >
                Close Timeline
              </button>
            </div>
          </div>
        </div>
      )}
      {/* In-App Turn-by-Turn Voice Navigation Modal */}
      <InAppVoiceNavigationModal
        isOpen={showVoiceNavModal}
        onClose={() => setShowVoiceNavModal(false)}
        riderCoords={captainCoords}
        targetCoords={stage === "in_trip" ? dropCoords : pickupCoords}
        targetName={stage === "in_trip" ? (order.dropTitle || "Drop Location") : (order.pickupTitle || "Pickup Location")}
        targetAddress={stage === "in_trip" ? order.dropAddress : order.pickupAddress}
        targetPhone={order.customerPhone}
        orderNumber={order.orderId}
        phaseLabel={stage === "in_trip" ? "To Customer" : "To Pickup"}
        onArrived={() => {
          setShowVoiceNavModal(false);
          if (stage === "en_route_pickup") {
            handleMarkArrived();
          } else if (stage === "in_trip") {
            handleCompleteTrip();
          }
        }}
      />
    </div>
  );
};
