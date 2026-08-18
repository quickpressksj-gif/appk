import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, PauseCircle, PlayCircle, Search, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AdminShell } from "../components/AdminShell";
import { DataTable, DetailRow, SectionCard, StatusPill } from "../components/AdminUI";
import { fetchPartner, fetchPartners, setPartnerStatus, type AdminPartner } from "../api/partners";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/partners")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Partners", "Approve, monitor and manage QuickPress laundry partners."),
  component: PartnersPage,
});

function PartnersPage() {
  const queryClient = useQueryClient();
  const partners = useQuery({ queryKey: ["admin", "partners"], queryFn: fetchPartners });
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [tab, setTab] = useState("all");
  const [selected, setSelected] = useState<AdminPartner | null>(null);

  const decide = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" | "suspend" | "activate" }) =>
      setPartnerStatus(id, action),
    onSuccess: (_d, vars) => {
      toast.success(`Partner ${vars.action}d`);
      queryClient.invalidateQueries({ queryKey: ["admin", "partners"] });
    },
  });

  const cities = useMemo(() => Array.from(new Set((partners.data ?? []).map((p) => p.city))), [partners.data]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (partners.data ?? []).filter((p) => {
      const matchesQuery = !q || [p.id, p.store, p.owner, p.phone].join(" ").toLowerCase().includes(q);
      const matchesTab =
        tab === "all" ||
        (tab === "pending" && p.status === "Pending") ||
        (tab === "active" && p.status === "Active") ||
        (tab === "suspended" && p.status === "Suspended");
      return matchesQuery && matchesTab && (city === "all" || p.city === city);
    });
  }, [partners.data, query, city, tab]);

  return (
    <AdminShell title="Partners" subtitle="Store approvals, KYC, pricing and performance.">
      <div className="space-y-4">
        <SectionCard>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending approval</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="suspended">Suspended</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search store, owner or phone…"
              />
            </div>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger><SelectValue placeholder="City" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cities</SelectItem>
                {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </SectionCard>

        <SectionCard title="Partner stores" description={`${rows.length} stores`}>
          <DataTable
            loading={partners.isLoading}
            rows={rows}
            onRowClick={setSelected}
            columns={[
              { key: "store", label: "Store", render: (r) => (
                <div>
                  <p className="font-medium text-foreground">{r.store}</p>
                  <p className="text-xs text-muted-foreground">{r.owner} · {r.id}</p>
                </div>
              ) },
              { key: "city", label: "City" },
              { key: "services", label: "Services" },
              { key: "rating", label: "Rating" },
              { key: "orders", label: "Orders" },
              { key: "wallet", label: "Wallet" },
              { key: "kyc", label: "KYC", render: (r) => <StatusPill value={r.kyc} /> },
              { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
              {
                key: "actions",
                label: "",
                className: "text-right",
                render: (r) =>
                  r.status === "Pending" ? (
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); decide.mutate({ id: r.id, action: "approve" }); }}>
                        <Check className="mr-1 h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); decide.mutate({ id: r.id, action: "reject" }); }}>
                        <X className="mr-1 h-3.5 w-3.5" /> Reject
                      </Button>
                    </div>
                  ) : r.status === "Suspended" ? (
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); decide.mutate({ id: r.id, action: "activate" }); }}>
                      <PlayCircle className="mr-1 h-3.5 w-3.5" /> Activate
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); decide.mutate({ id: r.id, action: "suspend" }); }}>
                      <PauseCircle className="mr-1 h-3.5 w-3.5" /> Suspend
                    </Button>
                  ),
              },
            ]}
          />
        </SectionCard>
      </div>

      <PartnerSheet partner={selected} onClose={() => setSelected(null)} />
    </AdminShell>
  );
}

function PartnerSheet({ partner, onClose }: { partner: AdminPartner | null; onClose: () => void }) {
  const detail = useQuery({
    queryKey: ["admin", "partners", partner?.id],
    queryFn: () => fetchPartner(partner!.id),
    enabled: Boolean(partner),
  });
  const data = detail.data;

  return (
    <Sheet open={Boolean(partner)} onOpenChange={(open) => (open ? null : onClose())}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{partner?.store ?? "Partner"}</SheetTitle>
          <SheetDescription>{partner?.id} · {partner?.city}</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-10">
          <Tabs defaultValue="profile">
            <TabsList className="w-full">
              <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
              <TabsTrigger value="kyc" className="flex-1">KYC</TabsTrigger>
              <TabsTrigger value="pricing" className="flex-1">Pricing</TabsTrigger>
              <TabsTrigger value="reviews" className="flex-1">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="pt-4">
              <DetailRow label="Owner" value={partner?.owner ?? "—"} />
              <DetailRow label="Phone" value={partner?.phone ?? "—"} />
              <DetailRow label="GSTIN" value={data?.gstin ?? "—"} />
              <DetailRow label="Address" value={data?.address ?? "—"} />
              <DetailRow label="Services" value={partner?.services ?? "—"} />
              <DetailRow label="Wallet balance" value={partner?.wallet ?? "—"} />
              <DetailRow label="Status" value={partner ? <StatusPill value={partner.status} /> : "—"} />
            </TabsContent>

            <TabsContent value="kyc" className="pt-4">
              <ul className="space-y-2">
                {(data?.documents ?? []).map((doc) => (
                  <li key={doc.name} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <span className="text-sm text-foreground">{doc.name}</span>
                    <StatusPill value={doc.status} />
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="pricing" className="pt-4">
              <DataTable
                loading={detail.isLoading}
                rows={(data?.pricing ?? []).map((p) => ({ ...p, id: `${p.item}-${p.service}` }))}
                columns={[
                  { key: "item", label: "Item" },
                  { key: "service", label: "Service" },
                  { key: "price", label: "Price", className: "text-right" },
                ]}
              />
            </TabsContent>

            <TabsContent value="reviews" className="pt-4">
              <ul className="space-y-3">
                {(data?.reviews ?? []).map((review) => (
                  <li key={review.customer} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{review.customer}</p>
                      <span className="text-sm text-muted-foreground">★ {review.rating}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{review.note}</p>
                  </li>
                ))}
              </ul>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
