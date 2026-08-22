import { createFileRoute } from "@tanstack/react-router";

import { OrdersScreen } from "../screens/OrdersScreen";
import { requirePartnerAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/orders/")({
  beforeLoad: requirePartnerAuth,
  head: () => ({
    meta: [
      { title: "Partner Orders · QuickPress Partner" },
      { name: "description", content: "Manage incoming, processing and ready QuickPress orders." },
      { property: "og:title", content: "Partner Orders · QuickPress Partner" },
      { property: "og:description", content: "Manage incoming, processing and ready QuickPress orders." },
    ],
  }),
  component: OrdersScreen,
});
