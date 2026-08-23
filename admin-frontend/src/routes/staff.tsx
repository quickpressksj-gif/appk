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
  ShieldAlert,
  UserCheck,
  Filter,
  Check,
  X,
  Building,
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
  head: () => adminHead("Staff & Role Permissions", "Internal team accounts, RBAC matrices, and audit logs."),
  component: StaffPage,
});

export function StaffPage() {
  const staff = useQuery({ queryKey: ["admin", "staff"], queryFn: fetchStaff });
  const roles = useQuery({ queryKey: ["admin", "roles"], queryFn: fetchRoles });
  const logs = useQuery({ queryKey: ["admin", "activity-logs"], queryFn: fetchActivityLogs });

  const [activeTab, setActiveTab] = useState("staff");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

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
      const matchQuery = !q || [s.name, s.email, s.role, s.scope].join(" ").toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || s.role.toLowerCase() === roleFilter.toLowerCase();
      return matchQuery && matchRole;
    });
  }, [allStaff, searchQuery, roleFilter]);

  const permissionsList = [
    { key: "orders", label: "Manage Orders & Live Dispatch" },
    { key: "partners", label: "Approve & Manage Partner Stores" },
    { key: "riders", label: "Fleet Governance & Rider Verification" },
    { key: "services", label: "Master Service Catalog & Pricing" },
    { key: "finance", label: "Wallet Settlements & Payout Approvals" },
    { key: "cities", label: "India Cities & Localities Coverage" },
    { key: "campaigns", label: "Push Broadcasts & Notifications" },
    { key: "staff", label: "Staff Invites & RBAC Management" },
  ];

  return (
    <AdminShell
      title="Staff & Role-Based Access Control (RBAC)"
      subtitle="Manage internal operations team, configure role permission boundaries, and review security audit logs."
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
              hint: "Secured with 2-Factor Authentication",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "roles-count",
              label: "Security Roles",
              value: metrics.totalRoles.toLocaleString("en-IN"),
              hint: "Granular access level tiers",
              positive: true,
            }}
          />
          <KpiCard
            kpi={{
              id: "audit-records",
              label: "Immutable Audit Trail",
              value: metrics.totalLogs.toLocaleString("en-IN"),
              hint: "Security mutations logged",
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
              Team Directory ({allStaff.length})
            </TabsTrigger>
            <TabsTrigger value="roles" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
              Permissions Matrix ({allRoles.length})
            </TabsTrigger>
            <TabsTrigger value="logs" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-xs">
              Security Audit Timeline ({allLogs.length})
            </TabsTrigger>
          </TabsList>

          {/* =========================================================================
              TAB 1: TEAM DIRECTORY (CARDS & TABLE)
          ========================================================================= */}
          <TabsContent value="staff" className="space-y-6">
            <SectionCard>
              <div className="grid gap-3 sm:grid-cols-12">
                <div className="relative sm:col-span-8">
                  <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search staff by name, email, role, or territory..."
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div className="sm:col-span-4">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="h-10 rounded-xl bg-zinc-50 border-zinc-200 text-xs">
                      <SelectValue placeholder="Filter by Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="ops manager">Ops Manager</SelectItem>
                      <SelectItem value="support lead">Support Lead</SelectItem>
                      <SelectItem value="finance lead">Finance Lead</SelectItem>
                      <SelectItem value="super admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SectionCard>

            {/* Visual Team Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStaff.map((m) => (
                <div
                  key={m.id}
                  className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs transition-all hover:shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900 font-black text-sm shadow-xs">
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-zinc-900 leading-tight">{m.name}</h4>
                        <p className="text-xs text-zinc-400 font-medium">{m.email}</p>
                      </div>
                    </div>
                    <StatusPill value={m.status} />
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">Assigned Role:</span>
                      <span className="font-bold text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded-md">
                        {m.role}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">Territory Scope:</span>
                      <span className="font-bold text-emerald-800 flex items-center gap-1">
                        <MapPin className="size-3 text-emerald-600" />
                        {m.scope}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">Last Active:</span>
                      <span className="text-zinc-500 font-mono text-[11px]">{m.lastActive}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* =========================================================================
              TAB 2: ROLES & PERMISSIONS MATRIX
          ========================================================================= */}
          <TabsContent value="roles" className="space-y-6">
            <SectionCard
              title="Role-Based Access Matrix"
              description="Standardized privilege levels across administrative roles"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50">
                      <th className="py-3 px-4 font-bold text-zinc-700">Platform Capability</th>
                      <th className="py-3 px-4 font-bold text-center text-zinc-700">Super Admin</th>
                      <th className="py-3 px-4 font-bold text-center text-zinc-700">Ops Manager</th>
                      <th className="py-3 px-4 font-bold text-center text-zinc-700">Support Lead</th>
                      <th className="py-3 px-4 font-bold text-center text-zinc-700">Finance Lead</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {permissionsList.map((p, idx) => (
                      <tr key={p.key} className="hover:bg-zinc-50/50">
                        <td className="py-3 px-4 font-medium text-zinc-900">{p.label}</td>
                        {/* Super Admin */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            <Check className="size-3.5" />
                          </span>
                        </td>
                        {/* Ops Manager */}
                        <td className="py-3 px-4 text-center">
                          {["orders", "partners", "riders", "services", "cities"].includes(p.key) ? (
                            <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold">
                              <Check className="size-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex size-5 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 font-bold">
                              <X className="size-3.5" />
                            </span>
                          )}
                        </td>
                        {/* Support Lead */}
                        <td className="py-3 px-4 text-center">
                          {["orders", "campaigns"].includes(p.key) ? (
                            <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold">
                              <Check className="size-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex size-5 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 font-bold">
                              <X className="size-3.5" />
                            </span>
                          )}
                        </td>
                        {/* Finance Lead */}
                        <td className="py-3 px-4 text-center">
                          {["finance", "orders"].includes(p.key) ? (
                            <span className="inline-flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold">
                              <Check className="size-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex size-5 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 font-bold">
                              <X className="size-3.5" />
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </TabsContent>

          {/* =========================================================================
              TAB 3: SECURITY AUDIT TIMELINE
          ========================================================================= */}
          <TabsContent value="logs" className="space-y-4">
            <SectionCard
              title="Immutable Security & Audit Trail"
              description="Real-time chronological stream of all admin mutations and access events"
            >
              <DataTable
                loading={logs.isLoading}
                rows={allLogs}
                emptyMessage="No audit logs recorded."
                columns={[
                  {
                    key: "actor",
                    label: "Operator / Admin",
                    render: (r) => (
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800 font-black text-xs">
                          {r.actor.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-zinc-900 text-xs">{r.actor}</span>
                      </div>
                    ),
                  },
                  {
                    key: "action",
                    label: "Operation Performed",
                    render: (r) => (
                      <span className="inline-flex items-center rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 font-mono text-[10px] font-bold">
                        {r.action}
                      </span>
                    ),
                  },
                  {
                    key: "target",
                    label: "Target Resource",
                    render: (r) => <span className="font-mono text-xs text-zinc-700 font-bold">{r.target}</span>,
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
