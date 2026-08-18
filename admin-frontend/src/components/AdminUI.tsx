import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
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
    <Card className="shadow-soft">
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{kpi.value}</p>
        {kpi.delta ? (
          <p
            className={cn(
              "mt-1.5 inline-flex items-center gap-1 text-xs font-medium",
              positive ? "text-secondary" : "text-destructive",
            )}
          >
            {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {kpi.delta}
            <span className="text-muted-foreground">vs last period</span>
          </p>
        ) : null}
        {kpi.hint ? <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p> : null}
      </CardContent>
    </Card>
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
          <Skeleton key={i} className="h-28 rounded-2xl" />
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
  positive: "bg-secondary/12 text-secondary border-secondary/25",
  warning: "bg-primary/20 text-foreground border-primary/40",
  danger: "bg-destructive/10 text-destructive border-destructive/25",
  neutral: "bg-muted text-muted-foreground border-border",
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
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONES[statusTone(value)],
      )}
    >
      {value}
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
  loading,
  empty = "Nothing to show yet.",
  onRowClick,
}: {
  columns: ColumnDef<T>[];
  rows: T[] | undefined;
  loading: boolean;
  empty?: string;
  onRowClick?: (row: T) => void;
}) {
  if (loading || !rows) {
    return (
      <div className="space-y-2.5 p-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-11 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return <p className="px-1 py-10 text-center text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead key={column.key} className={cn("whitespace-nowrap text-xs uppercase tracking-wide", column.className)}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? "cursor-pointer" : undefined}
            >
              {columns.map((column) => (
                <TableCell key={column.key} className={cn("whitespace-nowrap text-sm", column.className)}>
                  {column.render
                    ? column.render(row)
                    : String((row as unknown as Record<string, unknown>)[column.key] ?? "—")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ---------------------------------------------------------------- layout */

export function SectionCard({
  title,
  description,
  actions,
  children,
  padded = true,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <Card className="shadow-soft">
      {title ? (
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {actions}
        </CardHeader>
      ) : null}
      <CardContent className={padded ? undefined : "px-0 pb-0"}>{children}</CardContent>
    </Card>
  );
}

export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export function CountBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-xs font-medium">
      {label}: {value}
    </Badge>
  );
}