/**
 * Admin live tracking map (Sprint 5.4).
 *
 * Polls GET /api/maps/live and plots riders, partners and active-order drops on
 * the Google map. Without a browser Maps key it degrades to a compact counter
 * summary so the admin console still renders.
 */
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";

import { GoogleMapView, type MapPoint } from "@/shared/ui/google-map";
import { fetchLiveMap, fetchRiderLiveLocation } from "@/api/core/maps-api";

export function AdminLiveMap({ className = "h-80" }: { className?: string }) {
  const live = useQuery({
    queryKey: ["admin", "maps", "live"],
    queryFn: fetchLiveMap,
    refetchInterval: 15000,
  });

  const data = live.data;
  const markers: MapPoint[] = [
    ...(data?.riders ?? []).map((item) => ({
      id: item.id,
      latitude: item.latitude,
      longitude: item.longitude,
      label: `${item.label} · ${item.status ?? "rider"}`,
      tone: "primary" as const,
    })),
    ...(data?.partners ?? []).map((item) => ({
      id: item.id,
      latitude: item.latitude,
      longitude: item.longitude,
      label: item.label,
      tone: "secondary" as const,
    })),
    ...(data?.activeOrders ?? []).map((item) => ({
      id: item.id,
      latitude: item.latitude,
      longitude: item.longitude,
      label: `${item.label} · ${item.status ?? ""}`,
      tone: "muted" as const,
    })),
  ];

  const summary = (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
      <MapPin className="h-4 w-4" />
      <span>{data?.riders.length ?? 0} riders tracked</span>
      <span>{data?.partners.length ?? 0} partner hubs</span>
      <span>{data?.activeOrders.length ?? 0} active orders</span>
    </div>
  );

  return (
    <div className="space-y-3">
      <GoogleMapView className={className} markers={markers} fallback={summary} />
      {markers.length > 0 ? summary : null}
    </div>
  );
}

/** Single-rider live fix, used inside the rider detail drawer. */
export function AdminRiderLiveLocation({ riderId }: { riderId: string }) {
  const fix = useQuery({
    queryKey: ["admin", "maps", "live", riderId],
    queryFn: () => fetchRiderLiveLocation(riderId),
    refetchInterval: 15000,
  });

  const point = fix.data;
  if (!point) {
    return (
      <div className="mt-5 flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" /> No live location received from this rider yet.
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-2">
      <GoogleMapView
        className="h-56"
        center={point}
        markers={[{ ...point, label: point.label, tone: "primary" }]}
        interactive={false}
        fallback={
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" /> {point.latitude.toFixed(5)},{" "}
            {point.longitude.toFixed(5)}
          </div>
        }
      />
      <p className="text-xs text-muted-foreground">
        Last fix {point.updatedAt ? new Date(point.updatedAt).toLocaleTimeString() : "just now"}
      </p>
    </div>
  );
}
