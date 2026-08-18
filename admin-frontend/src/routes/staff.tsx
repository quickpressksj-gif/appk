import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
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
import { fetchActivityLogs, fetchRoles, fetchStaff, inviteStaff } from "../api/staff";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/staff")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Staff & roles", "Manage QuickPress admin users, permissions and audit history."),
  component: StaffPage,
});

function StaffPage() {
  const staff = useQuery({ queryKey: ["admin", "staff"], queryFn: fetchStaff });
  const roles = useQuery({ queryKey: ["admin", "roles"], queryFn: fetchRoles });
  const logs = useQuery({ queryKey: ["admin", "activity-logs"], queryFn: fetchActivityLogs });

  return (
    <AdminShell
      title="Staff & roles"
      subtitle="Admin accounts, role permissions and the audit trail."
      actions={<InviteStaffDialog />}
    >
      <Tabs defaultValue="staff" className="space-y-4">
        <TabsList>
          <TabsTrigger value="staff">Admin users</TabsTrigger>
          <TabsTrigger value="roles">Roles & permissions</TabsTrigger>
          <TabsTrigger value="logs">Activity log</TabsTrigger>
        </TabsList>

        <TabsContent value="staff">
          <SectionCard title="Admin users">
            <DataTable
              loading={staff.isLoading}
              rows={staff.data ?? []}
              columns={[
                { key: "name", label: "Member", render: (r) => (
                  <div>
                    <p className="font-medium text-foreground">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.email}</p>
                  </div>
                ) },
                { key: "role", label: "Role" },
                { key: "scope", label: "Scope" },
                { key: "lastActive", label: "Last active" },
                { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
              ]}
            />
          </SectionCard>
        </TabsContent>

        <TabsContent value="roles">
          <div className="grid gap-4 md:grid-cols-2">
            {(roles.data ?? []).map((role) => (
              <SectionCard key={role.id} title={role.name} description={`${role.members} members`}>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.map((permission) => (
                    <Badge key={permission} variant="secondary">{permission}</Badge>
                  ))}
                </div>
              </SectionCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <SectionCard title="Activity log" description="Every administrative action is recorded">
            <DataTable
              loading={logs.isLoading}
              rows={logs.data ?? []}
              columns={[
                { key: "actor", label: "Actor" },
                { key: "action", label: "Action" },
                { key: "target", label: "Target" },
                { key: "at", label: "When", className: "text-right" },
              ]}
            />
          </SectionCard>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}

function InviteStaffDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "", scope: "" });

  const invite = useMutation({
    mutationFn: inviteStaff,
    onSuccess: () => {
      toast.success("Invitation sent");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="mr-2 h-4 w-4" /> Invite member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
          <DialogDescription>They receive an email invite to set a password.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {([
            ["name", "Full name", "Ananya Bose"],
            ["email", "Work email", "ananya@quickpress.in"],
            ["role", "Role", "Operations Manager"],
            ["scope", "Scope", "Mumbai"],
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
          <Button disabled={invite.isPending} onClick={() => invite.mutate(form)}>Send invite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
