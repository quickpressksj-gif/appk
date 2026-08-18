import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Bell,
  ChevronRight,
  Database,
  FlaskConical,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Terminal,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  DEFAULT_SEED_INPUT,
  advanceOrderStep,
  cancelOrderFromPanel,
  clearDevModeLog,
  fetchDevOrders,
  fetchMockStats,
  isDevToolingAvailable,
  reseedMockDatabase,
  resetMockDatabase,
  runOrderLifecycle,
  setDevMode,
  simulateTick,
  type SeedConfigInput,
  DEV_ROLES,
  advanceAllLiveOrders,
  apiInspectorEntries,
  clearApiInspector,
  currentDevRole,
  generateTestCustomers,
  generateTestOrders,
  generateTestPartners,
  generateTestRiders,
  resetMockDatabaseHard,
  simulateNotification,
  subscribeApiInspector,
  subscribeDevRole,
  switchDevRole,
  type ApiInspectorEntry,
  type DevRole,
} from "@backend/dev/dev-api";
import { subscribeDb } from "@backend/mock/db";


const STATUS_FILTERS = [
  "all",
  "placed",
  "partner_accepted",
  "rider_assigned",
  "picked_up",
  "at_partner",
  "processing",
  "completed",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export function DeveloperPanel() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<SeedConfigInput>(DEFAULT_SEED_INPUT);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [generateCount, setGenerateCount] = useState(5);
  const [role, setRole] = useState<DevRole>(() => currentDevRole());
  const [inspector, setInspector] = useState<ApiInspectorEntry[]>(() => apiInspectorEntries());
  const [notification, setNotification] = useState({
    kind: "system",
    title: "Order update",
    description: "Simulated from the developer panel",
  });
  const [notificationSent, setNotificationSent] = useState(false);
  const available = isDevToolingAvailable();

  const stats = useQuery({
    queryKey: ["dev", "stats"],
    queryFn: fetchMockStats,
    enabled: available,
  });

  const orders = useQuery({
    queryKey: ["dev", "orders", statusFilter],
    queryFn: () => fetchDevOrders(statusFilter, 30),
    enabled: available,
  });

  // The mock DB broadcasts every mutation (including simulation ticks from
  // other tabs) — mirror that straight into the panel.
  useEffect(() => {
    if (!available) return undefined;
    return subscribeDb(() => {
      void queryClient.invalidateQueries({ queryKey: ["dev"] });
    });
  }, [available, queryClient]);

  // API inspector + role switch both broadcast; mirror them into local state.
  useEffect(() => subscribeApiInspector(() => setInspector(apiInspectorEntries())), []);
  useEffect(() => subscribeDevRole(() => setRole(currentDevRole())), []);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["dev"] });

  const reset = useMutation({ mutationFn: resetMockDatabase, onSuccess: refresh });
  const reseed = useMutation({ mutationFn: () => reseedMockDatabase(config), onSuccess: refresh });
  const mode = useMutation({
    mutationFn: (patch: { enabled?: boolean; autoAdvance?: boolean; intervalMs?: number }) =>
      setDevMode(patch),
    onSuccess: refresh,
  });
  const tick = useMutation({ mutationFn: () => simulateTick(3), onSuccess: refresh });
  const advance = useMutation({ mutationFn: advanceOrderStep, onSuccess: refresh });
  const complete = useMutation({ mutationFn: runOrderLifecycle, onSuccess: refresh });
  const cancel = useMutation({
    mutationFn: (id: string) => cancelOrderFromPanel(id),
    onSuccess: refresh,
  });
  const clearLog = useMutation({ mutationFn: clearDevModeLog, onSuccess: refresh });
  const advanceAll = useMutation({ mutationFn: advanceAllLiveOrders, onSuccess: refresh });
  const wipe = useMutation({ mutationFn: resetMockDatabaseHard, onSuccess: refresh });
  const genCustomers = useMutation({
    mutationFn: (count: number) => generateTestCustomers(count),
    onSuccess: refresh,
  });
  const genPartners = useMutation({
    mutationFn: (count: number) => generateTestPartners(count),
    onSuccess: refresh,
  });
  const genRiders = useMutation({
    mutationFn: (count: number) => generateTestRiders(count),
    onSuccess: refresh,
  });
  const genOrders = useMutation({
    mutationFn: (count: number) => generateTestOrders(count),
    onSuccess: refresh,
  });
  const notify = useMutation({
    mutationFn: () =>
      simulateNotification({
        role,
        kind: notification.kind,
        title: notification.title,
        description: notification.description,
      }),
    onSuccess: () => {
      setNotificationSent(true);
      window.setTimeout(() => setNotificationSent(false), 2000);
      void refresh();
    },
  });

  const dev = stats.data?.dev;
  const busy =
    reset.isPending || reseed.isPending || mode.isPending || tick.isPending || advance.isPending;

  if (!available) {
    return (
      <main className="mx-auto w-full max-w-md px-5 py-10">
        <h1 className="text-xl font-bold text-foreground">Mock Testing Panel</h1>
        <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          The app is pointed at a live API, so the mock seeder is disabled. Remove{" "}
          <code className="font-mono">VITE_API_BASE_URL</code> to test against the mock backend.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md px-5 pb-16 pt-8">
      <header className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-brand-green/12 text-brand-green">
          <FlaskConical className="size-5" />
        </span>
        <div>
          <h1 className="text-[20px] font-bold leading-tight tracking-tight text-foreground">
            Mock Testing Panel
          </h1>
          <p className="text-xs text-muted-foreground">
            Seed test data and simulate order lifecycles. No app screen changes.
          </p>
        </div>
      </header>

      {/* ------------------------------ stats ------------------------------ */}
      <section className="mt-6 grid grid-cols-2 gap-3">
        <StatCard label="Customers" value={stats.data?.customers} />
        <StatCard label="Partners" value={stats.data?.partners} />
        <StatCard label="Riders" value={stats.data?.riders} />
        <StatCard label="Orders" value={stats.data?.orders} />
        <StatCard label="Live orders" value={stats.data?.liveOrders} />
        <StatCard label="Delivered" value={stats.data?.deliveredOrders} />
      </section>

      {/* ------------------------------ seeder ----------------------------- */}
      <Panel icon={<Database className="size-4" />} title="Test data seeder">
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Customers"
            value={config.customers}
            onChange={(customers) => setConfig((prev) => ({ ...prev, customers }))}
          />
          <NumberField
            label="Partners"
            value={config.partners}
            onChange={(partners) => setConfig((prev) => ({ ...prev, partners }))}
          />
          <NumberField
            label="Riders"
            value={config.riders}
            onChange={(riders) => setConfig((prev) => ({ ...prev, riders }))}
          />
          <NumberField
            label="Orders"
            value={config.orders}
            onChange={(ordersCount) => setConfig((prev) => ({ ...prev, orders: ordersCount }))}
          />
          <NumberField
            label="Random seed"
            value={config.seed}
            onChange={(seed) => setConfig((prev) => ({ ...prev, seed }))}
          />
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => reseed.mutate()}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Sparkles className="size-4" />
            {reseed.isPending ? "Seeding…" : "Reseed database"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => reset.mutate()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground disabled:opacity-60"
          >
            <RotateCcw className="size-4" />
            Reset
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Reset empties the mock database. Reseed regenerates it from the seed above — the same
          seed always produces the same dataset, and demo logins are always preserved.
        </p>
      </Panel>

      {/* ---------------------------- developer mode ---------------------- */}
      <Panel icon={<Activity className="size-4" />} title="Developer mode">
        <ToggleRow
          label="Developer mode"
          hint="Unlocks lifecycle simulation. Purely backend — the UI stays identical."
          checked={dev?.enabled ?? false}
          onChange={(enabled) => mode.mutate(enabled ? { enabled } : { enabled, autoAdvance: false })}
        />
        <ToggleRow
          label="Auto-advance orders"
          hint={`Every ${Math.round((dev?.intervalMs ?? 4000) / 1000)}s, three live orders move one step forward.`}
          disabled={!dev?.enabled}
          checked={dev?.autoAdvance ?? false}
          onChange={(autoAdvance) => mode.mutate({ autoAdvance })}
        />

        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Tick speed</span>
          <input
            type="range"
            min={1}
            max={10}
            value={Math.round((dev?.intervalMs ?? 4000) / 1000)}
            onChange={(event) => mode.mutate({ intervalMs: Number(event.target.value) * 1000 })}
            className="flex-1 accent-brand-green"
          />
          <span className="w-10 text-right text-xs font-semibold text-foreground">
            {Math.round((dev?.intervalMs ?? 4000) / 1000)}s
          </span>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={!dev?.enabled || busy}
            onClick={() => tick.mutate()}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-dark px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Play className="size-4" />
            Run one tick
          </button>
          <button
            type="button"
            disabled={!dev?.autoAdvance}
            onClick={() => mode.mutate({ autoAdvance: false })}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground disabled:opacity-50"
          >
            <Square className="size-4" />
            Stop
          </button>
        </div>
      </Panel>

      {/* ------------------------- status breakdown ----------------------- */}
      <Panel title="Status breakdown">
        <ul className="space-y-1.5">
          {(stats.data?.statusBreakdown ?? []).map((row) => (
            <li key={row.status} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-semibold text-foreground">{row.count}</span>
            </li>
          ))}
        </ul>
      </Panel>

      {/* ----------------------------- orders ----------------------------- */}
      <Panel title="Orders">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold capitalize ${
                statusFilter === status
                  ? "border-brand-green bg-brand-green/10 text-brand-green"
                  : "border-border text-muted-foreground"
              }`}
            >
              {status.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <ul className="mt-2 divide-y divide-border">
          {(orders.data ?? []).map((order) => (
            <li key={order.id} className="py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {order.code} · {order.customer}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {order.statusLabel} · {order.partner}
                    {order.rider ? ` · ${order.rider}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-foreground">
                  ₹{order.total}
                </span>
              </div>
              <div className="mt-2 flex gap-1.5">
                <button
                  type="button"
                  disabled={!dev?.enabled}
                  onClick={() => advance.mutate(order.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-foreground disabled:opacity-40"
                >
                  <ChevronRight className="size-3" /> Next step
                </button>
                <button
                  type="button"
                  disabled={!dev?.enabled}
                  onClick={() => complete.mutate(order.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-foreground disabled:opacity-40"
                >
                  <Play className="size-3" /> Full lifecycle
                </button>
                <button
                  type="button"
                  disabled={!dev?.enabled}
                  onClick={() => cancel.mutate(order.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-destructive disabled:opacity-40"
                >
                  <XCircle className="size-3" /> Cancel
                </button>
              </div>
            </li>
          ))}
          {orders.data?.length === 0 ? (
            <li className="py-6 text-center text-sm text-muted-foreground">
              No orders. Reseed to generate test data.
            </li>
          ) : null}
        </ul>
      </Panel>

      {/* ---------------------------- role switch ------------------------- */}
      <Panel icon={<Users className="size-4" />} title="Role switch">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Every app shares one session store, so switching here changes the role the API client
          authenticates as for all subsequent calls.
        </p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {DEV_ROLES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRole(switchDevRole(item))}
              className={`rounded-xl border px-2 py-2 text-[11px] font-semibold capitalize ${
                role === item
                  ? "border-brand-green bg-brand-green/10 text-brand-green"
                  : "border-border text-muted-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </Panel>

      {/* ---------------------------- generators -------------------------- */}
      <Panel icon={<Sparkles className="size-4" />} title="Generators">
        <NumberField label="How many" value={generateCount} onChange={setGenerateCount} />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <GenerateButton
            label="Customers"
            pending={genCustomers.isPending}
            onClick={() => genCustomers.mutate(generateCount)}
          />
          <GenerateButton
            label="Partners"
            pending={genPartners.isPending}
            onClick={() => genPartners.mutate(generateCount)}
          />
          <GenerateButton
            label="Riders"
            pending={genRiders.isPending}
            onClick={() => genRiders.mutate(generateCount)}
          />
          <GenerateButton
            label="Orders"
            pending={genOrders.isPending}
            onClick={() => genOrders.mutate(generateCount)}
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => advanceAll.mutate()}
            className="flex-1 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-foreground"
          >
            Advance all live orders
          </button>
          <button
            type="button"
            onClick={() => wipe.mutate()}
            className="rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-destructive"
          >
            Wipe database
          </button>
        </div>
      </Panel>

      {/* ----------------------- notification simulator ------------------- */}
      <Panel icon={<Bell className="size-4" />} title="Notification simulator">
        <label className="block">
          <span className="text-[11px] font-medium text-muted-foreground">Title</span>
          <input
            value={notification.title}
            onChange={(event) =>
              setNotification((prev) => ({ ...prev, title: event.target.value }))
            }
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand-green"
          />
        </label>
        <label className="mt-3 block">
          <span className="text-[11px] font-medium text-muted-foreground">Message</span>
          <input
            value={notification.description}
            onChange={(event) =>
              setNotification((prev) => ({ ...prev, description: event.target.value }))
            }
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand-green"
          />
        </label>
        <button
          type="button"
          disabled={notify.isPending}
          onClick={() => notify.mutate()}
          className="mt-3 w-full rounded-xl bg-brand-dark px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {notificationSent ? "Sent ✓" : `Send to ${role}`}
        </button>
      </Panel>

      {/* ---------------------------- API inspector ----------------------- */}
      <Panel icon={<Terminal className="size-4" />} title="API inspector">
        <ul className="max-h-72 space-y-1.5 overflow-y-auto">
          {inspector.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-2 text-[11px]">
              <span className="min-w-0 truncate font-mono text-muted-foreground">
                <span
                  className={`mr-1.5 font-semibold ${entry.ok ? "text-brand-green" : "text-destructive"}`}
                >
                  {entry.method}
                </span>
                {entry.path}
              </span>
              <span className="shrink-0 font-mono text-muted-foreground">{entry.durationMs}ms</span>
            </li>
          ))}
          {inspector.length === 0 ? (
            <li className="text-[11px] text-muted-foreground">No API calls captured yet.</li>
          ) : null}
        </ul>
        {inspector.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              clearApiInspector();
              setInspector([]);
            }}
            className="mt-3 text-[11px] font-semibold text-muted-foreground underline"
          >
            Clear inspector
          </button>
        ) : null}
      </Panel>

      {/* ------------------------------- log ------------------------------ */}
      <Panel title="Simulation log">
        <ul className="space-y-1.5">
          {(dev?.log ?? []).map((entry, index) => (
            <li key={`${entry.at}-${index}`} className="text-[11px] leading-relaxed">
              <span className="font-mono text-muted-foreground">
                {new Date(entry.at).toLocaleTimeString()}
              </span>{" "}
              <span className="text-foreground">{entry.message}</span>
            </li>
          ))}
          {(dev?.log ?? []).length === 0 ? (
            <li className="text-[11px] text-muted-foreground">Nothing simulated yet.</li>
          ) : null}
        </ul>
        {(dev?.log ?? []).length > 0 ? (
          <button
            type="button"
            onClick={() => clearLog.mutate()}
            className="mt-3 text-[11px] font-semibold text-muted-foreground underline"
          >
            Clear log
          </button>
        ) : null}
      </Panel>
    </main>
  );
}

/* ------------------------------ small pieces ----------------------------- */

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 rounded-2xl border border-border bg-card p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
        {icon}
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-foreground">{value ?? "—"}</p>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-brand-green"
      />
    </label>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between gap-3 py-2 ${disabled ? "opacity-50" : ""}`}>
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`mt-1 h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-brand-green" : "bg-muted"
        }`}
      >
        <span
          className={`block size-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function GenerateButton({
  label,
  pending,
  onClick,
}: {
  label: string;
  pending: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className="rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-foreground disabled:opacity-60"
    >
      {pending ? "Working…" : label}
    </button>
  );
}
