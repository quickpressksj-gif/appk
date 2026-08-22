import { createFileRoute } from "@tanstack/react-router";

import { CustomersScreen } from "../screens/CustomersScreen";
import { requirePartnerAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/customers")({
  beforeLoad: requirePartnerAuth,
  head: () => ({
    meta: [
      { title: "Partner Customers · QuickPress Partner" },
      { name: "description", content: "Customer order histories, retention rates and review ratings." },
      { property: "og:title", content: "Partner Customers · QuickPress Partner" },
      { property: "og:description", content: "Customer order histories, retention rates and review ratings." },
    ],
  }),
  component: CustomersScreen,
});
