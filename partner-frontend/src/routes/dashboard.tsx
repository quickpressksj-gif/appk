import { createFileRoute } from "@tanstack/react-router";

import { PartnerDashboardScreen } from "../screens/PartnerDashboardScreen";
import { requirePartnerAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: requirePartnerAuth,
  head: () => ({
    meta: [
      { title: "Partner Dashboard · QuickPress Partner" },
      { name: "description", content: "Track live orders, capacity and earnings at a glance." },
      { property: "og:title", content: "Partner Dashboard · QuickPress Partner" },
      { property: "og:description", content: "Track live orders, capacity and earnings at a glance." },
    ],
  }),
  component: PartnerDashboardScreen,
});
