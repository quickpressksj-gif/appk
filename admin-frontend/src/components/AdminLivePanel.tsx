import { Activity, Bike, PackageCheck, Radio, Store } from "lucide-react";

import { useAdminRealtime } from "@/shared/hooks/use-admin-realtime";
import { useRealtimeConnection } from "@/shared/hooks/use-realtime";

import { SectionCard, StatusPill } from "./AdminUI";

/**
 * Sprint 5.5 — Admin live operations panel driven entirely by Socket.IO.
 * Additive: sits above the existing dashboard cards, replaces nothing.
 */
export function AdminLivePanel({ city }: { city?: string | null }) {
  const { orders, riders, partners, activity, metrics } = useAdminRealtime(city ?? null);
  const { status, mode } = useRealtimeConnection();

  const tiles = [
    { label: "Live orders", value: metrics.liveOrders, icon: Activity },
    { label: "Delivered (session)", value: metrics.delivered, icon: PackageCheck },
    { label: "Online riders", value: metrics.onlineRiders, icon: Bike },
    { label: "Active partners", value: metrics.activePartners, icon: Store },
  ];

  return (
    <SectionCard
      title="Live operations"
      description="Realtime feed from the QuickPress Socket.IO gateway."
      actions={
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium">
          <Radio
            className={status === "connected" ? "h-3.5 w-3.5 text-secondary" : "h-3.5 w-3.5 animate-pulse"}
          />
          {status} · {mode}
        </span>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <tile.icon className="h-4 w-4" /> {tile.label}
            </div>
            <p className="mt-2 text-2xl font-semibold">{tile.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium">Live orders</p>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Waiting for order events…</p>
          ) : (
            <ul className="space-y-2">
              {orders.slice(0, 6).map((order) => (
                <li
                  key={order.orderId}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                >
                  <span className="truncate">{order.orderId}</span>
                  <StatusPill value={order.label} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Customer &amp; fleet activity</p>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="space-y-2">
              {activity.slice(0, 6).map((entry) => (
                <li key={entry.id} className="rounded-lg border px-3 py-2 text-sm">
                  <span className="truncate">{entry.text}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {new Date(entry.at).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {(riders.length > 0 || partners.length > 0) && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">Live riders</p>
            <ul className="space-y-2">
              {riders.slice(0, 5).map((rider) => (
                <li key={rider.riderId} className="rounded-lg border px-3 py-2 text-sm">
                  {rider.riderId} · {rider.lat.toFixed(4)}, {rider.lng.toFixed(4)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Live partners</p>
            <ul className="space-y-2">
              {partners.slice(0, 5).map((partner) => (
                <li key={partner.partnerId} className="rounded-lg border px-3 py-2 text-sm">
                  {partner.partnerId} · {partner.orders} new order(s)
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
