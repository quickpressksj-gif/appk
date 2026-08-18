/**
 * QuickPress Admin — shared API helper types.
 *
 * Every module in `src/api` calls the SHARED QuickPress backend
 * (`/api/admin/*`, `/api/auth/*`, etc.) through `apiGetJson`/`apiPostJson`
 * from `@backend/core/transport`. This file only keeps the small table/KPI
 * view-model helpers screens rely on.
 */
export { request, delay, mock, ADMIN_API_BASE } from "@/api/core/admin-client";

export type Column = { key: string; label: string };
export type Row = Record<string, string | number>;
export type TableData = { columns: Column[]; rows: Row[] };
export type Kpi = {
  id: string;
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
  hint?: string;
};
export type SeriesPoint = { label: string; value: number; secondary?: number };

export function table(columns: Column[], rows: Row[]): TableData {
  return { columns, rows };
}
