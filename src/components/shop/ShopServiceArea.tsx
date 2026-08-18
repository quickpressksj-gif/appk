import { MapPin, Navigation, Truck } from "lucide-react";
import { useEffect, useState } from "react";

import { GoogleMapView } from "@shared/ui/google-map";
import {
  checkDeliveryArea,
  geocodeAddress,
  type DeliveryAreaResult,
  type LatLng,
} from "@backend/core/maps-api";

import type { ServiceArea } from "../../data/partner-shop-mock";

/**
 * Shop location + service radius.
 *
 * The shop address is geocoded through the backend Google Maps proxy, drawn on
 * the live map with the pickup radius, and validated against the platform
 * serviceable area.
 */
export function ShopServiceArea({ area }: { area: ServiceArea }) {
  const [point, setPoint] = useState<LatLng | null>(null);
  const [coverage, setCoverage] = useState<DeliveryAreaResult | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const result = await geocodeAddress(`${area.area}, ${area.city}`);
        if (!active) return;
        const located = { latitude: result.latitude, longitude: result.longitude };
        setPoint(located);
        const check = await checkDeliveryArea({
          ...located,
          radiusKm: area.pickupRadiusKm,
        });
        if (active) setCoverage(check);
      } catch {
        /* map falls back to the summary rows below */
      }
    })();
    return () => {
      active = false;
    };
  }, [area.area, area.city, area.pickupRadiusKm]);

  const rows = [
    { icon: MapPin, label: "City", value: area.city },
    { icon: Navigation, label: "Area", value: area.area },
    { icon: Truck, label: "Pickup Radius", value: `${area.pickupRadiusKm} km` },
    { icon: Truck, label: "Delivery Radius", value: `${area.deliveryRadiusKm} km` },
  ];

  return (
    <div className="mt-4">
      {point ? (
        <GoogleMapView
          className="h-52"
          center={point}
          markers={[{ ...point, label: area.area, tone: "primary" }]}
          radiusKm={area.pickupRadiusKm}
          interactive={false}
          fallback={null}
        />
      ) : null}

      {coverage ? (
        <p className="mt-3 px-1 text-[0.7rem] font-semibold text-muted-foreground">
          {coverage.message}
        </p>
      ) : null}

      <div className="card-soft mt-3 grid border border-border sm:grid-cols-2">
        {rows.map((row, index) => (
          <div
            key={row.label}
            style={{ animationDelay: `${index * 45}ms` }}
            className="animate-soft-fade flex items-center gap-3 border-b border-border px-4 py-3.5 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
              <row.icon className="size-4" strokeWidth={2.1} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.62rem] font-bold uppercase tracking-wider text-muted-foreground">
                {row.label}
              </span>
              <span className="block truncate text-sm font-bold tracking-tight text-foreground">
                {row.value}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
