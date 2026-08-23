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
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AdminShell } from "../components/AdminShell";
import { DataTable, DetailRow, SectionCard, StatusPill, KpiCard } from "../components/AdminUI";
import { fetchCustomer, fetchCustomers, setCustomerBlocked, type AdminCustomer } from "../api/customers";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/customers")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Customers Management", "Manage QuickPress customer directory, wallets, and orders."),
  component: CustomersPage,
});

export function CustomersPage() {
  const queryClient = useQueryClient();
  const customers = useQuery({ queryKey: ["admin", "customers"], queryFn: fetchCustomers });
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [statusTab, setStatusTab] = useState("all");
  const [selected, setSelected] = useState<AdminCustomer | null>(null);

  const allCustomers = customers.data ?? [];

  const blockMutation = useMutation({
    mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) => setCustomerBlocked(id, blocked),
    onSuccess: (_data, vars) => {
      toast.success(vars.blocked ? "Customer blocked from placing orders." : "Customer account unblocked.");
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
    },
    onError: () => {
      toast.error("Failed to update customer status.");
    },
  });

  const metrics = useMemo(() => {
    const total = allCustomers.length;
    const active = allCustomers.filter((c) => c.status === "Active").length;
    const totalOrders = allCustomers.reduce((sum, c) => sum + (c.orders || 0), 0);
    const totalSpend = allCustomers.reduce((sum, c) => {
      const num = Number(String(c.spend || "0").replace(/[^0-9.-]+/g, "")) || 0;
      return sum + num;
    }, 0);
    return { total, active, totalOrders, totalSpend };
  }, [allCustomers]);

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
      return matchesQuery && matchesTab && matchesCity;
    });
  }, [allCustomers, query, city, statusTab]);

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
      title="Customers Directory"
      subtitle="Complete user registry, lifetime spend, order history, and account governance."
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
              id: "tot-cust",
              label: "Registered Customers",
              value: metrics.total.toLocaleString("en-IN"),
              hint: "Total platform user accounts",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "act-cust",
              label: "Active Accounts",
              value: metrics.active.toLocaleString("en-IN"),
              hint: `${metrics.total ? Math.round((metrics.active / metrics.total) * 100) : 0}% active rate`,
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "tot-orders",
              label: "Cumulative Orders",
              value: metrics.totalOrders.toLocaleString("en-IN"),
              hint: `${metrics.total ? (metrics.totalOrders / metrics.total).toFixed(1) : "0"} orders/user avg`,
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "tot-spend",
              label: "Customer GMV Spend",
              value: `₹${metrics.totalSpend.toLocaleString("en-IN")}`,
              hint: "Gross platform purchases",
              positive: true,
            }}
          />
        </div>

        {/* =========================================================================
            2. STATUS TABS & FILTERS
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

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="relative sm:col-span-2">
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
          </div>
        </SectionCard>

        {/* =========================================================================
            3. CUSTOMERS DATA TABLE
        ========================================================================= */}
        <SectionCard
          title="Customer Accounts"
          description="Click any row to open the complete customer profile, addresses, and order history."
        >
          <DataTable
            loading={customers.isLoading}
            rows={rows}
            onRowClick={setSelected}
            emptyMessage="No customers found matching these filters."
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
                key: "email",
                label: "Email Address",
                render: (r) => (
                  <span className="text-xs text-zinc-600 flex items-center gap-1">
                    <Mail className="size-3 text-zinc-400" />
                    {r.email || "—"}
                  </span>
                ),
              },
              {
                key: "city",
                label: "City",
                render: (r) => (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700">
                    <MapPin className="size-3 text-zinc-400" />
                    {r.city || "—"}
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
          4. CUSTOMER DETAIL & HISTORY DRAWER
      ========================================================================= */}
      <CustomerDetailSheet
        customer={selected}
        onClose={() => setSelected(null)}
        onToggleBlock={(id, blocked) => blockMutation.mutate({ id, blocked })}
      />
    </AdminShell>
  );
}

function CustomerDetailSheet({
  customer,
  onClose,
  onToggleBlock,
}: {
  customer: AdminCustomer | null;
  onClose: () => void;
  onToggleBlock: (id: string, blocked: boolean) => void;
}) {
  const detail = useQuery({
    queryKey: ["admin", "customers", customer?.id],
    queryFn: () => fetchCustomer(customer!.id),
    enabled: Boolean(customer),
  });

  const data = detail.data;

  return (
    <Sheet open={Boolean(customer)} onOpenChange={(open) => (open ? null : onClose())}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl bg-white text-zinc-900 border-zinc-200">
        <SheetHeader className="border-b border-zinc-100 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 font-black text-sm">
                {customer?.name.slice(0, 2).toUpperCase() || "CU"}
              </div>
              <div>
                <SheetTitle className="text-lg font-black text-zinc-900">{customer?.name}</SheetTitle>
                <SheetDescription className="text-xs text-zinc-500 font-medium">
                  ID: #{customer?.id} · {customer?.city}
                </SheetDescription>
              </div>
            </div>
            {customer && <StatusPill value={customer.status} />}
          </div>
        </SheetHeader>

        <div className="space-y-6 px-4 py-6">
          <Tabs defaultValue="profile">
            <TabsList className="w-full bg-zinc-100 p-1 rounded-xl">
              <TabsTrigger value="profile" className="flex-1 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
                Profile & Contact
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex-1 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
                Order History ({data?.orders?.length ?? customer?.orders ?? 0})
              </TabsTrigger>
              <TabsTrigger value="addresses" className="flex-1 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
                Saved Addresses
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="pt-4 space-y-4">
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-2">
                  ACCOUNT SUMMARY
                </h4>
                <DetailRow label="Full Name" value={customer?.name ?? "—"} />
                <DetailRow label="Phone Number" value={customer?.phone ?? "—"} />
                <DetailRow label="Email Address" value={customer?.email ?? "—"} />
                <DetailRow label="City Region" value={customer?.city ?? "—"} />
                <DetailRow label="Lifetime Orders" value={<span className="font-bold text-zinc-900">{customer?.orders ?? 0}</span>} />
                <DetailRow label="Total Amount Spent" value={<span className="font-black text-emerald-700">{customer?.spend ?? "₹0"}</span>} />
                <DetailRow label="Account Standing" value={customer ? <StatusPill value={customer.status} /> : "—"} />
              </div>

              {/* Action Controls */}
              <div className="pt-2">
                <Button
                  variant={customer?.status === "Active" ? "destructive" : "default"}
                  className={`w-full rounded-xl text-xs font-bold ${customer?.status === "Active" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
                  onClick={() => {
                    if (customer) {
                      onToggleBlock(customer.id, customer.status === "Active");
                    }
                  }}
                >
                  {customer?.status === "Active" ? (
                    <>
                      <Lock className="mr-2 size-4" />
                      <span>Block Customer From Platform</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="mr-2 size-4" />
                      <span>Reactivate Customer Account</span>
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Orders History Tab */}
            <TabsContent value="orders" className="pt-4 space-y-3">
              <div className="rounded-2xl border border-zinc-200 overflow-hidden">
                <ul className="divide-y divide-zinc-100">
                  {(data?.orders ?? []).map((order) => (
                    <li key={order.id} className="p-3 text-xs hover:bg-zinc-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-zinc-900">#{order.id}</span>
                        <StatusPill value={order.status} />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-zinc-500 font-medium">
                        <span>{order.service} · {order.placedAt}</span>
                        <span className="font-black text-emerald-700">{order.total}</span>
                      </div>
                    </li>
                  ))}
                  {(!data?.orders || data.orders.length === 0) && (
                    <li className="p-6 text-center text-xs text-zinc-400">No past orders found for this user.</li>
                  )}
                </ul>
              </div>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses" className="pt-4 space-y-3">
              <div className="rounded-2xl border border-zinc-200 overflow-hidden">
                <ul className="divide-y divide-zinc-100">
                  {(data?.addresses ?? []).map((addr, idx) => (
                    <li key={idx} className="p-3.5 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                        <MapPin className="size-3.5 text-emerald-600" />
                        <span>{addr.label || "Saved Address"}</span>
                      </div>
                      <p className="mt-1 text-zinc-600 font-medium pl-5">{addr.line}, {addr.city}</p>
                    </li>
                  ))}
                  {(!data?.addresses || data.addresses.length === 0) && (
                    <li className="p-6 text-center text-xs text-zinc-400">No saved addresses on file.</li>
                  )}
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
