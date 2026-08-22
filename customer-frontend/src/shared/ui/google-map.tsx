/**
 * `<GoogleMapView />` — the single live-map surface shared by the customer,
 * partner, rider and admin apps.
 *
 * When `VITE_GOOGLE_MAPS_API_KEY` is configured the real Google map renders
 * with markers, an optional route polyline and an optional service-radius
 * circle. Without a key it renders `fallback` so every existing UI keeps its
 * designed placeholder instead of breaking.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

import { isGoogleMapsConfigured, loadGoogleMaps } from "../lib/google-maps-loader";

export type MapPoint = {
  id?: string;
  latitude: number;
  longitude: number;
  label?: string;
  tone?: "primary" | "secondary" | "muted";
};

export type GoogleMapViewProps = {
  center?: MapPoint | undefined;
  markers?: MapPoint[] | undefined;
  /** Decoded route path — draws a polyline and fits the map to it. */
  path?: { latitude: number; longitude: number }[] | undefined;
  /** Service radius in kilometres, drawn around `center`. */
  radiusKm?: number | undefined;
  zoom?: number | undefined;
  className?: string | undefined;
  interactive?: boolean | undefined;
  /** Fires when the user taps the map (address picker / shop location). */
  onPick?: ((point: { latitude: number; longitude: number }) => void) | undefined;
  /** Fires when map center moves / is dragged */
  onCenterChange?: ((point: { latitude: number; longitude: number }) => void) | undefined;
  fallback?: ReactNode | undefined;
};

const DEFAULT_CENTER: MapPoint = { latitude: 12.9352, longitude: 77.6245 };

const TONE_COLOR: Record<NonNullable<MapPoint["tone"]>, string> = {
  primary: "#2563eb",
  secondary: "#16a34a",
  muted: "#64748b",
};

export function GoogleMapView({
  center,
  markers = [],
  path,
  radiusKm,
  zoom = 15,
  className = "h-64",
  interactive = true,
  onPick,
  onCenterChange,
  fallback = null,
}: GoogleMapViewProps) {
  const container = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const isDraggingRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(!isGoogleMapsConfigured());

  // Load the SDK and create the map once.
  useEffect(() => {
    let active = true;
    if (!isGoogleMapsConfigured()) {
      setFailed(true);
      return;
    }

    void loadGoogleMaps().then((ok) => {
      if (!active) return;
      if (!ok) {
        setFailed(true);
        return;
      }
      const google = (window as any).google;
      if (!container.current || !google?.maps?.Map) {
        setFailed(true);
        return;
      }
      const start = center ?? markers[0] ?? DEFAULT_CENTER;
      mapRef.current = new google.maps.Map(container.current, {
        center: { lat: start.latitude, lng: start.longitude },
        zoom,
        disableDefaultUI: !interactive,
        gestureHandling: interactive ? "greedy" : "none",
        clickableIcons: false,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        zoomControl: false,
      });
      setReady(true);
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pan to new center when center prop updates
  useEffect(() => {
    if (!ready || !mapRef.current || !center) return;
    const currentCenter = mapRef.current.getCenter();
    if (!currentCenter) return;
    const latDiff = Math.abs(currentCenter.lat() - center.latitude);
    const lngDiff = Math.abs(currentCenter.lng() - center.longitude);
    if (latDiff > 0.0001 || lngDiff > 0.0001) {
      mapRef.current.panTo({ lat: center.latitude, lng: center.longitude });
    }
  }, [ready, center?.latitude, center?.longitude]);

  // Keep click and center change listeners in sync
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const google = (window as any).google;
    const map = mapRef.current;

    const clickListener = map.addListener("click", (event: any) => {
      if (!onPick || !event?.latLng) return;
      onPick({ latitude: event.latLng.lat(), longitude: event.latLng.lng() });
    });

    const dragStartListener = map.addListener("dragstart", () => {
      isDraggingRef.current = true;
    });

    const idleListener = map.addListener("idle", () => {
      if (!onCenterChange || !isDraggingRef.current) return;
      const c = map.getCenter();
      if (c) {
        onCenterChange({ latitude: c.lat(), longitude: c.lng() });
      }
      isDraggingRef.current = false;
    });

    return () => {
      google?.maps?.event?.removeListener?.(clickListener);
      google?.maps?.event?.removeListener?.(dragStartListener);
      google?.maps?.event?.removeListener?.(idleListener);
    };
  }, [ready, onPick, onCenterChange]);

  // Redraw markers, polyline and radius whenever inputs change.
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const google = (window as any).google;
    const map = mapRef.current;

    for (const overlay of overlaysRef.current) overlay.setMap?.(null);
    overlaysRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let bounded = false;

    for (const marker of markers) {
      const position = { lat: marker.latitude, lng: marker.longitude };
      const pin = new google.maps.Marker({
        map,
        position,
        title: marker.label ?? "",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: TONE_COLOR[marker.tone ?? "primary"],
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      overlaysRef.current.push(pin);
      bounds.extend(position);
      bounded = true;
    }

    if (path && path.length > 1) {
      const line = new google.maps.Polyline({
        map,
        path: path.map((point) => ({ lat: point.latitude, lng: point.longitude })),
        strokeColor: TONE_COLOR.primary,
        strokeOpacity: 0.9,
        strokeWeight: 5,
      });
      overlaysRef.current.push(line);
      for (const point of path) {
        bounds.extend({ lat: point.latitude, lng: point.longitude });
        bounded = true;
      }
    }

    const focus = center ?? markers[0];
    if (radiusKm && radiusKm > 0 && focus) {
      const circle = new google.maps.Circle({
        map,
        center: { lat: focus.latitude, lng: focus.longitude },
        radius: radiusKm * 1000,
        strokeColor: TONE_COLOR.secondary,
        strokeOpacity: 0.7,
        strokeWeight: 2,
        fillColor: TONE_COLOR.secondary,
        fillOpacity: 0.12,
      });
      overlaysRef.current.push(circle);
      bounds.union(circle.getBounds());
      bounded = true;
    }

    if (bounded && (markers.length > 1 || (path?.length ?? 0) > 1 || radiusKm)) {
      map.fitBounds(bounds, 48);
    }
  }, [ready, markers, path, radiusKm]);

  if (failed) return <>{fallback}</>;

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <div ref={container} className="absolute inset-0 size-full" />
      {!ready ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/60 animate-pulse">
          <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : null}
    </div>
  );
}
