import {
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  HandCoins,
  Landmark,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";

import {
  formatINR,
  type TransactionStatus,
  type TransactionType,
  type WalletTransaction,
} from "../../data/rider-wallet-mock";

const TYPE_META: Record<
  TransactionType,
  { icon: LucideIcon; label: string; credit: boolean; tone: string }
> = {
  credit: { icon: ArrowDownLeft, label: "Credit", credit: true, tone: "bg-secondary/10 text-brand-green" },
  debit: { icon: ArrowUpRight, label: "Debit", credit: false, tone: "bg-muted text-muted-foreground" },
  incentive: { icon: Gift, label: "Incentive", credit: true, tone: "bg-primary/15 text-brand-dark" },
  tip: { icon: HandCoins, label: "Tip", credit: true, tone: "bg-secondary/10 text-brand-green" },
  settlement: { icon: Landmark, label: "Settlement", credit: false, tone: "bg-muted text-muted-foreground" },
  refund: { icon: RotateCcw, label: "Refund", credit: true, tone: "bg-primary/15 text-brand-dark" },
};

const STATUS_TONE: Record<TransactionStatus, string> = {
  success: "bg-secondary/10 text-brand-green",
  pending: "bg-primary/15 text-brand-dark",
  failed: "bg-destructive/10 text-destructive",
};

export function TransactionRow({
  txn,
  delay = 0,
}: {
  txn: WalletTransaction;
  delay?: number;
}) {
  const meta = TYPE_META[txn.type];
  const Icon = meta.icon;

  return (
    <article
      className="card-soft animate-slide-in border border-border p-4 transition-all duration-300 hover:border-primary/60"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${meta.tone}`}>
          <Icon className="size-4" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold tracking-tight text-foreground">{txn.title}</p>
          <p className="truncate text-[0.68rem] font-medium text-muted-foreground">{txn.subtitle}</p>
        </div>
        <p
          className={`shrink-0 text-sm font-black tracking-tight ${
            meta.credit ? "text-brand-green" : "text-foreground"
          }`}
        >
          {meta.credit ? "+" : "−"}
          {formatINR(txn.amount)}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-[0.66rem] font-semibold text-muted-foreground">
        <span className="rounded-full bg-muted px-2 py-1 uppercase tracking-wider">{meta.label}</span>
        <span className={`rounded-full px-2 py-1 uppercase tracking-wider ${STATUS_TONE[txn.status]}`}>
          {txn.status}
        </span>
        <span>
          {txn.date} · {txn.time}
        </span>
        <span className="ml-auto truncate font-mono text-[0.64rem]">Ref {txn.referenceId}</span>
      </div>
    </article>
  );
}

export function TransactionList({ rows }: { rows: WalletTransaction[] }) {
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <TransactionRow key={row.id} txn={row} delay={index * 45} />
      ))}
    </div>
  );
}