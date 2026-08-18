import { createFileRoute } from "@tanstack/react-router";

import { CustomerProfileScreen } from "../screens/CustomerProfileScreen";

export const Route = createFileRoute("/customers/$customerId")({
  head: () => ({
    meta: [
      { title: "Customer Profile · QuickPress Partner" },
      {
        name: "description",
        content:
          "Customer profile with personal information, order history, favourite services, membership, referrals and saved addresses.",
      },
      { property: "og:title", content: "Customer Profile · QuickPress Partner" },
      {
        property: "og:description",
        content:
          "Customer profile with personal information, order history, favourite services, membership, referrals and saved addresses.",
      },
    ],
  }),
  component: CustomerProfileScreen,
});
