import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { AdminShell } from "../components/AdminShell";
import { SectionCard } from "../components/AdminUI";
import { fetchSettings, saveSettings, type AdminSettings } from "../api/settings";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/settings")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Settings", "Configure QuickPress platform, business, integration and finance settings."),
  component: SettingsPage,
});

const GROUPS = [
  { key: "platform", label: "Platform" },
  { key: "business", label: "Business" },
  { key: "integrations", label: "Integrations" },
  { key: "finance", label: "Taxes & commission" },
] as const;

const LABELS: Record<string, string> = {
  platformName: "Platform name",
  supportEmail: "Support email",
  supportPhone: "Support phone",
  defaultCity: "Default city",
  currency: "Currency",
  legalName: "Legal entity",
  gstin: "GSTIN",
  address: "Registered address",
  payoutCycle: "Payout cycle",
  paymentGateway: "Payment gateway",
  paymentKeyId: "Payment key ID",
  firebaseProject: "Firebase project",
  googleMapsKey: "Google Maps key",
  smtpHost: "SMTP host",
  smtpUser: "SMTP user",
  smsProvider: "SMS provider",
  smsSenderId: "SMS sender ID",
  gstPercent: "GST",
  serviceTax: "Service tax",
  defaultCommission: "Partner commission",
  riderCommission: "Rider commission",
};

function SettingsPage() {
  const settings = useQuery({ queryKey: ["admin", "settings"], queryFn: fetchSettings });
  const [draft, setDraft] = useState<AdminSettings | null>(null);

  useEffect(() => {
    if (settings.data) setDraft(settings.data);
  }, [settings.data]);

  const save = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => toast.success("Settings saved"),
  });

  return (
    <AdminShell
      title="Settings"
      subtitle="Platform configuration, integrations and finance rules."
      actions={
        <Button size="sm" disabled={!draft || save.isPending} onClick={() => draft && save.mutate(draft)}>
          <Save className="mr-2 h-4 w-4" /> Save changes
        </Button>
      }
    >
      <Tabs defaultValue="platform" className="space-y-4">
        <TabsList>
          {GROUPS.map((group) => (
            <TabsTrigger key={group.key} value={group.key}>{group.label}</TabsTrigger>
          ))}
        </TabsList>

        {GROUPS.map((group) => (
          <TabsContent key={group.key} value={group.key}>
            <SectionCard title={group.label} description="Applies across all QuickPress applications">
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(draft?.[group.key] ?? {}).map(([field, value]) => (
                  <div key={field} className="space-y-1.5">
                    <Label htmlFor={field}>{LABELS[field] ?? field}</Label>
                    <Input
                      id={field}
                      value={String(value)}
                      onChange={(e) =>
                        setDraft((prev) =>
                          prev
                            ? { ...prev, [group.key]: { ...prev[group.key], [field]: e.target.value } }
                            : prev,
                        )
                      }
                    />
                  </div>
                ))}
                {settings.isLoading ? <p className="text-sm text-muted-foreground">Loading settings…</p> : null}
              </div>
            </SectionCard>
          </TabsContent>
        ))}
      </Tabs>
    </AdminShell>
  );
}
