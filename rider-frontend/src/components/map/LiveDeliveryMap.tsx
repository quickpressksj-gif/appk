import { useEffect, useRef, useState } from "react";
import { Crosshair, ExternalLink, Layers, Navigation, ZoomIn, ZoomOut } from "lucide-react";
import { triggerHaptic } from "../../lib/captain-audio";

export type MapCoordinate = {
  lat: number;
  lng: number;
  label?: string;
  sublabel?: string;
};

export type LiveDeliveryMapProps = {
  riderLocation?: MapCoordinate | null;
  destinationLocation?: MapCoordinate | null;
  storeLocation?: MapCoordinate | null;
  targetAddressName?: string;
  phase?: "pickup" | "delivery" | "online" | "idle";
  heightClassName?: string;
  showControls?: boolean;
  onOpenNavigation?: () => void;
};

export type GoogleMapLayerType = "roadmap" | "satellite" | "traffic";

const GOOGLE_TILE_URLS: Record<GoogleMapLayerType, string> = {
  roadmap: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
  satellite: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
  traffic: "https://mt1.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}",
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
  onOpenNavigation,
}: LiveDeliveryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const polylineRef = useRef<any>(null);

  const [mapReady, setMapReady] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [etaMins, setEtaMins] = useState<number | null>(null);
  const [activeLayer, setActiveLayer] = useState<GoogleMapLayerType>("roadmap");

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
      // Approx 22 km/h average city courier bike speed
      const eta = Math.max(1, Math.round((dist / 22) * 60));
      setEtaMins(eta);
    } else {
      setDistanceKm(null);
      setEtaMins(null);
    }
  }, [riderLocation, destinationLocation, storeLocation]);

  // Initialize Leaflet map with Google Maps tiles on client
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

        // Add Google Maps High-Resolution Tile Layer
        const tile = L.tileLayer(GOOGLE_TILE_URLS[activeLayer], {
          maxZoom: 20,
          subdomains: ["mt0", "mt1", "mt2", "mt3"],
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

  // Update Google Maps Tile Layer when layer type toggles
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    void (async () => {
      const L = (await import("leaflet")).default;
      if (tileLayerRef.current) {
        mapInstanceRef.current.removeLayer(tileLayerRef.current);
      }
      const newTile = L.tileLayer(GOOGLE_TILE_URLS[activeLayer], {
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
      }).addTo(mapInstanceRef.current);
      tileLayerRef.current = newTile;
    })();
  }, [activeLayer]);

  // Update Markers & Polyline when coordinates change
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    void (async () => {
      try {
        const L = (await import("leaflet")).default;
        const map = mapInstanceRef.current;
        if (!map) return;
        const bounds: [number, number][] = [];

        // 1. Rider Marker (Pulsing Emerald Bike)
        if (riderLocation && riderLocation.lat && riderLocation.lng) {
          bounds.push([riderLocation.lat, riderLocation.lng]);

          const riderIcon = L.divIcon({
            className: "custom-rider-icon",
            html: `
              <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
                <span style="position: absolute; width: 42px; height: 42px; border-radius: 9999px; background-color: #34d399; opacity: 0.6; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
                <div style="position: relative; display: flex; width: 34px; height: 34px; align-items: center; justify-content: center; border-radius: 9999px; background-color: #065f46; color: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); border: 2.5px solid white;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/>
                    <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
                  </svg>
                </div>
              </div>
            `,
            iconSize: [44, 44],
            iconAnchor: [22, 22],
          });

          if (markersRef.current["rider"]) {
            markersRef.current["rider"].setLatLng([riderLocation.lat, riderLocation.lng]);
          } else {
            markersRef.current["rider"] = L.marker([riderLocation.lat, riderLocation.lng], {
              icon: riderIcon,
              zIndexOffset: 1000,
            }).addTo(map);
            markersRef.current["rider"].bindPopup(
              `<b>${riderLocation.label || "QuickPress Captain"}</b><br/>Live GPS Telemetry`
            );
          }
        }

        // 2. Destination Marker (Customer Home / Drop)
        if (destinationLocation && destinationLocation.lat && destinationLocation.lng) {
          bounds.push([destinationLocation.lat, destinationLocation.lng]);

          const destIcon = L.divIcon({
            className: "custom-dest-icon",
            html: `
              <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
                <div style="position: relative; display: flex; width: 32px; height: 32px; align-items: center; justify-content: center; border-radius: 9999px; background-color: #d97706; color: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); border: 2.5px solid white;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  </svg>
                </div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
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
              <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
                <div style="position: relative; display: flex; width: 32px; height: 32px; align-items: center; justify-content: center; border-radius: 9999px; background-color: #2563eb; color: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); border: 2.5px solid white;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>
                  </svg>
                </div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
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

        // 4. Draw Route Polyline
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
              color: "#00C853",
              weight: 5,
              opacity: 0.9,
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
        } else if (bounds.length === 1) {
          map.setView(bounds[0], 15);
        }
      } catch (err) {
        // Suppress unmounted map transitions
      }
    })();
  }, [mapReady, riderLocation, destinationLocation, storeLocation]);

  // Recenter on Rider
  const handleRecenter = () => {
    triggerHaptic(40);
    if (!mapInstanceRef.current) return;
    const focus = riderLocation || destinationLocation || storeLocation || defaultCenter;
    mapInstanceRef.current.flyTo([focus.lat, focus.lng], 16, { animate: true, duration: 1 });
  };

  // Toggle Layer (Roadmap -> Satellite -> Traffic -> Roadmap)
  const handleToggleLayer = () => {
    triggerHaptic(40);
    setActiveLayer((prev) => {
      if (prev === "roadmap") return "satellite";
      if (prev === "satellite") return "traffic";
      return "roadmap";
    });
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
    <div className={`relative w-full overflow-hidden rounded-2xl border border-emerald-200 bg-slate-100 shadow-sm select-none ${heightClassName}`}>
      {/* Actual Leaflet Container with Google Maps tiles */}
      <div ref={mapContainerRef} className="absolute inset-0 size-full z-0" />

      {/* Floating Telemetry Badge (Top Left) */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5">
        <div className="flex items-center gap-2 rounded-xl bg-white/95 backdrop-blur-md px-3 py-1.5 shadow-md border border-slate-200 text-xs">
          <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-slate-800">
            {phase === "pickup" ? "To Pickup" : phase === "delivery" ? "To Customer" : "Live Google Radar"}
          </span>
          {distanceKm !== null ? (
            <>
              <span className="text-slate-300">·</span>
              <span className="font-black text-emerald-700">{distanceKm} km</span>
            </>
          ) : null}
          {etaMins !== null ? (
            <>
              <span className="text-slate-300">·</span>
              <span className="font-bold text-slate-600">~{etaMins} mins</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Floating Controls (Top Right) */}
      {showControls ? (
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleRecenter}
            className="flex size-8 items-center justify-center rounded-xl bg-white/95 backdrop-blur-md text-slate-700 shadow-md border border-slate-200 hover:bg-slate-50 active:scale-95 transition-transform cursor-pointer"
            title="Recenter on Captain"
          >
            <Crosshair className="size-4 text-emerald-700" />
          </button>

          {/* Google Layer Switcher (Roadmap / Satellite / Traffic) */}
          <button
            type="button"
            onClick={handleToggleLayer}
            className="flex size-8 items-center justify-center rounded-xl bg-white/95 backdrop-blur-md text-slate-700 shadow-md border border-slate-200 hover:bg-slate-50 active:scale-95 transition-transform cursor-pointer"
            title={`Layer: ${activeLayer} (Click to switch)`}
          >
            <Layers className="size-4 text-blue-600" />
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            className="flex size-8 items-center justify-center rounded-xl bg-white/95 backdrop-blur-md text-slate-700 shadow-md border border-slate-200 hover:bg-slate-50 active:scale-95 transition-transform cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="flex size-8 items-center justify-center rounded-xl bg-white/95 backdrop-blur-md text-slate-700 shadow-md border border-slate-200 hover:bg-slate-50 active:scale-95 transition-transform cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut className="size-4" />
          </button>
        </div>
      ) : null}

      {/* Official Google Maps Watermark Badge (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-xs rounded-lg shadow-sm border border-slate-200 pointer-events-none text-[11px] font-bold">
        <span className="text-[#4285F4]">G</span>
        <span className="text-[#EA4335]">o</span>
        <span className="text-[#FBBC05]">o</span>
        <span className="text-[#4285F4]">g</span>
        <span className="text-[#34A853]">l</span>
        <span className="text-[#EA4335]">e</span>
        <span className="text-slate-600 font-semibold ml-0.5">Maps</span>
        <span className="text-[9px] uppercase px-1 py-0.2 bg-slate-100 text-slate-600 rounded">
          {activeLayer}
        </span>
      </div>

      {/* Action Buttons (Bottom Right) */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
        {/* Google Maps External 2-Wheeler Navigation Button */}
        {(destinationLocation || storeLocation) ? (
          <button
            type="button"
            onClick={handleOpenGoogleMapsApp}
            className="flex items-center gap-1.5 rounded-xl bg-white text-slate-900 border border-slate-200 px-3 py-1.5 text-xs font-black shadow-md hover:bg-slate-50 active:scale-95 transition-transform cursor-pointer"
            title="Open Google Maps App in Bike Navigation Mode"
          >
            <span className="text-sm leading-none">🗺️</span>
            <span>Google Maps</span>
            <ExternalLink className="size-3 text-slate-400" />
          </button>
        ) : null}

        {/* Turn-by-Turn In-App HUD Navigation Button */}
        {onOpenNavigation ? (
          <button
            type="button"
            onClick={onOpenNavigation}
            className="flex items-center gap-1.5 rounded-xl bg-[#00C853] px-3 py-1.5 text-xs font-black text-white shadow-md hover:bg-[#00B248] active:scale-95 transition-transform cursor-pointer"
          >
            <Navigation className="size-3.5 fill-white" />
            <span>Turn-by-Turn</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
