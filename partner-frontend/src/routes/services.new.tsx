import { createFileRoute } from "@tanstack/react-router";

import { AddServiceScreen } from "../screens/AddServiceScreen";
import { requirePartnerAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/services/new")({
  beforeLoad: requirePartnerAuth,
  head: () => ({
    meta: [
      { title: "Add Service · QuickPress Partner" },
      {
        name: "description",
        content: "Publish a new laundry, dry cleaning or pressing service to your store catalog.",
      },
      { property: "og:title", content: "Add Service · QuickPress Partner" },
      {
        property: "og:description",
        content: "Publish a new laundry, dry cleaning or pressing service to your store catalog.",
      },
    ],
  }),
  component: AddServiceScreen,
});
