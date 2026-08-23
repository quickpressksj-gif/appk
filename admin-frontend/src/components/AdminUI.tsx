import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, TrendingUp, Sparkles, Inbox } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { cn } from "@/shared/lib/utils";
import type { Kpi } from "../api/client";

/* ------------------------------------------------------------------ KPIs */

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const positive = kpi.positive !== false;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/90 to-zinc-950/80 p-5 backdrop-blur-xl transition-all duration-300 hover:border-zinc-700 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
      {/* Top Accent Light Line */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="flex items-start justify-between">
        <p className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
          {kpi.label}
        </p>
        <div className="flex size-8 items-center justify-center rounded-xl bg-zinc-800/80 text-emerald-400 border border-zinc-700/40">
          <TrendingUp className="size-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-2xl sm:text-3xl font-black tracking-tight text-white">{kpi.value}</p>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-zinc-800/50 pt-2.5">
        {kpi.delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black",
              positive
                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                : "bg-rose-950/60 text-rose-400 border border-rose-500/30",
            )}
          >
            {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {kpi.delta}
          </span>
        ) : (
          <span className="text-[10px] text-zinc-500 font-medium">Realtime sync</span>
        )}
        {kpi.hint ? (
          <span className="text-[10px] font-medium text-zinc-500 truncate max-w-[120px]">{kpi.hint}</span>
        ) : null}
      </div>
    </div>
  );
}

export function KpiGrid({
  kpis,
  loading,
  columns = 4,
}: {
  kpis: Kpi[] | undefined;
  loading: boolean;
  columns?: 3 | 4;
}) {
  const grid = columns === 3 ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-4";
  if (loading || !kpis) {
    return (
      <div className={cn("grid gap-4", grid)}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl border border-zinc-800 bg-zinc-900/60 animate-pulse" />
        ))}
      </div>
    );
  }
  return (
    <div className={cn("grid gap-4", grid)}>
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- status */

const TONES: Record<string, string> = {
  positive: "bg-emerald-950/70 text-emerald-400 border-emerald-500/40",
  warning: "bg-amber-950/70 text-amber-300 border-amber-500/40",
  danger: "bg-rose-950/70 text-rose-400 border-rose-500/40",
  neutral: "bg-zinc-800/80 text-zinc-300 border-zinc-700/60",
};

const POSITIVE = new Set([
  "active", "delivered", "live", "verified", "approved", "online", "settled", "resolved", "ready", "paid",
]);
const WARNING = new Set([
  "pending", "pilot", "in wash", "picked up", "out for delivery", "processing", "in progress", "scheduled",
  "beta", "invited", "on delivery", "draft", "sending", "queued", "cod", "paused", "hidden", "medium",
]);
const DANGER = new Set([
  "cancelled", "rejected", "suspended", "blocked", "failed", "expired", "disabled", "high", "refunded", "offline",
]);

export function statusTone(value: string): keyof typeof TONES {
  const key = value.toLowerCase();
  if (POSITIVE.has(key)) return "positive";
  if (WARNING.has(key)) return "warning";
  if (DANGER.has(key)) return "danger";
  return "neutral";
}

export function StatusPill({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider whitespace-nowrap shadow-sm",
        TONES[statusTone(value)],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      <span>{value}</span>
    </span>
  );
}

/* ----------------------------------------------------------------- table */

export type ColumnDef<T> = {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading = false,
  emptyMessage = "No records found",
  onRowClick,
}: {
  columns: ColumnDef<T>[];
  rows: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 w-full rounded-xl bg-zinc-800/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
          <Inbox className="size-6" />
        </div>
        <p className="mt-3 text-sm font-bold text-zinc-300">{emptyMessage}</p>
        <p className="mt-1 text-xs text-zinc-500">Records will appear as activity takes place.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/40">
      <Table>
        <TableHeader className="bg-zinc-900/80">
          <TableRow className="border-b border-zinc-800/80 hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn("text-[11px] font-black uppercase tracking-wider text-zinc-400 py-3.5", col.className)}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/40",
                onRowClick ? "cursor-pointer" : "",
              )}
            >
              {columns.map((col) => (
                <TableCell key={col.key} className={cn("py-3 text-xs text-zinc-200 font-medium", col.className)}>
                  {col.render ? col.render(row) : (row as any)[col.key] ?? "—"}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ----------------------------------------------------------------- cards */

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-800/90 bg-[#111827]/80 p-5 sm:p-6 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.3)]",
        className,
      )}
    >
      {title || actions ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/60 pb-3.5">
          <div>
            {title ? <h2 className="text-sm sm:text-base font-black tracking-tight text-white">{title}</h2> : null}
            {description ? <p className="text-xs text-zinc-400 font-medium mt-0.5">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- detail */

export function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800/60 py-2.5 text-xs">
      <span className="font-bold text-zinc-400">{label}</span>
      <span className="font-semibold text-zinc-100 text-right">{value}</span>
    </div>
  );
}