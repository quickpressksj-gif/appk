import {
  ArrowDownLeft,
  ArrowUpRight,
  Inbox,
  type LucideIcon,
} from "lucide-react";

import type { WalletLedgerEntry } from "@shared/types/payment";

import { formatInr } from "../../data/partner-wallet-mock";

const STATUS_TONE: Record<WalletLedgerEntry["status"], string> = {
  success: "bg-secondary/10 text-brand-green",
  pending: "bg-primary/15 text-brand-dark",
  failed: "bg-destructive/10 text-destructive",
};

function reasonLabel(reason: WalletLedgerEntry["reason"]) {
  return reason
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function WalletLedgerRow({ entry, delay = 0 }: { entry: WalletLedgerEntry; delay?: number }) {
  const Icon: LucideIcon = entry.direction === "credit" ? ArrowDownLeft : ArrowUpRight;
  const credit = entry.direction === "credit";

  return (
    <article
      className="card-soft animate-slide-in border border-border p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${
            credit ? "bg-secondary/10 text-brand-green" : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="size-4" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold tracking-tight text-foreground">
            {entry.note || reasonLabel(entry.reason)}
          </p>
          <p className="truncate text-[0.68rem] font-medium text-muted-foreground">
            {entry.orderId ? `Order ${entry.orderId}` : reasonLabel(entry.reason)}
          </p>
        </div>
        <p
          className={`shrink-0 text-sm font-black tracking-tight ${
            credit ? "text-brand-green" : "text-foreground"
          }`}
        >
          {credit ? "+" : "−"}
          {formatInr(entry.amount)}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-[0.66rem] font-semibold text-muted-foreground">
        <span className={`rounded-full px-2 py-1 uppercase tracking-wider ${STATUS_TONE[entry.status]}`}>
          {entry.status}
        </span>
        <span>{entry.dateLabel}</span>
        <span className="ml-auto text-right font-mono text-[0.62rem]">
          Bal {formatInr(entry.balanceAfter)}
        </span>
      </div>
    </article>
  );
}

export function WalletLedgerList({ entries }: { entries: WalletLedgerEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="card-soft flex flex-col items-center gap-2 border border-dashed border-border p-8 text-center">
        <Inbox className="size-6 text-muted-foreground" />
        <p className="text-sm font-bold text-foreground">No wallet activity yet</p>
        <p className="text-[0.7rem] font-medium text-muted-foreground">
          Ledger entries will appear here once orders start earning payouts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => (
        <WalletLedgerRow key={entry.id} entry={entry} delay={index * 40} />
      ))}
    </div>
  );
}
