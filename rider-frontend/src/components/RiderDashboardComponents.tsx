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
  const index = Math.max(0, DELIVERY_STAGES.findIndex((s) => s.id === stage));

  return (
    <div className="mt-4 rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/10">
      <div className="flex items-center justify-between gap-1">
        {DELIVERY_STAGES.map((s, i) => {
          const isCurrent = i === index;
          const isDone = i < index;
          return (
            <div key={s.id} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="relative flex w-full items-center">
                {/* Connecting Line Left */}
                {i > 0 ? (
                  <div
                    className={`h-1 flex-1 transition-colors duration-500 ${
                      i <= index ? "bg-emerald-400" : "bg-white/20"
                    }`}
                  />
                ) : (
                  <div className="flex-1" />
                )}

                {/* Node Circle */}
                <span
                  className={`relative z-10 flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-black transition-all ${
                    isCurrent
                      ? "bg-amber-400 text-slate-950 ring-4 ring-amber-400/30 scale-110"
                      : isDone
                        ? "bg-emerald-400 text-slate-950"
                        : "bg-white/20 text-white/60"
                  }`}
                >
                  {isDone ? "✓" : i + 1}
                </span>

                {/* Connecting Line Right */}
                {i < DELIVERY_STAGES.length - 1 ? (
                  <div
                    className={`h-1 flex-1 transition-colors duration-500 ${
                      i < index ? "bg-emerald-400" : "bg-white/20"
                    }`}
                  />
                ) : (
                  <div className="flex-1" />
                )}
              </div>
              <p
                className={`text-[8px] font-black uppercase text-center line-clamp-1 leading-tight ${
                  isCurrent
                    ? "text-amber-300 font-extrabold"
                    : isDone
                      ? "text-emerald-300"
                      : "text-white/40"
                }`}
              >
                {s.label}
              </p>
            </div>
          );
        })}
      </div>
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
    <article className="animate-rise relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-5 text-white shadow-xl shadow-emerald-950/40 border-2 border-emerald-500/80 transition-all">
      {/* Ambient Live Glow Aura */}
      <div className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 -bottom-12 size-44 rounded-full bg-teal-500/15 blur-3xl" />

      {/* Header Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
            ⚡ ACTIVE TRIP #{delivery.orderId}
          </span>
        </div>
        <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-400/30">
          {delivery.paymentType}
        </span>
      </div>

      {/* Customer & Store Info */}
      <div className="mt-3 flex items-start justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-black tracking-tight text-white">
            {delivery.customerName}
          </h3>
          <p className="truncate text-xs font-semibold text-emerald-200/80">
            🏪 Store: {delivery.partnerName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Payout</p>
          <p className="flex items-center text-xl font-black text-emerald-400">
            <IndianRupee className="size-4 text-emerald-400" strokeWidth={2.6} />
            {delivery.amount.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Addresses */}
      <div className="mt-3.5 space-y-2">
        <AddressLine label="1. Pickup Address" value={delivery.pickupAddress} time={delivery.pickupTime} />
        <AddressLine label="2. Delivery Address" value={delivery.deliveryAddress} time={delivery.etaDelivery} />
      </div>

      {/* Visual Milestone Timeline */}
      <DeliveryProgress stage={delivery.stage} />

      {/* Quick Action Navigation CTAs */}
      <div className="mt-4 flex items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={onNavigate}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/30 hover:brightness-110 active:scale-[0.97] transition-all cursor-pointer"
        >
          <Navigation className="size-4 stroke-[2.8]" />
          <span>START GOOGLE MAP NAVIGATION</span>
        </button>

        <button
          type="button"
          onClick={onOpen}
          className="flex size-12 items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 text-white active:scale-[0.95] transition-all border border-white/10 cursor-pointer"
          aria-label="View task details"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
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
