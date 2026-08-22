import { createFileRoute } from "@tanstack/react-router";

import { ShopManagementScreen } from "../screens/ShopManagementScreen";
import { requirePartnerAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/shop")({
  beforeLoad: requirePartnerAuth,
  head: () => ({
    meta: [
      { title: "Manage Shop · QuickPress Partner" },
      { name: "description", content: "Update your store profile, operating hours and delivery radius." },
      { property: "og:title", content: "Manage Shop · QuickPress Partner" },
      { property: "og:description", content: "Update your store profile, operating hours and delivery radius." },
    ],
  }),
  component: ShopManagementScreen,
});
