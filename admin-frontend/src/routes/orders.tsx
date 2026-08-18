import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Filter, Search, Undo2 } from "lucide-react";
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
import { AdminShell } from "../components/AdminShell";
import { DataTable, DetailRow, SectionCard, StatusPill } from "../components/AdminUI";
import {
  assignRider,
  changeOrderStatus,
  fetchOrder,
  fetchOrders,
  type AdminOrder,
  type OrderStatus,
} from "../api/orders";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/orders")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Orders", "Search, filter and manage every QuickPress order."),
  component: OrdersPage,
});

const STATUSES: OrderStatus[] = [
  "Pending",
  "Picked up",
  "In wash",
  "Out for delivery",
  "Delivered",
  "Cancelled",
];

function OrdersPage() {
  const orders = useQuery({ queryKey: ["admin", "orders"], queryFn: fetchOrders });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [city, setCity] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<AdminOrder | null>(null);

  const cities = useMemo(
    () => Array.from(new Set((orders.data ?? []).map((o) => o.city))),
    [orders.data],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (orders.data ?? []).filter((order) => {
      const matchesQuery =
        !q ||
        [order.id, order.customer, order.phone, order.partner, order.rider, order.service]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesStatus = status === "all" || order.status === status;
      const matchesCity = city === "all" || order.city === city;
      const matchesFrom = !from || order.placedAt >= from;
      const matchesTo = !to || order.placedAt <= to;
      return matchesQuery && matchesStatus && matchesCity && matchesFrom && matchesTo;
    });
  }, [orders.data, query, status, city, from, to]);

  return (
    <AdminShell
      title="Orders"
      subtitle="Every QuickPress order across cities, partners and riders."
      actions={
        <Button size="sm" variant="outline" onClick={() => toast.success("Order export queued")}>
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      }
    >
      <div className="space-y-4">
        <SectionCard>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_repeat(4,minmax(0,160px))]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search order, customer, phone, partner…"
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger>
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cities</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> {rows.length} of {orders.data?.length ?? 0} orders
          </p>
        </SectionCard>

        <SectionCard title="All orders" description="Select a row to open the full order record">
          <DataTable
            loading={orders.isLoading}
            rows={rows}
            onRowClick={setSelected}
            empty="No orders match these filters."
            columns={[
              { key: "id", label: "Order ID" },
              { key: "customer", label: "Customer" },
              { key: "service", label: "Service" },
              { key: "city", label: "City" },
              { key: "partner", label: "Partner" },
              { key: "rider", label: "Rider" },
              { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
              { key: "payment", label: "Payment", render: (r) => <StatusPill value={r.payment} /> },
              { key: "total", label: "Total", className: "text-right" },
            ]}
          />
        </SectionCard>
      </div>

      <OrderDetailSheet order={selected} onClose={() => setSelected(null)} />
    </AdminShell>
  );
}

function OrderDetailSheet({ order, onClose }: { order: AdminOrder | null; onClose: () => void }) {
  const detail = useQuery({
    queryKey: ["admin", "orders", order?.id],
    queryFn: () => fetchOrder(order!.id),
    enabled: Boolean(order),
  });

  const data = detail.data;

  return (
    <Sheet open={Boolean(order)} onOpenChange={(open) => (open ? null : onClose())}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{order?.id ?? "Order"}</SheetTitle>
          <SheetDescription>{order?.service} · {order?.city}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-10">
          <div>
            <DetailRow label="Customer" value={order?.customer ?? "—"} />
            <DetailRow label="Phone" value={order?.phone ?? "—"} />
            <DetailRow label="Status" value={order ? <StatusPill value={order.status} /> : "—"} />
            <DetailRow label="Payment" value={order ? <StatusPill value={order.payment} /> : "—"} />
            <DetailRow label="Placed on" value={order?.placedAt ?? "—"} />
            <DetailRow label="Slot" value={data?.slot ?? "—"} />
            <DetailRow label="Address" value={data?.address ?? "—"} />
            <DetailRow label="Total" value={order?.total ?? "—"} />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">Items</p>
            <ul className="space-y-1.5">
              {(data?.items ?? []).map((item) => (
                <li key={item.name} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.name} × {item.qty}
                  </span>
                  <span className="font-medium text-foreground">{item.price}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">Timeline</p>
            <ol className="space-y-2.5">
              {(data?.timeline ?? []).map((step) => (
                <li key={step.label} className="flex items-center gap-3 text-sm">
                  <span
                    className={
                      step.done
                        ? "h-2.5 w-2.5 rounded-full bg-secondary"
                        : "h-2.5 w-2.5 rounded-full border border-border bg-muted"
                    }
                  />
                  <span className={step.done ? "text-foreground" : "text-muted-foreground"}>{step.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{step.at}</span>
                </li>
              ))}
            </ol>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Assign rider</Label>
              <Select
                onValueChange={(value) => {
                  if (order)
                    assignRider(order.id, value)
                      .then(() => toast.success(`Rider assigned to ${order.id}`))
                      .catch(() => toast.error("Could not assign rider"));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={order?.rider ?? "Select rider"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RI-3001">Sameer Khan</SelectItem>
                  <SelectItem value="RI-3002">Priya Das</SelectItem>
                  <SelectItem value="RI-3004">Farhan Ali</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Change status</Label>
              <Select
                onValueChange={(value) => {
                  if (order)
                    changeOrderStatus(order.id, value as OrderStatus)
                      .then(() => toast.success(`Status updated to ${value}`))
                      .catch(() => toast.error("Could not update status"));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={order?.status ?? "Select status"} />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                disabled
                title="Invoice generation is not available yet"
              >
                <FileText className="mr-2 h-4 w-4" /> Invoice (unavailable)
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled
                title="Refunding from here is not available yet"
              >
                <Undo2 className="mr-2 h-4 w-4" /> Refund (unavailable)
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
