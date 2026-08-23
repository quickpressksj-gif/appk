import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  PauseCircle,
  PlayCircle,
  Search,
  X,
  Building2,
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
  Store,
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
import { DataTable, DetailRow, SectionCard, StatusPill, KpiCard } from "../components/AdminUI";
import {
  fetchPartner,
  fetchPartners,
  setPartnerStatus,
  updatePartner,
  type AdminPartner,
  type PartnerDetail,
} from "../api/partners";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/partners")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Partners Management", "Approve, monitor, edit and manage QuickPress laundry partner network."),
  component: PartnersPage,
});

export function PartnersPage() {
  const queryClient = useQueryClient();
  const partners = useQuery({ queryKey: ["admin", "partners"], queryFn: fetchPartners });
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState<AdminPartner | null>(null);

  const allPartners = partners.data ?? [];

  const decideMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" | "suspend" | "activate" }) =>
      setPartnerStatus(id, action),
    onSuccess: (_d, vars) => {
      toast.success(`Partner store ${vars.action}d successfully!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "partners"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "partners", vars.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: () => {
      toast.error("Failed to update partner store status.");
    },
  });

  const metrics = useMemo(() => {
    const total = allPartners.length;
    const pending = allPartners.filter((p) => p.status === "Pending" || p.kyc === "Pending").length;
    const active = allPartners.filter((p) => p.status === "Active").length;
    const suspended = allPartners.filter((p) => p.status === "Suspended").length;
    return { total, pending, active, suspended };
  }, [allPartners]);

  const cities = useMemo(
    () => Array.from(new Set(allPartners.map((p) => p.city).filter(Boolean))),
    [allPartners],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allPartners.filter((p) => {
      const matchesQuery = !q || [p.id, p.store, p.owner, p.phone, p.city].join(" ").toLowerCase().includes(q);
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "pending" && (p.status === "Pending" || p.kyc === "Pending")) ||
        (activeTab === "active" && p.status === "Active") ||
        (activeTab === "suspended" && p.status === "Suspended");
      return matchesQuery && matchesTab && (city === "all" || p.city === city);
    });
  }, [allPartners, query, city, activeTab]);

  const handleExportCSV = () => {
    if (rows.length === 0) {
      toast.error("No partner records to export.");
      return;
    }
    const headers = ["Partner ID", "Store Name", "Owner", "Phone", "City", "Services", "Rating", "Orders", "Wallet", "KYC Status", "Account Status"];
    const csvRows = [headers.join(",")];
    for (const r of rows) {
      csvRows.push(
        [
          `"${r.id}"`,
          `"${r.store.replace(/"/g, '""')}"`,
          `"${r.owner.replace(/"/g, '""')}"`,
          `"${r.phone}"`,
          `"${r.city}"`,
          `"${r.services.replace(/"/g, '""')}"`,
          r.rating,
          r.orders,
          `"${r.wallet}"`,
          r.kyc,
          r.status,
        ].join(","),
      );
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QuickPress_Partners_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Partner stores CSV exported successfully!");
  };

  return (
    <AdminShell
      title="Partner Stores Management"
      subtitle="Store approvals, KYC verification, live editing, pricing matrix and payouts."
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
        {/* TOP METRIC CARDS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            kpi={{
              id: "tot-part",
              label: "Total Registered Stores",
              value: metrics.total.toLocaleString("en-IN"),
              hint: "All platform laundry partners",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "pend-part",
              label: "Pending Applications",
              value: metrics.pending.toLocaleString("en-IN"),
              hint: "Awaiting admin review & approval",
              positive: metrics.pending === 0,
            }}
          />
          <KpiCard
            kpi={{
              id: "act-part",
              label: "Active & Verified",
              value: metrics.active.toLocaleString("en-IN"),
              hint: "Receiving customer orders",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "susp-part",
              label: "Suspended Stores",
              value: metrics.suspended.toLocaleString("en-IN"),
              hint: "Temporarily disabled",
              positive: metrics.suspended === 0,
            }}
          />
        </div>

        {/* STATUS TABS & FILTERS */}
        <SectionCard>
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-100">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-zinc-100 p-1 rounded-xl">
                <TabsTrigger value="all" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  All Stores ({allPartners.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  Pending Review ({allPartners.filter((p) => p.status === "Pending" || p.kyc === "Pending").length})
                </TabsTrigger>
                <TabsTrigger value="active" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  Active Stores ({allPartners.filter((p) => p.status === "Active").length})
                </TabsTrigger>
                <TabsTrigger value="suspended" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  Suspended ({allPartners.filter((p) => p.status === "Suspended").length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
              <Building2 className="size-4 text-emerald-600" />
              <span>Showing {rows.length} Stores</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search store name, owner, phone, or store ID..."
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

        {/* PARTNER STORES DATA TABLE */}
        <SectionCard
          title="Partner Stores Directory"
          description="Click any row to inspect store details, edit information, review KYC documents, and grant approvals."
        >
          <DataTable
            loading={partners.isLoading}
            rows={rows}
            onRowClick={setSelected}
            emptyMessage="No partner stores match the selected filters."
            columns={[
              {
                key: "store",
                label: "Store / Owner",
                render: (r) => (
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs">
                      <Store className="size-4" />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900 text-xs">{r.store}</p>
                      <p className="text-[10px] text-zinc-500 font-medium">{r.owner} · #{r.id}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "phone",
                label: "Contact",
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
                key: "services",
                label: "Services Offered",
                render: (r) => (
                  <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                    {r.services}
                  </span>
                ),
              },
              {
                key: "rating",
                label: "Rating",
                render: (r) => <span className="font-bold text-xs text-amber-700">★ {r.rating}</span>,
              },
              {
                key: "orders",
                label: "Orders",
                render: (r) => <span className="font-bold text-zinc-800 text-xs">{r.orders}</span>,
              },
              {
                key: "kyc",
                label: "KYC Status",
                render: (r) => <StatusPill value={r.kyc} />,
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

      {/* PARTNER DETAIL, KYC & EDIT DRAWER */}
      <PartnerSheet
        partner={selected}
        onClose={() => setSelected(null)}
        onAction={(id, action) => decideMutation.mutate({ id, action })}
      />
    </AdminShell>
  );
}

function PartnerSheet({
  partner,
  onClose,
  onAction,
}: {
  partner: AdminPartner | null;
  onClose: () => void;
  onAction: (id: string, action: "approve" | "reject" | "suspend" | "activate") => void;
}) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  const detail = useQuery({
    queryKey: ["admin", "partners", partner?.id],
    queryFn: () => fetchPartner(partner!.id),
    enabled: Boolean(partner),
  });

  const data = detail.data;

  useEffect(() => {
    if (data) {
      setForm({
        businessName: data.store || "",
        ownerName: data.owner || "",
        phone: data.phone || "",
        email: data.email || "",
        address: data.address || "",
        city: data.city || "",
        openingTime: data.openingTime || "08:00",
        closingTime: data.closingTime || "21:00",
        weeklyOff: data.weeklyOff || "None",
        pan: data.pan || "",
        aadhaar: data.aadhaar || "",
        gstin: data.gstin || "",
        experience: data.experience || "",
        bankName: data.bankName || "",
        accountHolder: data.accountHolder || "",
        accountNumber: data.accountNumber || "",
        ifsc: data.ifsc || "",
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, any>) => updatePartner(partner!.id, payload),
    onSuccess: () => {
      toast.success("Partner store details updated successfully! 🎉");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "partners"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "partners", partner?.id] });
    },
    onError: () => {
      toast.error("Failed to update partner details.");
    },
  });

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  return (
    <Sheet open={Boolean(partner)} onOpenChange={(open) => (open ? null : onClose())}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl bg-white text-zinc-900 border-zinc-200">
        <SheetHeader className="border-b border-zinc-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg font-black text-zinc-900">{partner?.store ?? "Partner Store"}</SheetTitle>
              <SheetDescription className="text-xs text-zinc-500 font-medium mt-0.5">
                ID: #{partner?.id} · {partner?.city}
              </SheetDescription>
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
                {isEditing ? "View Details" : "Edit Store Info"}
              </Button>
              {partner && <StatusPill value={partner.status} />}
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-4 py-6">
          {/* EDIT FORM VIEW */}
          {isEditing ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                <p className="text-xs font-bold text-amber-900 flex items-center gap-2">
                  <Sparkles className="size-4 text-amber-600" />
                  <span>Admin Edit Mode: Modify partner profile, KYC credentials and bank details.</span>
                </p>
              </div>

              {/* Store & Owner Details Form */}
              <div className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50/40 p-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-600">Store & Owner Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600">Store Name</label>
                    <Input
                      value={form.businessName || ""}
                      onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600">Owner Name</label>
                    <Input
                      value={form.ownerName || ""}
                      onChange={(e) => setForm((p) => ({ ...p, ownerName: e.target.value }))}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600">Phone</label>
                    <Input
                      value={form.phone || ""}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600">Email</label>
                    <Input
                      value={form.email || ""}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600">Address</label>
                    <Input
                      value={form.address || ""}
                      onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600">City</label>
                    <Input
                      value={form.city || ""}
                      onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600">Weekly Off</label>
                    <Input
                      value={form.weeklyOff || ""}
                      onChange={(e) => setForm((p) => ({ ...p, weeklyOff: e.target.value }))}
                      className="h-9 text-xs bg-white"
                      placeholder="e.g. Sunday or None"
                    />
                  </div>
                </div>
              </div>

              {/* KYC & Tax Identifiers Form */}
              <div className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50/40 p-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-600">KYC & Tax Identifiers</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600">PAN Card</label>
                    <Input
                      value={form.pan || ""}
                      onChange={(e) => setForm((p) => ({ ...p, pan: e.target.value.toUpperCase() }))}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600">Aadhaar Number</label>
                    <Input
                      value={form.aadhaar || ""}
                      onChange={(e) => setForm((p) => ({ ...p, aadhaar: e.target.value }))}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600">GSTIN Tax ID</label>
                    <Input
                      value={form.gstin || ""}
                      onChange={(e) => setForm((p) => ({ ...p, gstin: e.target.value.toUpperCase() }))}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600">Experience</label>
                    <Input
                      value={form.experience || ""}
                      onChange={(e) => setForm((p) => ({ ...p, experience: e.target.value }))}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Payout Details Form */}
              <div className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50/40 p-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-600">Bank Payout Details</h4>
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
                    <label className="text-[11px] font-bold text-zinc-600">Account Holder</label>
                    <Input
                      value={form.accountHolder || ""}
                      onChange={(e) => setForm((p) => ({ ...p, accountHolder: e.target.value }))}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600">Account Number</label>
                    <Input
                      value={form.accountNumber || ""}
                      onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600">IFSC Code</label>
                    <Input
                      value={form.ifsc || ""}
                      onChange={(e) => setForm((p) => ({ ...p, ifsc: e.target.value.toUpperCase() }))}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Save & Cancel Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold h-10 shadow-sm"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  <Save className="mr-2 size-4" />
                  <span>{updateMutation.isPending ? "Saving..." : "Save Store Changes"}</span>
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
            /* VIEW MODE TABS */
            <Tabs defaultValue="profile">
              <TabsList className="w-full bg-zinc-100 p-1 rounded-xl">
                <TabsTrigger value="profile" className="flex-1 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  Profile & Bank
                </TabsTrigger>
                <TabsTrigger value="kyc" className="flex-1 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  KYC & Tax
                </TabsTrigger>
                <TabsTrigger value="photos" className="flex-1 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  Store Photos
                </TabsTrigger>
                <TabsTrigger value="pricing" className="flex-1 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  Rate Card
                </TabsTrigger>
              </TabsList>

              {/* Profile & Bank Tab */}
              <TabsContent value="profile" className="pt-4 space-y-4">
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4 space-y-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500">
                      STORE & OWNER PROFILE
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Edit3 className="size-3" /> Edit
                    </button>
                  </div>
                  <DetailRow label="Store Name" value={partner?.store ?? "—"} />
                  <DetailRow label="Authorized Owner" value={partner?.owner ?? "—"} />
                  <DetailRow label="Contact Phone" value={partner?.phone ?? "—"} />
                  <DetailRow label="Email Address" value={data?.email ?? "—"} />
                  <DetailRow label="Physical Address" value={data?.address ?? "—"} />
                  <DetailRow label="Operating City" value={partner?.city ?? "—"} />
                  <DetailRow label="Store Timings" value={data?.openingTime && data?.closingTime ? `${data.openingTime} - ${data.closingTime}` : "08:00 - 21:00"} />
                  <DetailRow label="Weekly Off" value={data?.weeklyOff ?? "None (Open 7 Days)"} />
                  <DetailRow label="Store Status" value={partner ? <StatusPill value={partner.status} /> : "—"} />
                </div>

                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4 space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-2">
                    BANK ACCOUNT & PAYOUT SPEC
                  </h4>
                  <DetailRow label="Bank Name" value={data?.bankName ?? "—"} />
                  <DetailRow label="Account Holder" value={data?.accountHolder ?? "—"} />
                  <DetailRow label="Account Number" value={data?.accountNumber ?? "—"} />
                  <DetailRow label="IFSC Code" value={data?.ifsc ?? "—"} />
                </div>

                {/* Status Action Buttons */}
                <div className="pt-2 flex gap-2">
                  {partner?.status === "Pending" ? (
                    <>
                      <Button
                        className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold shadow-sm"
                        onClick={() => onAction(partner.id, "approve")}
                      >
                        <Check className="mr-2 size-4" />
                        <span>Approve & Verify Store</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold"
                        onClick={() => onAction(partner.id, "reject")}
                      >
                        <X className="mr-2 size-4" />
                        <span>Reject Application</span>
                      </Button>
                    </>
                  ) : partner?.status === "Suspended" ? (
                    <Button
                      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold"
                      onClick={() => onAction(partner.id, "activate")}
                    >
                      <PlayCircle className="mr-2 size-4" />
                      <span>Reactivate Store</span>
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      className="w-full rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700"
                      onClick={() => onAction(partner!.id, "suspend")}
                    >
                      <PauseCircle className="mr-2 size-4" />
                      <span>Suspend Store Operations</span>
                    </Button>
                  )}
                </div>
              </TabsContent>

              {/* KYC Tab */}
              <TabsContent value="kyc" className="pt-4 space-y-4">
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4 space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-2">
                    TAX IDENTIFIERS & CREDENTIALS
                  </h4>
                  <DetailRow label="PAN Card Number" value={data?.pan ?? "—"} />
                  <DetailRow label="Aadhaar Number" value={data?.aadhaar ?? "—"} />
                  <DetailRow label="GSTIN Tax ID" value={data?.gstin ?? "Not Provided / Exempt"} />
                  <DetailRow label="Industry Experience" value={data?.experience ?? "—"} />
                  <DetailRow label="Verification Status" value={partner ? <StatusPill value={partner.kyc} /> : "—"} />
                </div>

                <div className="rounded-2xl border border-zinc-200 overflow-hidden">
                  <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-200">
                    <span className="text-[11px] font-black uppercase tracking-wider text-zinc-600">Verification Checklist</span>
                  </div>
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
                      <li className="p-6 text-center text-xs text-zinc-400">No document records found.</li>
                    )}
                  </ul>
                </div>
              </TabsContent>

              {/* Photos Tab */}
              <TabsContent value="photos" className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-zinc-200 p-3 bg-white space-y-2">
                    <span className="text-xs font-bold text-zinc-700">Store Logo</span>
                    {data?.logo ? (
                      <img src={data.logo} alt="Logo" className="h-32 w-full object-cover rounded-xl border border-zinc-100" />
                    ) : (
                      <div className="h-32 rounded-xl bg-zinc-100 flex items-center justify-center text-xs text-zinc-400 font-medium">No Logo</div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-zinc-200 p-3 bg-white space-y-2">
                    <span className="text-xs font-bold text-zinc-700">Facade Signboard</span>
                    {data?.banner ? (
                      <img src={data.banner} alt="Banner" className="h-32 w-full object-cover rounded-xl border border-zinc-100" />
                    ) : (
                      <div className="h-32 rounded-xl bg-zinc-100 flex items-center justify-center text-xs text-zinc-400 font-medium">No Banner</div>
                    )}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-black uppercase tracking-wider text-zinc-700 mb-2">
                    Store Gallery Photos ({data?.gallery?.length ?? 0})
                  </span>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(data?.gallery ?? []).map((img, i) => (
                      <img key={i} src={img} alt={`Gallery ${i + 1}`} className="h-24 w-full object-cover rounded-xl border border-zinc-200" />
                    ))}
                    {(!data?.gallery || data.gallery.length === 0) && (
                      <p className="col-span-3 text-xs text-zinc-400 py-4 text-center">No gallery photos uploaded.</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Pricing Tab */}
              <TabsContent value="pricing" className="pt-4">
                <DataTable
                  loading={detail.isLoading}
                  rows={(data?.pricing ?? []).map((p) => ({ ...p, id: `${p.item}-${p.service}` }))}
                  columns={[
                    { key: "item", label: "Item Name" },
                    { key: "service", label: "Service Category" },
                    { key: "price", label: "Partner Rate", className: "text-right" },
                  ]}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
