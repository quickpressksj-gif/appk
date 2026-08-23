import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UserPlus,
  ShieldCheck,
  Users,
  Key,
  History,
  Search,
  Sparkles,
  Lock,
  Mail,
  MapPin,
  CheckCircle2,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AdminShell } from "../components/AdminShell";
import { DataTable, SectionCard, StatusPill, KpiCard } from "../components/AdminUI";
import { fetchActivityLogs, fetchRoles, fetchStaff, inviteStaff, type StaffMember } from "../api/staff";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/staff")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Staff & Role Permissions", "Manage QuickPress administrators, permissions and audit trails."),
  component: StaffPage,
});

export function StaffPage() {
  const staff = useQuery({ queryKey: ["admin", "staff"], queryFn: fetchStaff });
  const roles = useQuery({ queryKey: ["admin", "roles"], queryFn: fetchRoles });
  const logs = useQuery({ queryKey: ["admin", "activity-logs"], queryFn: fetchActivityLogs });

  const [activeTab, setActiveTab] = useState("staff");
  const [searchQuery, setSearchQuery] = useState("");

  const allStaff = staff.data ?? [];
  const allRoles = roles.data ?? [];
  const allLogs = logs.data ?? [];

  const metrics = useMemo(() => {
    const total = allStaff.length;
    const active = allStaff.filter((s) => s.status === "Active").length;
    const totalRoles = allRoles.length;
    const totalLogs = allLogs.length;
    return { total, active, totalRoles, totalLogs };
  }, [allStaff, allRoles, allLogs]);

  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allStaff.filter((s) => {
      return !q || [s.name, s.email, s.role, s.scope].join(" ").toLowerCase().includes(q);
    });
  }, [allStaff, searchQuery]);

  return (
    <AdminShell
      title="Staff & Role-Based Access Control"
      subtitle="Manage internal administrators, dispatchers, role permissions, and immutable audit logs."
      actions={<InviteStaffDialog />}
    >
      <div className="space-y-6">
        {/* =========================================================================
            1. TOP METRIC CARDS
        ========================================================================= */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            kpi={{
              id: "tot-staff",
              label: "Team Members",
              value: metrics.total.toLocaleString("en-IN"),
              hint: `${metrics.active} active platform operators`,
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "act-admins",
              label: "Active Administrators",
              value: metrics.active.toLocaleString("en-IN"),
              hint: "Granted management console access",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "roles-count",
              label: "Configured Roles",
              value: metrics.totalRoles.toLocaleString("en-IN"),
              hint: "Fine-grained permission matrices",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "audit-records",
              label: "Audit Log Records",
              value: metrics.totalLogs.toLocaleString("en-IN"),
              hint: "Security and mutation trail",
              positive: true,
            }}
          />
        </div>

        {/* =========================================================================
            2. MAIN TABS
        ========================================================================= */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-zinc-100 p-1 rounded-xl">
            <TabsTrigger value="staff" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
              Staff Members ({allStaff.length})
            </TabsTrigger>
            <TabsTrigger value="roles" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
              Roles & Permissions ({allRoles.length})
            </TabsTrigger>
            <TabsTrigger value="logs" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
              Security Audit Log ({allLogs.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: STAFF DIRECTORY */}
          <TabsContent value="staff" className="space-y-4">
            <SectionCard>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search team member name, work email, role, or operating scope..."
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </SectionCard>

            <SectionCard
              title="Internal Administrators & Dispatchers"
              description="Team members with administrative dashboard access privileges."
            >
              <DataTable
                loading={staff.isLoading}
                rows={filteredStaff}
                emptyMessage="No staff members found."
                columns={[
                  {
                    key: "name",
                    label: "Team Member",
                    render: (r) => (
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs">
                          {r.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 text-xs">{r.name}</p>
                          <p className="text-[10px] text-zinc-400 font-medium">{r.email}</p>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "role",
                    label: "System Role",
                    render: (r) => (
                      <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                        {r.role}
                      </span>
                    ),
                  },
                  {
                    key: "scope",
                    label: "Operating Scope",
                    render: (r) => (
                      <span className="inline-flex items-center gap-1 text-xs text-zinc-700 font-medium">
                        <MapPin className="size-3 text-zinc-400" />
                        {r.scope}
                      </span>
                    ),
                  },
                  {
                    key: "lastActive",
                    label: "Last Active",
                    render: (r) => <span className="text-xs text-zinc-500 font-medium">{r.lastActive}</span>,
                  },
                  {
                    key: "status",
                    label: "Access Status",
                    render: (r) => <StatusPill value={r.status} />,
                  },
                ]}
              />
            </SectionCard>
          </TabsContent>

          {/* TAB 2: ROLES & PERMISSIONS */}
          <TabsContent value="roles" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {allRoles.map((role) => (
                <div
                  key={role.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <Key className="size-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-zinc-900">{role.name}</h4>
                        <p className="text-[10px] text-zinc-400 font-semibold">{role.members} assigned members</p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-zinc-400">#{role.id}</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100">
                    <p className="text-[11px] font-bold uppercase text-zinc-500 mb-2">Granted Permissions:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {role.permissions.map((perm) => (
                        <span
                          key={perm}
                          className="inline-flex items-center rounded-lg bg-zinc-100 px-2.5 py-1 font-mono text-[10px] font-bold text-zinc-700"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TAB 3: ACTIVITY LOG */}
          <TabsContent value="logs" className="space-y-4">
            <SectionCard
              title="Security & Mutation Audit Trail"
              description="Chronological log of administrative actions across the platform"
            >
              <DataTable
                loading={logs.isLoading}
                rows={allLogs}
                emptyMessage="No audit logs recorded."
                columns={[
                  {
                    key: "actor",
                    label: "Operator",
                    render: (r) => <span className="font-bold text-zinc-900 text-xs">{r.actor}</span>,
                  },
                  {
                    key: "action",
                    label: "Action Performed",
                    render: (r) => (
                      <span className="inline-flex items-center rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 font-mono text-[10px] font-bold">
                        {r.action}
                      </span>
                    ),
                  },
                  {
                    key: "target",
                    label: "Target Resource",
                    render: (r) => <span className="font-mono text-xs text-zinc-600 font-semibold">{r.target}</span>,
                  },
                  {
                    key: "at",
                    label: "Timestamp",
                    className: "text-right",
                    render: (r) => <span className="text-xs text-zinc-500 font-mono">{r.at}</span>,
                  },
                ]}
              />
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}

function InviteStaffDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Ops manager");
  const [scope, setScope] = useState("All cities");

  const inviteMutation = useMutation({
    mutationFn: () => inviteStaff({ name, email, role, scope }),
    onSuccess: () => {
      toast.success(`Invitation dispatched to ${email}!`);
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
      setOpen(false);
      setName("");
      setEmail("");
    },
    onError: () => {
      toast.error("Failed to send staff invitation.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-emerald-700 active:scale-95 shadow-xs"
        >
          <UserPlus className="size-3.5" />
          <span>Invite Member</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border-zinc-200">
        <DialogHeader>
          <DialogTitle className="text-base font-black text-zinc-900">Invite Team Member</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 font-medium">
            Send an administrative dashboard onboarding invite.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700">Full Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ananya Bose"
              className="h-10 rounded-xl text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700">Work Email Address</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ananya@quickpress.app"
              className="h-10 rounded-xl text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ops manager">Operations Manager</SelectItem>
                  <SelectItem value="Support lead">Support Lead</SelectItem>
                  <SelectItem value="Finance lead">Finance / Accounts</SelectItem>
                  <SelectItem value="Super admin">Super Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Operating Scope</Label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue placeholder="Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All cities">All India Markets</SelectItem>
                  <SelectItem value="Kasganj">Kasganj Hub</SelectItem>
                  <SelectItem value="Aligarh">Aligarh Hub</SelectItem>
                  <SelectItem value="Noida">Noida Hub</SelectItem>
                  <SelectItem value="Mumbai">Mumbai Hub</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" className="rounded-xl text-xs font-bold" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white"
            disabled={!name.trim() || !email.trim() || inviteMutation.isPending}
            onClick={() => inviteMutation.mutate()}
          >
            Dispatch Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
