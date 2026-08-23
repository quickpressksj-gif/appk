import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  FileText,
  Filter,
  Search,
  Undo2,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  User,
  Building2,
  Calendar,
  MapPin,
  ChevronRight,
  Phone,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/ui/sheet";
import { Separator } from "@/shared/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AdminShell } from "../components/AdminShell";
import { DataTable, DetailRow, SectionCard, StatusPill, KpiCard } from "../components/AdminUI";
import {
  assignRider,
  changeOrderStatus,
  fetchOrder,
  fetchOrders,
  type AdminOrder,
  type OrderStatus,
} from "../api/orders";
import { fetchRiders } from "../api/riders";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/orders")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Orders Management", "Search, filter and manage every QuickPress order."),
  component: OrdersPage,
});

const STATUS_TABS = [
  { id: "all", label: "All Orders" },
  { id: "Pending", label: "Pending Acceptance" },
  { id: "Picked up", label: "Picked Up" },
  { id: "In wash", label: "In Wash" },
  { id: "Out for delivery", label: "Out for Delivery" },
  { id: "Delivered", label: "Delivered" },
  { id: "Cancelled", label: "Cancelled" },
];

export function OrdersPage() {
  const queryClient = useQueryClient();
  const orders = useQuery({ queryKey: ["admin", "orders"], queryFn: fetchOrders });
  const riders = useQuery({ queryKey: ["admin", "riders"], queryFn: fetchRiders });

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [city, setCity] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<AdminOrder | null>(null);

  const allOrders = orders.data ?? [];

  const metrics = useMemo(() => {
    const total = allOrders.length;
    const active = allOrders.filter((o) => ["Pending", "Picked up", "In wash", "Out for delivery"].includes(o.status)).length;
    const delivered = allOrders.filter((o) => o.status === "Delivered").length;
    const cancelled = allOrders.filter((o) => o.status === "Cancelled").length;
    return { total, active, delivered, cancelled };
  }, [allOrders]);

  const cities = useMemo(
    () => Array.from(new Set(allOrders.map((o) => o.city).filter(Boolean))),
    [allOrders],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allOrders.filter((order) => {
      const matchesQuery =
        !q ||
        [order.id, order.customer, order.phone, order.partner, order.rider, order.service]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesStatus = activeTab === "all" || order.status === activeTab;
      const matchesCity = city === "all" || order.city === city;
      const matchesFrom = !from || order.placedAt >= from;
      const matchesTo = !to || order.placedAt <= to;
      return matchesQuery && matchesStatus && matchesCity && matchesFrom && matchesTo;
    });
  }, [allOrders, query, activeTab, city, from, to]);

  const handleExportCSV = () => {
    if (rows.length === 0) {
      toast.error("No orders to export.");
      return;
    }
    const headers = ["Order ID", "Customer", "Partner", "Rider", "Service", "City", "Status", "Payment", "Placed At", "Total"];
    const csvRows = [headers.join(",")];
    for (const r of rows) {
      csvRows.push(
        [
          `"${r.id}"`,
          `"${r.customer}"`,
          `"${r.partner}"`,
          `"${r.rider}"`,
          `"${r.service}"`,
          `"${r.city}"`,
          `"${r.status}"`,
          `"${r.payment}"`,
          `"${r.placedAt}"`,
          `"${r.total}"`,
        ].join(","),
      );
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QuickPress_Orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Orders CSV exported successfully!");
  };

  return (
    <AdminShell
      title="Orders Management"
      subtitle="Central tracking, dispatch, and status governance across all network orders."
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
              id: "tot-orders",
              label: "Total Orders",
              value: metrics.total.toLocaleString("en-IN"),
              hint: "Lifetime platform bookings",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "active-orders",
              label: "Active In-Flight",
              value: metrics.active.toLocaleString("en-IN"),
              hint: "Currently being serviced",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "del-orders",
              label: "Completed Deliveries",
              value: metrics.delivered.toLocaleString("en-IN"),
              hint: `${metrics.total ? Math.round((metrics.delivered / metrics.total) * 100) : 0}% fulfillment rate`,
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "can-orders",
              label: "Cancelled Orders",
              value: metrics.cancelled.toLocaleString("en-IN"),
              hint: "Customer or system cancellations",
              positive: metrics.cancelled === 0,
            }}
          />
        </div>

        {/* =========================================================================
            2. STATUS TABS & FILTERS
        ========================================================================= */}
        <SectionCard>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap h-auto p-1 bg-zinc-100/80 rounded-xl gap-1">
              {STATUS_TABS.map((tab) => {
                const countNum =
                  tab.id === "all"
                    ? allOrders.length
                    : allOrders.filter((o) => o.status === tab.id).length;

                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-xs"
                  >
                    <span>{tab.label}</span>
                    <span className="rounded-full bg-zinc-200 px-1.5 py-0.2 text-[10px] font-black text-zinc-700">
                      {countNum}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by order ID, customer name, phone, partner..."
                className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="h-10 rounded-xl bg-zinc-50 border-zinc-200 text-xs">
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

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                aria-label="From date"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 text-xs text-zinc-700 focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
              <span className="text-zinc-400 text-xs">to</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                aria-label="To date"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 text-xs text-zinc-700 focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>
        </SectionCard>

        {/* =========================================================================
            3. ORDERS DATA TABLE
        ========================================================================= */}
        <SectionCard
          title="All Platform Orders"
          description={`Showing ${rows.length} of ${allOrders.length} records. Click any row to inspect or dispatch.`}
        >
          <DataTable
            loading={orders.isLoading}
            rows={rows}
            onRowClick={setSelected}
            emptyMessage="No orders match the selected filters."
            columns={[
              {
                key: "id",
                label: "Order ID",
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-100 font-mono text-[11px] font-black text-zinc-800 border border-zinc-200">
                      #
                    </div>
                    <div>
                      <p className="font-mono font-black text-xs text-zinc-900">{r.id}</p>
                      <p className="text-[10px] text-zinc-400 font-medium">{r.placedAt}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "customer",
                label: "Customer",
                render: (r) => (
                  <div>
                    <p className="font-bold text-zinc-900 text-xs">{r.customer}</p>
                    <p className="text-[10px] text-zinc-500 font-medium">{r.city}</p>
                  </div>
                ),
              },
              {
                key: "partner",
                label: "Partner Store",
                render: (r) => (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-zinc-400" />
                    <span className="text-zinc-800 font-semibold text-xs">{r.partner}</span>
                  </div>
                ),
              },
              {
                key: "rider",
                label: "Assigned Rider",
                render: (r) => (
                  <div className="flex items-center gap-1.5">
                    <Truck className="size-3.5 text-zinc-400" />
                    <span className={`text-xs font-semibold ${r.rider === "Unassigned" ? "text-amber-600 font-black" : "text-zinc-800"}`}>
                      {r.rider}
                    </span>
                  </div>
                ),
              },
              {
                key: "service",
                label: "Service",
                render: (r) => (
                  <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                    {r.service}
                  </span>
                ),
              },
              {
                key: "status",
                label: "Order Status",
                render: (r) => <StatusPill value={r.status} />,
              },
              {
                key: "payment",
                label: "Payment",
                render: (r) => (
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase ${
                      r.payment === "Paid"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : r.payment === "COD"
                        ? "bg-amber-50 text-amber-900 border-amber-200"
                        : "bg-rose-50 text-rose-800 border-rose-200"
                    }`}
                  >
                    {r.payment}
                  </span>
                ),
              },
              {
                key: "total",
                label: "Total Amount",
                className: "text-right",
                render: (r) => <span className="font-black text-emerald-700 text-xs">{r.total}</span>,
              },
            ]}
          />
        </SectionCard>
      </div>

      {/* =========================================================================
          4. ORDER DETAIL & DISPATCH DRAWER
      ========================================================================= */}
      <OrderDetailSheet
        order={selected}
        availableRiders={riders.data ?? []}
        onClose={() => setSelected(null)}
      />
    </AdminShell>
  );
}

function OrderDetailSheet({
  order,
  availableRiders,
  onClose,
}: {
  order: AdminOrder | null;
  availableRiders: any[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const detail = useQuery({
    queryKey: ["admin", "orders", order?.id],
    queryFn: () => fetchOrder(order!.id),
    enabled: Boolean(order),
  });

  const data = detail.data;

  const assignMutation = useMutation({
    mutationFn: ({ orderId, riderId }: { orderId: string; riderId: string }) =>
      assignRider(orderId, riderId),
    onSuccess: () => {
      toast.success("Rider assigned to order successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: () => {
      toast.error("Failed to assign rider to order.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ orderId }: { orderId: string }) =>
      changeOrderStatus(orderId, "Cancelled"),
    onSuccess: () => {
      toast.success("Order cancelled by administrator.");
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: () => {
      toast.error("Failed to cancel order.");
    },
  });

  return (
    <Sheet open={Boolean(order)} onOpenChange={(open) => (open ? null : onClose())}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl bg-white text-zinc-900 border-zinc-200">
        <SheetHeader className="border-b border-zinc-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg font-black text-zinc-900">
                Order #{order?.id}
              </SheetTitle>
              <SheetDescription className="text-xs text-zinc-500 font-medium mt-0.5">
                {order?.service} · {order?.city}
              </SheetDescription>
            </div>
            {order && <StatusPill value={order.status} />}
          </div>
        </SheetHeader>

        <div className="space-y-6 px-4 py-6">
          {/* Order Summary Spec */}
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-2">
              CUSTOMER & DELIVERY DETAILS
            </h4>
            <DetailRow label="Customer Name" value={order?.customer ?? "—"} />
            <DetailRow
              label="Contact Phone"
              value={
                <span className="flex items-center gap-1 font-mono text-zinc-900">
                  <Phone className="size-3 text-emerald-600" />
                  {order?.phone || "—"}
                </span>
              }
            />
            <DetailRow label="Pickup / Delivery Slot" value={data?.slot ?? "—"} />
            <DetailRow label="Delivery Address" value={data?.address ?? "—"} />
            <DetailRow label="Partner Store" value={order?.partner ?? "—"} />
            <DetailRow label="Assigned Rider" value={order?.rider ?? "Unassigned"} />
            <DetailRow label="Grand Total" value={<span className="font-black text-emerald-700 text-sm">{order?.total}</span>} />
          </div>

          {/* Items Breakdown */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-2.5">
              ORDER ITEMS ({data?.items?.length ?? 0})
            </h4>
            <div className="rounded-2xl border border-zinc-200 overflow-hidden">
              <ul className="divide-y divide-zinc-100">
                {(data?.items ?? []).map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between p-3 text-xs">
                    <span className="font-bold text-zinc-800">
                      {item.name} <span className="text-zinc-400 font-normal">× {item.qty}</span>
                    </span>
                    <span className="font-black text-zinc-900">{item.price}</span>
                  </li>
                ))}
                {(!data?.items || data.items.length === 0) && (
                  <li className="p-4 text-center text-xs text-zinc-400">Standard Laundry Bag</li>
                )}
              </ul>
            </div>
          </div>

          {/* Realtime Milestone Timeline */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-3">
              LIFECYCLE MILESTONE TIMELINE
            </h4>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4">
              <ol className="relative border-l border-zinc-200 ml-3 space-y-4">
                {(data?.timeline ?? []).map((step, idx) => (
                  <li key={idx} className="ml-4">
                    <div
                      className={`absolute -left-1.5 mt-1.5 size-3 rounded-full border-2 border-white ${
                        step.done ? "bg-emerald-600" : "bg-zinc-300"
                      }`}
                    />
                    <div className="flex items-center justify-between text-xs">
                      <p className={`font-bold ${step.done ? "text-zinc-900" : "text-zinc-400"}`}>
                        {step.label}
                      </p>
                      <span className="text-[10px] text-zinc-400 font-mono">{step.at}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <Separator />

          {/* Operational Actions */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500">
              DISPATCH & GOVERNANCE ACTIONS
            </h4>

            {/* Rider Assignment */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Assign / Reassign Rider</Label>
              <Select
                onValueChange={(riderId) => {
                  if (order) assignMutation.mutate({ orderId: order.id, riderId });
                }}
              >
                <SelectTrigger className="h-10 rounded-xl bg-zinc-50 border-zinc-200 text-xs">
                  <SelectValue placeholder={order?.rider === "Unassigned" ? "Choose a rider..." : order?.rider} />
                </SelectTrigger>
                <SelectContent>
                  {availableRiders.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} ({r.city} · {r.live})
                    </SelectItem>
                  ))}
                  {availableRiders.length === 0 && (
                    <SelectItem value="rdr-auto">Auto-assign Nearest Rider</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl text-xs font-bold"
                onClick={() => toast.success(`Order #${order?.id} invoice generated.`)}
              >
                <FileText className="mr-1.5 size-3.5" />
                <span>Invoice PDF</span>
              </Button>

              <Button
                variant="destructive"
                className="flex-1 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700"
                disabled={order?.status === "Cancelled" || order?.status === "Delivered"}
                onClick={() => {
                  if (order && confirm(`Are you sure you want to cancel Order #${order.id}?`)) {
                    cancelMutation.mutate({ orderId: order.id });
                  }
                }}
              >
                <XCircle className="mr-1.5 size-3.5" />
                <span>Cancel Order</span>
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
