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
  IndianRupee,
  Bike,
  RefreshCw,
  Eye,
  Sliders,
  Save,
  Phone,
  Radio,
  Navigation,
  Compass as CompassIcon,
  CircleDot,
  Check,
  Zap,
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
  addCityZone,
  deleteArea,
  fetchAreas,
  fetchCitiesIntelligence,
  fetchCityStats,
  fetchStates,
  fetchZones,
  saveArea,
  saveCity,
  toggleCityStatus,
  updateCityRadius,
  type AdminArea,
  type AdminState,
  type CityIntelligence,
  type CityStats,
  type CityZone,
} from "../api/cities";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/cities")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("City & Zone Geo-Delivery Engine", "City-wise geo-fencing, delivery radius control, zonal sectors, real-time revenue, and fleet tracking."),
  component: CitiesPage,
});

export function CitiesPage() {
  const queryClient = useQueryClient();
  const citiesQuery = useQuery({ queryKey: ["admin", "cities", "intelligence"], queryFn: fetchCitiesIntelligence });
  const statsQuery = useQuery({ queryKey: ["admin", "cities", "stats"], queryFn: fetchCityStats });
  const statesQuery = useQuery({ queryKey: ["admin", "states"], queryFn: fetchStates });
  const areasQuery = useQuery({ queryKey: ["admin", "areas"], queryFn: () => fetchAreas() });

  const [activeTab, setActiveTab] = useState<"cities" | "zones" | "revenue" | "pincodes">("cities");
  const [stateFilter, setStateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"revenue" | "customers" | "captains" | "radius" | "name">("revenue");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<CityIntelligence | null>(null);

  const allCities = citiesQuery.data ?? [];
  const stats = statsQuery.data;
  const allStates = statesQuery.data ?? [];
  const allAreas = areasQuery.data ?? [];

  const cityStatusMutation = useMutation({
    mutationFn: ({ cityId, status }: { cityId: string; status: "Live" | "Pilot" | "Paused" | "Coming Soon" }) =>
      toggleCityStatus(cityId, status),
    onSuccess: () => {
      toast.success("City operational status updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin", "cities", "intelligence"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "cities", "stats"] });
    },
    onError: () => {
      toast.error("Failed to update city status.");
    },
  });

  const metrics = useMemo(() => {
    const totalCities = stats?.totalCities ?? allCities.length;
    const totalZones = stats?.totalZones ?? allCities.reduce((acc, c) => acc + (c.totalZones || 0), 0);
    const totalRevenue = stats?.totalGeoRevenue ?? allCities.reduce((acc, c) => acc + (c.financials?.grossRevenue || 0), 0);
    const totalCustomers = stats?.totalCityCustomers ?? allCities.reduce((acc, c) => acc + (c.totalCustomers || 0), 0);
    const totalCaptains = stats?.totalActiveCaptains ?? allCities.reduce((acc, c) => acc + (c.totalRiders || 0), 0);
    const totalHubs = stats?.totalPartnerHubs ?? allCities.reduce((acc, c) => acc + (c.totalPartners || 0), 0);

    return { totalCities, totalZones, totalRevenue, totalCustomers, totalCaptains, totalHubs };
  }, [allCities, stats]);

  // Filter & Sort Cities
  const filteredCities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let filtered = allCities.filter((c) => {
      const matchSearch =
        !q ||
        [c.city, c.name, c.state, c.tier, ...(c.pincodes || []), ...(c.zones || []).map((z) => z.name)]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchState = stateFilter === "all" || c.state.toLowerCase() === stateFilter.toLowerCase();
      const matchStatus = statusFilter === "all" || c.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchState && matchStatus;
    });

    if (sortBy === "revenue") {
      filtered.sort((a, b) => (b.financials?.grossRevenue || 0) - (a.financials?.grossRevenue || 0));
    } else if (sortBy === "customers") {
      filtered.sort((a, b) => b.totalCustomers - a.totalCustomers);
    } else if (sortBy === "captains") {
      filtered.sort((a, b) => b.totalRiders - a.totalRiders);
    } else if (sortBy === "radius") {
      filtered.sort((a, b) => b.deliveryRadiusKm - a.deliveryRadiusKm);
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.city.localeCompare(b.city));
    }
    return filtered;
  }, [allCities, searchQuery, stateFilter, statusFilter, sortBy]);

  // Extract all operational zones across cities
  const allZonesList = useMemo(() => {
    const list: Array<{ city: CityIntelligence; zone: CityZone }> = [];
    for (const c of allCities) {
      for (const z of c.zones || []) {
        list.push({ city: c, zone: z });
      }
    }
    return list;
  }, [allCities]);

  const handleExportCSV = () => {
    if (filteredCities.length === 0) {
      toast.error("No city records to export.");
      return;
    }
    const headers = [
      "City Name",
      "State",
      "Tier",
      "Operational Status",
      "Delivery Radius (km)",
      "Base Delivery Fee (INR)",
      "Per KM Rate (INR)",
      "Total Registered Customers",
      "Partner Laundry Hubs",
      "Active Delivery Captains",
      "Gross Revenue GMV (INR)",
      "Platform Commission (INR)",
      "Partner Payout (INR)",
      "Captain Payout (INR)",
      "Total Orders Handled",
      "Covered Pincodes",
    ];
    const csvRows = [headers.join(",")];
    for (const c of filteredCities) {
      csvRows.push(
        [
          `"${c.city}"`,
          `"${c.state}"`,
          `"${c.tier}"`,
          `"${c.status}"`,
          `"${c.deliveryRadiusKm}"`,
          `"${c.baseDeliveryFee}"`,
          `"${c.perKmFee}"`,
          `"${c.totalCustomers}"`,
          `"${c.totalPartners}"`,
          `"${c.totalRiders}"`,
          `"${c.financials?.grossRevenue || 0}"`,
          `"${c.financials?.platformCommission || 0}"`,
          `"${c.financials?.partnerEarnings || 0}"`,
          `"${c.financials?.riderEarnings || 0}"`,
          `"${c.financials?.totalOrders || 0}"`,
          `"${(c.pincodes || []).join("; ")}"`,
        ].join(","),
      );
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QuickPress_City_Geo_Engine_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("City Geo-Engine spreadsheet exported! 🚀");
  };

  return (
    <AdminShell
      title="City & Zone Geo-Delivery Engine"
      subtitle="Zonal geo-fencing, delivery radius control, live city revenue, partner store hubs, and captain fleet deployment."
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              citiesQuery.refetch();
              statsQuery.refetch();
              statesQuery.refetch();
              toast.success("Geo-Engine intelligence refreshed!");
            }}
            disabled={citiesQuery.isRefetching}
            className="h-8 rounded-xl border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${citiesQuery.isRefetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={handleExportCSV}
            className="h-8 rounded-xl bg-zinc-900 px-3 text-xs font-bold text-white hover:bg-zinc-800 shadow-xs"
          >
            <Download className="size-3.5 mr-1.5" />
            <span>Export CSV</span>
          </Button>

          <AddCityDialog />
          <AddZoneDialog cities={allCities} />
        </div>
      }
    >
      <div className="space-y-6">
        {/* =========================================================================
            1. TOP KPI SUMMARY METRICS
        ========================================================================= */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <KpiCard
            kpi={{
              id: "tot-cities",
              label: "Operational Cities",
              value: `${metrics.totalCities} Cities`,
              hint: "Multi-state network",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "tot-zones",
              label: "Geo-Sectors & Zones",
              value: `${metrics.totalZones} Sectors`,
              hint: "Delivery clusters active",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "tot-geo-rev",
              label: "City Gross Revenue",
              value: `₹${metrics.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
              hint: "Total delivered GMV",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "tot-cust",
              label: "City Customer Base",
              value: `${metrics.totalCustomers} Users`,
              hint: "Registered in zones",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "tot-captains",
              label: "Captains on Duty",
              value: `${metrics.totalCaptains} Captains`,
              hint: "Active delivery fleet",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "tot-hubs",
              label: "Partner Store Hubs",
              value: `${metrics.totalHubs} Hubs`,
              hint: "Live processing centers",
              positive: true,
            }}
          />
        </div>

        {/* =========================================================================
            2. MAIN TABS NAVIGATION & TOOLBAR
        ========================================================================= */}
        <SectionCard>
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-100">
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
              <TabsList className="bg-zinc-100 p-1 rounded-xl">
                <TabsTrigger value="cities" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  🏙️ Master Cities & Radius Engine ({allCities.length})
                </TabsTrigger>
                <TabsTrigger value="zones" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  🗺️ Operational Zones & Sector Clusters ({allZonesList.length})
                </TabsTrigger>
                <TabsTrigger value="revenue" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  📊 City Revenue & Financials
                </TabsTrigger>
                <TabsTrigger value="pincodes" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
                  📍 Serviceable Pincodes
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
              <Navigation className="size-4 text-emerald-600" />
              <span>Showing {filteredCities.length} Cities</span>
            </div>
          </div>

          {activeTab === "cities" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search city, state, sector, pincode, or captain name..."
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 rounded-xl bg-zinc-50 border-zinc-200 text-xs">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="live">● Live & Operational</SelectItem>
                  <SelectItem value="pilot">⚡ Pilot Launch</SelectItem>
                  <SelectItem value="paused">⏸️ Paused</SelectItem>
                  <SelectItem value="coming soon">⏳ Coming Soon</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="h-10 rounded-xl bg-zinc-50 border-zinc-200 text-xs">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">💰 Highest Revenue First</SelectItem>
                  <SelectItem value="customers">👥 Most Customers</SelectItem>
                  <SelectItem value="captains">🚴 Most Captains</SelectItem>
                  <SelectItem value="radius">🗺️ Largest Delivery Radius</SelectItem>
                  <SelectItem value="name">🔤 City Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </SectionCard>

        {/* =========================================================================
            3. TAB CONTENT VIEWS
        ========================================================================= */}
        {activeTab === "cities" && (
          <SectionCard
            title="Operational Cities & Delivery Radius Control"
            description="Manage live geo-fencing radius, base delivery pricing, and inspect city-wise partner stores, captains, and customers."
          >
            <DataTable
              loading={citiesQuery.isLoading}
              rows={filteredCities}
              onRowClick={(row) => setSelectedCity(row)}
              emptyMessage="No operational cities found matching your search."
              columns={[
                {
                  key: "city",
                  label: "City & State",
                  render: (c) => (
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-800 font-black text-xs shadow-xs border border-emerald-200/60">
                        {c.city.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                          {c.city}
                          <span className="rounded bg-zinc-100 text-zinc-600 text-[10px] px-1.5 py-0.2 font-bold">{c.tier}</span>
                        </p>
                        <p className="text-[10px] text-zinc-400 font-medium">
                          {c.state}, India · {c.pincodes?.length || 1} Pincodes
                        </p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "status",
                  label: "Status",
                  render: (c) => <StatusPill value={c.status} />,
                },
                {
                  key: "radius",
                  label: "Delivery Radius & Fee",
                  render: (c) => (
                    <div className="text-xs">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 border border-sky-200">
                        <Navigation className="size-3" /> {c.deliveryRadiusKm} km Radius
                      </span>
                      <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                        Base: ₹{c.baseDeliveryFee} · +₹{c.perKmFee}/km
                      </p>
                    </div>
                  ),
                },
                {
                  key: "customers",
                  label: "Customer Base",
                  render: (c) => (
                    <div className="text-xs">
                      <span className="font-bold text-zinc-900">{c.totalCustomers} Customers</span>
                      <p className="text-[10px] text-zinc-400">{c.financials?.totalOrders || 0} Orders placed</p>
                    </div>
                  ),
                },
                {
                  key: "partners",
                  label: "Partner Stores",
                  render: (c) => (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700">
                      <Store className="size-3.5 text-emerald-600" />
                      {c.totalPartners} Hubs
                    </span>
                  ),
                },
                {
                  key: "captains",
                  label: "Captains Fleet",
                  render: (c) => (
                    <div className="text-xs">
                      <div className="flex items-center gap-1">
                        <Bike className="size-3.5 text-sky-600" />
                        <span className="font-bold text-zinc-900">{c.totalRiders} Captains</span>
                      </div>
                      <p className="text-[10px] text-emerald-600 font-bold">● {c.onlineRiders} Online now</p>
                    </div>
                  ),
                },
                {
                  key: "revenue",
                  label: "City Revenue (GMV)",
                  render: (c) => (
                    <div className="text-xs">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 border border-emerald-200">
                        <IndianRupee className="size-3.5" />
                        {(c.financials?.grossRevenue || 0).toFixed(2)}
                      </span>
                    </div>
                  ),
                },
                {
                  key: "actions",
                  label: "",
                  className: "text-right",
                  render: (c) => (
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-xl border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100 hover:text-emerald-700"
                        onClick={() => setSelectedCity(c)}
                      >
                        <Eye className="size-3.5 mr-1" /> City 360°
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </SectionCard>
        )}

        {/* TAB 2: OPERATIONAL ZONES & SECTORS */}
        {activeTab === "zones" && (
          <SectionCard
            title="City Operational Zones & Delivery Sectors"
            description="Manage specific micro-zones, delivery clusters, radius fences, and base fees within each operational city."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allZonesList.map(({ city, zone }) => (
                <div key={zone.zoneId} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-black text-xs">
                        {zone.sector.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900 text-xs">{zone.name}</h4>
                        <p className="text-[10px] text-zinc-400 font-medium">{city.city}, {city.state}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 border border-emerald-200">
                      ● {zone.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-zinc-50">
                      <span className="text-zinc-500 font-medium">Delivery Radius</span>
                      <span className="font-bold text-zinc-900 flex items-center gap-1">
                        <Navigation className="size-3 text-sky-600" /> {zone.radiusKm} km
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-zinc-50">
                      <span className="text-zinc-500 font-medium">Base Delivery Fee</span>
                      <span className="font-bold text-zinc-900">₹{zone.baseFee.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-zinc-50">
                      <span className="text-zinc-500 font-medium">Covered Pincodes</span>
                      <span className="font-mono text-[11px] font-bold text-zinc-700">
                        {zone.pincodes.join(", ")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-zinc-500 font-medium">GPS Center</span>
                      <span className="font-mono text-[10px] text-zinc-400">
                        {zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs font-bold text-emerald-700 hover:bg-emerald-50 px-2 rounded-lg"
                      onClick={() => setSelectedCity(city)}
                    >
                      Inspect City Hub <ChevronRight className="size-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* TAB 3: CITY REVENUE & FINANCIALS */}
        {activeTab === "revenue" && (
          <SectionCard
            title="City-Wise Financial Economics & Revenue Share"
            description="Gross merchandise value (GMV), 18% platform commission, 70% partner payouts, and 12% captain delivery earnings by city."
          >
            <DataTable
              loading={citiesQuery.isLoading}
              rows={filteredCities}
              columns={[
                {
                  key: "city",
                  label: "City & State",
                  render: (c) => (
                    <div>
                      <p className="font-bold text-zinc-900 text-xs">{c.city}</p>
                      <p className="text-[10px] text-zinc-400">{c.state}</p>
                    </div>
                  ),
                },
                {
                  key: "gross",
                  label: "Gross GMV",
                  render: (c) => (
                    <span className="font-black text-xs text-zinc-900">
                      ₹{(c.financials?.grossRevenue || 0).toFixed(2)}
                    </span>
                  ),
                },
                {
                  key: "commission",
                  label: "Platform Comm (18%)",
                  render: (c) => (
                    <span className="font-black text-xs text-emerald-700">
                      ₹{(c.financials?.platformCommission || 0).toFixed(2)}
                    </span>
                  ),
                },
                {
                  key: "partnerShare",
                  label: "Partner Payout (70%)",
                  render: (c) => (
                    <span className="font-bold text-xs text-sky-700">
                      ₹{(c.financials?.partnerEarnings || 0).toFixed(2)}
                    </span>
                  ),
                },
                {
                  key: "captainShare",
                  label: "Captain Share (12%)",
                  render: (c) => (
                    <span className="font-bold text-xs text-amber-700">
                      ₹{(c.financials?.riderEarnings || 0).toFixed(2)}
                    </span>
                  ),
                },
                {
                  key: "aov",
                  label: "Avg Order Value (AOV)",
                  render: (c) => (
                    <span className="font-bold text-xs text-zinc-700">
                      ₹{(c.financials?.aov || 0).toFixed(2)}
                    </span>
                  ),
                },
              ]}
            />
          </SectionCard>
        )}

        {/* TAB 4: SERVICEABLE PINCODES */}
        {activeTab === "pincodes" && (
          <SectionCard
            title="Serviceable India Pincodes Directory"
            description="Complete list of postal codes mapped to active delivery clusters."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {allCities.flatMap((c) =>
                (c.pincodes || []).map((pin) => (
                  <div key={`${c.city}-${pin}`} className="rounded-xl border border-zinc-200 bg-white p-3.5 flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm font-black text-zinc-900">{pin}</p>
                      <p className="text-xs text-zinc-500">{c.city}, {c.state}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 border border-emerald-200">
                      Active
                    </span>
                  </div>
                )),
              )}
            </div>
          </SectionCard>
        )}
      </div>

      {/* =========================================================================
          4. CITY 360° COMPREHENSIVE DRAWER SHEET
      ========================================================================= */}
      <City360Sheet
        city={selectedCity}
        onClose={() => setSelectedCity(null)}
      />
    </AdminShell>
  );
}

/* =========================================================================
   5. CITY 360° DRAWER SHEET (6 TABS: REVENUE, RADIUS ENGINE, PARTNERS, CAPTAINS, CUSTOMERS, ORDERS)
========================================================================= */
function City360Sheet({
  city,
  onClose,
}: {
  city: CityIntelligence | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("radius_engine");
  const [radiusForm, setRadiusForm] = useState({
    deliveryRadiusKm: 15,
    baseDeliveryFee: 20,
    perKmFee: 5,
    freeDeliveryAbove: 199,
    minOrderValue: 99,
    surgeMultiplier: 1.0,
    status: "Live",
  });

  const updateRadiusMutation = useMutation({
    mutationFn: (payload: any) => updateCityRadius(city!.id, payload),
    onSuccess: () => {
      toast.success("City delivery radius & fees updated successfully! 🎉");
      queryClient.invalidateQueries({ queryKey: ["admin", "cities", "intelligence"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "cities", "stats"] });
    },
    onError: () => {
      toast.error("Failed to update delivery radius.");
    },
  });

  if (!city) return null;

  return (
    <Sheet open={Boolean(city)} onOpenChange={(open) => (open ? null : onClose())}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto bg-white text-zinc-900 border-zinc-200 p-0 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-sm shadow-md">
                {city.city.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-base font-black text-zinc-900">{city.city}</SheetTitle>
                  <StatusPill value={city.status} />
                </div>
                <SheetDescription className="text-xs text-zinc-500 font-medium flex items-center gap-2 mt-0.5">
                  <span>{city.state}, India</span>
                  <span>·</span>
                  <span>{city.tier}</span>
                  <span>·</span>
                  <span>Radius: {city.deliveryRadiusKm} km</span>
                </SheetDescription>
              </div>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="mt-4 grid grid-cols-4 gap-2 rounded-xl bg-zinc-50 p-2.5 border border-zinc-100 text-center">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Gross GMV</p>
              <p className="text-xs font-black text-emerald-600">₹{(city.financials?.grossRevenue || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Customers</p>
              <p className="text-xs font-black text-zinc-900">{city.totalCustomers}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Captains</p>
              <p className="text-xs font-black text-sky-600">{city.totalRiders} Fleet</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Partner Hubs</p>
              <p className="text-xs font-black text-zinc-900">{city.totalPartners} Stores</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full bg-zinc-100 p-1 rounded-xl">
              <TabsTrigger value="radius_engine" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
                🗺️ Radius & Fees
              </TabsTrigger>
              <TabsTrigger value="revenue" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
                💰 Revenue
              </TabsTrigger>
              <TabsTrigger value="partners" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
                🏪 Stores ({city.totalPartners})
              </TabsTrigger>
              <TabsTrigger value="captains" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
                🚴 Captains ({city.totalRiders})
              </TabsTrigger>
              <TabsTrigger value="orders" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs">
                📦 Orders
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: RADIUS & DELIVERY ENGINE */}
            <TabsContent value="radius_engine" className="space-y-4 pt-4">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700 flex items-center gap-2">
                    <Sliders className="size-4 text-emerald-600" />
                    <span>Geo-Fencing & Delivery Radius Settings</span>
                  </h4>
                  <span className="text-xs font-bold text-emerald-700">Live Engine</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span>Delivery Radius Coverage</span>
                      <span className="text-emerald-700 font-black">{radiusForm.deliveryRadiusKm || city.deliveryRadiusKm} KM</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      step="0.5"
                      value={radiusForm.deliveryRadiusKm || city.deliveryRadiusKm}
                      onChange={(e) => setRadiusForm((p) => ({ ...p, deliveryRadiusKm: parseFloat(e.target.value) }))}
                      className="w-full accent-emerald-600 h-2 bg-zinc-200 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                      <span>1 km (Micro Hub)</span>
                      <span>15 km (City Standard)</span>
                      <span>50 km (Metro Zone)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-zinc-600">Base Delivery Fee (₹)</Label>
                      <Input
                        type="number"
                        value={radiusForm.baseDeliveryFee || city.baseDeliveryFee}
                        onChange={(e) => setRadiusForm((p) => ({ ...p, baseDeliveryFee: parseFloat(e.target.value) || 0 }))}
                        className="h-9 text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-zinc-600">Per KM Distance Rate (₹/km)</Label>
                      <Input
                        type="number"
                        value={radiusForm.perKmFee || city.perKmFee}
                        onChange={(e) => setRadiusForm((p) => ({ ...p, perKmFee: parseFloat(e.target.value) || 0 }))}
                        className="h-9 text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-zinc-600">Free Delivery Threshold (₹)</Label>
                      <Input
                        type="number"
                        value={radiusForm.freeDeliveryAbove || city.freeDeliveryAbove}
                        onChange={(e) => setRadiusForm((p) => ({ ...p, freeDeliveryAbove: parseFloat(e.target.value) || 0 }))}
                        className="h-9 text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-zinc-600">Minimum Order Value (₹)</Label>
                      <Input
                        type="number"
                        value={radiusForm.minOrderValue || city.minOrderValue}
                        onChange={(e) => setRadiusForm((p) => ({ ...p, minOrderValue: parseFloat(e.target.value) || 0 }))}
                        className="h-9 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white h-10 mt-2"
                    onClick={() => updateRadiusMutation.mutate(radiusForm)}
                    disabled={updateRadiusMutation.isPending}
                  >
                    <Save className="size-3.5 mr-1.5" />
                    {updateRadiusMutation.isPending ? "Updating Engine..." : "Apply Delivery Radius & Fee Rules"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: REVENUE BREAKDOWN */}
            <TabsContent value="revenue" className="space-y-4 pt-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                <p className="text-[11px] font-bold text-emerald-800 uppercase">Gross City GMV</p>
                <p className="text-2xl font-black text-emerald-950 mt-1">₹{(city.financials?.grossRevenue || 0).toFixed(2)}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5 space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Platform (18%)</p>
                  <p className="text-base font-black text-zinc-900">₹{(city.financials?.platformCommission || 0).toFixed(2)}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5 space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Stores (70%)</p>
                  <p className="text-base font-black text-zinc-900">₹{(city.financials?.partnerEarnings || 0).toFixed(2)}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5 space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Captains (12%)</p>
                  <p className="text-base font-black text-zinc-900">₹{(city.financials?.riderEarnings || 0).toFixed(2)}</p>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: PARTNER STORES */}
            <TabsContent value="partners" className="space-y-4 pt-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700">Laundry Partner Hubs in {city.city}</h4>
              <div className="rounded-2xl border border-zinc-200 overflow-hidden divide-y divide-zinc-100">
                {city.partnerList.map((p) => (
                  <div key={p.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-zinc-50">
                    <div>
                      <p className="font-bold text-zinc-900">{p.name}</p>
                      <p className="text-[10px] text-zinc-400">{p.address}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ● {p.status}
                      </span>
                    </div>
                  </div>
                ))}
                {city.partnerList.length === 0 && (
                  <div className="p-6 text-center text-xs text-zinc-400">No partner stores in this city yet.</div>
                )}
              </div>
            </TabsContent>

            {/* TAB 4: CAPTAINS */}
            <TabsContent value="captains" className="space-y-4 pt-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700">Delivery Captains Fleet ({city.totalRiders})</h4>
              <div className="rounded-2xl border border-zinc-200 overflow-hidden divide-y divide-zinc-100">
                {city.riderList.map((r) => (
                  <div key={r.riderId} className="p-3.5 flex items-center justify-between text-xs hover:bg-zinc-50">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-xl bg-sky-100 text-sky-800 font-bold text-xs">
                        {r.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900">{r.name}</p>
                        <p className="text-[10px] text-zinc-400">{r.vehicle} · {r.plate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          r.liveState === "Online"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        ● {r.liveState}
                      </span>
                      <a href={`tel:${r.phone}`} className="flex size-7 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-100">
                        <Phone className="size-3" />
                      </a>
                    </div>
                  </div>
                ))}
                {city.riderList.length === 0 && (
                  <div className="p-6 text-center text-xs text-zinc-400">No captains registered in this city yet.</div>
                )}
              </div>
            </TabsContent>

            {/* TAB 5: ORDERS */}
            <TabsContent value="orders" className="space-y-4 pt-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700">Recent Dispatched Orders</h4>
              <div className="rounded-2xl border border-zinc-200 overflow-hidden divide-y divide-zinc-100">
                {city.recentOrders.map((o) => (
                  <div key={o.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-zinc-50">
                    <div>
                      <p className="font-bold text-zinc-900">{o.code}</p>
                      <p className="text-[10px] text-zinc-400">Customer: {o.customer} · Rider: {o.rider}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-zinc-900">₹{o.amount}</p>
                      <span className="text-[10px] text-emerald-600 font-bold capitalize">{o.status}</span>
                    </div>
                  </div>
                ))}
                {city.recentOrders.length === 0 && (
                  <div className="p-6 text-center text-xs text-zinc-400">No orders recorded in this city yet.</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* =========================================================================
   6. ADD CITY & ADD ZONE DIALOGS
========================================================================= */
function AddCityDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState("");
  const [state, setState] = useState("Uttar Pradesh");
  const [radius, setRadius] = useState("15");
  const [baseFee, setBaseFee] = useState("20");
  const [tier, setTier] = useState("Tier-2");

  const createMutation = useMutation({
    mutationFn: () =>
      saveCity({
        city,
        state,
        deliveryRadiusKm: parseFloat(radius) || 15,
        baseDeliveryFee: parseFloat(baseFee) || 20,
        tier,
      }),
    onSuccess: () => {
      toast.success("New operational city configured in Geo-Engine! 🎉");
      setOpen(false);
      setCity("");
      queryClient.invalidateQueries({ queryKey: ["admin", "cities", "intelligence"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "cities", "stats"] });
    },
    onError: () => {
      toast.error("Failed to add city.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs">
          <MapPinPlus className="size-3.5 mr-1" />
          <span>Add City</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white text-zinc-900 border-zinc-200">
        <DialogHeader>
          <DialogTitle className="text-base font-black">Configure Operational City</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Add a new city to the QuickPress delivery engine with initial radius and base pricing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="space-y-1">
            <Label className="text-xs font-bold">City Name</Label>
            <Input placeholder="e.g. Aligarh, Hathras, Mathura" value={city} onChange={(e) => setCity(e.target.value)} className="h-9 text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">State</Label>
              <Input placeholder="Uttar Pradesh" value={state} onChange={(e) => setState(e.target.value)} className="h-9 text-xs" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">City Tier</Label>
              <Select value={tier} onValueChange={setTier}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tier-1">Tier-1 Metro</SelectItem>
                  <SelectItem value="Tier-2">Tier-2 Hub</SelectItem>
                  <SelectItem value="Tier-3">Tier-3 City</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Initial Radius (KM)</Label>
              <Input type="number" placeholder="15" value={radius} onChange={(e) => setRadius(e.target.value)} className="h-9 text-xs" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Base Delivery Fee (₹)</Label>
              <Input type="number" placeholder="20" value={baseFee} onChange={(e) => setBaseFee(e.target.value)} className="h-9 text-xs" />
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="rounded-xl text-xs font-bold">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => createMutation.mutate()}
            disabled={!city || createMutation.isPending}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white"
          >
            {createMutation.isPending ? "Adding..." : "Launch City Engine"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddZoneDialog({ cities }: { cities: CityIntelligence[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [cityId, setCityId] = useState(cities[0]?.id || "");
  const [name, setName] = useState("");
  const [sector, setSector] = useState("Sector 1");
  const [radius, setRadius] = useState("6.5");
  const [pincodes, setPincodes] = useState("207123");
  const [baseFee, setBaseFee] = useState("20");

  const createMutation = useMutation({
    mutationFn: () =>
      addCityZone(cityId || cities[0]?.id || "", {
        name,
        sector,
        radiusKm: parseFloat(radius) || 6.5,
        pincodes: pincodes.split(",").map((p) => p.trim()),
        baseFee: parseFloat(baseFee) || 20,
      }),
    onSuccess: () => {
      toast.success("New operational zone sector added! 🎉");
      setOpen(false);
      setName("");
      queryClient.invalidateQueries({ queryKey: ["admin", "cities", "intelligence"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "cities", "stats"] });
    },
    onError: () => {
      toast.error("Failed to add sector zone.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 rounded-xl border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100">
          <Layers className="size-3.5 mr-1" />
          <span>Add Sector Zone</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white text-zinc-900 border-zinc-200">
        <DialogHeader>
          <DialogTitle className="text-base font-black">Add Delivery Sector / Micro-Zone</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Define a specific delivery sector cluster within an operational city.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="space-y-1">
            <Label className="text-xs font-bold">Select City</Label>
            <Select value={cityId} onValueChange={setCityId}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select City" />
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

          <div className="space-y-1">
            <Label className="text-xs font-bold">Sector / Zone Name</Label>
            <Input placeholder="e.g. Nadrai Gate & Market Hub" value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Sector Label</Label>
              <Input placeholder="Sector 1" value={sector} onChange={(e) => setSector(e.target.value)} className="h-9 text-xs" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Radius (KM)</Label>
              <Input type="number" placeholder="6.5" value={radius} onChange={(e) => setRadius(e.target.value)} className="h-9 text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Covered Pincodes</Label>
              <Input placeholder="207123, 207124" value={pincodes} onChange={(e) => setPincodes(e.target.value)} className="h-9 text-xs" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Base Delivery Fee (₹)</Label>
              <Input type="number" placeholder="20" value={baseFee} onChange={(e) => setBaseFee(e.target.value)} className="h-9 text-xs" />
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="rounded-xl text-xs font-bold">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => createMutation.mutate()}
            disabled={!name || createMutation.isPending}
            className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-bold"
          >
            {createMutation.isPending ? "Adding..." : "Add Sector Zone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
