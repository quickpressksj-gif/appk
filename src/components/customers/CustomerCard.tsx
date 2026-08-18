import { CalendarDays, ChevronRight, IndianRupee, Package, Phone, Star } from "lucide-react";
import { useState } from "react";

import {
  formatDate,
  formatInr,
  initialsOf,
  type PartnerCustomer,
} from "../../data/partner-customers-mock";

const segmentLabels: Record<string, string> = {
  new: "New",
  repeat: "Repeat",
  premium: "Premium",
  "high-value": "High Value",
};

export function CustomerAvatar({
  customer,
  size = "md",
}: {
  customer: Pick<PartnerCustomer, "name" | "photo">;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "size-16 text-lg" : size === "sm" ? "size-9 text-[0.7rem]" : "size-12 text-sm";

  if (customer.photo) {
    return (
      <img
        src={customer.photo}
        alt={`${customer.name} profile photo`}
        loading="lazy"
        className={`${sizeClass} shrink-0 rounded-2xl object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-2xl bg-primary/15 font-black tracking-tight text-brand-dark`}
    >
      {initialsOf(customer.name)}
    </span>
  );
}

/** Premium customer card with expandable quick-stats drawer. */
export function CustomerCard({
  customer,
  index = 0,
  onOpenProfile,
}: {
  customer: PartnerCustomer;
  index?: number;
  onOpenProfile: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className="card-soft animate-soft-fade border border-border p-4 transition-all duration-300 hover:border-primary/60"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="flex items-start gap-3">
        <CustomerAvatar customer={customer} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-black tracking-tight text-foreground">{customer.name}</p>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${
                customer.status === "active"
                  ? "bg-secondary/10 text-brand-green-dark"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {customer.status}
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-[0.7rem] font-semibold text-muted-foreground">
            <Phone className="size-3" />
            {customer.mobile}
          </p>
          <p className="text-[0.68rem] font-medium text-muted-foreground">
            {customer.id} · Member since {formatDate(customer.memberSince)}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniStat icon={Package} label="Orders" value={String(customer.totalOrders)} />
        <MiniStat icon={IndianRupee} label="Spend" value={formatInr(customer.totalSpend)} />
        <MiniStat icon={Star} label="Rating" value={customer.avgRating.toFixed(1)} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {customer.segments.map((segment) => (
          <span
            key={segment}
            className="rounded-full border border-border px-2 py-0.5 text-[0.62rem] font-bold tracking-tight text-muted-foreground"
          >
            {segmentLabels[segment] ?? segment}
          </span>
        ))}
      </div>

      <p className="mt-3 flex items-center gap-1 text-[0.68rem] font-semibold text-muted-foreground">
        <CalendarDays className="size-3" />
        Last order · {formatDate(customer.lastOrderDate)}
      </p>

      {/* Card expansion animation */}
      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="mt-3 space-y-1.5 border-t border-border pt-3">
            <Row label="Membership" value={customer.membership.tier} />
            <Row label="Referrals" value={`${customer.referral.referred} joined`} />
            <Row
              label="Top service"
              value={customer.favouriteServices[0]?.name ?? "—"}
            />
            <Row label="Saved addresses" value={String(customer.addresses.length)} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
          className="ripple flex-1 rounded-2xl border border-border bg-card px-3 py-2 text-[0.7rem] font-bold tracking-tight text-foreground transition-all duration-300 hover:border-primary/60 active:scale-[0.96]"
        >
          {expanded ? "Hide details" : "Quick details"}
        </button>
        <button
          type="button"
          onClick={onOpenProfile}
          className="ripple flex items-center gap-1 rounded-2xl bg-primary px-3.5 py-2 text-[0.7rem] font-black tracking-tight text-primary-foreground transition-all duration-300 active:scale-[0.96]"
        >
          View Profile
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </article>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-muted/60 px-2.5 py-2">
      <span className="flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </span>
      <p className="mt-0.5 truncate text-xs font-black tracking-tight text-foreground">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[0.68rem] font-semibold text-muted-foreground">{label}</span>
      <span className="truncate text-[0.7rem] font-bold tracking-tight text-foreground">{value}</span>
    </div>
  );
}
