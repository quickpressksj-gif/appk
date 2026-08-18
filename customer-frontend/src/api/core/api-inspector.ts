/**
 * In-memory API inspector shared by every QuickPress app.
 *
 * `apiRequest()` records one entry per call here, so the Developer Panel can
 * show live traffic (mock or HTTP) without any app-specific plumbing.
 */

export type ApiInspectorEntry = {
  id: string;
  at: string;
  method: string;
  path: string;
  mode: "mock" | "http";
  role: string;
  durationMs: number;
  ok: boolean;
  status?: number | undefined;
  error?: string | undefined;
};

const MAX_ENTRIES = 100;

let entries: ApiInspectorEntry[] = [];
const listeners = new Set<() => void>();
let counter = 0;

export function recordApiCall(entry: Omit<ApiInspectorEntry, "id" | "at">): void {
  counter += 1;
  entries = [{ ...entry, id: `req-${counter}`, at: new Date().toISOString() }, ...entries].slice(
    0,
    MAX_ENTRIES,
  );
  for (const listener of listeners) listener();
}

export function apiInspectorEntries(): ApiInspectorEntry[] {
  return entries;
}

export function clearApiInspector(): void {
  entries = [];
  for (const listener of listeners) listener();
}

export function subscribeApiInspector(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
