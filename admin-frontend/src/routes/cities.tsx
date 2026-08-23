import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MapPinPlus,
  MapPin,
  Building2,
  Truck,
  Users,
  ShoppingBag,
  TrendingUp,
  Download,
  Plus,
  Search,
  Filter,
  PlayCircle,
  PauseCircle,
  Clock,
  Layers,
  Sparkles,
  ChevronRight,
  Store,
  Compass,
  Globe2,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AdminShell } from "../components/AdminShell";
import { DataTable, DetailRow, SectionCard, StatusPill, KpiCard } from "../components/AdminUI";
import {
  deleteArea,
  fetchAreas,
  fetchCities,
  fetchStates,
  fetchZones,
  saveArea,
  saveCity,
  toggleCityStatus,
  type AdminArea,
  type AdminCity,
  type AdminState,
} from "../api/cities";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/cities")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("India Cities & Coverage Areas", "Nationwide QuickPress coverage, city analytics, and delivery zones."),
  component: CitiesPage,
});

export function CitiesPage() {
  const queryClient = useQueryClient();
  const cities = useQuery({ queryKey: ["admin", "cities"], queryFn: fetchCities });
  const states = useQuery({ queryKey: ["admin", "states"], queryFn: fetchStates });
  const areas = useQuery({ queryKey: ["admin", "areas"], queryFn: () => fetchAreas() });
  const zones = useQuery({ queryKey: ["admin", "zones"], queryFn: fetchZones });

  const [activeTab, setActiveTab] = useState("cities");
  const [stateFilter, setStateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<AdminCity | null>(null);

  const allCities = cities.data ?? [];
  const allStates = states.data ?? [];
  const allAreas = areas.data ?? [];

  const cityStatusMutation = useMutation({
    mutationFn: ({ cityId, status }: { cityId: string; status: "Live" | "Pilot" | "Paused" | "Coming Soon" }) =>
      toggleCityStatus(cityId, status),
    onSuccess: () => {
      toast.success("City operational status updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin", "cities"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "states"] });
    },
    onError: () => {
      toast.error("Failed to update city status.");
    },
  });

  const deleteAreaMutation = useMutation({
    mutationFn: (id: string) => deleteArea(id),
    onSuccess: () => {
      toast.success("Area removed from coverage zone.");
      queryClient.invalidateQueries({ queryKey: ["admin", "areas"] });
    },
    onError: () => {
      toast.error("Failed to delete area.");
    },
  });

  const metrics = useMemo(() => {
    const totalCities = allCities.length;
    const liveCities = allCities.filter((c) => c.status === "Live").length;
    const totalLocalities = allAreas.length;
    const totalSales = allCities.reduce((sum, c) => sum + (c.sales || 0), 0);
    return { totalCities, liveCities, totalLocalities, totalSales };
  }, [allCities, allAreas]);

  const uniqueStates = useMemo(
    () => Array.from(new Set(allCities.map((c) => c.state).filter(Boolean))),
    [allCities],
  );

  const filteredCities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allCities.filter((c) => {
      const matchQuery = !q || [c.city, c.state, c.country].join(" ").toLowerCase().includes(q);
      const matchState = stateFilter === "all" || c.state === stateFilter;
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchQuery && matchState && matchStatus;
    });
  }, [allCities, searchQuery, stateFilter, statusFilter]);

  const topCitiesBySales = useMemo(() => {
    return [...allCities].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 5);
  }, [allCities]);

  const topCitiesByOrders = useMemo(() => {
    return [...allCities].sort((a, b) => (b.orders || 0) - (a.orders || 0)).slice(0, 5);
  }, [allCities]);

  const handleExportCSV = () => {
    if (filteredCities.length === 0) {
      toast.error("No cities to export.");
      return;
    }
    const headers = ["City", "State", "Status", "Partners", "Riders", "Customers", "Orders", "Gross Sales", "Platform Earnings"];
    const csvRows = [headers.join(",")];
    for (const c of filteredCities) {
      csvRows.push(
        [
          `"${c.city}"`,
          `"${c.state}"`,
          `"${c.status}"`,
          `"${c.partners}"`,
          `"${c.riders}"`,
          `"${c.customers}"`,
          `"${c.orders}"`,
          `"${c.sales}"`,
          `"${c.platformEarnings}"`,
        ].join(","),
      );
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QuickPress_Cities_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Cities performance CSV exported successfully!");
  };

  return (
    <AdminShell
      title="India Cities & Coverage Operations"
      subtitle="Nationwide hub management, serviceable localities, and city-wise performance metrics."
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-50 active:scale-95 shadow-xs"
          >
            <Download className="size-3.5" />
            <span>Export CSV</span>
          </button>
          <AddAreaDialog cities={allCities} />
          <AddCityDialog />
        </div>
      }
    >
      <div className="space-y-6">
        {/* =========================================================================
            1. TOP METRIC CARDS
        ========================================================================= */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            kpi={{
              id: "tot-cities",
              label: "Indian Expansion Cities",
              value: metrics.totalCities.toLocaleString("en-IN"),
              hint: `${metrics.liveCities} operating live markets`,
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "live-ops",
              label: "Live Market Operations",
              value: metrics.liveCities.toLocaleString("en-IN"),
              hint: "Accepting partner & customer orders",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "tot-localities",
              label: "Serviceable Localities",
              value: metrics.totalLocalities.toLocaleString("en-IN"),
              hint: "Mapped delivery zones & pincodes",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "nat-sales",
              label: "Nationwide Gross GMV",
              value: `₹${metrics.totalSales.toLocaleString("en-IN")}`,
              hint: "Aggregated platform sales",
              positive: true,
            }}
          />
        </div>

        {/* =========================================================================
            2. MAIN TABS
        ========================================================================= */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-zinc-100 p-1 rounded-xl">
            <TabsTrigger value="cities" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
              Cities Directory ({allCities.length})
            </TabsTrigger>
            <TabsTrigger value="india" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
              India Operations & States ({allStates.length})
            </TabsTrigger>
            <TabsTrigger value="areas" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
              Areas & Pincodes ({allAreas.length})
            </TabsTrigger>
            <TabsTrigger value="zones" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
              Delivery Hub Zones
            </TabsTrigger>
          </TabsList>

          {/* =========================================================================
              TAB 1: CITIES DIRECTORY & LIVE METRICS
          ========================================================================= */}
          <TabsContent value="cities" className="space-y-4">
            <SectionCard>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative lg:col-span-2">
                  <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search city, state, or region..."
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="h-10 rounded-xl bg-zinc-50 border-zinc-200 text-xs">
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Indian States</SelectItem>
                    {uniqueStates.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 rounded-xl bg-zinc-50 border-zinc-200 text-xs">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Live">Live</SelectItem>
                    <SelectItem value="Pilot">Pilot</SelectItem>
                    <SelectItem value="Coming Soon">Coming Soon</SelectItem>
                    <SelectItem value="Paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </SectionCard>

            <SectionCard
              title="City Performance & Expansion Hubs"
              description="Click any city to open full operational deep-dive, fleet status, partner rankings, and launch controls."
            >
              <DataTable
                loading={cities.isLoading}
                rows={filteredCities}
                onRowClick={setSelectedCity}
                emptyMessage="No cities found matching these filters."
                columns={[
                  {
                    key: "city",
                    label: "City / State",
                    render: (r) => (
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs">
                          <MapPin className="size-4" />
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 text-xs">{r.city}</p>
                          <p className="text-[10px] text-zinc-500 font-medium">{r.state}, {r.country}</p>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "partners",
                    label: "Partner Stores",
                    render: (r) => (
                      <div className="text-xs">
                        <span className="font-bold text-zinc-900">{r.activePartners}</span>
                        <span className="text-zinc-400 font-normal"> / {r.partners} active</span>
                      </div>
                    ),
                  },
                  {
                    key: "riders",
                    label: "Rider Fleet",
                    render: (r) => (
                      <div className="text-xs">
                        <span className="font-bold text-emerald-700">{r.onlineRiders} online</span>
                        <span className="text-zinc-400 font-normal"> ({r.riders} total)</span>
                      </div>
                    ),
                  },
                  {
                    key: "customers",
                    label: "Customers",
                    render: (r) => <span className="text-xs font-bold text-zinc-800">{r.customers}</span>,
                  },
                  {
                    key: "orders",
                    label: "Orders (Today / Total)",
                    render: (r) => (
                      <div className="text-xs">
                        <span className="font-bold text-zinc-900">{r.todayOrders} today</span>
                        <span className="text-zinc-400 font-normal"> ({r.orders} total)</span>
                      </div>
                    ),
                  },
                  {
                    key: "sales",
                    label: "Gross GMV",
                    render: (r) => <span className="font-black text-zinc-900 text-xs">₹{r.sales.toLocaleString("en-IN")}</span>,
                  },
                  {
                    key: "platformEarnings",
                    label: "Platform Comm (18%)",
                    render: (r) => (
                      <span className="font-black text-emerald-700 text-xs">
                        ₹{r.platformEarnings.toLocaleString("en-IN")}
                      </span>
                    ),
                  },
                  {
                    key: "status",
                    label: "Operational State",
                    render: (r) => <StatusPill value={r.status} />,
                  },
                  {
                    key: "actions",
                    label: "",
                    className: "text-right",
                    render: (r) => (
                      <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {r.status === "Live" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 text-xs font-bold"
                            onClick={() => cityStatusMutation.mutate({ cityId: r.id, status: "Paused" })}
                          >
                            <PauseCircle className="mr-1 size-3.5" /> Pause
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 text-xs font-bold"
                            onClick={() => cityStatusMutation.mutate({ cityId: r.id, status: "Live" })}
                          >
                            <PlayCircle className="mr-1 size-3.5" /> Launch
                          </Button>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            </SectionCard>
          </TabsContent>

          {/* =========================================================================
              TAB 2: INDIA OPERATIONS & STATE AGGREGATION
          ========================================================================= */}
          <TabsContent value="india" className="space-y-6">
            {/* State Grid */}
            <SectionCard title="State-Level Performance" description="Aggregated metrics by Indian State and Union Territory">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {allStates.map((st) => (
                  <div key={st.state} className="rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {st.liveCities} Live Cities
                      </span>
                      <Globe2 className="size-4 text-zinc-400" />
                    </div>
                    <h4 className="mt-2 text-base font-black text-zinc-900">{st.state}</h4>
                    <div className="mt-3 space-y-1.5 text-xs text-zinc-600 font-medium">
                      <div className="flex justify-between">
                        <span>Partners & Fleet:</span>
                        <span className="font-bold text-zinc-800">{st.partners} stores · {st.riders} riders</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Orders:</span>
                        <span className="font-bold text-zinc-800">{st.orders}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-zinc-100">
                        <span>Gross GMV:</span>
                        <span className="font-black text-emerald-700">₹{st.sales.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Rankings Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard title="Top Cities by Gross Sales (GMV)" description="Highest volume transaction markets across India">
                <ul className="divide-y divide-zinc-100">
                  {topCitiesBySales.map((c, idx) => (
                    <li key={c.id} className="flex items-center justify-between py-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="flex size-6 items-center justify-center rounded-full bg-zinc-100 font-mono text-[11px] font-black text-zinc-700">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-zinc-900">{c.city}</p>
                          <p className="text-[10px] text-zinc-400 font-medium">{c.state}</p>
                        </div>
                      </div>
                      <span className="font-black text-emerald-700">₹{c.sales.toLocaleString("en-IN")}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>

              <SectionCard title="Top Cities by Order Bookings" description="Customer demand and fulfillment frequency">
                <ul className="divide-y divide-zinc-100">
                  {topCitiesByOrders.map((c, idx) => (
                    <li key={c.id} className="flex items-center justify-between py-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="flex size-6 items-center justify-center rounded-full bg-zinc-100 font-mono text-[11px] font-black text-zinc-700">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-zinc-900">{c.city}</p>
                          <p className="text-[10px] text-zinc-400 font-medium">{c.state}</p>
                        </div>
                      </div>
                      <span className="font-bold text-zinc-900">{c.orders} bookings</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            </div>
          </TabsContent>

          {/* =========================================================================
              TAB 3: AREAS & PINCODES
          ========================================================================= */}
          <TabsContent value="areas" className="space-y-4">
            <SectionCard title="Mapped Localities & Pincodes" description="Micro-service zones mapped to fulfillment hubs">
              <DataTable
                loading={areas.isLoading}
                rows={allAreas}
                emptyMessage="No areas registered yet."
                columns={[
                  {
                    key: "area",
                    label: "Locality / Area",
                    render: (r) => (
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3.5 text-emerald-600" />
                        <span className="font-bold text-zinc-900 text-xs">{r.area}</span>
                      </div>
                    ),
                  },
                  { key: "city", label: "City", render: (r) => <span className="text-xs font-semibold text-zinc-800">{r.city}</span> },
                  { key: "state", label: "State", render: (r) => <span className="text-xs text-zinc-600">{r.state}</span> },
                  { key: "pincode", label: "Pincode", render: (r) => <span className="font-mono text-xs font-bold text-zinc-700">{r.pincode}</span> },
                  { key: "zone", label: "Fulfillment Hub Zone", render: (r) => <span className="text-xs font-medium text-zinc-700">{r.zone}</span> },
                  { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
                  {
                    key: "actions",
                    label: "",
                    className: "text-right",
                    render: (r) => (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-rose-500 hover:bg-rose-50"
                        onClick={() => {
                          if (confirm(`Remove area "${r.area}"?`)) deleteAreaMutation.mutate(r.id);
                        }}
                      >
                        <XCircle className="size-3.5" />
                      </Button>
                    ),
                  },
                ]}
              />
            </SectionCard>
          </TabsContent>

          {/* =========================================================================
              TAB 4: DELIVERY HUBS & ZONES
          ========================================================================= */}
          <TabsContent value="zones" className="space-y-4">
            <SectionCard title="Delivery Hubs & Slots" description="Pickup radius and scheduled delivery windows per city">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(zones.data ?? []).map((z) => (
                  <div key={z.id} className="rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-zinc-500">Radius: {z.radius}</span>
                      <Layers className="size-4 text-emerald-600" />
                    </div>
                    <h4 className="mt-2 text-sm font-black text-zinc-900">{z.zone}</h4>
                    <p className="mt-0.5 text-xs text-zinc-500 font-medium">{z.city} · {z.areas} Localities</p>
                    <div className="mt-3 pt-3 border-t border-zinc-100 text-xs text-zinc-600">
                      <p className="font-bold text-zinc-700">Dispatch Slots:</p>
                      <p className="mt-0.5 text-[11px] text-zinc-500">{z.slots}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>

      {/* =========================================================================
          3. CITY DETAILS INSPECTION DRAWER
      ========================================================================= */}
      <CityDetailSheet
        city={selectedCity}
        onClose={() => setSelectedCity(null)}
        onToggleStatus={(cityId, status) => cityStatusMutation.mutate({ cityId, status })}
      />
    </AdminShell>
  );
}

function CityDetailSheet({
  city,
  onClose,
  onToggleStatus,
}: {
  city: AdminCity | null;
  onClose: () => void;
  onToggleStatus: (cityId: string, status: "Live" | "Pilot" | "Paused" | "Coming Soon") => void;
}) {
  return (
    <Sheet open={Boolean(city)} onOpenChange={(open) => (open ? null : onClose())}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl bg-white text-zinc-900 border-zinc-200">
        <SheetHeader className="border-b border-zinc-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg font-black text-zinc-900">{city?.city}</SheetTitle>
              <SheetDescription className="text-xs text-zinc-500 font-medium mt-0.5">
                {city?.state}, {city?.country} · #{city?.id}
              </SheetDescription>
            </div>
            {city && <StatusPill value={city.status} />}
          </div>
        </SheetHeader>

        <div className="space-y-6 px-4 py-6">
          {/* Overview Spec */}
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-2">
              MARKET SUMMARY
            </h4>
            <DetailRow label="City / Market" value={city?.city ?? "—"} />
            <DetailRow label="State / UT" value={city?.state ?? "—"} />
            <DetailRow label="Standard Pickup Radius" value={city?.pickupRadius ?? "8 km"} />
            <DetailRow label="Operating Localities" value={<span className="font-bold">{city?.areas ?? 0} zones</span>} />
            <DetailRow label="Active Partner Stores" value={<span className="font-bold text-zinc-900">{city?.activePartners ?? 0} / {city?.partners ?? 0}</span>} />
            <DetailRow label="Online Delivery Fleet" value={<span className="font-bold text-emerald-700">{city?.onlineRiders ?? 0} / {city?.riders ?? 0}</span>} />
            <DetailRow label="Registered Customers" value={<span className="font-bold text-zinc-900">{city?.customers ?? 0}</span>} />
          </div>

          {/* Revenue Breakdown */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 mb-2">
              FINANCIAL AGGREGATIONS
            </h4>
            <DetailRow label="Total City GMV" value={<span className="font-black text-emerald-800 text-sm">₹{(city?.sales ?? 0).toLocaleString("en-IN")}</span>} />
            <DetailRow label="Platform Revenue (18%)" value={<span className="font-black text-emerald-700">₹{(city?.platformEarnings ?? 0).toLocaleString("en-IN")}</span>} />
            <DetailRow label="Partner Net Payouts (82%)" value={<span className="font-bold text-zinc-700">₹{(city?.partnerEarnings ?? 0).toLocaleString("en-IN")}</span>} />
          </div>

          {/* Operational Status Controls */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-2">
              MARKET LAUNCH & GOVERNANCE
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                onClick={() => city && onToggleStatus(city.id, "Live")}
              >
                <PlayCircle className="mr-1.5 size-3.5" /> Launch City (Live)
              </Button>
              <Button
                variant="outline"
                className="rounded-xl border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-bold"
                onClick={() => city && onToggleStatus(city.id, "Pilot")}
              >
                <Clock className="mr-1.5 size-3.5" /> Set Pilot Mode
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                className="rounded-xl border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-bold"
                onClick={() => city && onToggleStatus(city.id, "Coming Soon")}
              >
                Set Coming Soon
              </Button>
              <Button
                variant="destructive"
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold"
                onClick={() => city && onToggleStatus(city.id, "Paused")}
              >
                <PauseCircle className="mr-1.5 size-3.5" /> Pause Market
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AddCityDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [cityName, setCityName] = useState("");
  const [stateName, setStateName] = useState("Uttar Pradesh");
  const [radius, setRadius] = useState("8 km");
  const [status, setStatus] = useState("Live");

  const createMutation = useMutation({
    mutationFn: () =>
      saveCity({
        city: cityName,
        state: stateName,
        pickupRadius: radius,
        status,
        areas: 4,
      }),
    onSuccess: () => {
      toast.success(`City "${cityName}" added to expansion network.`);
      queryClient.invalidateQueries({ queryKey: ["admin", "cities"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "states"] });
      setOpen(false);
      setCityName("");
    },
    onError: () => {
      toast.error("Failed to add city.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-emerald-700 active:scale-95 shadow-xs"
        >
          <MapPinPlus className="size-3.5" />
          <span>Add City</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border-zinc-200">
        <DialogHeader>
          <DialogTitle className="text-base font-black text-zinc-900">Add Expansion City</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 font-medium">
            Expand QuickPress laundry operations to a new Indian city or hub.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700">City Name</Label>
            <Input
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              placeholder="e.g. Kasganj, Aligarh, Noida, Lucknow"
              className="h-10 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">State / Region</Label>
              <Input
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                placeholder="e.g. Uttar Pradesh, Maharashtra"
                className="h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Pickup Radius</Label>
              <Input
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                placeholder="e.g. 8 km"
                className="h-10 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700">Initial Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-10 rounded-xl text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Live">Live (Active)</SelectItem>
                <SelectItem value="Pilot">Pilot (Testing)</SelectItem>
                <SelectItem value="Coming Soon">Coming Soon</SelectItem>
                <SelectItem value="Paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" className="rounded-xl text-xs font-bold" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white"
            disabled={!cityName.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            Launch City
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddAreaDialog({ cities }: { cities: AdminCity[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [areaName, setAreaName] = useState("");
  const [selectedCityId, setSelectedCityId] = useState(cities[0]?.id || "");
  const [pincode, setPincode] = useState("");
  const [zone, setZone] = useState("Zone 1");

  const createMutation = useMutation({
    mutationFn: () => {
      const cityObj = cities.find((c) => c.id === selectedCityId) || cities[0];
      return saveArea({
        area: areaName,
        city: cityObj?.city || "Kasganj",
        state: cityObj?.state || "Uttar Pradesh",
        pincode: pincode || "207123",
        zone,
      });
    },
    onSuccess: () => {
      toast.success(`Locality "${areaName}" added to coverage.`);
      queryClient.invalidateQueries({ queryKey: ["admin", "areas"] });
      setOpen(false);
      setAreaName("");
      setPincode("");
    },
    onError: () => {
      toast.error("Failed to add area.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-50 active:scale-95 shadow-xs"
        >
          <Plus className="size-3.5" />
          <span>Add Area</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border-zinc-200">
        <DialogHeader>
          <DialogTitle className="text-base font-black text-zinc-900">Add Service Locality</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 font-medium">
            Register a specific sector, market, or neighborhood under a city hub.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700">Locality / Area Name</Label>
            <Input
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              placeholder="e.g. Soron Gate, Civil Lines, Sector 62"
              className="h-10 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">City Hub</Label>
              <Select value={selectedCityId} onValueChange={setSelectedCityId}>
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.city} ({c.state})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Pincode</Label>
              <Input
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="e.g. 207123"
                className="h-10 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700">Fulfillment Hub Zone</Label>
            <Input
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="e.g. Delivery Hub 1"
              className="h-10 rounded-xl text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" className="rounded-xl text-xs font-bold" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white"
            disabled={!areaName.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            Add Locality
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
