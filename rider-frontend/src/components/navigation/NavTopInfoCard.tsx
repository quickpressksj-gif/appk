import { ArrowLeft, Clock3, Route as RouteIcon, Volume2, VolumeX } from "lucide-react";

import {
  DELIVERY_STATUS_LABEL,
  DELIVERY_STATUS_TONE,
  type DeliveryOrder,
} from "../../data/rider-delivery-mock";
import type { NavigationTrip } from "../../data/rider-navigation-mock";
import { useCountUp } from "../../hooks/use-count-up";

function EtaCard({ label, minutes }: { label: string; minutes: number }) {
  const value = useCountUp(minutes, 900);

  return (
    <div className="rounded-2xl bg-muted/70 px-3 py-2">
      <p className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-black tabular-nums tracking-tight text-foreground">
        {Math.round(value)} min
      </p>
    </div>
  );
}

export function NavTopInfoCard({
  delivery,
  trip,
  voiceOn,
  onToggleVoice,
  onBack,
}: {
  delivery: DeliveryOrder;
  trip: NavigationTrip;
  voiceOn: boolean;
  onToggleVoice: () => void;
  onBack: () => void;
}) {
  return (
    <section className="glass-panel animate-rise rounded-3xl p-3 shadow-soft">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
        <button
          type="button"
          aria-label="Back to delivery details"
          onClick={onBack}
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground active:scale-[0.94]"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[0.7rem] font-black tracking-widest text-muted-foreground">
              {delivery.orderId}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${DELIVERY_STATUS_TONE[delivery.status]}`}
            >
              {DELIVERY_STATUS_LABEL[delivery.status]}
            </span>
          </div>
          <p className="truncate text-sm font-black tracking-tight text-foreground">
            {delivery.customerName}
          </p>
          <p className="truncate text-[0.68rem] font-medium text-muted-foreground">
            {delivery.partnerName}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={voiceOn}
          aria-label="Voice guidance"
          onClick={onToggleVoice}
          className={`flex size-11 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 active:scale-[0.94] ${
            voiceOn ? "bg-secondary/15 text-brand-green" : "bg-muted text-muted-foreground"
          }`}
        >
          {voiceOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <EtaCard label="Pickup ETA" minutes={trip.pickupEtaMinutes} />
        <EtaCard label="Delivery ETA" minutes={trip.deliveryEtaMinutes} />
        <div className="rounded-2xl bg-muted/70 px-3 py-2">
          <p className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
            Distance
          </p>
          <p className="flex items-center gap-1 text-sm font-black tabular-nums tracking-tight text-foreground">
            <RouteIcon className="size-3.5 text-brand-dark" />
            {trip.totalDistanceKm} km
          </p>
        </div>
      </div>

      <p className="mt-2 flex items-center gap-1.5 truncate text-[0.7rem] font-semibold text-muted-foreground">
        <Clock3 className="size-3.5 shrink-0" />
        {trip.nextManeuver} · {trip.nextManeuverDistance}
      </p>
    </section>
  );
}
