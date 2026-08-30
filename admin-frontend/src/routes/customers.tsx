import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  Search,
  ShieldCheck,
  Users,
  ShoppingBag,
  Wallet,
  TrendingUp,
  Download,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  CheckCircle2,
  Lock,
  Unlock,
  Calendar,
  Sparkles,
  Award,
  Ticket,
  Share2,
  FileText,
  Bell,
  Activity,
  Tag,
  MessageSquare,
  ShieldAlert,
  Send,
  Plus,
  RefreshCw,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AdminShell } from "../components/AdminShell";
import { DataTable, DetailRow, SectionCard, StatusPill, KpiCard } from "../components/AdminUI";
import {
  fetchCustomer360,
  fetchCustomerStats,
  fetchCustomers,
  setCustomerBlocked,
  adjustCustomerWallet,
  adjustCustomerLoyalty,
  addCustomerNote,
  updateCustomerTags,
  sendCustomerNotification,
  logoutCustomerSessions,
  type AdminCustomer,
  type Customer360Data,
} from "../api/customers";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/customers")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Customers Management", "Manage QuickPress customer directory, wallets, and orders."),
  component: CustomersPage,
});

export function CustomersPage() {
  const queryClient = useQueryClient();
  const statsQuery = useQuery({ queryKey: ["admin", "customers", "stats"], queryFn: fetchCustomerStats });
  const customers = useQuery({ queryKey: ["admin", "customers"], queryFn: fetchCustomers });

  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [statusTab, setStatusTab] = useState("all");
  const [segment, setSegment] = useState("all");
  const [selected, setSelected] = useState<AdminCustomer | null>(null);

  const allCustomers = customers.data ?? [];
  const stats = statsQuery.data;

  const blockMutation = useMutation({
    mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) => setCustomerBlocked(id, blocked),
    onSuccess: (_data, vars) => {
      toast.success(vars.blocked ? "Customer blocked from placing orders." : "Customer account unblocked.");
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "customers", "stats"] });
    },
    onError: () => {
      toast.error("Failed to update customer status.");
    },
  });

  const cities = useMemo(
    () => Array.from(new Set(allCustomers.map((c) => c.city).filter(Boolean))),
    [allCustomers],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allCustomers.filter((c) => {
      const matchesQuery = !q || [c.id, c.name, c.phone, c.email, c.city].join(" ").toLowerCase().includes(q);
      const matchesTab =
        statusTab === "all" ||
        (statusTab === "active" && c.status === "Active") ||
        (statusTab === "blocked" && c.status === "Blocked");
      const matchesCity = city === "all" || c.city === city;
      const matchesSegment =
        segment === "all" ||
        (segment === "vip" && (c as any).isVip) ||
        (segment === "repeat" && c.orders >= 2) ||
        (segment === "new" && c.orders <= 1);
      return matchesQuery && matchesTab && matchesCity && matchesSegment;
    });
  }, [allCustomers, query, city, statusTab, segment]);

  const handleExportCSV = () => {
    if (rows.length === 0) {
      toast.error("No customers to export.");
      return;
    }
    const headers = ["Customer ID", "Name", "Phone", "Email", "City", "Orders", "Total Spend", "Status"];
    const csvRows = [headers.join(",")];
    for (const r of rows) {
      csvRows.push(
        [
          `"${r.id}"`,
          `"${r.name}"`,
          `"${r.phone}"`,
          `"${r.email}"`,
          `"${r.city}"`,
          `"${r.orders}"`,
          `"${r.spend}"`,
          `"${r.status}"`,
        ].join(","),
      );
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QuickPress_Customers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Customers CSV exported successfully!");
  };

  return (
    <AdminShell
      title="Customers Directory &amp; 360° Hub"
      subtitle="Complete user registry, lifetime spend, order history, wallet balance, and account governance."
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
            1. TOP METRIC CARDS (REAL SUPABASE STATS)
        ========================================================================= */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <KpiCard
            kpi={{
              id: "tot-cust",
              label: "Total Customers",
              value: (stats?.totalCustomers ?? allCustomers.length).toLocaleString("en-IN"),
              hint: "Lifetime registered accounts",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "act-cust",
              label: "Active Accounts",
              value: (stats?.activeCustomers ?? allCustomers.filter((c) => c.status === "Active").length).toLocaleString("en-IN"),
              hint: "Normal standing",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "new-today",
              label: "New Today",
              value: (stats?.newCustomersToday ?? 0).toLocaleString("en-IN"),
              hint: "Joined past 24 hours",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "repeat-cust",
              label: "Repeat Buyers",
              value: (stats?.repeatCustomers ?? 0).toLocaleString("en-IN"),
              hint: "2+ booked orders",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "vip-cust",
              label: "VIP Members",
              value: (stats?.vipCustomers ?? 0).toLocaleString("en-IN"),
              hint: "Active subscriptions / High spenders",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "tot-spend",
              label: "Total GMV Spend",
              value: `₹${(stats?.totalRevenue ?? 0).toLocaleString("en-IN")}`,
              hint: `AOV: ₹${stats?.averageOrderValue ?? 0}`,
              positive: true,
            }}
          />
        </div>

        {/* =========================================================================
            2. SEARCH & ADVANCED FILTERS
        ========================================================================= */}
        <SectionCard>
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-100">
            <Tabs value={statusTab} onValueChange={setStatusTab}>
              <TabsList className="bg-zinc-100 p-1 rounded-xl">
                <TabsTrigger value="all" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  All Accounts ({allCustomers.length})
                </TabsTrigger>
                <TabsTrigger value="active" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  Active ({allCustomers.filter((c) => c.status === "Active").length})
                </TabsTrigger>
                <TabsTrigger value="blocked" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  Blocked ({allCustomers.filter((c) => c.status === "Blocked").length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
              <Users className="size-4 text-emerald-600" />
              <span>Showing {rows.length} Customers</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by customer name, phone, email or ID..."
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

            <Select value={segment} onValueChange={setSegment}>
              <SelectTrigger className="h-10 rounded-xl bg-zinc-50 border-zinc-200 text-xs font-bold">
                <SelectValue placeholder="Segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Segments</SelectItem>
                <SelectItem value="vip">⭐ VIP / High Value</SelectItem>
                <SelectItem value="repeat">🔄 Repeat Buyers (2+)</SelectItem>
                <SelectItem value="new">🆕 New Customers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </SectionCard>

        {/* =========================================================================
            3. CUSTOMERS DATA TABLE
        ========================================================================= */}
        <SectionCard
          title="Customer Accounts Directory"
          description="Click any row to open the complete Customer 360° Profile, Wallet Ledger, Loyalty Points, and Orders."
        >
          <DataTable
            loading={customers.isLoading}
            rows={rows}
            onRowClick={setSelected}
            emptyMessage="No customer accounts found matching these criteria."
            columns={[
              {
                key: "name",
                label: "Customer",
                render: (r) => (
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs">
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
                  <span className="font-mono font-bold text-xs text-zinc-800 flex items-center gap-1">
                    <Phone className="size-3 text-emerald-600" />
                    {r.phone || "—"}
                  </span>
                ),
              },
              {
                key: "city",
                label: "City / Area",
                render: (r) => (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700">
                    <MapPin className="size-3 text-zinc-400" />
                    {r.city || "Kasganj"}
                  </span>
                ),
              },
              {
                key: "orders",
                label: "Bookings",
                render: (r) => (
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-black text-zinc-800">
                    {r.orders} orders
                  </span>
                ),
              },
              {
                key: "spend",
                label: "Total Spend",
                render: (r) => <span className="font-black text-emerald-700 text-xs">{r.spend}</span>,
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
                render: (r) => (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      blockMutation.mutate({ id: r.id, blocked: r.status === "Active" });
                    }}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                      r.status === "Active"
                        ? "text-rose-600 hover:bg-rose-50 border border-rose-200"
                        : "text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                    }`}
                  >
                    {r.status === "Active" ? "Block" : "Unblock"}
                  </button>
                ),
              },
            ]}
          />
        </SectionCard>
      </div>

      {/* =========================================================================
          4. CUSTOMER 360° PROFILES SHEET
      ========================================================================= */}
      <Customer360Sheet
        customer={selected}
        onClose={() => setSelected(null)}
        onToggleBlock={(id, blocked) => blockMutation.mutate({ id, blocked })}
      />
    </AdminShell>
  );
}

function Customer360Sheet({
  customer,
  onClose,
  onToggleBlock,
}: {
  customer: AdminCustomer | null;
  onClose: () => void;
  onToggleBlock: (id: string, blocked: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const c360 = useQuery({
    queryKey: ["admin", "customer360", customer?.id],
    queryFn: () => fetchCustomer360(customer!.id),
    enabled: Boolean(customer),
  });

  const [walletAmount, setWalletAmount] = useState("");
  const [walletReason, setWalletReason] = useState("");
  const [loyaltyPts, setLoyaltyPts] = useState("");
  const [loyaltyReason, setLoyaltyReason] = useState("");
  const [newNote, setNewNote] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");

  const data: Customer360Data | undefined = c360.data;

  // Wallet adjustment mutation
  const walletMutation = useMutation({
    mutationFn: ({ amount, reason }: { amount: number; reason: string }) =>
      adjustCustomerWallet(customer!.id, amount, reason),
    onSuccess: () => {
      toast.success("Wallet balance adjusted successfully!");
      setWalletAmount("");
      setWalletReason("");
      queryClient.invalidateQueries({ queryKey: ["admin", "customer360", customer?.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to adjust wallet balance.");
    },
  });

  // Loyalty adjustment mutation
  const loyaltyMutation = useMutation({
    mutationFn: ({ points, reason }: { points: number; reason: string }) =>
      adjustCustomerLoyalty(customer!.id, points, reason),
    onSuccess: () => {
      toast.success("Loyalty points updated!");
      setLoyaltyPts("");
      setLoyaltyReason("");
      queryClient.invalidateQueries({ queryKey: ["admin", "customer360", customer?.id] });
    },
    onError: () => toast.error("Failed to update loyalty points."),
  });

  // Add staff note mutation
  const noteMutation = useMutation({
    mutationFn: (note: string) => addCustomerNote(customer!.id, note),
    onSuccess: () => {
      toast.success("Internal staff note saved!");
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: ["admin", "customer360", customer?.id] });
    },
    onError: () => toast.error("Failed to add note."),
  });

  // Send notification mutation
  const notifMutation = useMutation({
    mutationFn: ({ title, body }: { title: string; body: string }) =>
      sendCustomerNotification(customer!.id, title, body),
    onSuccess: () => {
      toast.success("Push Notification dispatched to customer!");
      setNotifTitle("");
      setNotifBody("");
    },
    onError: () => toast.error("Failed to send notification."),
  });

  // Logout sessions mutation
  const logoutMutation = useMutation({
    mutationFn: () => logoutCustomerSessions(customer!.id),
    onSuccess: () => toast.success("All active login sessions invalidated!"),
    onError: () => toast.error("Failed to invalidate sessions."),
  });

  return (
    <Sheet open={Boolean(customer)} onOpenChange={(open) => (open ? null : onClose())}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl bg-white text-zinc-900 border-zinc-200">
        {/* Customer Header */}
        <SheetHeader className="border-b border-zinc-100 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-sm">
                {customer?.name.slice(0, 2).toUpperCase() || "CU"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-lg font-black text-zinc-900">{customer?.name}</SheetTitle>
                  {customer?.spend && Number(String(customer.spend).replace(/[^0-9.]/g, "")) > 500 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">
                      <Sparkles className="size-3" /> VIP
                    </span>
                  )}
                </div>
                <SheetDescription className="text-xs text-zinc-500 font-medium mt-0.5">
                  ID: #{customer?.id} · {customer?.city || "Kasganj"} · Reg: {customer?.joined || "Active"}
                </SheetDescription>
              </div>
            </div>
            {customer && <StatusPill value={customer.status} />}
          </div>
        </SheetHeader>

        {/* Customer 360° Unified Body */}
        <div className="space-y-6 px-4 py-6">
          {/* Quick Summary Cards Row */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 text-center">
              <span className="text-[10px] font-black uppercase text-zinc-500">Total Spent</span>
              <p className="text-sm font-black text-emerald-700 mt-0.5">{customer?.spend || "₹0"}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 text-center">
              <span className="text-[10px] font-black uppercase text-zinc-500">Bookings</span>
              <p className="text-sm font-black text-zinc-900 mt-0.5">{customer?.orders || 0} Orders</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 text-center">
              <span className="text-[10px] font-black uppercase text-zinc-500">Wallet</span>
              <p className="text-sm font-black text-emerald-700 mt-0.5">₹{data?.wallet?.balance || 0}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 text-center">
              <span className="text-[10px] font-black uppercase text-zinc-500">Loyalty Pts</span>
              <p className="text-sm font-black text-amber-700 mt-0.5">{data?.loyalty?.points || 120} Pts</p>
            </div>
          </div>

          {/* 14 Multi-Tab Customer 360 Workspace */}
          <Tabs defaultValue="overview">
            <TabsList className="flex flex-wrap h-auto p-1 bg-zinc-100/90 rounded-xl gap-1">
              <TabsTrigger value="overview" className="text-xs font-bold px-2.5 py-1 rounded-lg data-[state=active]:bg-white shadow-2xs">Overview</TabsTrigger>
              <TabsTrigger value="orders" className="text-xs font-bold px-2.5 py-1 rounded-lg data-[state=active]:bg-white shadow-2xs">Orders ({data?.orders?.length ?? customer?.orders ?? 0})</TabsTrigger>
              <TabsTrigger value="wallet" className="text-xs font-bold px-2.5 py-1 rounded-lg data-[state=active]:bg-white shadow-2xs">Wallet</TabsTrigger>
              <TabsTrigger value="loyalty" className="text-xs font-bold px-2.5 py-1 rounded-lg data-[state=active]:bg-white shadow-2xs">Loyalty</TabsTrigger>
              <TabsTrigger value="membership" className="text-xs font-bold px-2.5 py-1 rounded-lg data-[state=active]:bg-white shadow-2xs">VIP Plan</TabsTrigger>
              <TabsTrigger value="notes" className="text-xs font-bold px-2.5 py-1 rounded-lg data-[state=active]:bg-white shadow-2xs">Notes ({data?.notes?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs font-bold px-2.5 py-1 rounded-lg data-[state=active]:bg-white shadow-2xs">Send Push</TabsTrigger>
              <TabsTrigger value="security" className="text-xs font-bold px-2.5 py-1 rounded-lg data-[state=active]:bg-white shadow-2xs">Security</TabsTrigger>
            </TabsList>

            {/* TAB 1: OVERVIEW */}
            <TabsContent value="overview" className="pt-4 space-y-4">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-2">ACCOUNT INTELLIGENCE SUMMARY</h4>
                <DetailRow label="Customer ID" value={<span className="font-mono font-bold text-zinc-900">{customer?.id}</span>} />
                <DetailRow label="Phone Contact" value={<a href={`tel:${customer?.phone}`} className="font-mono font-bold text-emerald-700 hover:underline">{customer?.phone}</a>} />
                <DetailRow label="Email Address" value={<span className="font-mono text-zinc-700">{customer?.email || "—"}</span>} />
                <DetailRow label="First Order Date" value={data?.overview?.firstOrder || "—"} />
                <DetailRow label="Latest Order Date" value={data?.overview?.lastOrder || "—"} />
                <DetailRow label="Favorite Service" value={<span className="font-bold text-zinc-900">{data?.overview?.favoriteService || "Standard Laundry"}</span>} />
                <DetailRow label="Favorite Partner Store" value={<span className="font-bold text-zinc-900">{data?.overview?.favoritePartner || "QuickPress Store"}</span>} />
                <DetailRow label="Referral Code" value={<span className="font-mono font-bold text-emerald-700">{data?.overview?.referralCode || "QP-100"}</span>} />
              </div>
            </TabsContent>

            {/* TAB 2: ORDERS */}
            <TabsContent value="orders" className="pt-4 space-y-3">
              <div className="rounded-2xl border border-zinc-200 overflow-hidden">
                <ul className="divide-y divide-zinc-100">
                  {(data?.orders ?? []).map((order) => (
                    <li key={order.id} className="p-3.5 text-xs hover:bg-zinc-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-zinc-900">#{order.id}</span>
                        <StatusPill value={order.status} />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-zinc-600 font-medium">
                        <span>{order.service} · {order.placedOn}</span>
                        <span className="font-black text-emerald-700">{order.amount ? `₹${order.amount}` : order.total}</span>
                      </div>
                    </li>
                  ))}
                  {(!data?.orders || data.orders.length === 0) && (
                    <li className="p-6 text-center text-xs text-zinc-400">No past orders found for this user.</li>
                  )}
                </ul>
              </div>
            </TabsContent>

            {/* TAB 3: WALLET LEDGER & ADJUSTMENT */}
            <TabsContent value="wallet" className="pt-4 space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-800">Current Wallet Balance</span>
                    <p className="text-2xl font-black text-emerald-950">₹{data?.wallet?.balance || 0}</p>
                  </div>
                  <Wallet className="size-8 text-emerald-600" />
                </div>
              </div>

              {/* Admin Wallet Credit/Deduct Form */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700">ADMINISTRATIVE WALLET ADJUSTMENT</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Amount (e.g. 100 or -50)"
                    value={walletAmount}
                    onChange={(e) => setWalletAmount(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                  <Input
                    placeholder="Reason (Mandatory audit log)"
                    value={walletReason}
                    onChange={(e) => setWalletReason(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    className="flex-1 h-9 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={!walletAmount || !walletReason}
                    onClick={() => walletMutation.mutate({ amount: Number(walletAmount), reason: walletReason })}
                  >
                    + Add Wallet Credit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-9 rounded-xl text-xs font-bold border-rose-300 text-rose-700 hover:bg-rose-50"
                    disabled={!walletAmount || !walletReason}
                    onClick={() => walletMutation.mutate({ amount: -Math.abs(Number(walletAmount)), reason: walletReason })}
                  >
                    - Deduct Balance
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: LOYALTY */}
            <TabsContent value="loyalty" className="pt-4 space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-800">Loyalty Tier &amp; Points</span>
                    <p className="text-2xl font-black text-amber-950">{data?.loyalty?.points || 120} Points</p>
                    <p className="text-xs font-bold text-amber-800 mt-0.5">{data?.loyalty?.level || "Silver Tier"}</p>
                  </div>
                  <Award className="size-8 text-amber-600" />
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700">MANUAL LOYALTY ADJUSTMENT</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Points (e.g. 50 or -20)"
                    value={loyaltyPts}
                    onChange={(e) => setLoyaltyPts(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                  <Input
                    placeholder="Reason"
                    value={loyaltyReason}
                    onChange={(e) => setLoyaltyReason(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <Button
                  type="button"
                  className="w-full h-9 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={!loyaltyPts || !loyaltyReason}
                  onClick={() => loyaltyMutation.mutate({ points: Number(loyaltyPts), reason: loyaltyReason })}
                >
                  Update Loyalty Points
                </Button>
              </div>
            </TabsContent>

            {/* TAB 5: MEMBERSHIP */}
            <TabsContent value="membership" className="pt-4 space-y-3">
              <div className="rounded-2xl border border-emerald-200 bg-white p-4 space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-black text-emerald-900">ACTIVE SUBSCRIPTION PLAN</h4>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    {data?.membership?.status || "Active"}
                  </span>
                </div>
                <DetailRow label="Current Plan" value={<span className="font-black text-zinc-900">{data?.membership?.plan || "Gold VIP Plan"}</span>} />
                <DetailRow label="Valid From" value={data?.membership?.startDate || "2026-01-01"} />
                <DetailRow label="Expires On" value={data?.membership?.expiryDate || "2026-12-31"} />
              </div>
            </TabsContent>

            {/* TAB 6: INTERNAL STAFF NOTES */}
            <TabsContent value="notes" className="pt-4 space-y-4">
              <div className="space-y-2">
                {(data?.notes ?? []).map((n) => (
                  <div key={n.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs">
                    <p className="font-bold text-zinc-900">{n.note}</p>
                    <p className="text-[10px] text-zinc-400 mt-1 font-medium">{n.author} · {n.at.slice(0, 10)}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add internal staff note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="h-9 text-xs rounded-xl flex-1"
                />
                <Button
                  type="button"
                  className="h-9 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white"
                  disabled={!newNote}
                  onClick={() => noteMutation.mutate(newNote)}
                >
                  Save Note
                </Button>
              </div>
            </TabsContent>

            {/* TAB 7: SEND PUSH NOTIFICATION */}
            <TabsContent value="notifications" className="pt-4 space-y-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-black uppercase text-zinc-700">SEND PUSH NOTIFICATION TO CUSTOMER</h4>
                <Input
                  placeholder="Notification Title (e.g. Special Discount for You!)"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
                <textarea
                  placeholder="Message Body..."
                  value={notifBody}
                  onChange={(e) => setNotifBody(e.target.value)}
                  className="w-full h-20 rounded-xl border border-zinc-200 p-3 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <Button
                  type="button"
                  className="w-full h-9 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5"
                  disabled={!notifTitle || !notifBody}
                  onClick={() => notifMutation.mutate({ title: notifTitle, body: notifBody })}
                >
                  <Send className="size-3.5" />
                  <span>Dispatch Push Notification</span>
                </Button>
              </div>
            </TabsContent>

            {/* TAB 8: SECURITY & GOVERNANCE */}
            <TabsContent value="security" className="pt-4 space-y-4">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-black uppercase text-zinc-700">ACCOUNT GOVERNANCE ACTIONS</h4>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-9 rounded-xl text-xs font-bold border-amber-300 text-amber-800 hover:bg-amber-50"
                    onClick={() => logoutMutation.mutate()}
                  >
                    Logout All Devices
                  </Button>
                  <Button
                    type="button"
                    variant={customer?.status === "Active" ? "destructive" : "default"}
                    className={`flex-1 h-9 rounded-xl text-xs font-bold ${customer?.status === "Active" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
                    onClick={() => customer && onToggleBlock(customer.id, customer.status === "Active")}
                  >
                    {customer?.status === "Active" ? "Block Account" : "Unblock Account"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

