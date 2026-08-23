import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  PauseCircle,
  PlayCircle,
  Search,
  X,
  Truck,
  Download,
  Phone,
  MapPin,
  FileCheck,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  Bike,
  Activity,
  Navigation,
  Edit3,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AdminShell } from "../components/AdminShell";
import { AdminLiveMap } from "../components/AdminLiveMap";
import { DataTable, DetailRow, SectionCard, StatusPill, KpiCard } from "../components/AdminUI";
import { fetchRider, fetchRiders, setRiderStatus, updateRider, type AdminRider } from "../api/riders";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/riders")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Riders Fleet Management", "Track QuickPress delivery fleet, live locations and approvals."),
  component: RidersPage,
});

export function RidersPage() {
  const queryClient = useQueryClient();
  const riders = useQuery({ queryKey: ["admin", "riders"], queryFn: fetchRiders });
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState<AdminRider | null>(null);

  const allRiders = riders.data ?? [];

  const decideMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" | "suspend" | "activate" }) =>
      setRiderStatus(id, action),
    onSuccess: (_d, vars) => {
      toast.success(`Rider ${vars.action}d successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "riders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: () => {
      toast.error("Failed to update rider status.");
    },
  });

  const metrics = useMemo(() => {
    const total = allRiders.length;
    const online = allRiders.filter((r) => r.live === "Online" || r.live === "On delivery").length;
    const busy = allRiders.filter((r) => r.live === "On delivery").length;
    const available = Math.max(0, online - busy);
    return { total, online, busy, available };
  }, [allRiders]);

  const cities = useMemo(
    () => Array.from(new Set(allRiders.map((r) => r.city).filter(Boolean))),
    [allRiders],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRiders.filter((r) => {
      const matchesQuery = !q || [r.id, r.name, r.phone, r.plate, r.vehicle, r.city].join(" ").toLowerCase().includes(q);
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "online" && (r.live === "Online" || r.live === "On delivery")) ||
        (activeTab === "offline" && r.live === "Offline") ||
        (activeTab === "pending" && r.status === "Pending") ||
        (activeTab === "suspended" && r.status === "Suspended");
      return matchesQuery && matchesTab && (city === "all" || r.city === city);
    });
  }, [allRiders, query, city, activeTab]);

  const handleExportCSV = () => {
    if (rows.length === 0) {
      toast.error("No rider records to export.");
      return;
    }
    const headers = ["Rider ID", "Name", "Phone", "City", "Vehicle", "Plate", "Trips", "Rating", "Live Status", "Account Status"];
    const csvRows = [headers.join(",")];
    for (const r of rows) {
      csvRows.push(
        [
          `"${r.id}"`,
          `"${r.name}"`,
          `"${r.phone}"`,
          `"${r.city}"`,
          `"${r.vehicle}"`,
          `"${r.plate}"`,
          `"${r.trips}"`,
          `"${r.rating}"`,
          `"${r.live}"`,
          `"${r.status}"`,
        ].join(","),
      );
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QuickPress_Riders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Riders CSV exported successfully!");
  };

  return (
    <AdminShell
      title="Riders & Fleet Operations"
      subtitle="Fleet onboarding, live location tracking, availability, trips, and dispatch load."
      actions={
        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-50 active:scale-95 shadow-xs"
        >
          <Download className="size-3.5" />
          <span>Export CSV</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* =========================================================================
            1. TOP METRIC CARDS
        ========================================================================= */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            kpi={{
              id: "tot-rdr",
              label: "Total Fleet Strength",
              value: metrics.total.toLocaleString("en-IN"),
              hint: "Registered delivery partners",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "onl-rdr",
              label: "Online Fleet",
              value: metrics.online.toLocaleString("en-IN"),
              hint: `${metrics.total ? Math.round((metrics.online / metrics.total) * 100) : 0}% fleet active`,
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "busy-rdr",
              label: "On Active Delivery",
              value: metrics.busy.toLocaleString("en-IN"),
              hint: "Orders currently in transit",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "avail-rdr",
              label: "Available For Dispatch",
              value: metrics.available.toLocaleString("en-IN"),
              hint: "Ready for instant pickup",
              positive: metrics.available > 0,
            }}
          />
        </div>

        {/* =========================================================================
            2. LIVE FLEET MAP
        ========================================================================= */}
        <SectionCard
          title="Live Fleet & Order Positions"
          description="Real-time GPS telemetry from active rider devices and partner pickup hubs"
        >
          <AdminLiveMap />
        </SectionCard>

        {/* =========================================================================
            3. STATUS TABS & FILTERS
        ========================================================================= */}
        <SectionCard>
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-100">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-zinc-100 p-1 rounded-xl">
                <TabsTrigger value="all" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  All Fleet ({allRiders.length})
                </TabsTrigger>
                <TabsTrigger value="online" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  Online Now ({allRiders.filter((r) => r.live === "Online" || r.live === "On delivery").length})
                </TabsTrigger>
                <TabsTrigger value="offline" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  Offline ({allRiders.filter((r) => r.live === "Offline").length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  Pending Approval ({allRiders.filter((r) => r.status === "Pending").length})
                </TabsTrigger>
                <TabsTrigger value="suspended" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  Suspended ({allRiders.filter((r) => r.status === "Suspended").length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
              <Truck className="size-4 text-emerald-600" />
              <span>Showing {rows.length} Riders</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search rider name, phone, plate, or rider ID..."
                className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="h-10 rounded-xl bg-zinc-50 border-zinc-200 text-xs">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SectionCard>

        {/* =========================================================================
            4. RIDERS DATA TABLE
        ========================================================================= */}
        <SectionCard
          title="Rider Directory"
          description="Click any row to inspect vehicle specifications, documents, and performance records."
        >
          <DataTable
            loading={riders.isLoading}
            rows={rows}
            onRowClick={setSelected}
            emptyMessage="No riders match the selected filters."
            columns={[
              {
                key: "name",
                label: "Rider Name",
                render: (r) => (
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-sky-100 text-sky-800 font-black text-xs">
                      {r.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900 text-xs">{r.name}</p>
                      <p className="font-mono text-[10px] text-zinc-400 font-medium">#{r.id}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "phone",
                label: "Phone Contact",
                render: (r) => (
                  <span className="font-mono text-xs text-zinc-800 flex items-center gap-1">
                    <Phone className="size-3 text-emerald-600" />
                    {r.phone || "—"}
                  </span>
                ),
              },
              {
                key: "city",
                label: "City Region",
                render: (r) => (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700">
                    <MapPin className="size-3 text-zinc-400" />
                    {r.city || "—"}
                  </span>
                ),
              },
              {
                key: "vehicle",
                label: "Vehicle / Plate",
                render: (r) => (
                  <div className="text-xs">
                    <p className="font-bold text-zinc-900 flex items-center gap-1">
                      <Bike className="size-3 text-zinc-400" />
                      {r.vehicle}
                    </p>
                    <p className="font-mono text-[10px] text-zinc-500 font-semibold">{r.plate}</p>
                  </div>
                ),
              },
              {
                key: "rating",
                label: "Rating",
                render: (r) => <span className="font-bold text-xs text-amber-700">★ {r.rating}</span>,
              },
              {
                key: "trips",
                label: "Trips Done",
                render: (r) => (
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-black text-zinc-800">
                    {r.trips} trips
                  </span>
                ),
              },
              {
                key: "live",
                label: "Live State",
                render: (r) => <StatusPill value={r.live} />,
              },
              {
                key: "status",
                label: "Account Status",
                render: (r) => <StatusPill value={r.status} />,
              },
              {
                key: "actions",
                label: "",
                className: "text-right",
                render: (r) =>
                  r.status === "Pending" ? (
                    <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        className="h-8 rounded-lg bg-emerald-600 px-2.5 text-xs font-bold hover:bg-emerald-700"
                        onClick={() => decideMutation.mutate({ id: r.id, action: "approve" })}
                      >
                        <Check className="mr-1 size-3.5" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg border-rose-300 text-rose-600 px-2.5 text-xs font-bold hover:bg-rose-50"
                        onClick={() => decideMutation.mutate({ id: r.id, action: "reject" })}
                      >
                        <X className="mr-1 size-3.5" /> Reject
                      </Button>
                    </div>
                  ) : r.status === "Suspended" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg border-emerald-300 text-emerald-700 px-2.5 text-xs font-bold hover:bg-emerald-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        decideMutation.mutate({ id: r.id, action: "activate" });
                      }}
                    >
                      <PlayCircle className="mr-1 size-3.5" /> Activate
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 text-xs font-bold"
                      onClick={(e) => {
                        e.stopPropagation();
                        decideMutation.mutate({ id: r.id, action: "suspend" });
                      }}
                    >
                      <PauseCircle className="mr-1 size-3.5" /> Suspend
                    </Button>
                  ),
              },
            ]}
          />
        </SectionCard>
      </div>

      {/* =========================================================================
          5. RIDER DETAIL & SPEC SHEET
      ========================================================================= */}
      <RiderSheet
        rider={selected}
        onClose={() => setSelected(null)}
        onAction={(id, action) => decideMutation.mutate({ id, action })}
      />
    </AdminShell>
  );
}

function RiderSheet({
  rider,
  onClose,
  onAction,
}: {
  rider: AdminRider | null;
  onClose: () => void;
  onAction: (id: string, action: "approve" | "reject" | "suspend" | "activate") => void;
}) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  const detail = useQuery({
    queryKey: ["admin", "riders", rider?.id],
    queryFn: () => fetchRider(rider!.id),
    enabled: Boolean(rider),
  });

  const data = detail.data;

  useEffect(() => {
    if (data) {
      setForm({
        fullName: data.name || "",
        phone: data.phone || "",
        email: data.email || "",
        city: data.city || "",
        vehicleType: data.vehicle || "Motorbike",
        vehicleNumber: data.plate || "",
        bankName: data.bankName || "",
        accountLast4: data.accountLast4 || "",
        ifsc: data.ifsc || "",
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, any>) => updateRider(rider!.id, payload),
    onSuccess: () => {
      toast.success("Rider details updated successfully! 🎉");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "riders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "riders", rider?.id] });
    },
    onError: () => {
      toast.error("Failed to update rider details.");
    },
  });

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  return (
    <Sheet open={Boolean(rider)} onOpenChange={(open) => (open ? null : onClose())}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl bg-white text-zinc-900 border-zinc-200">
        <SheetHeader className="border-b border-zinc-100 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-800 font-black text-sm">
                {rider?.name.slice(0, 2).toUpperCase() || "RD"}
              </div>
              <div>
                <SheetTitle className="text-lg font-black text-zinc-900">{rider?.name}</SheetTitle>
                <SheetDescription className="text-xs text-zinc-500 font-medium">
                  ID: #{rider?.id} · {rider?.city}
                </SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={isEditing ? "default" : "outline"}
                className={`h-8 rounded-xl text-xs font-bold ${
                  isEditing
                    ? "bg-zinc-900 text-white hover:bg-zinc-800"
                    : "border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                }`}
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit3 className="mr-1.5 size-3.5" />
                {isEditing ? "View Details" : "Edit Rider Info"}
              </Button>
              {rider && <StatusPill value={rider.live} />}
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-4 py-6">
          {isEditing ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4">
                <p className="text-xs font-bold text-sky-900 flex items-center gap-2">
                  <Sparkles className="size-4 text-sky-600" />
                  <span>Admin Edit Mode: Modify rider personal details, vehicle RC and bank specs.</span>
                </p>
              </div>

              {/* Rider Personal Info Form */}
              <div className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50/40 p-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-600">Rider Personal & Contact</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600">Full Name</label>
                    <Input
                      value={form.fullName || ""}
                      onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600">Phone Number</label>
                    <Input
                      value={form.phone || ""}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600">Email Address</label>
                    <Input
                      value={form.email || ""}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600">Assigned City</label>
                    <Input
                      value={form.city || ""}
                      onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle & Plate Form */}
              <div className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50/40 p-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-600">Vehicle & License Specs</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600">Vehicle Type</label>
                    <Input
                      value={form.vehicleType || ""}
                      onChange={(e) => setForm((p) => ({ ...p, vehicleType: e.target.value }))}
                      className="h-9 text-xs bg-white"
                      placeholder="e.g. Scooter, Bike"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600">Plate Number</label>
                    <Input
                      value={form.vehicleNumber || ""}
                      onChange={(e) => setForm((p) => ({ ...p, vehicleNumber: e.target.value.toUpperCase() }))}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Payout Form */}
              <div className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50/40 p-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-600">Payout Bank Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600">Bank Name</label>
                    <Input
                      value={form.bankName || ""}
                      onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600">Account (Last 4 digits)</label>
                    <Input
                      value={form.accountLast4 || ""}
                      onChange={(e) => setForm((p) => ({ ...p, accountLast4: e.target.value }))}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600">IFSC Code</label>
                    <Input
                      value={form.ifsc || ""}
                      onChange={(e) => setForm((p) => ({ ...p, ifsc: e.target.value.toUpperCase() }))}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Save / Cancel */}
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold h-10 shadow-sm"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  <Save className="mr-2 size-4" />
                  <span>{updateMutation.isPending ? "Saving..." : "Save Rider Changes"}</span>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl border-zinc-200 text-zinc-700 hover:bg-zinc-100 text-xs font-bold h-10"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="profile">
              <TabsList className="w-full bg-zinc-100 p-1 rounded-xl">
                <TabsTrigger value="profile" className="flex-1 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  Profile & Vehicle
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex-1 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  Documents
                </TabsTrigger>
                <TabsTrigger value="bank" className="flex-1 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  Bank Details
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="pt-4 space-y-4">
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4 space-y-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500">
                      RIDER SPECIFICATIONS
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Edit3 className="size-3" /> Edit
                    </button>
                  </div>
                  <DetailRow label="Full Name" value={rider?.name ?? "—"} />
                  <DetailRow label="Phone Number" value={rider?.phone ?? "—"} />
                  <DetailRow label="Email Address" value={data?.email ?? "—"} />
                  <DetailRow label="Assigned City" value={rider?.city ?? "—"} />
                  <DetailRow label="Vehicle Type" value={rider?.vehicle ?? "—"} />
                  <DetailRow label="Registration Plate" value={<span className="font-mono font-bold text-zinc-900">{rider?.plate ?? "—"}</span>} />
                  <DetailRow label="Lifetime Trips" value={<span className="font-bold text-zinc-900">{rider?.trips ?? 0}</span>} />
                  <DetailRow label="Customer Rating" value={<span className="font-bold text-amber-700">★ {rider?.rating ?? "4.8"}</span>} />
                  <DetailRow label="Live Availability" value={rider ? <StatusPill value={rider.live} /> : "—"} />
                  <DetailRow label="Account Standing" value={rider ? <StatusPill value={rider.status} /> : "—"} />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex gap-2">
                  {rider?.status === "Pending" ? (
                    <>
                      <Button
                        className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold shadow-sm"
                        onClick={() => onAction(rider.id, "approve")}
                      >
                        <Check className="mr-2 size-4" />
                        <span>Approve Rider</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold"
                        onClick={() => onAction(rider.id, "reject")}
                      >
                        <X className="mr-2 size-4" />
                        <span>Reject Application</span>
                      </Button>
                    </>
                  ) : rider?.status === "Suspended" ? (
                    <Button
                      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold"
                      onClick={() => onAction(rider.id, "activate")}
                    >
                      <PlayCircle className="mr-2 size-4" />
                      <span>Reactivate Rider</span>
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      className="w-full rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700"
                      onClick={() => onAction(rider!.id, "suspend")}
                    >
                      <PauseCircle className="mr-2 size-4" />
                      <span>Suspend Rider Fleet Access</span>
                    </Button>
                  )}
                </div>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="pt-4 space-y-3">
                <div className="rounded-2xl border border-zinc-200 overflow-hidden">
                  <ul className="divide-y divide-zinc-100">
                    {(data?.documents ?? []).map((doc) => (
                      <li key={doc.name} className="flex items-center justify-between p-3.5 text-xs">
                        <div className="flex items-center gap-2 font-bold text-zinc-900">
                          <FileCheck className="size-4 text-emerald-600" />
                          <span>{doc.name}</span>
                        </div>
                        <StatusPill value={doc.status} />
                      </li>
                    ))}
                    {(!data?.documents || data.documents.length === 0) && (
                      <li className="p-6 text-center text-xs text-zinc-400">Driver License & RC verified.</li>
                    )}
                  </ul>
                </div>
              </TabsContent>

              {/* Bank Tab */}
              <TabsContent value="bank" className="pt-4 space-y-3">
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4 space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-2">
                    PAYOUT BANK DETAILS
                  </h4>
                  <DetailRow label="Bank Name" value={data?.bankName ?? "—"} />
                  <DetailRow label="Account Number" value={data?.accountLast4 ? `•••• •••• ${data.accountLast4}` : "—"} />
                  <DetailRow label="IFSC Code" value={data?.ifsc ?? "—"} />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
