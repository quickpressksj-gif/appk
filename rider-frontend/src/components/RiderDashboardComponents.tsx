import type { LucideIcon } from "lucide-react";
import {
  ChevronRight,
  IndianRupee,
  MapPin,
  Navigation,
  Phone,
  Star,
} from "lucide-react";

import { useCountUp } from "../hooks/use-count-up";
import {
  DELIVERY_STAGES,
  type ActiveDelivery,
  type Announcement,
  type PerformanceStat,
  type RiderWorkStatus,
} from "../data/rider-dashboard-mock";

const STATUS_META: Record<RiderWorkStatus, { label: string; className: string }> = {
  online: { label: "Online", className: "bg-secondary/20 text-brand-green" },
  offline: { label: "Offline", className: "bg-muted text-muted-foreground" },
  busy: { label: "Busy", className: "bg-primary/15 text-brand-dark" },
  "on-delivery": { label: "On Delivery", className: "bg-primary/15 text-brand-dark" },
  break: { label: "On Break", className: "bg-accent text-foreground" },
};

export function StatusBadge({ status }: { status: RiderWorkStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-widest ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

/** Animated KPI tile used in the dashboard summary grid. */
export function KpiCard({
  icon: Icon,
  label,
  value,
  prefix,
  suffix,
  decimals = 0,
  tone = "primary",
  delayClass,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  prefix?: string | undefined;
  suffix?: string | undefined;
  decimals?: number | undefined;
  tone?: "primary" | "green" | "muted" | undefined;
  delayClass?: string | undefined;
}) {
  const animated = useCountUp(value, 900, decimals);
  const toneClass =
    tone === "green"
      ? "bg-secondary/15 text-brand-green"
      : tone === "muted"
        ? "bg-muted text-muted-foreground"
        : "bg-primary/15 text-brand-dark";

  return (
    <div
      className={`card-soft animate-rise ${delayClass ?? ""} border border-border p-4 transition-all duration-300 hover:border-primary/60`}
    >
      <span className={`flex size-9 items-center justify-center rounded-2xl ${toneClass}`}>
        <Icon className="size-4" strokeWidth={2.2} />
      </span>
      <p className="mt-3 text-lg font-black tracking-tight text-foreground">
        {prefix}
        {animated.toLocaleString("en-IN", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
        {suffix}
      </p>
      <p className="text-[0.66rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export function DeliveryProgress({ stage }: { stage: ActiveDelivery["stage"] }) {
  const index = DELIVERY_STAGES.findIndex((s) => s.id === stage);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-1">
        {DELIVERY_STAGES.map((s, i) => (
          <span
            key={s.id}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
              i <= index ? "bg-background" : "bg-background/25"
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-widest text-background/80">
        {DELIVERY_STAGES[index]?.label ?? "Assigned"} · Step {index + 1} of {DELIVERY_STAGES.length}
      </p>
    </div>
  );
}

export function ActiveDeliveryCard({
  delivery,
  onNavigate,
  onOpen,
}: {
  delivery: ActiveDelivery;
  onNavigate: () => void;
  onOpen: () => void;
}) {
  return (
    <article className="animate-rise overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark via-brand-dark to-brand-green p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.66rem] font-black uppercase tracking-widest text-background/70">
            Active Delivery · {delivery.orderId}
          </p>
          <p className="mt-1 truncate text-lg font-black tracking-tight text-background">
            {delivery.customerName}
          </p>
          <p className="truncate text-[0.7rem] font-medium text-background/75">
            {delivery.partnerName}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-background/15 px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-widest text-background backdrop-blur">
          {delivery.paymentType}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <AddressLine label="Pickup" value={delivery.pickupAddress} time={delivery.pickupTime} />
        <AddressLine label="Drop" value={delivery.deliveryAddress} time={delivery.etaDelivery} />
      </div>

      <DeliveryProgress stage={delivery.stage} />

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="flex items-center text-xl font-black tracking-tight text-background">
          <IndianRupee className="size-5" strokeWidth={2.6} />
          {delivery.amount.toLocaleString("en-IN")}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Call customer"
            className="flex size-11 items-center justify-center rounded-2xl bg-background/15 text-background backdrop-blur transition-all duration-300 active:scale-[0.94]"
          >
            <Phone className="size-4" />
          </button>
          <button
            type="button"
            onClick={onNavigate}
            className="ripple flex items-center gap-1.5 rounded-2xl bg-background px-4 py-3 text-[0.72rem] font-black tracking-tight text-brand-dark transition-all duration-300 active:scale-[0.96]"
          >
            <Navigation className="size-4" strokeWidth={2.4} />
            Navigate
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-2xl bg-background/10 py-2.5 text-[0.7rem] font-bold text-background backdrop-blur transition-all duration-300 active:scale-[0.97]"
      >
        View order details
        <ChevronRight className="size-3.5" />
      </button>
    </article>
  );
}

function AddressLine({ label, value, time }: { label: string; value: string; time: string }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-background/10 p-3 backdrop-blur">
      <MapPin className="mt-0.5 size-4 shrink-0 text-background/80" />
      <div className="min-w-0 flex-1">
        <p className="text-[0.6rem] font-black uppercase tracking-widest text-background/70">
          {label}
        </p>
        <p className="text-[0.74rem] font-semibold leading-snug text-background">{value}</p>
      </div>
      <span className="shrink-0 text-[0.66rem] font-bold text-background/80">{time}</span>
    </div>
  );
}

export function PerformanceBar({ stat }: { stat: PerformanceStat }) {
  const barTone =
    stat.tone === "green" ? "bg-brand-green" : stat.tone === "muted" ? "bg-muted-foreground" : "bg-primary";

  return (
    <div className="card-soft border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="text-[0.7rem] font-bold tracking-tight text-muted-foreground">{stat.label}</p>
        <p className="text-[0.78rem] font-black tracking-tight text-foreground">{stat.value}</p>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={stat.progress}
        aria-label={stat.label}
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={`h-full rounded-full ${barTone} transition-[width] duration-700 ease-out`}
          style={{ width: `${stat.progress}%` }}
        />
      </div>
    </div>
  );
}

export function FeedbackCard({
  customer,
  rating,
  comment,
}: {
  customer: string;
  rating: number;
  comment: string;
}) {
  return (
    <div className="card-soft w-64 shrink-0 border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold tracking-tight text-foreground">{customer}</p>
        <span className="flex items-center gap-0.5 text-[0.7rem] font-black text-brand-green">
          <Star className="size-3.5 fill-current" />
          {rating.toFixed(1)}
        </span>
      </div>
      <p className="mt-1.5 text-[0.72rem] font-medium leading-relaxed text-muted-foreground">
        “{comment}”
      </p>
    </div>
  );
}

export function AnnouncementCard({ item }: { item: Announcement }) {
  return (
    <div className="card-soft border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[0.58rem] font-black uppercase tracking-widest text-brand-dark">
          {item.type}
        </span>
        <span className="text-[0.66rem] font-semibold text-muted-foreground">{item.time}</span>
      </div>
      <p className="mt-2 text-sm font-bold tracking-tight text-foreground">{item.title}</p>
      <p className="mt-1 text-[0.72rem] font-medium leading-relaxed text-muted-foreground">
        {item.body}
      </p>
    </div>
  );
}
