import { createFileRoute } from "@tanstack/react-router";

import { BusinessSettingsScreen } from "../screens/BusinessSettingsScreen";
import { requirePartnerAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/settings")({
  beforeLoad: requirePartnerAuth,
  head: () => ({
    meta: [
      { title: "Store Settings · QuickPress Partner" },
      { name: "description", content: "Configure auto-accept, order alarms and business preferences." },
      { property: "og:title", content: "Store Settings · QuickPress Partner" },
      { property: "og:description", content: "Configure auto-accept, order alarms and business preferences." },
    ],
  }),
  component: BusinessSettingsScreen,
});
