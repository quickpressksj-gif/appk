import { MapPin, Navigation, Truck } from "lucide-react";

import type { ServiceArea } from "../../data/partner-shop-mock";

/** Read-only service area summary (UI placeholder — no map integration yet). */
export function ShopServiceArea({ area }: { area: ServiceArea }) {
  const rows = [
    { icon: MapPin, label: "City", value: area.city },
    { icon: Navigation, label: "Area", value: area.area },
    { icon: Truck, label: "Pickup Radius", value: `${area.pickupRadiusKm} km` },
    { icon: Truck, label: "Delivery Radius", value: `${area.deliveryRadiusKm} km` },
  ];

  return (
    <div className="card-soft mt-4 grid border border-border sm:grid-cols-2">
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
  );
}
