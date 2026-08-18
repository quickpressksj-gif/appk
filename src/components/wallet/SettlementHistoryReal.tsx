import { CalendarClock, ReceiptText } from "lucide-react";

import type { Settlement } from "@shared/types/payment";

import { formatInr } from "../../data/partner-wallet-mock";

const STATUS_TONE: Record<Settlement["status"], string> = {
  settled: "bg-secondary/10 text-brand-green",
  approved: "bg-secondary/10 text-brand-green",
  processing: "bg-primary/15 text-brand-dark",
  pending: "bg-primary/15 text-brand-dark",
  rejected: "bg-destructive/10 text-destructive",
};

/** Sprint 5.6 — settlement history with status + UTR, fed by the real API. */
export function SettlementHistoryReal({ settlements }: { settlements: Settlement[] }) {
  return (
    <section className="mt-6">
      <p className="text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
        Settlement History
      </p>

      {settlements.length === 0 ? (
        <div className="card-soft mt-3 flex flex-col items-center gap-2 border border-dashed border-border p-8 text-center">
          <ReceiptText className="size-6 text-muted-foreground" />
          <p className="text-sm font-bold text-foreground">No settlements yet</p>
          <p className="text-[0.7rem] font-medium text-muted-foreground">
            Settlements are created once your wallet balance is periodically paid out.
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {settlements.map((item, index) => (
            <article
              key={item.id}
              className="card-soft animate-slide-in border border-border p-4"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold tracking-tight text-foreground">
                    {item.periodLabel}
                  </p>
                  <p className="truncate text-[0.68rem] font-medium text-muted-foreground">
                    {item.orders} orders · Commission {formatInr(item.commission)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-black tracking-tight text-foreground">
                  {formatInr(item.netAmount)}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-[0.66rem] font-semibold text-muted-foreground">
                <span
                  className={`rounded-full px-2 py-1 uppercase tracking-wider ${STATUS_TONE[item.status]}`}
                >
                  {item.status}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="size-3" />
                  {item.settledAt ?? "Awaiting settlement"}
                </span>
                <span className="ml-auto font-mono text-[0.62rem]">
                  UTR {item.utr ?? "Pending"}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
