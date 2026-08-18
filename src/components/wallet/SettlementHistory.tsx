import { CheckCircle2, Clock3, Landmark, XCircle } from "lucide-react";

import { PartnerEmptyState, SectionHeading } from "../PartnerPrimitives";
import { formatInr, type SettlementRecord } from "../../data/partner-wallet-mock";

const STATUS_META: Record<
  SettlementRecord["status"],
  { icon: typeof Clock3; tone: string; label: string }
> = {
  settled: { icon: CheckCircle2, tone: "bg-secondary/10 text-brand-green", label: "Settled" },
  processing: { icon: Clock3, tone: "bg-primary/15 text-brand-dark", label: "Processing" },
  failed: { icon: XCircle, tone: "bg-destructive/10 text-destructive", label: "Failed" },
};

/** Sprint 3.6 — settlement history list. */
export function SettlementHistory({ settlements }: { settlements: SettlementRecord[] }) {
  return (
    <section className="mt-7">
      <SectionHeading title="Settlement History" />

      {settlements.length === 0 ? (
        <PartnerEmptyState
          icon={Landmark}
          title="No withdrawals"
          body="Your bank settlements will be listed here after your first withdrawal."
        />
      ) : (
        <div className="mt-4 space-y-3">
          {settlements.map((item, index) => {
            const meta = STATUS_META[item.status];
            const Icon = meta.icon;
            return (
              <article
                key={item.id}
                style={{ animationDelay: `${index * 40}ms` }}
                className="animate-slide-up card-soft flex items-start gap-3 border border-border p-4"
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${meta.tone}`}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold tracking-tight text-foreground">
                    {item.id}
                  </p>
                  <p className="truncate text-[0.68rem] font-medium text-muted-foreground">
                    {item.date} · UTR {item.utr}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-black tracking-tight text-foreground">
                    {formatInr(item.amount)}
                  </p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-widest ${meta.tone}`}
                  >
                    {meta.label}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
