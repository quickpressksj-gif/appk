import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Pencil,
  Plus,
  Trash2,
  Sparkles,
  Store,
  Layers,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  PauseCircle,
  PlayCircle,
  TrendingUp,
  Tag,
  Clock,
  Info,
  MapPin,
  Building2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AdminShell } from "../components/AdminShell";
import { DataTable, DetailRow, SectionCard, StatusPill, KpiCard } from "../components/AdminUI";
import {
  createCategory,
  createService,
  deleteService,
  fetchPartnerServices,
  fetchServiceCategories,
  fetchServices,
  togglePartnerServiceStatus,
  updateService,
  type LaundryService,
  type PartnerServiceRow,
  type ServiceCategory,
} from "../api/services";
import { fetchPartners } from "../api/partners";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/services")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Services Catalog & Partner Pricing", "Master platform service catalog and individual partner rate cards."),
  component: ServicesPage,
});

export function ServicesPage() {
  const queryClient = useQueryClient();
  const services = useQuery({ queryKey: ["admin", "services"], queryFn: fetchServices });
  const categories = useQuery({ queryKey: ["admin", "service-categories"], queryFn: fetchServiceCategories });
  const partnerServices = useQuery({ queryKey: ["admin", "partner-services"], queryFn: () => fetchPartnerServices() });
  const partners = useQuery({ queryKey: ["admin", "partners"], queryFn: fetchPartners });

  const [activeTab, setActiveTab] = useState("master");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const allMasterServices = services.data ?? [];
  const allPartnerServices = partnerServices.data ?? [];
  const allCategories = categories.data ?? [];
  const allPartners = partners.data ?? [];

  const partnerStatusMutation = useMutation({
    mutationFn: ({ serviceId, action }: { serviceId: string; action: "activate" | "suspend" | "disable" | "enable" }) =>
      togglePartnerServiceStatus(serviceId, action),
    onSuccess: () => {
      toast.success("Partner service status updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin", "partner-services"] });
    },
    onError: () => {
      toast.error("Failed to update partner service status.");
    },
  });

  const deleteMasterMutation = useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      toast.success("Master service removed from catalog.");
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
    },
    onError: () => {
      toast.error("Failed to delete master service.");
    },
  });

  const cities = useMemo(
    () => Array.from(new Set(allPartnerServices.map((p) => p.city).filter(Boolean))),
    [allPartnerServices],
  );

  const metrics = useMemo(() => {
    const totalMaster = allMasterServices.length;
    const totalPartnerOfferings = allPartnerServices.length;
    const activeOfferings = allPartnerServices.filter((p) => p.status === "Active").length;
    const storesWithServices = new Set(allPartnerServices.map((p) => p.partnerId)).size;
    return { totalMaster, totalPartnerOfferings, activeOfferings, storesWithServices };
  }, [allMasterServices, allPartnerServices]);

  const filteredPartnerServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allPartnerServices.filter((p) => {
      const matchSearch =
        !q ||
        [p.name, p.partnerName, p.category, p.city].join(" ").toLowerCase().includes(q);
      const matchPartner = partnerFilter === "all" || p.partnerId === partnerFilter;
      const matchCity = cityFilter === "all" || p.city === cityFilter;
      const matchCat = categoryFilter === "all" || p.category.toLowerCase() === categoryFilter.toLowerCase();
      return matchSearch && matchPartner && matchCity && matchCat;
    });
  }, [allPartnerServices, searchQuery, partnerFilter, cityFilter, categoryFilter]);

  return (
    <AdminShell
      title="Services Catalog & Partner Rates"
      subtitle="Platform-wide Master Service Catalog and individual partner rate cards."
      actions={
        <div className="flex items-center gap-2">
          <CreateCategoryDialog />
          <CreateServiceDialog categories={allCategories} />
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
              id: "tot-master",
              label: "Master Services",
              value: metrics.totalMaster.toLocaleString("en-IN"),
              hint: "Platform standardized catalog",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "tot-partner-rates",
              label: "Partner Rate Cards",
              value: metrics.totalPartnerOfferings.toLocaleString("en-IN"),
              hint: "Active partner pricing entries",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "act-offerings",
              label: "Active Partner Rates",
              value: metrics.activeOfferings.toLocaleString("en-IN"),
              hint: `${metrics.totalPartnerOfferings ? Math.round((metrics.activeOfferings / metrics.totalPartnerOfferings) * 100) : 0}% active`,
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "stores-with-services",
              label: "Stores with Pricing",
              value: metrics.storesWithServices.toLocaleString("en-IN"),
              hint: "Partner stores with rate cards",
              positive: true,
            }}
          />
        </div>

        {/* =========================================================================
            2. MAIN TABS
        ========================================================================= */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-zinc-100 p-1 rounded-xl">
            <TabsTrigger value="master" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
              Master Services ({allMasterServices.length})
            </TabsTrigger>
            <TabsTrigger value="partner" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
              Partner Rates & Pricing ({allPartnerServices.length})
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
              Categories ({allCategories.length})
            </TabsTrigger>
          </TabsList>

          {/* =========================================================================
              TAB 1: MASTER SERVICES CATALOG
          ========================================================================= */}
          <TabsContent value="master" className="space-y-4">
            <SectionCard
              title="Platform Master Service Catalog"
              description="Standard services available for partner onboarding. Partners select these and set their own custom prices."
            >
              <DataTable
                loading={services.isLoading}
                rows={allMasterServices}
                emptyMessage="No master services found in catalog."
                columns={[
                  {
                    key: "name",
                    label: "Master Service",
                    render: (r) => (
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs">
                          <Sparkles className="size-4" />
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 text-xs">{r.name}</p>
                          <p className="text-[10px] text-zinc-400 font-medium line-clamp-1">{r.description || "Standard laundry service"}</p>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "category",
                    label: "Category",
                    render: (r) => (
                      <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                        {r.category}
                      </span>
                    ),
                  },
                  {
                    key: "unit",
                    label: "Billing Unit",
                    render: (r) => <span className="font-mono text-xs text-zinc-700 uppercase font-bold">{r.unit}</span>,
                  },
                  {
                    key: "sla",
                    label: "Standard SLA",
                    render: (r) => (
                      <span className="inline-flex items-center gap-1 text-xs text-zinc-600 font-medium">
                        <Clock className="size-3 text-zinc-400" />
                        {r.sla}
                      </span>
                    ),
                  },
                  {
                    key: "price",
                    label: "Reference Price",
                    render: (r) => (
                      <span className="font-mono text-xs font-bold text-zinc-600">
                        {r.price > 0 ? `₹${r.price}/${r.unit}` : "Partner-defined"}
                      </span>
                    ),
                  },
                  {
                    key: "status",
                    label: "Catalog Status",
                    render: (r) => <StatusPill value={r.status} />,
                  },
                  {
                    key: "actions",
                    label: "",
                    className: "text-right",
                    render: (r) => (
                      <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => {
                            if (confirm(`Remove "${r.name}" from Master Service catalog?`)) {
                              deleteMasterMutation.mutate(r.id);
                            }
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            </SectionCard>
          </TabsContent>

          {/* =========================================================================
              TAB 2: PARTNER SERVICES & RATES (PRICING MATRIX)
          ========================================================================= */}
          <TabsContent value="partner" className="space-y-4">
            <SectionCard>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative lg:col-span-2">
                  <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by store name, service, category, or city..."
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                  <SelectTrigger className="h-10 rounded-xl bg-zinc-50 border-zinc-200 text-xs">
                    <SelectValue placeholder="All Partner Stores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Partner Stores</SelectItem>
                    {allPartners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.store} ({p.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={cityFilter} onValueChange={setCityFilter}>
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

            <SectionCard
              title="Partner Custom Rate Cards"
              description="Each laundry partner sets their own selling price. Customers pay the partner-specific price when ordering from that store."
            >
              <DataTable
                loading={partnerServices.isLoading}
                rows={filteredPartnerServices}
                emptyMessage="No partner service rates match these filters."
                columns={[
                  {
                    key: "partnerName",
                    label: "Partner Store",
                    render: (r) => (
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                          <Store className="size-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 text-xs">{r.partnerName}</p>
                          <p className="text-[10px] text-zinc-400 font-medium">{r.city} · #{r.partnerId}</p>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "name",
                    label: "Service Offering",
                    render: (r) => (
                      <div>
                        <p className="font-bold text-zinc-900 text-xs">{r.name}</p>
                        <span className="inline-block rounded bg-zinc-100 px-1.5 py-0.2 text-[10px] font-semibold text-zinc-600">
                          {r.category}
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: "price",
                    label: "Partner Selling Price",
                    render: (r) => (
                      <div>
                        <span className="font-black text-emerald-700 text-sm">₹{r.price}</span>
                        <span className="text-zinc-400 text-xs font-semibold"> / {r.unit}</span>
                      </div>
                    ),
                  },
                  {
                    key: "turnaroundHours",
                    label: "SLA / Turnaround",
                    render: (r) => (
                      <span className="text-xs text-zinc-600 font-medium">
                        {r.turnaroundHours} hours
                      </span>
                    ),
                  },
                  {
                    key: "ordersCount",
                    label: "Orders Delivered",
                    render: (r) => (
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-800">
                        {r.ordersCount} orders
                      </span>
                    ),
                  },
                  {
                    key: "revenue",
                    label: "Store Revenue",
                    render: (r) => (
                      <span className="font-black text-zinc-900 text-xs">
                        ₹{r.revenue.toLocaleString("en-IN")}
                      </span>
                    ),
                  },
                  {
                    key: "status",
                    label: "Service Status",
                    render: (r) => <StatusPill value={r.status} />,
                  },
                  {
                    key: "actions",
                    label: "",
                    className: "text-right",
                    render: (r) => (
                      <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {r.status === "Suspended" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg border-emerald-300 text-emerald-700 px-2.5 text-xs font-bold hover:bg-emerald-50"
                            onClick={() => partnerStatusMutation.mutate({ serviceId: r.id, action: "activate" })}
                          >
                            <PlayCircle className="mr-1 size-3.5" /> Reactivate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 text-xs font-bold"
                            onClick={() => partnerStatusMutation.mutate({ serviceId: r.id, action: "suspend" })}
                          >
                            <PauseCircle className="mr-1 size-3.5" /> Suspend
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
              TAB 3: SERVICE CATEGORIES
          ========================================================================= */}
          <TabsContent value="categories" className="space-y-4">
            <SectionCard
              title="Platform Service Categories"
              description="Taxonomy and grouping used across the Customer, Partner, and Admin apps."
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {allCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                          <Layers className="size-5" />
                        </div>
                        <StatusPill value={cat.status} />
                      </div>
                      <h4 className="mt-3 text-sm font-black text-zinc-900">{cat.name}</h4>
                      <p className="mt-1 text-xs text-zinc-500 font-medium line-clamp-2">
                        {cat.description || "Primary laundry service classification category"}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400 font-semibold">
                      <span>{cat.services} active services</span>
                      <span className="font-mono text-[10px]">#{cat.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}

function CreateServiceDialog({ categories }: { categories: ServiceCategory[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [unit, setUnit] = useState("kg");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      createService({
        name,
        category: categoryId,
        unit,
        price: Number(price) || 0,
        description,
      }),
    onSuccess: () => {
      toast.success(`Master service "${name}" added to catalog.`);
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      setOpen(false);
      setName("");
      setPrice("");
      setDescription("");
    },
    onError: () => {
      toast.error("Failed to create master service.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-emerald-700 active:scale-95 shadow-xs"
        >
          <Plus className="size-3.5" />
          <span>Add Master Service</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border-zinc-200">
        <DialogHeader>
          <DialogTitle className="text-base font-black text-zinc-900">Add Master Service</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 font-medium">
            Create a standardized platform service that partners can offer with their own pricing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700">Service Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Blanket Cleaning, Curtain Care"
              className="h-10 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Pricing Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Per Kilogram (kg)</SelectItem>
                  <SelectItem value="item">Per Item / Piece</SelectItem>
                  <SelectItem value="pair">Per Pair</SelectItem>
                  <SelectItem value="sqft">Per Sq Ft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700">Reference / Guideline Price (₹)</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 120 (Partners can override with own rate)"
              className="h-10 rounded-xl text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700">Service Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short summary for customer care and partner guidelines"
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
            disabled={!name.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            Create Master Service
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateCategoryDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: () => createCategory({ name, description }),
    onSuccess: () => {
      toast.success(`Category "${name}" created.`);
      queryClient.invalidateQueries({ queryKey: ["admin", "service-categories"] });
      setOpen(false);
      setName("");
      setDescription("");
    },
    onError: () => {
      toast.error("Failed to create category.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-50 active:scale-95 shadow-xs"
        >
          <Layers className="size-3.5" />
          <span>New Category</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border-zinc-200">
        <DialogHeader>
          <DialogTitle className="text-base font-black text-zinc-900">Add Service Category</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 font-medium">
            Create a taxonomy category to organize platform services.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700">Category Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Home Care, Express Care, Luxury Garments"
              className="h-10 rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
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
            disabled={!name.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            Create Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
