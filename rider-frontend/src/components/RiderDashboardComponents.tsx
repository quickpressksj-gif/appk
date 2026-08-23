import type { LucideIcon } from "lucide-react";
import {
  ChevronRight,
  IndianRupee,
  MapPin,
  Navigation,
  Phone,
  Radio,
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

const STATUS_META: Record<
  RiderWorkStatus,
  { label: string; className: string; dotClass: string }
> = {
  online: {
    label: "Online & Ready",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dotClass: "bg-emerald-500 animate-ping",
  },
  offline: {
    label: "Offline",
    className: "bg-slate-100 text-slate-600 border border-slate-200",
    dotClass: "bg-slate-400",
  },
  busy: {
    label: "Busy",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
    dotClass: "bg-amber-500",
  },
  "on-delivery": {
    label: "On Delivery",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
    dotClass: "bg-blue-500 animate-pulse",
  },
  break: {
    label: "On Break",
    className: "bg-slate-100 text-slate-700 border border-slate-200",
    dotClass: "bg-slate-400",
  },
};

export function StatusBadge({ status }: { status: RiderWorkStatus }) {
  const meta = STATUS_META[status] || STATUS_META.offline;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${meta.className}`}
    >
      <span className={`size-1.5 rounded-full ${meta.dotClass}`} />
      {meta.label}
    </span>
  );
}

/** Animated KPI tile with modern white card styling */
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
  const animated = useCountUp(value, 800, decimals);
  const iconTone =
    tone === "green"
      ? "bg-emerald-50 text-emerald-600"
      : tone === "muted"
        ? "bg-slate-100 text-slate-700"
        : "bg-emerald-50 text-emerald-700";

  return (
    <div
      className={`animate-rise ${
        delayClass ?? ""
      } rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md`}
    >
      <span className={`flex size-8 items-center justify-center rounded-xl ${iconTone}`}>
        <Icon className="size-4" strokeWidth={2.3} />
      </span>
      <p className="mt-2.5 text-lg font-black tracking-tight text-slate-900">
        {prefix}
        {animated.toLocaleString("en-IN", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
        {suffix}
      </p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
        {label}
      </p>
    </div>
  );
}

export function DeliveryProgress({ stage }: { stage: ActiveDelivery["stage"] }) {
  const index = DELIVERY_STAGES.findIndex((s) => s.id === stage);

  return (
    <div className="mt-3.5">
      <div className="flex items-center gap-1.5">
        {DELIVERY_STAGES.map((s, i) => (
          <span
            key={s.id}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
              i <= index ? "bg-emerald-400" : "bg-white/25"
            }`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[10px] font-extrabold uppercase tracking-widest text-emerald-300">
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
    <article className="animate-rise overflow-hidden rounded-2xl bg-slate-900 p-4 text-white shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Active Task · {delivery.orderId}
          </p>
          <p className="mt-0.5 truncate text-base font-black tracking-tight text-white">
            {delivery.customerName}
          </p>
          <p className="truncate text-xs font-semibold text-slate-300">
            Store: {delivery.partnerName}
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-tight text-white backdrop-blur">
          {delivery.paymentType}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        <AddressLine label="Pickup" value={delivery.pickupAddress} time={delivery.pickupTime} />
        <AddressLine label="Drop" value={delivery.deliveryAddress} time={delivery.etaDelivery} />
      </div>

      <DeliveryProgress stage={delivery.stage} />

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
        <div>
          <p className="text-[10px] font-semibold text-slate-400">Estimated Payout</p>
          <p className="flex items-center text-lg font-black tracking-tight text-emerald-400">
            <IndianRupee className="size-4" strokeWidth={2.6} />
            {delivery.amount.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Call customer"
            className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur transition-all active:scale-[0.94] hover:bg-white/20"
          >
            <Phone className="size-4" />
          </button>
          <button
            type="button"
            onClick={onNavigate}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-black tracking-tight text-slate-950 transition-all hover:bg-emerald-400 active:scale-[0.96]"
          >
            <Navigation className="size-3.5" strokeWidth={2.6} />
            Navigate
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-xl bg-white/5 py-2 text-[11px] font-bold text-slate-300 transition-all hover:bg-white/10 active:scale-[0.97]"
      >
        View Full Task Details
        <ChevronRight className="size-3.5" />
      </button>
    </article>
  );
}

function AddressLine({ label, value, time }: { label: string; value: string; time: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-white/5 p-2.5 backdrop-blur">
      <MapPin className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          {label}
        </p>
        <p className="text-xs font-semibold leading-snug text-white line-clamp-1">{value}</p>
      </div>
      <span className="shrink-0 text-[10px] font-bold text-emerald-300">{time}</span>
    </div>
  );
}

export function PerformanceBar({ stat }: { stat: PerformanceStat }) {
  const barTone =
    stat.tone === "green" ? "bg-emerald-500" : stat.tone === "muted" ? "bg-slate-400" : "bg-slate-900";

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-600">{stat.label}</p>
        <p className="text-xs font-black text-slate-900">{stat.value}</p>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={stat.progress}
        aria-label={stat.label}
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className={`h-full rounded-full ${barTone} transition-all duration-700 ease-out`}
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
    <div className="w-64 shrink-0 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black tracking-tight text-slate-900">{customer}</p>
        <span className="flex items-center gap-0.5 text-xs font-black text-emerald-600">
          <Star className="size-3.5 fill-current" />
          {rating.toFixed(1)}
        </span>
      </div>
      <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-600">
        “{comment}”
      </p>
    </div>
  );
}

export function AnnouncementCard({ item }: { item: Announcement }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700 border border-emerald-100">
          {item.type}
        </span>
        <span className="text-[10px] font-semibold text-slate-500">{item.time}</span>
      </div>
      <p className="mt-2 text-xs font-black tracking-tight text-slate-900">{item.title}</p>
      <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-600">
        {item.body}
      </p>
    </div>
  );
}
