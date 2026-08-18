import { Clock3, IndianRupee, Pencil, TrendingUp } from "lucide-react";

import {
  categoryLabel,
  formatTurnaround,
  formatUpdated,
  unitSuffix,
  type ManagedService,
  type ServiceOffer,
} from "../../data/partner-services-mock";
import { serviceIcon } from "./service-icons";

/** Premium service card used on the Manage Services grid. */
export function ServiceCard({
  service,
  offers,
  index,
  onToggle,
  onEdit,
  onViewDetails,
}: {
  service: ManagedService;
  offers: ServiceOffer[];
  index: number;
  onToggle: () => void;
  onEdit: () => void;
  onViewDetails: () => void;
}) {
  const Icon = serviceIcon(service.icon);

  return (
    <article
      className={`card-soft animate-slide-up group flex flex-col border border-border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-soft stagger-${
        (index % 6) + 1
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex size-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 ${
            service.enabled ? "bg-primary/15 text-brand-dark" : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="size-5" strokeWidth={2.1} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-black tracking-tight text-foreground">
                {service.name}
              </h3>
              <p className="mt-0.5 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                {categoryLabel(service.category)}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={service.enabled}
              aria-label={`Toggle ${service.name}`}
              onClick={onToggle}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
                service.enabled ? "bg-secondary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full bg-background shadow-soft transition-all duration-300 ${
                  service.enabled ? "left-[1.4rem]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          <p className="mt-2 line-clamp-2 text-xs font-medium leading-relaxed text-muted-foreground">
            {service.description}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <StatusPill enabled={service.enabled} />
        <Chip icon={Clock3} label={formatTurnaround(service.estimatedHours)} />
        {service.ordersThisMonth > 0 ? (
          <Chip icon={TrendingUp} label={`${service.ordersThisMonth} orders`} />
        ) : null}
        {offers.map((offer) => (
          <span
            key={offer.id}
            className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[0.65rem] font-bold tracking-tight text-brand-dark"
          >
            {offer.type === "flat" ? `₹${offer.value} off` : `${offer.value}% off`}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-3">
        <div>
          <span className="flex items-center gap-0.5 text-lg font-black tracking-tight text-foreground">
            <IndianRupee className="size-4" />
            {service.price}
            <span className="text-[0.7rem] font-bold text-muted-foreground">
              {unitSuffix(service.unit)}
            </span>
          </span>
          <p className="text-[0.65rem] font-medium text-muted-foreground">
            Updated {formatUpdated(service.updatedMinutesAgo)} · Min ₹{service.minOrderValue}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onViewDetails}
            className="ripple rounded-2xl border border-border bg-card px-3 py-2 text-[0.7rem] font-bold tracking-tight text-foreground transition-all duration-300 hover:border-primary/60 active:scale-[0.96]"
          >
            View Details
          </button>
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${service.name}`}
            className="ripple flex items-center gap-1 rounded-2xl bg-primary/15 px-3 py-2 text-[0.7rem] font-bold tracking-tight text-brand-dark transition-all duration-300 active:scale-[0.96]"
          >
            <Pencil className="size-3.5" />
            Edit
          </button>
        </div>
      </div>
    </article>
  );
}

export function StatusPill({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-bold tracking-tight ${
        enabled ? "bg-secondary/15 text-brand-green-dark" : "bg-muted text-muted-foreground"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${enabled ? "bg-brand-green" : "bg-muted-foreground"}`}
      />
      {enabled ? "Active" : "Inactive"}
    </span>
  );
}

function Chip({
  icon: Icon,
  label,
}: {
  icon: typeof Clock3;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[0.65rem] font-bold tracking-tight text-muted-foreground">
      <Icon className="size-3" />
      {label}
    </span>
  );
}
