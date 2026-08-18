import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AdminShell } from "../components/AdminShell";
import { DataTable, SectionCard, StatusPill } from "../components/AdminUI";
import {
  createService,
  fetchServiceCategories,
  fetchServicePricing,
  fetchServices,
} from "../api/services";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/services")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Services", "Manage the QuickPress laundry catalogue, categories and pricing."),
  component: ServicesPage,
});

function ServicesPage() {
  const queryClient = useQueryClient();
  const services = useQuery({ queryKey: ["admin", "services"], queryFn: fetchServices });
  const categories = useQuery({ queryKey: ["admin", "service-categories"], queryFn: fetchServiceCategories });
  const pricing = useQuery({ queryKey: ["admin", "service-pricing"], queryFn: fetchServicePricing });

  return (
    <AdminShell
      title="Services"
      subtitle="Catalogue, categories and city-level pricing."
      actions={<CreateServiceDialog />}
    >
      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="services">
          <SectionCard title="Service catalogue" description="Every service offered on the platform">
            <DataTable
              loading={services.isLoading}
              rows={services.data ?? []}
              columns={[
                { key: "name", label: "Service" },
                { key: "category", label: "Category" },
                { key: "sla", label: "Turnaround" },
                { key: "cities", label: "Cities" },
                { key: "ordersPerWeek", label: "Orders / week" },
                { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
                {
                  key: "actions",
                  label: "",
                  className: "text-right",
                  render: (r) => (
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => toast.info(`Editing ${r.name}`)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled
                        title="Deleting services is not available yet — no backend endpoint exists."
                        onClick={() => toast.error("Deleting services is not available yet.")}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="categories">
          <SectionCard title="Categories" description="Grouping used across all customer apps">
            <DataTable
              loading={categories.isLoading}
              rows={categories.data ?? []}
              columns={[
                { key: "name", label: "Category" },
                { key: "services", label: "Services" },
                { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="pricing">
          <SectionCard title="Pricing" description="Item level rates and platform commission">
            <DataTable
              loading={pricing.isLoading}
              rows={pricing.data ?? []}
              columns={[
                { key: "item", label: "Item" },
                { key: "service", label: "Service" },
                { key: "city", label: "City" },
                { key: "price", label: "Price" },
                { key: "commission", label: "Commission", className: "text-right" },
              ]}
            />
          </SectionCard>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}

function CreateServiceDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", sla: "", price: "" });

  const create = useMutation({
    mutationFn: createService,
    onSuccess: () => {
      toast.success("Service created");
      setOpen(false);
      setForm({ name: "", category: "", sla: "", price: "" });
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> New service
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create service</DialogTitle>
          <DialogDescription>Adds a service to the catalogue across selected cities.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {([
            ["name", "Service name", "Premium Care"],
            ["category", "Category", "Specialist"],
            ["sla", "Turnaround", "48 hrs"],
            ["price", "Base price", "₹199"],
          ] as const).map(([key, label, placeholder]) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                value={form[key]}
                placeholder={placeholder}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={create.isPending} onClick={() => create.mutate(form)}>Create service</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
