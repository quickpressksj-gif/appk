import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  ReceiptText,
  RotateCcw,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import { useState } from "react";

import { PartnerEmptyState, SectionHeading } from "../PartnerPrimitives";
import {
  TRANSACTION_FILTERS,
  formatInr,
  type TransactionKind,
  type WalletTransaction,
} from "../../data/partner-wallet-mock";

const KIND_META: Record<TransactionKind, { icon: typeof Wallet; tone: string; sign: string }> = {
  credit: { icon: ArrowDownLeft, tone: "bg-secondary/10 text-brand-green", sign: "+" },
  debit: { icon: ArrowUpRight, tone: "bg-muted text-muted-foreground", sign: "−" },
  refund: { icon: RotateCcw, tone: "bg-destructive/10 text-destructive", sign: "−" },
  adjustment: { icon: SlidersHorizontal, tone: "bg-primary/15 text-brand-dark", sign: "+" },
  settlement: { icon: Landmark, tone: "bg-primary/15 text-brand-dark", sign: "−" },
};

const STATUS_TONE: Record<string, string> = {
  success: "bg-secondary/10 text-brand-green",
  pending: "bg-primary/15 text-brand-dark",
  failed: "bg-destructive/10 text-destructive",
};

/** Sprint 3.6 — transaction history with type filters and rich rows. */
export function TransactionHistory({ transactions }: { transactions: WalletTransaction[] }) {
  const [filter, setFilter] = useState<"all" | TransactionKind>("all");
  const rows = filter === "all" ? transactions : transactions.filter((t) => t.kind === filter);

  return (
    <section className="mt-7">
      <SectionHeading title="Transaction History" />

      <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
        {TRANSACTION_FILTERS.map((item) => {
          const isActive = item.id === filter;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setFilter(item.id)}
              className={`focus-key shrink-0 rounded-full border px-3.5 py-2 text-[0.7rem] font-bold tracking-tight transition-all duration-300 active:scale-[0.96] ${
                isActive
                  ? "border-primary bg-primary/15 text-brand-dark"
                  : "border-border bg-card text-muted-foreground hover:border-primary/60"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <PartnerEmptyState
          icon={ReceiptText}
          title="No transactions"
          body="Transactions will appear here once money moves in or out of your wallet."
        />
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((txn, index) => {
            const meta = KIND_META[txn.kind];
            const Icon = meta.icon;
            return (
              <article
                key={txn.id}
                style={{ animationDelay: `${index * 40}ms` }}
                className="animate-slide-up card-soft border border-border p-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${meta.tone}`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold tracking-tight text-foreground">
                      {txn.title}
                    </p>
                    <p className="truncate text-[0.68rem] font-medium text-muted-foreground">
                      {txn.date}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={`text-sm font-black tracking-tight ${
                        txn.kind === "credit" || txn.kind === "adjustment"
                          ? "text-brand-green"
                          : "text-foreground"
                      }`}
                    >
                      {meta.sign}
                      {formatInr(txn.amount)}
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-widest ${STATUS_TONE[txn.status]}`}
                    >
                      {txn.status}
                    </span>
                  </div>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
                  <div className="min-w-0">
                    <dt className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
                      Reference No
                    </dt>
                    <dd className="truncate text-[0.72rem] font-bold text-foreground">
                      {txn.reference}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
                      Payment Method
                    </dt>
                    <dd className="truncate text-[0.72rem] font-bold text-foreground">
                      {txn.method}
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
