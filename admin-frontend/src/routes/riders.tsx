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
import { AdminLiveMap, AdminRiderLiveLocation } from "../components/AdminLiveMap";
import { CountBadge, DataTable, DetailRow, SectionCard, StatusPill } from "../components/AdminUI";
import { fetchRider, fetchRiders, setRiderStatus, type AdminRider } from "../api/riders";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/riders")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Riders", "Track the QuickPress rider fleet, approvals and live status."),
  component: RidersPage,
});

function RidersPage() {
  const queryClient = useQueryClient();
  const riders = useQuery({ queryKey: ["admin", "riders"], queryFn: fetchRiders });
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [live, setLive] = useState("all");
  const [selected, setSelected] = useState<AdminRider | null>(null);

  const decide = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" | "suspend" | "activate" }) =>
      setRiderStatus(id, action),
    onSuccess: (_d, vars) => {
      toast.success(`Rider ${vars.action}d`);
      queryClient.invalidateQueries({ queryKey: ["admin", "riders"] });
    },
  });

  const cities = useMemo(() => Array.from(new Set((riders.data ?? []).map((r) => r.city))), [riders.data]);
  const online = (riders.data ?? []).filter((r) => r.live !== "Offline").length;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (riders.data ?? []).filter((r) => {
      const matchesQuery = !q || [r.id, r.name, r.phone, r.plate].join(" ").toLowerCase().includes(q);
      return matchesQuery && (city === "all" || r.city === city) && (live === "all" || r.live === live);
    });
  }, [riders.data, query, city, live]);

  return (
    <AdminShell
      title="Riders"
      subtitle="Fleet approvals, live availability and delivery load."
      actions={<CountBadge label="Online now" value={online} />}
    >
      <div className="space-y-4">
        <SectionCard title="Live fleet map" description="Rider, partner and active order positions refresh every 15 seconds">
          <AdminLiveMap />
        </SectionCard>

        <SectionCard>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search rider, phone or plate…"
              />
            </div>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger><SelectValue placeholder="City" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cities</SelectItem>
                {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={live} onValueChange={setLive}>
              <SelectTrigger><SelectValue placeholder="Availability" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All riders</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
                <SelectItem value="On delivery">On delivery</SelectItem>
                <SelectItem value="Offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </SectionCard>

        <SectionCard title="Rider fleet" description={`${rows.length} riders`}>
          <DataTable
            loading={riders.isLoading}
            rows={rows}
            onRowClick={setSelected}
            columns={[
              { key: "name", label: "Rider", render: (r) => (
                <div>
                  <p className="font-medium text-foreground">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.id} · {r.phone}</p>
                </div>
              ) },
              { key: "city", label: "City" },
              { key: "vehicle", label: "Vehicle", render: (r) => `${r.vehicle} · ${r.plate}` },
              { key: "trips", label: "Trips today" },
              { key: "rating", label: "Rating" },
              { key: "wallet", label: "Earnings" },
              { key: "live", label: "Availability", render: (r) => <StatusPill value={r.live} /> },
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

      <RiderSheet rider={selected} onClose={() => setSelected(null)} />
    </AdminShell>
  );
}

function RiderSheet({ rider, onClose }: { rider: AdminRider | null; onClose: () => void }) {
  const detail = useQuery({
    queryKey: ["admin", "riders", rider?.id],
    queryFn: () => fetchRider(rider!.id),
    enabled: Boolean(rider),
  });
  const data = detail.data;

  return (
    <Sheet open={Boolean(rider)} onOpenChange={(open) => (open ? null : onClose())}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{rider?.name ?? "Rider"}</SheetTitle>
          <SheetDescription>{rider?.id} · {rider?.city}</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-10">
          <Tabs defaultValue="profile">
            <TabsList className="w-full">
              <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
              <TabsTrigger value="documents" className="flex-1">Documents</TabsTrigger>
              <TabsTrigger value="orders" className="flex-1">Orders</TabsTrigger>
              <TabsTrigger value="earnings" className="flex-1">Earnings</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="pt-4">
              <DetailRow label="Phone" value={rider?.phone ?? "—"} />
              <DetailRow label="Vehicle" value={rider ? `${rider.vehicle} · ${rider.plate}` : "—"} />
              <DetailRow label="Rating" value={rider?.rating ?? "—"} />
              <DetailRow label="Availability" value={rider ? <StatusPill value={rider.live} /> : "—"} />
              <DetailRow label="Status" value={rider ? <StatusPill value={rider.status} /> : "—"} />
              {rider ? <AdminRiderLiveLocation riderId={rider.id} /> : null}
            </TabsContent>

            <TabsContent value="documents" className="pt-4">
              <ul className="space-y-2">
                {(data?.documents ?? []).map((doc) => (
                  <li key={doc.name} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <span className="text-sm text-foreground">{doc.name}</span>
                    <StatusPill value={doc.status} />
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="orders" className="pt-4">
              <DataTable
                loading={detail.isLoading}
                rows={data?.assignedOrders ?? []}
                columns={[
                  { key: "id", label: "Order" },
                  { key: "customer", label: "Customer" },
                  { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
                  { key: "eta", label: "ETA", className: "text-right" },
                ]}
              />
            </TabsContent>

            <TabsContent value="earnings" className="pt-4">
              <DataTable
                loading={detail.isLoading}
                rows={data?.earnings ?? []}
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
