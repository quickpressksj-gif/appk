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
  Send,
  Star,
  FileText,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Users,
  Activity,
  History,
  Lock,
  Percent,
  Truck,
  PackageCheck,
  Ban,
  RefreshCw,
  Eye,
  PlusCircle,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { AdminShell } from "../components/AdminShell";
import { DataTable, DetailRow, SectionCard, StatusPill, KpiCard } from "../components/AdminUI";
import {
  fetchPartner360,
  fetchPartners,
  fetchPartnerStats,
  approvePartner,
  suspendPartner,
  blockPartner,
  unblockPartner,
  updatePartnerKyc,
  updatePartnerCommission,
  adjustPartnerWallet,
  addPartnerNote,
  updatePartnerTags,
  sendPartnerNotification,
  createPartner,
  type AdminPartner,

  type Partner360Data,
  type PartnerDashboardStats,
} from "../api/partners";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/partners")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Partner Management & 360° System", "Approve, monitor, audit, and manage QuickPress laundry partner stores across Supabase."),
  component: PartnersPage,
  errorComponent: ({ error }) => (
    <AdminShell title="Partner Control Center">
      <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-2xl border border-rose-200 m-6">
        <h3 className="text-lg font-bold">Partner Management Loaded</h3>
        <p className="text-xs text-rose-500 mt-1">{String((error as Error)?.message || error)}</p>
        <Button onClick={() => window.location.reload()} className="mt-4 bg-rose-600 text-white font-bold text-xs">Reload Page</Button>
      </div>
    </AdminShell>
  ),
});


export function PartnersPage() {
  const queryClient = useQueryClient();
  const partnersQuery = useQuery({ queryKey: ["admin", "partners"], queryFn: () => fetchPartners(1, 100) });
  const statsQuery = useQuery({ queryKey: ["admin", "partners", "stats"], queryFn: fetchPartnerStats });

  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [statusTab, setStatusTab] = useState("all");
  const [kycFilter, setKycFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newBizName, setNewBizName] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCity, setNewCity] = useState("Kasganj");
  const [newAddress, setNewAddress] = useState("");

  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendNote, setSuspendNote] = useState("");

  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blockNote, setBlockNote] = useState("");

  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [kycStatusVal, setKycStatusVal] = useState("Verified");
  const [kycReasonVal, setKycReasonVal] = useState("");

  const [commissionModalOpen, setCommissionModalOpen] = useState(false);
  const [commissionRateVal, setCommissionRateVal] = useState("18.0");

  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletType, setWalletType] = useState<"credit" | "debit">("credit");
  const [walletReason, setWalletReason] = useState("");

  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyBody, setNotifyBody] = useState("");

  const [newNoteText, setNewNoteText] = useState("");

  const allPartners = partnersQuery.data ?? [];
  const stats = statsQuery.data;

  // Selected 360 query
  const profile360Query = useQuery({
    queryKey: ["admin", "partners", "360", selectedId],
    queryFn: () => fetchPartner360(selectedId!),
    enabled: Boolean(selectedId),
  });
  const profile = profile360Query.data;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: { businessName: string; ownerName: string; phone: string; email?: string; city: string; address?: string }) =>
      createPartner(payload),
    onSuccess: (data) => {
      toast.success(`Partner Store created successfully!`);
      setAddModalOpen(false);
      setNewBizName("");
      setNewOwnerName("");
      setNewPhone("");
      setNewEmail("");
      setNewAddress("");
      queryClient.invalidateQueries({ queryKey: ["admin", "partners"] });
    },
    onError: () => toast.error("Failed to create partner store."),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approvePartner(id),
    onSuccess: () => {
      toast.success("Partner store approved & activated!");
      queryClient.invalidateQueries({ queryKey: ["admin", "partners"] });
      if (selectedId) queryClient.invalidateQueries({ queryKey: ["admin", "partners", "360", selectedId] });
    },
    onError: () => toast.error("Failed to approve partner."),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason, internalNote }: { id: string; reason: string; internalNote?: string }) =>
      suspendPartner(id, { reason, internalNote }),
    onSuccess: (data) => {
      toast.success(`Partner temporarily suspended! (${data.activeOrdersCount} active orders protected)`);
      setSuspendModalOpen(false);
      setSuspendReason("");
      setSuspendNote("");
      queryClient.invalidateQueries({ queryKey: ["admin", "partners"] });
      if (selectedId) queryClient.invalidateQueries({ queryKey: ["admin", "partners", "360", selectedId] });
    },
    onError: () => toast.error("Failed to suspend partner."),
  });

  const blockMutation = useMutation({
    mutationFn: ({ id, reason, internalNote }: { id: string; reason: string; internalNote?: string }) =>
      blockPartner(id, { reason, internalNote }),
    onSuccess: (data) => {
      toast.success(`Partner permanently blocked! Historical order & financial data preserved.`);
      setBlockModalOpen(false);
      setBlockReason("");
      setBlockNote("");
      queryClient.invalidateQueries({ queryKey: ["admin", "partners"] });
      if (selectedId) queryClient.invalidateQueries({ queryKey: ["admin", "partners", "360", selectedId] });
    },
    onError: () => toast.error("Failed to block partner."),
  });

  const unblockMutation = useMutation({
    mutationFn: (id: string) => unblockPartner(id),
    onSuccess: () => {
      toast.success("Partner store unblocked & reactivated!");
      queryClient.invalidateQueries({ queryKey: ["admin", "partners"] });
      if (selectedId) queryClient.invalidateQueries({ queryKey: ["admin", "partners", "360", selectedId] });
    },
    onError: () => toast.error("Failed to unblock partner."),
  });

  const kycMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      updatePartnerKyc(id, { status, reason }),
    onSuccess: () => {
      toast.success("Partner KYC status updated!");
      setKycModalOpen(false);
      setKycReasonVal("");
      queryClient.invalidateQueries({ queryKey: ["admin", "partners"] });
      if (selectedId) queryClient.invalidateQueries({ queryKey: ["admin", "partners", "360", selectedId] });
    },
    onError: () => toast.error("Failed to update KYC status."),
  });

  const commissionMutation = useMutation({
    mutationFn: ({ id, rate }: { id: string; rate: number }) =>
      updatePartnerCommission(id, { commissionRate: rate }),
    onSuccess: () => {
      toast.success("Commission rate updated!");
      setCommissionModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "partners"] });
      if (selectedId) queryClient.invalidateQueries({ queryKey: ["admin", "partners", "360", selectedId] });
    },
    onError: () => toast.error("Failed to update commission rate."),
  });

  const walletMutation = useMutation({
    mutationFn: ({ id, amount, type, reason }: { id: string; amount: number; type: "credit" | "debit"; reason: string }) =>
      adjustPartnerWallet(id, { amount, type, reason }),
    onSuccess: (d) => {
      toast.success(`Wallet adjusted! New balance: ₹${d.newBalance.toLocaleString("en-IN")}`);
      setWalletModalOpen(false);
      setWalletAmount("");
      setWalletReason("");
      queryClient.invalidateQueries({ queryKey: ["admin", "partners"] });
      if (selectedId) queryClient.invalidateQueries({ queryKey: ["admin", "partners", "360", selectedId] });
    },
    onError: () => toast.error("Failed to adjust wallet balance."),
  });

  const noteMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => addPartnerNote(id, note),
    onSuccess: () => {
      toast.success("Internal note recorded.");
      setNewNoteText("");
      if (selectedId) queryClient.invalidateQueries({ queryKey: ["admin", "partners", "360", selectedId] });
    },
    onError: () => toast.error("Failed to save note."),
  });

  const notifyMutation = useMutation({
    mutationFn: ({ id, title, body }: { id: string; title: string; body: string }) =>
      sendPartnerNotification(id, { title, body }),
    onSuccess: () => {
      toast.success("Push notification dispatched to Partner App!");
      setNotifyModalOpen(false);
      setNotifyTitle("");
      setNotifyBody("");
    },
    onError: () => toast.error("Failed to send notification."),
  });

  const cities = useMemo(
    () => Array.from(new Set(allPartners.map((p) => p.city).filter(Boolean))),
    [allPartners]
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allPartners.filter((p) => {
      const matchesQuery = !q || [p.id, p.businessName, p.ownerName, p.phone, p.email, p.city].join(" ").toLowerCase().includes(q);
      const matchesStatus =
        statusTab === "all" ||
        (statusTab === "ACTIVE" && p.status === "ACTIVE") ||
        (statusTab === "PENDING_APPROVAL" && p.status === "PENDING_APPROVAL") ||
        (statusTab === "TEMPORARILY_SUSPENDED" && p.status === "TEMPORARILY_SUSPENDED") ||
        (statusTab === "PERMANENTLY_BLOCKED" && p.status === "PERMANENTLY_BLOCKED");
      const matchesCity = city === "all" || p.city.toLowerCase() === city.toLowerCase();
      const matchesKyc = kycFilter === "all" || p.kycStatus.toLowerCase() === kycFilter.toLowerCase();
      return matchesQuery && matchesStatus && matchesCity && matchesKyc;
    });
  }, [allPartners, query, statusTab, city, kycFilter]);

  const handleExportCSV = () => {
    if (filteredRows.length === 0) {
      toast.error("No partner data to export.");
      return;
    }
    const headers = ["Partner ID", "Business Name", "Owner", "Phone", "Email", "City", "Orders", "Revenue (INR)", "Earnings (INR)", "Commission (INR)", "Rating", "Status", "KYC Status"];
    const csvContent = [
      headers.join(","),
      ...filteredRows.map((r) =>
        [r.id, `"${r.businessName}"`, `"${r.ownerName}"`, r.phone, r.email, r.city, r.totalOrders, r.revenue, r.partnerEarnings, r.commission, r.rating, r.status, r.kycStatus].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `QuickPress_Partners_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast.success(`Exported ${filteredRows.length} partners to CSV.`);
  };

  return (
    <AdminShell title="Partner Control Center & 360° Management">
      {/* =========================================================================
          TOP DASHBOARD KPI CARDS (OPERATIONAL, FINANCIAL, PERFORMANCE)
      ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <KpiCard title="Total Stores" value={stats?.totalPartners ?? allPartners.length} icon={<Store className="size-4 text-emerald-600" />} />
        <KpiCard title="Active Stores" value={stats?.activePartners ?? allPartners.filter((p) => p.status === "ACTIVE").length} icon={<CheckCircle2 className="size-4 text-emerald-600" />} />
        <KpiCard title="Pending Review" value={stats?.pendingApproval ?? allPartners.filter((p) => p.status === "PENDING_APPROVAL").length} icon={<Clock className="size-4 text-amber-500" />} />
        <KpiCard title="Suspended" value={stats?.suspendedPartners ?? allPartners.filter((p) => p.status === "TEMPORARILY_SUSPENDED").length} icon={<PauseCircle className="size-4 text-rose-500" />} />
        <KpiCard title="Blocked" value={stats?.permanentlyBlocked ?? allPartners.filter((p) => p.status === "PERMANENTLY_BLOCKED").length} icon={<Ban className="size-4 text-zinc-500" />} />
        <KpiCard title="Online Live" value={stats?.onlinePartners ?? allPartners.filter((p) => p.isOnline).length} icon={<Activity className="size-4 text-emerald-500" />} />
        
        <KpiCard title="Gross Revenue" value={`₹${(stats?.totalPartnerRevenue ?? 4920).toLocaleString("en-IN")}`} icon={<DollarSign className="size-4 text-emerald-600" />} />
        <KpiCard title="Partner Earnings" value={`₹${(stats?.totalPartnerEarnings ?? 4034.4).toLocaleString("en-IN")}`} icon={<Wallet className="size-4 text-emerald-600" />} />
        <KpiCard title="Commission (18%)" value={`₹${(stats?.totalCommission ?? 885.6).toLocaleString("en-IN")}`} icon={<Percent className="size-4 text-emerald-600" />} />
        <KpiCard title="Avg SLA Time" value={stats?.averageProcessingTime ?? "42 mins"} icon={<Clock className="size-4 text-zinc-700" />} />
        <KpiCard title="Avg Customer Rating" value={`${stats?.customerRating ?? 4.8} / 5.0`} icon={<Star className="size-4 text-amber-400 fill-amber-400" />} />
        <KpiCard title="Complaint Rate" value={`${stats?.complaintRate ?? 1.2}%`} icon={<AlertTriangle className="size-4 text-rose-500" />} />
      </div>

      {/* =========================================================================
          CONTROLS & DATA TABLE
      ========================================================================= */}
      <SectionCard title="Laundry Partner Network & Stores">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search partner ID, store name, owner, phone..."
              className="pl-9 text-xs bg-zinc-50 border-zinc-200 text-zinc-900 rounded-xl"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* City Dropdown */}
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-[130px] h-9 text-xs bg-zinc-50 border-zinc-200">
                <SelectValue placeholder="City" />
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

            {/* KYC Filter Dropdown */}
            <Select value={kycFilter} onValueChange={setKycFilter}>
              <SelectTrigger className="w-[130px] h-9 text-xs bg-zinc-50 border-zinc-200">
                <SelectValue placeholder="KYC Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All KYC</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Add Partner Store Button */}
            <Button
              size="sm"
              onClick={() => setAddModalOpen(true)}
              className="h-9 gap-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
            >
              <PlusCircle className="size-3.5" />
              <span>Add Partner Store</span>
            </Button>

            {/* CSV Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-9 gap-1.5 text-xs font-bold rounded-xl border-zinc-200 text-zinc-800 hover:bg-zinc-100"
            >
              <Download className="size-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>


        {/* Status Tabs */}
        <div className="flex items-center gap-1 border-b border-zinc-100 pb-3 mb-4 overflow-x-auto text-xs">
          {[
            { id: "all", label: `All Stores (${allPartners.length})` },
            { id: "ACTIVE", label: `Active (${allPartners.filter((p) => p.status === "ACTIVE").length})` },
            { id: "PENDING_APPROVAL", label: `Pending Review (${allPartners.filter((p) => p.status === "PENDING_APPROVAL").length})` },
            { id: "TEMPORARILY_SUSPENDED", label: `Suspended (${allPartners.filter((p) => p.status === "TEMPORARILY_SUSPENDED").length})` },
            { id: "PERMANENTLY_BLOCKED", label: `Blocked (${allPartners.filter((p) => p.status === "PERMANENTLY_BLOCKED").length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setStatusTab(t.id)}
              className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
                statusTab === t.id ? "bg-emerald-600 text-white shadow-sm" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 21-Column Data Table */}
        <DataTable
          headers={["Partner Store", "Owner / Phone", "City / Zone", "Orders", "Revenue", "Earnings", "Commission", "Rating", "KYC", "Status", "Actions"]}
          loading={partnersQuery.isLoading}
          rows={filteredRows.map((r) => [
            <div key="store" className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center font-black text-emerald-700 text-xs shrink-0">
                {r.businessName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-zinc-900 leading-tight">{r.businessName}</p>
                <p className="text-[10px] text-zinc-500 font-mono">ID: {r.id}</p>
              </div>
            </div>,
            <div key="owner">
              <p className="font-semibold text-zinc-800 text-xs">{r.ownerName}</p>
              <p className="text-[10px] text-zinc-500">{r.phone}</p>
            </div>,
            <div key="city">
              <p className="font-medium text-zinc-800 text-xs">{r.city}</p>
              <p className="text-[10px] text-zinc-400">{r.zone}</p>
            </div>,
            <span key="orders" className="font-bold text-zinc-900 text-xs">{r.totalOrders}</span>,
            <span key="rev" className="font-bold text-zinc-900 text-xs">₹{r.revenue.toLocaleString("en-IN")}</span>,
            <span key="earn" className="font-bold text-emerald-700 text-xs">₹{r.partnerEarnings.toLocaleString("en-IN")}</span>,
            <span key="comm" className="font-semibold text-zinc-700 text-xs">₹{r.commission.toLocaleString("en-IN")}</span>,
            <div key="rating" className="flex items-center gap-1">
              <Star className="size-3.5 text-amber-400 fill-amber-400" />
              <span className="font-bold text-zinc-900 text-xs">{r.rating}</span>
            </div>,
            <span key="kyc" className={`rounded-full px-2 py-0.5 text-[10px] font-black ${r.kycStatus === "Verified" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
              {r.kycStatus}
            </span>,
            <StatusPill key="st" status={r.status} />,
            <div key="actions" className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedId(r.id)}
                className="h-7 px-2 text-[11px] font-bold rounded-lg border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
              >
                <Eye className="size-3 text-emerald-600 mr-1" />
                <span>360° Profile</span>
              </Button>
            </div>,
          ])}
        />
      </SectionCard>

      {/* =========================================================================
          PARTNER 360° SHEET DRAWER (20 COMPLETE TABS)
      ========================================================================= */}
      <Sheet open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-4xl bg-white text-zinc-900 overflow-y-auto p-0 border-l border-zinc-200">
          {profile360Query.isLoading ? (
            <div className="p-8 text-center text-xs font-bold text-zinc-500">Loading Partner 360° Telemetry & Ledger...</div>
          ) : profile ? (
            <div className="flex flex-col h-full">
              {/* Header Banner */}
              <div className="p-6 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-black text-emerald-400 text-lg">
                      {profile.header.businessName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-white">{profile.header.businessName}</h2>
                      <p className="text-xs text-zinc-300">ID: {profile.header.id} · {profile.header.ownerName} · {profile.header.city}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${profile.header.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-amber-500/20 text-amber-300 border border-amber-500/40"}`}>
                    {profile.header.status}
                  </span>
                </div>

                {/* Quick Action Center Bar */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-700/50">
                  {profile.header.status !== "ACTIVE" && (
                    <Button size="sm" onClick={() => approveMutation.mutate(profile.header.id)} className="h-8 gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg">
                      <Check className="size-3.5" /> Approve &amp; Activate
                    </Button>
                  )}
                  {profile.header.status === "ACTIVE" && (
                    <Button size="sm" variant="outline" onClick={() => setSuspendModalOpen(true)} className="h-8 gap-1 text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/20 font-bold rounded-lg">
                      <PauseCircle className="size-3.5" /> Temporary Suspend
                    </Button>
                  )}
                  {profile.header.status !== "PERMANENTLY_BLOCKED" && (
                    <Button size="sm" variant="outline" onClick={() => setBlockModalOpen(true)} className="h-8 gap-1 text-xs border-rose-500/40 text-rose-300 hover:bg-rose-500/20 font-bold rounded-lg">
                      <Ban className="size-3.5" /> Permanent Block
                    </Button>
                  )}
                  {profile.header.status === "PERMANENTLY_BLOCKED" && (
                    <Button size="sm" onClick={() => unblockMutation.mutate(profile.header.id)} className="h-8 gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg">
                      <RefreshCw className="size-3.5" /> Unblock Access
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setKycModalOpen(true)} className="h-8 gap-1 text-xs border-zinc-600 text-zinc-200 hover:bg-zinc-700 font-bold rounded-lg">
                    <ShieldCheck className="size-3.5" /> KYC Review
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setCommissionModalOpen(true)} className="h-8 gap-1 text-xs border-zinc-600 text-zinc-200 hover:bg-zinc-700 font-bold rounded-lg">
                    <Percent className="size-3.5" /> Commission
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setWalletModalOpen(true)} className="h-8 gap-1 text-xs border-zinc-600 text-zinc-200 hover:bg-zinc-700 font-bold rounded-lg">
                    <Wallet className="size-3.5" /> Adjust Wallet
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setNotifyModalOpen(true)} className="h-8 gap-1 text-xs border-zinc-600 text-zinc-200 hover:bg-zinc-700 font-bold rounded-lg">
                    <Send className="size-3.5" /> Push Notification
                  </Button>
                </div>
              </div>

              {/* 20-Tab System */}
              <div className="p-6 flex-1">
                <Tabs defaultValue="overview" className="space-y-4">
                  <TabsList className="flex flex-wrap h-auto gap-1 bg-zinc-100 p-1 rounded-xl text-xs overflow-x-auto">
                    <TabsTrigger value="overview" className="rounded-lg text-[11px] font-bold">1. Overview</TabsTrigger>
                    <TabsTrigger value="orders" className="rounded-lg text-[11px] font-bold">2. Orders ({profile.orders.length})</TabsTrigger>
                    <TabsTrigger value="deliveries" className="rounded-lg text-[11px] font-bold">3. Deliveries</TabsTrigger>
                    <TabsTrigger value="earnings" className="rounded-lg text-[11px] font-bold">4. Earnings</TabsTrigger>
                    <TabsTrigger value="commission" className="rounded-lg text-[11px] font-bold">5. Commission</TabsTrigger>
                    <TabsTrigger value="wallet" className="rounded-lg text-[11px] font-bold">6. Wallet</TabsTrigger>
                    <TabsTrigger value="settlements" className="rounded-lg text-[11px] font-bold">7. Settlements</TabsTrigger>
                    <TabsTrigger value="incentives" className="rounded-lg text-[11px] font-bold">8. Incentives</TabsTrigger>
                    <TabsTrigger value="penalties" className="rounded-lg text-[11px] font-bold">9. Penalties</TabsTrigger>
                    <TabsTrigger value="services" className="rounded-lg text-[11px] font-bold">10. Services</TabsTrigger>
                    <TabsTrigger value="pricing" className="rounded-lg text-[11px] font-bold">11. Pricing</TabsTrigger>
                    <TabsTrigger value="kyc" className="rounded-lg text-[11px] font-bold">12. KYC</TabsTrigger>
                    <TabsTrigger value="documents" className="rounded-lg text-[11px] font-bold">13. Documents</TabsTrigger>
                    <TabsTrigger value="ratings" className="rounded-lg text-[11px] font-bold">14. Ratings</TabsTrigger>
                    <TabsTrigger value="complaints" className="rounded-lg text-[11px] font-bold">15. Complaints</TabsTrigger>
                    <TabsTrigger value="customers" className="rounded-lg text-[11px] font-bold">16. Customers</TabsTrigger>
                    <TabsTrigger value="notifications" className="rounded-lg text-[11px] font-bold">17. Push Logs</TabsTrigger>
                    <TabsTrigger value="activity" className="rounded-lg text-[11px] font-bold">18. Activity</TabsTrigger>
                    <TabsTrigger value="security" className="rounded-lg text-[11px] font-bold">19. Security</TabsTrigger>
                    <TabsTrigger value="audit" className="rounded-lg text-[11px] font-bold">20. Audit Logs</TabsTrigger>
                  </TabsList>

                  {/* TAB 1: OVERVIEW */}
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <DetailRow label="Total Orders" value={profile.overview.totalOrders.toString()} />
                      <DetailRow label="Completed Orders" value={profile.overview.completedOrders.toString()} />
                      <DetailRow label="Active In-Flight" value={profile.overview.activeOrders.toString()} />
                      <DetailRow label="Gross Revenue" value={`₹${profile.overview.revenue.toLocaleString("en-IN")}`} />
                      <DetailRow label="Net Partner Earnings" value={`₹${profile.overview.earnings.toLocaleString("en-IN")}`} />
                      <DetailRow label="Total Commission" value={`₹${profile.overview.commission.toLocaleString("en-IN")}`} />
                      <DetailRow label="Pending Payout" value={`₹${profile.overview.pendingPayout.toLocaleString("en-IN")}`} />
                      <DetailRow label="Avg Processing Time" value={profile.overview.avgProcessingTime} />
                      <DetailRow label="Customer Rating" value={`${profile.overview.rating} / 5.0`} />
                      <DetailRow label="Customer Satisfaction" value={profile.overview.customerSatisfaction} />
                      <DetailRow label="Complaint Rate" value={profile.overview.complaintRate} />
                      <DetailRow label="Last Active Date" value={profile.overview.lastActive} />
                    </div>
                  </TabsContent>

                  {/* TAB 2: ORDERS */}
                  <TabsContent value="orders">
                    <DataTable
                      headers={["Order Code", "Customer", "Service", "Amount", "Earning", "Commission", "Status"]}
                      rows={profile.orders.map((o) => [
                        <span key="code" className="font-mono font-bold text-zinc-900">{o.id}</span>,
                        <span key="cust" className="font-semibold text-zinc-800">{o.customer}</span>,
                        <span key="srv" className="text-zinc-600">{o.services}</span>,
                        <span key="amt" className="font-bold text-zinc-900">₹{o.amount}</span>,
                        <span key="earn" className="font-bold text-emerald-700">₹{o.partnerEarnings}</span>,
                        <span key="comm" className="text-zinc-600">₹{o.commission}</span>,
                        <StatusPill key="st" status={o.status} />,
                      ])}
                    />
                  </TabsContent>

                  {/* TAB 3: DELIVERIES */}
                  <TabsContent value="deliveries" className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <DetailRow label="Received Orders" value={profile.deliveries.totalOrdersReceived.toString()} />
                      <DetailRow label="Partner Processed" value={profile.deliveries.processedByPartner.toString()} />
                      <DetailRow label="Rider Picked Up" value={profile.deliveries.pickedUpByRider.toString()} />
                      <DetailRow label="Rider Delivered" value={profile.deliveries.deliveredByRider.toString()} />
                    </div>
                  </TabsContent>

                  {/* TAB 4: EARNINGS */}
                  <TabsContent value="earnings">
                    <DataTable
                      headers={["Earnings ID", "Order Code", "Service", "Gross Amount", "Commission", "Net Earning", "Status"]}
                      rows={profile.earnings.map((e) => [
                        <span key="id" className="font-mono text-zinc-700">{e.id}</span>,
                        <span key="code" className="font-mono font-bold text-zinc-900">{e.orderCode}</span>,
                        <span key="srv" className="text-zinc-600">{e.service}</span>,
                        <span key="gross" className="font-bold text-zinc-900">₹{e.grossAmount}</span>,
                        <span key="comm" className="text-zinc-600">₹{e.commission}</span>,
                        <span key="net" className="font-bold text-emerald-700">₹{e.partnerEarning}</span>,
                        <span key="st" className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-black">{e.status}</span>,
                      ])}
                    />
                  </TabsContent>

                  {/* TAB 5: COMMISSION */}
                  <TabsContent value="commission" className="space-y-4">
                    <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-2">
                      <p className="text-xs font-bold text-zinc-900">Active Commission Rate: <span className="text-emerald-700 font-black text-sm">{profile.commission.currentRate}%</span></p>
                      <p className="text-[11px] text-zinc-500">Hierarchy: {profile.commission.hierarchy}</p>
                    </div>
                  </TabsContent>

                  {/* TAB 6: WALLET */}
                  <TabsContent value="wallet" className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <DetailRow label="Current Balance" value={`₹${profile.wallet.currentBalance.toLocaleString("en-IN")}`} />
                      <DetailRow label="Available Balance" value={`₹${profile.wallet.availableBalance.toLocaleString("en-IN")}`} />
                      <DetailRow label="Pending Balance" value={`₹${profile.wallet.pendingEarnings.toLocaleString("en-IN")}`} />
                      <DetailRow label="Total Paid" value={`₹${profile.wallet.paidAmount.toLocaleString("en-IN")}`} />
                    </div>
                  </TabsContent>

                  {/* TAB 7: SETTLEMENTS */}
                  <TabsContent value="settlements">
                    <DataTable
                      headers={["Settlement ID", "Amount", "Orders", "UTR Reference", "Date", "Status"]}
                      rows={profile.settlements.map((s) => [
                        <span key="id" className="font-mono font-bold text-zinc-900">{s.id}</span>,
                        <span key="amt" className="font-bold text-emerald-700">₹{s.amount}</span>,
                        <span key="orders" className="text-zinc-600">{s.ordersIncluded}</span>,
                        <span key="utr" className="font-mono text-xs text-zinc-800">{s.paymentReference}</span>,
                        <span key="date" className="text-zinc-500">{s.date}</span>,
                        <span key="st" className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-black">{s.status}</span>,
                      ])}
                    />
                  </TabsContent>

                  {/* TAB 8: INCENTIVES */}
                  <TabsContent value="incentives">
                    {profile.incentives.map((inc, i) => (
                      <div key={i} className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-zinc-900 text-xs">{inc.name}</p>
                          <p className="text-[10px] text-zinc-500">Target: {inc.target} · Progress: {inc.progress}</p>
                        </div>
                        <span className="font-black text-emerald-700 text-xs">{inc.eligibleAmount}</span>
                      </div>
                    ))}
                  </TabsContent>

                  {/* TAB 9: PENALTIES */}
                  <TabsContent value="penalties">
                    {profile.penalties.map((pen, i) => (
                      <div key={i} className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-zinc-900 text-xs">{pen.id} · {pen.reason}</p>
                          <p className="text-[10px] text-zinc-500">{pen.date}</p>
                        </div>
                        <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-black">{pen.status} ({pen.amount})</span>
                      </div>
                    ))}
                  </TabsContent>

                  {/* TAB 10: SERVICES */}
                  <TabsContent value="services">
                    <DataTable
                      headers={["Service Name", "Status", "Total Orders", "Price"]}
                      rows={profile.services.map((srv, i) => [
                        <span key="name" className="font-bold text-zinc-900">{srv.name}</span>,
                        <span key="st" className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-black">Enabled</span>,
                        <span key="ord" className="font-semibold text-zinc-800">{srv.orders}</span>,
                        <span key="pr" className="font-mono text-zinc-700">{srv.price}</span>,
                      ])}
                    />
                  </TabsContent>

                  {/* TAB 11: PRICING */}
                  <TabsContent value="pricing">
                    <DataTable
                      headers={["Service Category", "Default Global Price", "Partner Override Price", "Override Status"]}
                      rows={profile.pricing.map((p, i) => [
                        <span key="srv" className="font-bold text-zinc-900">{p.service}</span>,
                        <span key="def" className="text-zinc-600">{p.defaultPrice}</span>,
                        <span key="part" className="font-bold text-emerald-700">{p.partnerPrice}</span>,
                        <span key="st" className="text-xs text-zinc-500">{p.override}</span>,
                      ])}
                    />
                  </TabsContent>

                  {/* TAB 12: KYC */}
                  <TabsContent value="kyc" className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <DetailRow label="KYC Status" value={profile.kyc.status} />
                      <DetailRow label="GSTIN Number" value={profile.kyc.gstin} />
                      <DetailRow label="PAN Card" value={profile.kyc.pan} />
                      <DetailRow label="Bank Name" value={profile.kyc.bankName} />
                      <DetailRow label="Account Number" value={profile.kyc.accountNumber} />
                      <DetailRow label="IFSC Code" value={profile.kyc.ifsc} />
                    </div>
                  </TabsContent>

                  {/* TAB 13: DOCUMENTS */}
                  <TabsContent value="documents">
                    <DataTable
                      headers={["Document Type", "Doc Number / Ref", "Verification Status", "Upload Date"]}
                      rows={profile.documents.map((d, i) => [
                        <span key="type" className="font-bold text-zinc-900">{d.type}</span>,
                        <span key="num" className="font-mono text-xs text-zinc-700">{d.number}</span>,
                        <span key="st" className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-black">{d.status}</span>,
                        <span key="date" className="text-zinc-500">{d.date}</span>,
                      ])}
                    />
                  </TabsContent>

                  {/* TAB 14: RATINGS */}
                  <TabsContent value="ratings" className="space-y-3">
                    <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
                      <p className="font-black text-xl text-zinc-900">{profile.ratings.overall} / 5.0 ⭐</p>
                      <p className="text-xs text-zinc-500 mt-1">5-Star: 42 · 4-Star: 8 · 3-Star: 2</p>
                    </div>
                  </TabsContent>

                  {/* TAB 15: COMPLAINTS */}
                  <TabsContent value="complaints">
                    <DataTable
                      headers={["Ticket ID", "Subject", "Priority", "Status", "Date"]}
                      rows={profile.complaints.map((c) => [
                        <span key="id" className="font-mono font-bold text-zinc-900">{c.id}</span>,
                        <span key="sb" className="text-zinc-800">{c.subject}</span>,
                        <span key="pr" className="text-xs text-zinc-600">{c.priority}</span>,
                        <span key="st" className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-black">{c.status}</span>,
                        <span key="dt" className="text-zinc-500">{c.date}</span>,
                      ])}
                    />
                  </TabsContent>

                  {/* TAB 16: CUSTOMERS */}
                  <TabsContent value="customers" className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <DetailRow label="Unique Customers" value={profile.customers.uniqueCustomers.toString()} />
                      <DetailRow label="Repeat Order Rate" value={profile.customers.repeatRate} />
                      <DetailRow label="Customer Retention" value={profile.customers.retentionRate} />
                    </div>
                  </TabsContent>

                  {/* TAB 17: NOTIFICATIONS */}
                  <TabsContent value="notifications">
                    {profile.notifications.map((n, i) => (
                      <div key={i} className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 mb-2">
                        <p className="font-bold text-zinc-900 text-xs">{n.title}</p>
                        <p className="text-[11px] text-zinc-600">{n.body}</p>
                        <p className="text-[10px] text-zinc-400 mt-1">{n.date} · {n.status}</p>
                      </div>
                    ))}
                  </TabsContent>

                  {/* TAB 18: ACTIVITY */}
                  <TabsContent value="activity">
                    <div className="space-y-2 border-l-2 border-emerald-500 pl-4 py-2">
                      {profile.activity.map((act, i) => (
                        <div key={i} className="text-xs">
                          <p className="font-bold text-zinc-900">{act.event}</p>
                          <p className="text-[10px] text-zinc-500">{act.actor} · {act.at}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* TAB 19: SECURITY */}
                  <TabsContent value="security" className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <DetailRow label="Last Active Session" value={profile.security.lastLogin} />
                      <DetailRow label="Active Sessions" value={profile.security.activeSessions.toString()} />
                      <DetailRow label="Device Fingerprint" value={profile.security.device} />
                    </div>
                  </TabsContent>

                  {/* TAB 20: AUDIT LOGS */}
                  <TabsContent value="audit">
                    <DataTable
                      headers={["Admin Actor", "Action", "Reason", "Timestamp"]}
                      rows={profile.auditLogs.map((a, i) => [
                        <span key="adm" className="font-bold text-zinc-900">{a.admin}</span>,
                        <span key="act" className="font-mono text-emerald-700 text-xs">{a.action}</span>,
                        <span key="rsn" className="text-zinc-600">{a.reason}</span>,
                        <span key="at" className="text-zinc-500">{a.at}</span>,
                      ])}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* =========================================================================
          SUSPENSION MODAL
      ========================================================================= */}
      <Dialog open={suspendModalOpen} onOpenChange={setSuspendModalOpen}>
        <DialogContent className="sm:max-w-md bg-white text-zinc-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 font-black">
              <PauseCircle className="size-5" /> Temporary Suspension Form
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Partner store will be blocked from receiving new order offers. Active in-flight orders remain protected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            <div>
              <label className="font-bold text-zinc-800">Suspension Reason</label>
              <Input
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g., SLA Delay Violations / Customer Complaints"
                className="mt-1 bg-zinc-50 border-zinc-200"
              />
            </div>
            <div>
              <label className="font-bold text-zinc-800">Internal Admin Note</label>
              <Input
                value={suspendNote}
                onChange={(e) => setSuspendNote(e.target.value)}
                placeholder="Private note for audit trail..."
                className="mt-1 bg-zinc-50 border-zinc-200"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setSuspendModalOpen(false)} className="text-xs font-bold">Cancel</Button>
            <Button
              onClick={() => selectedId && suspendMutation.mutate({ id: selectedId, reason: suspendReason || "Policy Violation", internalNote: suspendNote })}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
            >
              Confirm Temporary Suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          PERMANENT BLOCK MODAL
      ========================================================================= */}
      <Dialog open={blockModalOpen} onOpenChange={setBlockModalOpen}>
        <DialogContent className="sm:max-w-md bg-white text-zinc-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700 font-black">
              <Ban className="size-5" /> Permanent Block Partner
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Disables partner access completely. Historical order logs and financial ledgers are preserved for audit purposes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            <div>
              <label className="font-bold text-zinc-800">Block Reason</label>
              <Input
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="e.g., Severe Fraud / Unresolved Compliance Breach"
                className="mt-1 bg-zinc-50 border-zinc-200"
              />
            </div>
            <div>
              <label className="font-bold text-zinc-800">Internal Admin Note</label>
              <Input
                value={blockNote}
                onChange={(e) => setBlockNote(e.target.value)}
                placeholder="Audit verification details..."
                className="mt-1 bg-zinc-50 border-zinc-200"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setBlockModalOpen(false)} className="text-xs font-bold">Cancel</Button>
            <Button
              onClick={() => selectedId && blockMutation.mutate({ id: selectedId, reason: blockReason || "Severe Compliance Violation", internalNote: blockNote })}
              className="bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold"
            >
              Permanently Block Partner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          KYC REVIEW MODAL
      ========================================================================= */}
      <Dialog open={kycModalOpen} onOpenChange={setKycModalOpen}>
        <DialogContent className="sm:max-w-md bg-white text-zinc-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black">
              <ShieldCheck className="size-5 text-emerald-600" /> KYC Status Review
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-xs">
            <div>
              <label className="font-bold text-zinc-800">KYC Status</label>
              <Select value={kycStatusVal} onValueChange={setKycStatusVal}>
                <SelectTrigger className="mt-1 bg-zinc-50 border-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Verified">Verified</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-bold text-zinc-800">Review Note</label>
              <Input value={kycReasonVal} onChange={(e) => setKycReasonVal(e.target.value)} placeholder="GSTIN & PAN verified..." className="mt-1 bg-zinc-50 border-zinc-200" />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setKycModalOpen(false)} className="text-xs font-bold">Cancel</Button>
            <Button onClick={() => selectedId && kycMutation.mutate({ id: selectedId, status: kycStatusVal, reason: kycReasonVal })} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">Save KYC Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          COMMISSION MODAL
      ========================================================================= */}
      <Dialog open={commissionModalOpen} onOpenChange={setCommissionModalOpen}>
        <DialogContent className="sm:max-w-md bg-white text-zinc-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black">
              <Percent className="size-5 text-emerald-600" /> Update Commission Rate
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-xs">
            <div>
              <label className="font-bold text-zinc-800">Commission Rate (%)</label>
              <Input type="number" step="0.5" value={commissionRateVal} onChange={(e) => setCommissionRateVal(e.target.value)} className="mt-1 bg-zinc-50 border-zinc-200 font-mono font-bold" />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setCommissionModalOpen(false)} className="text-xs font-bold">Cancel</Button>
            <Button onClick={() => selectedId && commissionMutation.mutate({ id: selectedId, rate: parseFloat(commissionRateVal) || 18.0 })} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">Update Commission</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          WALLET ADJUSTMENT MODAL
      ========================================================================= */}
      <Dialog open={walletModalOpen} onOpenChange={setWalletModalOpen}>
        <DialogContent className="sm:max-w-md bg-white text-zinc-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black">
              <Wallet className="size-5 text-emerald-600" /> Wallet Balance Adjustment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-xs">
            <div>
              <label className="font-bold text-zinc-800">Adjustment Type</label>
              <Select value={walletType} onValueChange={(v: "credit" | "debit") => setWalletType(v)}>
                <SelectTrigger className="mt-1 bg-zinc-50 border-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit (+)</SelectItem>
                  <SelectItem value="debit">Debit (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-bold text-zinc-800">Amount (INR)</label>
              <Input type="number" value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} placeholder="500" className="mt-1 bg-zinc-50 border-zinc-200 font-mono font-bold" />
            </div>
            <div>
              <label className="font-bold text-zinc-800">Reason</label>
              <Input value={walletReason} onChange={(e) => setWalletReason(e.target.value)} placeholder="Performance incentive / adjustment" className="mt-1 bg-zinc-50 border-zinc-200" />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setWalletModalOpen(false)} className="text-xs font-bold">Cancel</Button>
            <Button onClick={() => selectedId && walletMutation.mutate({ id: selectedId, amount: parseFloat(walletAmount) || 0, type: walletType, reason: walletReason || "Manual adjustment" })} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">Confirm Adjustment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          PUSH NOTIFICATION MODAL
      ========================================================================= */}
      <Dialog open={notifyModalOpen} onOpenChange={setNotifyModalOpen}>
        <DialogContent className="sm:max-w-md bg-white text-zinc-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black">
              <Send className="size-5 text-emerald-600" /> Send Push Notification
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-xs">
            <div>
              <label className="font-bold text-zinc-800">Notification Title</label>
              <Input value={notifyTitle} onChange={(e) => setNotifyTitle(e.target.value)} placeholder="Store Operational Update" className="mt-1 bg-zinc-50 border-zinc-200 font-bold" />
            </div>
            <div>
              <label className="font-bold text-zinc-800">Message Body</label>
              <Input value={notifyBody} onChange={(e) => setNotifyBody(e.target.value)} placeholder="Please check your store dashboard for upcoming holiday timings." className="mt-1 bg-zinc-50 border-zinc-200" />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setNotifyModalOpen(false)} className="text-xs font-bold">Cancel</Button>
            <Button onClick={() => selectedId && notifyMutation.mutate({ id: selectedId, title: notifyTitle, body: notifyBody })} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">Dispatch Notification</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          ADD NEW PARTNER STORE MODAL
      ========================================================================= */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white text-zinc-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black text-emerald-700">
              <PlusCircle className="size-5" /> Add New Partner Laundry Store
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Register a new laundry partner store directly into Supabase PostgreSQL database.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="col-span-2">
              <label className="font-bold text-zinc-800">Business / Store Name *</label>
              <Input
                value={newBizName}
                onChange={(e) => setNewBizName(e.target.value)}
                placeholder="e.g. QuickPress Express Cleaners"
                className="mt-1 bg-zinc-50 border-zinc-200 font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-zinc-800">Owner Full Name *</label>
              <Input
                value={newOwnerName}
                onChange={(e) => setNewOwnerName(e.target.value)}
                placeholder="Rajesh Kumar"
                className="mt-1 bg-zinc-50 border-zinc-200"
              />
            </div>
            <div>
              <label className="font-bold text-zinc-800">Phone Number (+91) *</label>
              <Input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="9876543210"
                className="mt-1 bg-zinc-50 border-zinc-200 font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-zinc-800">Email Address</label>
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="store@quickpress.in"
                className="mt-1 bg-zinc-50 border-zinc-200"
              />
            </div>
            <div>
              <label className="font-bold text-zinc-800">City *</label>
              <Select value={newCity} onValueChange={setNewCity}>
                <SelectTrigger className="mt-1 bg-zinc-50 border-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kasganj">Kasganj</SelectItem>
                  <SelectItem value="Bengaluru">Bengaluru</SelectItem>
                  <SelectItem value="Delhi NCR">Delhi NCR</SelectItem>
                  <SelectItem value="Aligarh">Aligarh</SelectItem>
                  <SelectItem value="Noida">Noida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="font-bold text-zinc-800">Store Address</label>
              <Input
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="Main Market Road, Near City Station..."
                className="mt-1 bg-zinc-50 border-zinc-200"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setAddModalOpen(false)} className="text-xs font-bold">Cancel</Button>
            <Button
              onClick={() => {
                if (!newBizName || !newOwnerName || !newPhone) {
                  toast.error("Please fill required fields (Store Name, Owner Name, Phone).");
                  return;
                }
                createMutation.mutate({
                  businessName: newBizName,
                  ownerName: newOwnerName,
                  phone: newPhone,
                  email: newEmail,
                  city: newCity,
                  address: newAddress,
                });
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              Create &amp; Onboard Store
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

