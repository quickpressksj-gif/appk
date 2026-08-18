import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPinPlus } from "lucide-react";
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
import { fetchAreas, fetchCities, fetchZones, saveCity } from "../api/cities";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/cities")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Cities & areas", "Control QuickPress service coverage, areas and delivery zones."),
  component: CitiesPage,
});

function CitiesPage() {
  const cities = useQuery({ queryKey: ["admin", "cities"], queryFn: fetchCities });
  const areas = useQuery({ queryKey: ["admin", "areas"], queryFn: fetchAreas });
  const zones = useQuery({ queryKey: ["admin", "zones"], queryFn: fetchZones });

  return (
    <AdminShell
      title="Cities & areas"
      subtitle="Coverage, serviceable pincodes and delivery zones."
      actions={<AddCityDialog />}
    >
      <Tabs defaultValue="cities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cities">Cities</TabsTrigger>
          <TabsTrigger value="areas">Areas & pincodes</TabsTrigger>
          <TabsTrigger value="zones">Delivery zones</TabsTrigger>
        </TabsList>

        <TabsContent value="cities">
          <SectionCard title="Cities" description="Live, pilot and paused markets">
            <DataTable
              loading={cities.isLoading}
              rows={cities.data ?? []}
              columns={[
                { key: "city", label: "City" },
                { key: "state", label: "State" },
                { key: "areas", label: "Areas" },
                { key: "partners", label: "Partners" },
                { key: "riders", label: "Riders" },
                { key: "pickupRadius", label: "Pickup radius" },
                { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="areas">
          <SectionCard title="Areas & pincodes" description="Serviceable pincodes mapped to zones">
            <DataTable
              loading={areas.isLoading}
              rows={areas.data ?? []}
              columns={[
                { key: "area", label: "Area" },
                { key: "city", label: "City" },
                { key: "pincode", label: "Pincode" },
                { key: "zone", label: "Zone" },
                { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="zones">
          <SectionCard title="Delivery zones" description="Slot windows and coverage radius">
            <DataTable
              loading={zones.isLoading}
              rows={zones.data ?? []}
              columns={[
                { key: "zone", label: "Zone" },
                { key: "city", label: "City" },
                { key: "areas", label: "Areas" },
                { key: "slots", label: "Slots" },
                { key: "radius", label: "Radius", className: "text-right" },
              ]}
            />
          </SectionCard>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}

function AddCityDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ city: "", state: "", pickupRadius: "" });

  const save = useMutation({
    mutationFn: saveCity,
    onSuccess: () => {
      toast.success("City saved");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "cities"] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <MapPinPlus className="mr-2 h-4 w-4" /> Add city
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add city</DialogTitle>
          <DialogDescription>Opens a new market for onboarding partners and riders.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {([
            ["city", "City", "Chennai"],
            ["state", "State", "Tamil Nadu"],
            ["pickupRadius", "Pickup radius", "5 km"],
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
          <Button disabled={save.isPending} onClick={() => save.mutate(form)}>Save city</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
