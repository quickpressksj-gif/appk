import { useEffect, useRef, useState } from "react";
import { Crosshair, ExternalLink, Flame, Layers, Moon, Navigation, Sun, Zap, ZoomIn, ZoomOut } from "lucide-react";
import { triggerHaptic } from "../../lib/captain-audio";

export type MapCoordinate = {
  lat: number;
  lng: number;
  label?: string;
  sublabel?: string;
};

export type SurgeHotspot = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  bonus: number;
  multiplier: string;
  label: string;
};

export const KASGANJ_SURGE_HOTSPOTS: SurgeHotspot[] = [
  {
    id: "ksj-station",
    name: "Kasganj Junction Station",
    lat: 27.8105,
    lng: 78.6410,
    bonus: 25,
    multiplier: "1.6x",
    label: "+₹25 Surge 🔥",
  },
  {
    id: "ksj-market",
    name: "Main Bazaar & Gandhi Murti",
    lat: 27.8145,
    lng: 78.6495,
    bonus: 20,
    multiplier: "1.5x",
    label: "+₹20 Surge ⚡",
  },
  {
    id: "ksj-soron",
    name: "Soron Gate Commercial Hub",
    lat: 27.8182,
    lng: 78.6442,
    bonus: 15,
    multiplier: "1.3x",
    label: "+₹15 Surge 📍",
  },
  {
    id: "ksj-bilram",
    name: "Bilram Gate Express Zone",
    lat: 27.8080,
    lng: 78.6525,
    bonus: 20,
    multiplier: "1.4x",
    label: "+₹20 Surge 🚀",
  },
];

export type LiveDeliveryMapProps = {
  riderLocation?: MapCoordinate | null;
  destinationLocation?: MapCoordinate | null;
  storeLocation?: MapCoordinate | null;
  targetAddressName?: string;
  phase?: "pickup" | "delivery" | "online" | "idle";
  heightClassName?: string;
  showControls?: boolean;
  showSurgePins?: boolean;
  isRapidoTheme?: boolean;
  onOpenNavigation?: () => void;
  onSurgeClick?: (surge: SurgeHotspot) => void;
  activeLayerOverride?: GoogleMapLayerType;
  onLayerChange?: (layer: GoogleMapLayerType) => void;
};

export type GoogleMapLayerType = "roadmap" | "satellite" | "traffic" | "night";

const MAP_TILE_CONFIGS: Record<GoogleMapLayerType, { url: string; subdomains: string[] }> = {
  roadmap: {
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
  },
  night: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    subdomains: ["a", "b", "c", "d"],
  },
  satellite: {
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
  },
  traffic: {
    url: "https://mt1.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
  },
};

// Calculate Haversine distance in Kilometres
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export function LiveDeliveryMap({
  riderLocation,
  destinationLocation,
  storeLocation,
  targetAddressName,
  phase = "pickup",
  heightClassName = "h-72",
  showControls = true,
  showSurgePins = true,
  isRapidoTheme = true,
  onOpenNavigation,
  onSurgeClick,
  activeLayerOverride,
  onLayerChange,
}: LiveDeliveryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const surgeMarkersRef = useRef<{ [key: string]: any }>({});
  const polylineRef = useRef<any>(null);

  const [mapReady, setMapReady] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [etaMins, setEtaMins] = useState<number | null>(null);
  const [internalLayer, setInternalLayer] = useState<GoogleMapLayerType>("roadmap");

  const activeLayer = activeLayerOverride || internalLayer;

  // Default coordinate (Center of Kasganj, UP if no coordinates available)
  const defaultCenter = { lat: 27.8118, lng: 78.6477 };

  // Calculate distance & ETA whenever positions update
  useEffect(() => {
    const dest = destinationLocation || storeLocation;
    if (riderLocation && dest) {
      const dist = getDistanceKm(
        riderLocation.lat,
        riderLocation.lng,
        dest.lat,
        dest.lng
      );
      setDistanceKm(dist);
      const eta = Math.max(1, Math.round((dist / 22) * 60));
      setEtaMins(eta);
    } else {
      setDistanceKm(null);
      setEtaMins(null);
    }
  }, [riderLocation, destinationLocation, storeLocation]);

  // Initialize Leaflet map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;

      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const initialCenter = riderLocation || destinationLocation || defaultCenter;

        const map = L.map(mapContainerRef.current, {
          center: [initialCenter.lat, initialCenter.lng],
          zoom: 15,
          zoomControl: false,
          attributionControl: false,
        });

        const cfg = MAP_TILE_CONFIGS[activeLayer];
        const tile = L.tileLayer(cfg.url, {
          maxZoom: 20,
          subdomains: cfg.subdomains,
        }).addTo(map);

        tileLayerRef.current = tile;
        mapInstanceRef.current = map;
        setMapReady(true);
      }
    }

    void initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when layer type toggles
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    void (async () => {
      const L = (await import("leaflet")).default;
      if (tileLayerRef.current) {
        mapInstanceRef.current.removeLayer(tileLayerRef.current);
      }
      const cfg = MAP_TILE_CONFIGS[activeLayer];
      const newTile = L.tileLayer(cfg.url, {
        maxZoom: 20,
        subdomains: cfg.subdomains,
      }).addTo(mapInstanceRef.current);
      tileLayerRef.current = newTile;
    })();
  }, [activeLayer]);

  // Update Markers, Polyline, and Rapido Surge Pins
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    void (async () => {
      try {
        const L = (await import("leaflet")).default;
        const map = mapInstanceRef.current;
        if (!map) return;
        const bounds: [number, number][] = [];

        // 1. Rider Marker (Rapido Captain Scooter with Radar Ripple Waves)
        if (riderLocation && riderLocation.lat && riderLocation.lng) {
          bounds.push([riderLocation.lat, riderLocation.lng]);

          const riderHtml = isRapidoTheme
            ? `
              <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 64px; height: 64px;">
                <!-- Radar Ripple Wave 1 -->
                <span style="position: absolute; width: 60px; height: 60px; border-radius: 9999px; background-color: rgba(255, 196, 0, 0.28); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
                <!-- Radar Ripple Wave 2 -->
                <span style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background-color: rgba(255, 196, 0, 0.45); animation: pulse 1.6s ease-in-out infinite;"></span>
                <!-- Rapido Signature Yellow 3D Scooter Avatar -->
                <div style="position: relative; display: flex; width: 38px; height: 38px; align-items: center; justify-content: center; border-radius: 9999px; background: linear-gradient(135deg, #FFE082, #FFC400); color: #0F172A; box-shadow: 0 4px 14px rgba(255, 196, 0, 0.7), 0 2px 4px rgba(0,0,0,0.3); border: 2.5px solid #0F172A; font-size: 19px; line-height: 1;">
                  🛵
                </div>
                <!-- Live Online Duty Dot -->
                <span style="position: absolute; bottom: 8px; right: 10px; width: 12px; height: 12px; border-radius: 9999px; background: #00C853; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.4);"></span>
              </div>
            `
            : `
              <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 46px; height: 46px;">
                <span style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background-color: #34d399; opacity: 0.6; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
                <div style="position: relative; display: flex; width: 34px; height: 34px; align-items: center; justify-content: center; border-radius: 9999px; background-color: #065f46; color: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); border: 2.5px solid white;">
                  🛵
                </div>
              </div>
            `;

          const riderIcon = L.divIcon({
            className: "rapido-rider-marker",
            html: riderHtml,
            iconSize: [64, 64],
            iconAnchor: [32, 32],
          });

          if (markersRef.current["rider"]) {
            markersRef.current["rider"].setLatLng([riderLocation.lat, riderLocation.lng]);
            markersRef.current["rider"].setIcon(riderIcon);
          } else {
            markersRef.current["rider"] = L.marker([riderLocation.lat, riderLocation.lng], {
              icon: riderIcon,
              zIndexOffset: 1000,
            }).addTo(map);
            markersRef.current["rider"].bindPopup(
              `<b>${riderLocation.label || "QuickPress Captain"}</b><br/>Rapido Telemetry Active 🟢`
            );
          }
        }

        // 2. Destination Marker (Customer Home / Drop)
        if (destinationLocation && destinationLocation.lat && destinationLocation.lng) {
          bounds.push([destinationLocation.lat, destinationLocation.lng]);

          const destIcon = L.divIcon({
            className: "custom-dest-icon",
            html: `
              <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px;">
                <div style="position: relative; display: flex; width: 34px; height: 34px; align-items: center; justify-content: center; border-radius: 9999px; background-color: #d97706; color: white; box-shadow: 0 4px 10px rgba(217, 119, 6, 0.4); border: 2.5px solid white; font-size: 16px;">
                  🏠
                </div>
              </div>
            `,
            iconSize: [42, 42],
            iconAnchor: [21, 21],
          });

          if (markersRef.current["dest"]) {
            markersRef.current["dest"].setLatLng([destinationLocation.lat, destinationLocation.lng]);
          } else {
            markersRef.current["dest"] = L.marker([destinationLocation.lat, destinationLocation.lng], {
              icon: destIcon,
            }).addTo(map);
            markersRef.current["dest"].bindPopup(
              `<b>${destinationLocation.label || "Customer Destination"}</b><br/>${destinationLocation.sublabel || targetAddressName || ""}`
            );
          }
        }

        // 3. Store / Pickup Location Marker
        if (storeLocation && storeLocation.lat && storeLocation.lng) {
          bounds.push([storeLocation.lat, storeLocation.lng]);

          const storeIcon = L.divIcon({
            className: "custom-store-icon",
            html: `
              <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px;">
                <div style="position: relative; display: flex; width: 34px; height: 34px; align-items: center; justify-content: center; border-radius: 9999px; background-color: #2563eb; color: white; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.4); border: 2.5px solid white; font-size: 16px;">
                  🧺
                </div>
              </div>
            `,
            iconSize: [42, 42],
            iconAnchor: [21, 21],
          });

          if (markersRef.current["store"]) {
            markersRef.current["store"].setLatLng([storeLocation.lat, storeLocation.lng]);
          } else {
            markersRef.current["store"] = L.marker([storeLocation.lat, storeLocation.lng], {
              icon: storeIcon,
            }).addTo(map);
            markersRef.current["store"].bindPopup(
              `<b>${storeLocation.label || "Pickup Partner Store"}</b><br/>${storeLocation.sublabel || ""}`
            );
          }
        }

        // 4. Interactive Rapido Surge Hotspot Badges
        if (showSurgePins && phase === "online") {
          KASGANJ_SURGE_HOTSPOTS.forEach((surge) => {
            if (!surgeMarkersRef.current[surge.id]) {
              const surgeIcon = L.divIcon({
                className: "rapido-surge-badge",
                html: `
                  <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
                    <div style="display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 12px; background: #0F172A; color: #FFC400; font-weight: 900; font-size: 11px; box-shadow: 0 4px 10px rgba(0,0,0,0.35); border: 1.5px solid #FFC400; white-space: nowrap;">
                      <span>${surge.label}</span>
                    </div>
                    <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #0F172A;"></div>
                    <span style="position: absolute; bottom: -4px; width: 10px; height: 10px; border-radius: 9999px; background: rgba(255, 196, 0, 0.5); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
                  </div>
                `,
                iconSize: [110, 36],
                iconAnchor: [55, 36],
              });

              const marker = L.marker([surge.lat, surge.lng], { icon: surgeIcon }).addTo(map);
              marker.on("click", () => {
                triggerHaptic(40);
                if (onSurgeClick) onSurgeClick(surge);
                map.flyTo([surge.lat, surge.lng], 16, { animate: true, duration: 0.8 });
              });
              marker.bindPopup(
                `<b>${surge.name}</b><br/><span style="color:#00C853;font-weight:bold;">${surge.multiplier} Surge Active</span> · +₹${surge.bonus} Extra per Ride`
              );
              surgeMarkersRef.current[surge.id] = marker;
            }
          });
        }

        // 5. Draw Polyline Route
        const targetPoint = destinationLocation || storeLocation;
        if (riderLocation && targetPoint) {
          const polylineCoords: [number, number][] = [
            [riderLocation.lat, riderLocation.lng],
            [
              (riderLocation.lat + targetPoint.lat) / 2 + 0.0006,
              (riderLocation.lng + targetPoint.lng) / 2 - 0.0004,
            ],
            [targetPoint.lat, targetPoint.lng],
          ];

          if (polylineRef.current) {
            polylineRef.current.setLatLngs(polylineCoords);
          } else {
            polylineRef.current = L.polyline(polylineCoords, {
              color: isRapidoTheme ? "#FFC400" : "#00C853",
              weight: 5,
              opacity: 0.95,
              dashArray: "6, 8",
              lineJoin: "round",
              lineCap: "round",
            }).addTo(map);
          }
        } else if (polylineRef.current) {
          map.removeLayer(polylineRef.current);
          polylineRef.current = null;
        }

        // Auto-Fit Bounds if multiple points exist
        if (bounds.length > 1) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
        } else if (bounds.length === 1 && !markersRef.current["hasCentered"]) {
          map.setView(bounds[0], 15);
          markersRef.current["hasCentered"] = true;
        }
      } catch (err) {
        // Suppress unmounted map transitions
      }
    })();
  }, [mapReady, riderLocation, destinationLocation, storeLocation, isRapidoTheme, showSurgePins, phase]);

  // Recenter on Rider
  const handleRecenter = () => {
    triggerHaptic(40);
    if (!mapInstanceRef.current) return;
    const focus = riderLocation || destinationLocation || storeLocation || defaultCenter;
    mapInstanceRef.current.flyTo([focus.lat, focus.lng], 16, { animate: true, duration: 1 });
  };

  // Toggle Layer (Roadmap -> Night -> Satellite -> Traffic -> Roadmap)
  const handleToggleLayer = () => {
    triggerHaptic(40);
    const order: GoogleMapLayerType[] = ["roadmap", "night", "satellite", "traffic"];
    const currIdx = order.indexOf(activeLayer);
    const nextLayer = order[(currIdx + 1) % order.length];
    setInternalLayer(nextLayer);
    if (onLayerChange) onLayerChange(nextLayer);
  };

  // Zoom In / Out
  const handleZoomIn = () => {
    triggerHaptic(30);
    mapInstanceRef.current?.zoomIn();
  };
  const handleZoomOut = () => {
    triggerHaptic(30);
    mapInstanceRef.current?.zoomOut();
  };

  // Open External Google Maps (Two-Wheeler Navigation Mode)
  const handleOpenGoogleMapsApp = () => {
    triggerHaptic(50);
    const dest = destinationLocation || storeLocation || defaultCenter;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=two-wheeler`;
    window.open(url, "_blank");
  };

  return (
    <div className={`relative w-full overflow-hidden bg-slate-900 select-none ${heightClassName}`}>
      {/* Actual Leaflet Container */}
      <div ref={mapContainerRef} className="absolute inset-0 size-full z-0" />

      {/* Floating Telemetry Badge (Top Left - In Trip Phase) */}
      {(phase === "pickup" || phase === "delivery") && (
        <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-2 rounded-2xl bg-zinc-950/90 backdrop-blur-md px-3 py-1.5 shadow-lg border border-amber-400/40 text-xs text-white">
            <span className="flex size-2 rounded-full bg-[#00C853] animate-pulse" />
            <span className="font-black text-amber-400">
              {phase === "pickup" ? "To Pickup" : "To Customer"}
            </span>
            {distanceKm !== null ? (
              <>
                <span className="text-zinc-600">·</span>
                <span className="font-mono font-black text-white">{distanceKm} km</span>
              </>
            ) : null}
            {etaMins !== null ? (
              <>
                <span className="text-zinc-600">·</span>
                <span className="font-bold text-zinc-300">~{etaMins} mins</span>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Floating Rapido Controls (Right Side) */}
      {showControls ? (
        <div className="absolute top-16 right-3 z-20 flex flex-col gap-2">
          {/* Recenter on Captain with Rapido Yellow Accent */}
          <button
            type="button"
            onClick={handleRecenter}
            className="flex size-10 items-center justify-center rounded-2xl bg-zinc-950/90 backdrop-blur-md text-[#FFC400] shadow-xl border border-zinc-700 hover:bg-zinc-900 active:scale-95 transition-transform cursor-pointer"
            title="Recenter on Captain (GPS)"
          >
            <Crosshair className="size-5" />
          </button>

          {/* Layer Switcher (Roadmap / Night / Satellite / Traffic) */}
          <button
            type="button"
            onClick={handleToggleLayer}
            className="flex size-10 items-center justify-center rounded-2xl bg-zinc-950/90 backdrop-blur-md text-white shadow-xl border border-zinc-700 hover:bg-zinc-900 active:scale-95 transition-transform cursor-pointer"
            title={`Map View: ${activeLayer} (Tap to switch)`}
          >
            {activeLayer === "night" ? (
              <Moon className="size-4.5 text-indigo-400" />
            ) : activeLayer === "satellite" ? (
              <Layers className="size-4.5 text-emerald-400" />
            ) : (
              <Sun className="size-4.5 text-amber-400" />
            )}
          </button>

          {/* Zoom controls */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="flex size-10 items-center justify-center rounded-2xl bg-zinc-950/90 backdrop-blur-md text-white shadow-xl border border-zinc-700 hover:bg-zinc-900 active:scale-95 transition-transform cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn className="size-4.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="flex size-10 items-center justify-center rounded-2xl bg-zinc-950/90 backdrop-blur-md text-white shadow-xl border border-zinc-700 hover:bg-zinc-900 active:scale-95 transition-transform cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut className="size-4.5" />
          </button>
        </div>
      ) : null}

      {/* Action Buttons (Bottom Right) */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
        {/* External Google Maps App Button */}
        {(destinationLocation || storeLocation) ? (
          <button
            type="button"
            onClick={handleOpenGoogleMapsApp}
            className="flex items-center gap-1.5 rounded-2xl bg-zinc-950/90 text-white border border-zinc-700 px-3 py-2 text-xs font-black shadow-lg hover:bg-zinc-900 active:scale-95 transition-transform cursor-pointer"
            title="Open Google Maps App in Bike Navigation Mode"
          >
            <span className="text-sm leading-none">🗺️</span>
            <span>Google Maps</span>
            <ExternalLink className="size-3 text-zinc-400" />
          </button>
        ) : null}

        {/* Turn-by-Turn HUD Navigation Button */}
        {onOpenNavigation ? (
          <button
            type="button"
            onClick={onOpenNavigation}
            className="flex items-center gap-1.5 rounded-2xl bg-[#00C853] px-3.5 py-2 text-xs font-black text-white shadow-lg hover:bg-[#00B248] active:scale-95 transition-transform cursor-pointer"
          >
            <Navigation className="size-4 fill-white" />
            <span>Turn-by-Turn</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
