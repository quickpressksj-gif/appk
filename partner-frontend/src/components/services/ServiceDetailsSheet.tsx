import { Clock3, IndianRupee, ImageIcon, Info, Layers, Tag, TrendingUp, X } from "lucide-react";
import type { ReactNode } from "react";

import { ReviewRow } from "../PartnerFormPrimitives";
import {
  categoryLabel,
  formatTurnaround,
  formatUpdated,
  offerTypeLabel,
  unitLabel,
  type ManagedService,
  type ServiceOffer,
} from "../../data/partner-services-mock";
import { serviceIcon } from "./service-icons";
import { StatusPill } from "./ServiceCard";

export function ServiceSheet({
  title,
  icon,
  onClose,
  children,
}: {
  title: string;
  icon: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="animate-overlay-in absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="animate-sheet-up relative w-full max-w-md rounded-t-3xl border border-border bg-card p-5 shadow-soft sm:rounded-3xl">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
              {icon}
            </span>
            <h3 className="truncate text-sm font-black tracking-tight text-foreground">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

/** Read-only "View Details" sheet for a single service. */
export function ServiceDetailsSheet({
  service,
  offers = [],
  open = true,
  onClose,
  onEdit,
}: {
  service?: ManagedService | null;
  offers?: ServiceOffer[];
  open?: boolean;
  onClose: () => void;
  onEdit?: () => void;
}) {
  if (!service || !open) return null;
  const Icon = serviceIcon(service.icon);

  return (
    <ServiceSheet title={service.name} icon={<Icon className="size-4" />} onClose={onClose}>
      <div className="flex items-center gap-2">
        <StatusPill enabled={service.enabled} />
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[0.65rem] font-bold text-muted-foreground">
          <Layers className="size-3" />
          {categoryLabel(service.category)}
        </span>
      </div>

      <p className="mt-3 text-xs font-medium leading-relaxed text-muted-foreground">
        {service.description}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Metric
          icon={IndianRupee}
          label="Current Price"
          value={`₹${service.price} · ${unitLabel(service.unit)}`}
        />
        <Metric
          icon={Clock3}
          label="Processing Time"
          value={formatTurnaround(service.estimatedHours)}
        />
        <Metric
          icon={TrendingUp}
          label="Orders This Month"
          value={`${service.ordersThisMonth}`}
        />
        <Metric icon={Tag} label="Minimum Order" value={`₹${service.minOrderValue}`} />
      </div>

      <div className="mt-4 space-y-2 rounded-2xl border border-border p-4">
        <ReviewRow label="Pricing model" value={unitLabel(service.unit)} />
        <ReviewRow label="Last updated" value={formatUpdated(service.updatedMinutesAgo)} />
        <ReviewRow
          label="Service image"
          value={service.imageLabel ?? "No image uploaded"}
        />
      </div>

      <div className="mt-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground">
          Offers
        </p>
        {offers.length === 0 ? (
          <p className="mt-2 flex items-center gap-1.5 text-[0.7rem] font-medium text-muted-foreground">
            <Info className="size-3.5" />
            No active offers on this service.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {offers.map((offer) => (
              <li
                key={offer.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-muted px-3 py-2.5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[0.72rem] font-bold tracking-tight text-foreground">
                    {offer.title}
                  </span>
                  <span className="block text-[0.65rem] font-medium text-muted-foreground">
                    {offerTypeLabel(offer.type)} · till {offer.validTill}
                  </span>
                </span>
                <span className="shrink-0 text-[0.72rem] font-black text-brand-green-dark">
                  {offer.type === "flat" ? `₹${offer.value}` : `${offer.value}%`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onClose}
          className="ripple rounded-2xl border border-border bg-card px-4 py-3 text-xs font-bold tracking-tight text-foreground transition-all duration-300 active:scale-[0.97]"
        >
          Close
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="ripple rounded-2xl bg-primary px-4 py-3 text-xs font-black tracking-tight text-primary-foreground transition-all duration-300 active:scale-[0.97]"
        >
          Edit Service
        </button>
      </div>
    </ServiceSheet>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-muted px-3 py-2.5">
      <span className="flex items-center gap-1 text-[0.62rem] font-bold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </span>
      <p className="mt-1 truncate text-[0.78rem] font-black tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

export { ImageIcon as ServiceImageIcon };
