import {
  BadgeCheck,
  Crown,
  Gift,
  Heart,
  MapPin,
  Notebook,
  Package,
  Phone,
  Mail,
  Clock,
} from "lucide-react";
import { useState } from "react";

import { CustomerAvatar } from "./CustomerCard";
import { StarRating } from "../reviews/StarRating";
import {
  formatDate,
  formatInr,
  type PartnerCustomer,
} from "../../data/partner-customers-mock";

export function CustomerProfileHeader({ customer }: { customer: PartnerCustomer }) {
  return (
    <section className="card-soft animate-soft-fade border border-border p-4">
      <div className="flex items-start gap-4">
        <CustomerAvatar customer={customer} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-black tracking-tight text-foreground">
              {customer.name}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${
                customer.status === "active"
                  ? "bg-secondary/10 text-brand-green-dark"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {customer.status}
            </span>
          </div>
          <p className="mt-0.5 text-[0.7rem] font-semibold text-muted-foreground">
            {customer.id} · Member since {formatDate(customer.memberSince)}
          </p>
          <div className="mt-1.5">
            <StarRating value={Math.round(customer.avgRating)} size="sm" />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <HeaderStat label="Orders" value={String(customer.totalOrders)} />
        <HeaderStat label="Spend" value={formatInr(customer.totalSpend)} />
        <HeaderStat label="Last order" value={formatDate(customer.lastOrderDate)} />
      </div>
    </section>
  );
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 px-2.5 py-2 text-center">
      <p className="truncate text-xs font-black tracking-tight text-foreground">{value}</p>
      <p className="text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
  delay = 0,
}: {
  icon: typeof Package;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <section
      className="card-soft animate-soft-fade border border-border p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" />
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-[0.7rem] font-semibold text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right text-[0.72rem] font-bold tracking-tight text-foreground">
        {value}
      </span>
    </div>
  );
}

export function CustomerPersonalInfo({ customer }: { customer: PartnerCustomer }) {
  return (
    <SectionCard icon={BadgeCheck} title="Personal Information" delay={60}>
      <div className="divide-y divide-border">
        <InfoRow label="Mobile" value={customer.mobile} />
        <InfoRow label="Email" value={customer.email} />
        <InfoRow label="Gender" value={customer.gender} />
        <InfoRow label="Preferred slot" value={customer.preferredSlot} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <a
          href={`tel:${customer.mobile.replace(/\s/g, "")}`}
          className="ripple flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-primary px-3 py-2 text-[0.7rem] font-black tracking-tight text-primary-foreground transition-all duration-300 active:scale-[0.96]"
        >
          <Phone className="size-3.5" />
          Call
        </a>
        <a
          href={`mailto:${customer.email}`}
          className="ripple flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border bg-card px-3 py-2 text-[0.7rem] font-bold tracking-tight text-foreground transition-all duration-300 hover:border-primary/60 active:scale-[0.96]"
        >
          <Mail className="size-3.5" />
          Email
        </a>
      </div>
    </SectionCard>
  );
}

export function CustomerOrderHistory({ customer }: { customer: PartnerCustomer }) {
  return (
    <SectionCard icon={Package} title="Order History" delay={120}>
      <div className="space-y-2">
        {customer.orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center gap-3 rounded-2xl bg-muted/60 px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.74rem] font-bold tracking-tight text-foreground">
                {order.service}
              </p>
              <p className="flex items-center gap-1 text-[0.66rem] font-medium text-muted-foreground">
                <Clock className="size-3" />
                {order.id} · {formatDate(order.date)} · {order.items} items
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[0.74rem] font-black tracking-tight text-foreground">
                {formatInr(order.amount)}
              </p>
              <span
                className={`text-[0.6rem] font-bold uppercase tracking-wider ${
                  order.status === "delivered"
                    ? "text-brand-green-dark"
                    : order.status === "cancelled"
                      ? "text-destructive"
                      : "text-muted-foreground"
                }`}
              >
                {order.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function CustomerFavouriteServices({ customer }: { customer: PartnerCustomer }) {
  const max = Math.max(...customer.favouriteServices.map((service) => service.orders), 1);
  return (
    <SectionCard icon={Heart} title="Favourite Services" delay={180}>
      <div className="space-y-2.5">
        {customer.favouriteServices.map((service) => (
          <div key={service.name}>
            <div className="flex items-center justify-between">
              <span className="text-[0.72rem] font-bold tracking-tight text-foreground">
                {service.name}
              </span>
              <span className="text-[0.66rem] font-semibold text-muted-foreground">
                {service.orders} orders
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-secondary transition-all duration-700 ease-out"
                style={{ width: `${(service.orders / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export function CustomerMembershipCard({ customer }: { customer: PartnerCustomer }) {
  return (
    <SectionCard icon={Crown} title="Membership Status" delay={240}>
      <div className="divide-y divide-border">
        <InfoRow label="Tier" value={customer.membership.tier} />
        <InfoRow
          label="Valid till"
          value={customer.membership.expiresOn ? formatDate(customer.membership.expiresOn) : "—"}
        />
        <InfoRow label="Saved this year" value={formatInr(customer.membership.savedThisYear)} />
      </div>
    </SectionCard>
  );
}

export function CustomerReferralCard({ customer }: { customer: PartnerCustomer }) {
  return (
    <SectionCard icon={Gift} title="Referral Status" delay={300}>
      <div className="divide-y divide-border">
        <InfoRow label="Referral code" value={customer.referral.code} />
        <InfoRow label="Friends joined" value={String(customer.referral.referred)} />
        <InfoRow label="Reward earned" value={formatInr(customer.referral.rewardEarned)} />
      </div>
    </SectionCard>
  );
}

export function CustomerAddressesCard({ customer }: { customer: PartnerCustomer }) {
  return (
    <SectionCard icon={MapPin} title="Saved Addresses" delay={360}>
      <div className="space-y-2">
        {customer.addresses.map((address) => (
          <div key={address.id} className="rounded-2xl bg-muted/60 px-3 py-2.5">
            <p className="flex items-center gap-2 text-[0.72rem] font-bold tracking-tight text-foreground">
              {address.label}
              {address.isDefault ? (
                <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider text-brand-green-dark">
                  Default
                </span>
              ) : null}
            </p>
            <p className="mt-0.5 text-[0.68rem] font-medium text-muted-foreground">
              {address.line} · {address.pincode}
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/** Notes placeholder — local state only, nothing is stored. */
export function CustomerNotesCard({ onSaved }: { onSaved: (message: string) => void }) {
  const [note, setNote] = useState("");
  return (
    <SectionCard icon={Notebook} title="Notes (internal)" delay={420}>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={3}
        maxLength={300}
        placeholder="Add a private note about this customer…"
        className="w-full resize-none rounded-2xl border border-border bg-background px-3.5 py-3 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted-foreground"
      />
      <button
        type="button"
        disabled={!note.trim()}
        onClick={() => {
          onSaved("Note saved locally");
          setNote("");
        }}
        className="ripple mt-2 w-full rounded-2xl bg-primary px-4 py-2.5 text-[0.72rem] font-black tracking-tight text-primary-foreground transition-all duration-300 active:scale-[0.97] disabled:opacity-50"
      >
        Save Note
      </button>
      <p className="mt-2 text-center text-[0.62rem] font-medium text-muted-foreground">
        UI placeholder · notes are not stored yet
      </p>
    </SectionCard>
  );
}
