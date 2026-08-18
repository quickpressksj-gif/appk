import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AdminShell } from "../components/AdminShell";
import { DataTable, DetailRow, SectionCard, StatusPill } from "../components/AdminUI";
import { fetchCustomer, fetchCustomers, setCustomerBlocked, type AdminCustomer } from "../api/customers";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/customers")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Customers", "Manage QuickPress customers, wallets, addresses and access."),
  component: CustomersPage,
});

function CustomersPage() {
  const queryClient = useQueryClient();
  const customers = useQuery({ queryKey: ["admin", "customers"], queryFn: fetchCustomers });
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<AdminCustomer | null>(null);

  const block = useMutation({
    mutationFn: ({ id, blocked }: { id: string; blocked: boolean }) => setCustomerBlocked(id, blocked),
    onSuccess: (_data, vars) => {
      toast.success(vars.blocked ? "Customer blocked" : "Customer unblocked");
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
    },
  });

  const cities = useMemo(
    () => Array.from(new Set((customers.data ?? []).map((c) => c.city))),
    [customers.data],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (customers.data ?? []).filter((c) => {
      const matchesQuery = !q || [c.id, c.name, c.phone, c.email].join(" ").toLowerCase().includes(q);
      return (
        matchesQuery && (city === "all" || c.city === city) && (status === "all" || c.status === status)
      );
    });
  }, [customers.data, query, city, status]);

  return (
    <AdminShell title="Customers" subtitle="Accounts, order history, wallets and access control.">
      <div className="space-y-4">
        <SectionCard>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, phone or email…"
              />
            </div>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger><SelectValue placeholder="City" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cities</SelectItem>
                {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </SectionCard>

        <SectionCard title="Customer list" description={`${rows.length} accounts`}>
          <DataTable
            loading={customers.isLoading}
            rows={rows}
            onRowClick={setSelected}
            columns={[
              { key: "name", label: "Customer", render: (r) => (
                <div>
                  <p className="font-medium text-foreground">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.id}</p>
                </div>
              ) },
              { key: "phone", label: "Phone" },
              { key: "city", label: "City" },
              { key: "orders", label: "Orders" },
              { key: "spend", label: "Total spend" },
              { key: "wallet", label: "Wallet" },
              { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
              {
                key: "actions",
                label: "",
                className: "text-right",
                render: (r) => (
                  <Button
                    size="sm"
                    variant={r.status === "Blocked" ? "outline" : "destructive"}
                    onClick={(event) => {
                      event.stopPropagation();
                      block.mutate({ id: r.id, blocked: r.status !== "Blocked" });
                    }}
                  >
                    {r.status === "Blocked" ? (
                      <><ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Unblock</>
                    ) : (
                      <><Ban className="mr-1.5 h-3.5 w-3.5" /> Block</>
                    )}
                  </Button>
                ),
              },
            ]}
          />
        </SectionCard>
      </div>

      <CustomerSheet customer={selected} onClose={() => setSelected(null)} />
    </AdminShell>
  );
}

function CustomerSheet({ customer, onClose }: { customer: AdminCustomer | null; onClose: () => void }) {
  const detail = useQuery({
    queryKey: ["admin", "customers", customer?.id],
    queryFn: () => fetchCustomer(customer!.id),
    enabled: Boolean(customer),
  });
  const data = detail.data;

  return (
    <Sheet open={Boolean(customer)} onOpenChange={(open) => (open ? null : onClose())}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{customer?.name ?? "Customer"}</SheetTitle>
          <SheetDescription>{customer?.id} · {customer?.city}</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-10">
          <Tabs defaultValue="profile">
            <TabsList className="w-full">
              <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
              <TabsTrigger value="orders" className="flex-1">Orders</TabsTrigger>
              <TabsTrigger value="wallet" className="flex-1">Wallet</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="pt-4">
              <DetailRow label="Phone" value={customer?.phone ?? "—"} />
              <DetailRow label="Email" value={customer?.email ?? "—"} />
              <DetailRow label="Joined" value={customer?.joined ?? "—"} />
              <DetailRow label="Lifetime spend" value={customer?.spend ?? "—"} />
              <DetailRow label="Status" value={customer ? <StatusPill value={customer.status} /> : "—"} />
              <p className="mb-2 mt-5 text-sm font-semibold text-foreground">Saved addresses</p>
              <ul className="space-y-2">
                {(data?.addresses ?? []).map((address) => (
                  <li key={address.label} className="rounded-lg border border-border bg-muted/40 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{address.label}</p>
                    <p className="text-sm text-foreground">{address.line}</p>
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="orders" className="pt-4">
              <DataTable
                loading={detail.isLoading}
                rows={data?.recentOrders ?? []}
                columns={[
                  { key: "id", label: "Order" },
                  { key: "service", label: "Service" },
                  { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
                  { key: "total", label: "Total", className: "text-right" },
                ]}
              />
            </TabsContent>

            <TabsContent value="wallet" className="pt-4">
              <DataTable
                loading={detail.isLoading}
                rows={data?.walletLedger ?? []}
                columns={[
                  { key: "label", label: "Entry" },
                  { key: "date", label: "Date" },
                  { key: "amount", label: "Amount", className: "text-right" },
                ]}
              />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
