import { BadgeCheck, Clock, MapPin, Star, Tag, Truck } from "lucide-react";
import { memo } from "react";

import type { ListingPartner } from "@/api/customer/service-listing-api";

type Props = {
  partner: ListingPartner;
  onOpen: (id: string) => void;
};

/**
 * Partner card used across the service listing. Memoized and lazy-loading its
 * image so long lists stay smooth on mid-range phones.
 */
export const PartnerCard = memo(function PartnerCard({ partner, onOpen }: Props) {
  const coverSrc =
    partner.cover && (partner.cover.startsWith("http") || partner.cover.startsWith("/"))
      ? partner.cover
      : partner.image && (partner.image.startsWith("http") || partner.image.startsWith("/"))
        ? partner.image
        : null;

  return (
    <button
      type="button"
      onClick={() => onOpen(partner.id)}
      className="card-soft ripple animate-pop w-full overflow-hidden border border-border text-left transition-all duration-300 hover:border-primary/60 active:scale-[0.99]"
    >
      <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-primary/20 via-card to-muted">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={`${partner.name} store`}
            width={800}
            height={480}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-primary/25 via-background to-secondary/15">
            <span className="text-xl font-black tracking-tight text-foreground/40">{partner.name}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/70 via-transparent to-transparent" />
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold ${
            partner.open
              ? "bg-secondary text-secondary-foreground"
              : "bg-brand-dark text-secondary-foreground"
          }`}
        >
          {partner.open ? "Open now" : "Closed"}
        </span>
        {partner.offerLabel ? (
          <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground shadow-cta">
            <Tag className="size-3" /> {partner.offerLabel}
          </span>
        ) : null}
        {partner.logo && (partner.logo.startsWith("http") || partner.logo.startsWith("/")) ? (
          <img
            src={partner.logo}
            alt={`${partner.name} logo`}
            width={96}
            height={96}
            loading="lazy"
            decoding="async"
            className="absolute bottom-3 right-3 size-11 rounded-2xl border-2 border-card object-cover shadow-cta bg-card"
          />
        ) : null}
      </div>


      <div className="p-3.5">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-sm font-bold leading-tight text-foreground">
              {partner.name}
              {partner.verified ? (
                <BadgeCheck className="size-3.5 shrink-0 text-brand-green" />
              ) : null}
            </p>
            <p className="mt-1 truncate text-[11px] text-muted-foreground">
              {partner.services.slice(0, 3).join(" · ")}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-brand-dark">
            <Star className="size-3 fill-current" />
            {partner.rating}
            <span className="font-medium text-muted-foreground">({partner.reviews})</span>
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Truck className="size-3" /> Pickup {partner.pickupTime}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" /> Delivery {partner.deliveryTime}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3" /> {partner.distanceKm} km
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-dashed border-border pt-2.5 text-[11px]">
          <span className="text-muted-foreground">
            Starts at <span className="font-bold text-foreground">₹{partner.minPrice}</span>
          </span>
          <span className="text-muted-foreground">
            <span className="font-bold text-foreground">{partner.servicesCount}</span> services
          </span>
          <span className="text-muted-foreground">
            Min order <span className="font-bold text-foreground">₹{partner.minOrderValue}</span>
          </span>
        </div>

      </div>
    </button>
  );
});
