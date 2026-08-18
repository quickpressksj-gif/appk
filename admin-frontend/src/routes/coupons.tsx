import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
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
import { createCoupon, fetchCoupons, fetchOffers } from "../api/coupons";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/coupons")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Coupons & offers", "Create and track QuickPress discounts, referrals and offers."),
  component: CouponsPage,
});

function CouponsPage() {
  const coupons = useQuery({ queryKey: ["admin", "coupons"], queryFn: fetchCoupons });
  const offers = useQuery({ queryKey: ["admin", "offers"], queryFn: fetchOffers });

  return (
    <AdminShell
      title="Coupons & offers"
      subtitle="Discount codes, referral rewards and seasonal campaigns."
      actions={<CreateCouponDialog />}
    >
      <Tabs defaultValue="coupons" className="space-y-4">
        <TabsList>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
          <TabsTrigger value="offers">Referrals & offers</TabsTrigger>
        </TabsList>

        <TabsContent value="coupons">
          <SectionCard title="Coupon codes" description="Active, scheduled and expired discounts">
            <DataTable
              loading={coupons.isLoading}
              rows={coupons.data ?? []}
              columns={[
                { key: "code", label: "Code" },
                { key: "type", label: "Type" },
                { key: "value", label: "Value" },
                { key: "minOrder", label: "Min order" },
                { key: "audience", label: "Audience" },
                { key: "used", label: "Redemptions" },
                { key: "expiry", label: "Expiry" },
                { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="offers">
          <SectionCard title="Referral & offer programmes">
            <DataTable
              loading={offers.isLoading}
              rows={offers.data ?? []}
              columns={[
                { key: "name", label: "Programme" },
                { key: "kind", label: "Type" },
                { key: "reward", label: "Reward" },
                { key: "window", label: "Window" },
                { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
              ]}
            />
          </SectionCard>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}

function CreateCouponDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", value: "", minOrder: "", expiry: "" });

  const create = useMutation({
    mutationFn: createCoupon,
    onSuccess: () => {
      toast.success("Coupon created");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> New coupon
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create coupon</DialogTitle>
          <DialogDescription>Discount codes apply instantly across the customer app.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {([
            ["code", "Code", "MONSOON30"],
            ["value", "Value", "30% up to ₹150"],
            ["minOrder", "Minimum order", "₹499"],
            ["expiry", "Expiry", "31 Dec 2026"],
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
          <Button disabled={create.isPending} onClick={() => create.mutate(form)}>Create coupon</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
