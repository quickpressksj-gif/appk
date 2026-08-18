import { createFileRoute } from "@tanstack/react-router";

import { PartnerProvider } from "../context/PartnerContext";
import { PartnerProfileScreen } from "../screens/PartnerProfileScreen";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Partner Profile · QuickPress Partner" },
      { name: "description", content: "Your business profile, tier and account settings." },
      { property: "og:title", content: "Partner Profile · QuickPress Partner" },
      { property: "og:description", content: "Your business profile, tier and account settings." },
    ],
  }),
  component: () => (
    <PartnerProvider>
      <PartnerProfileScreen />
    </PartnerProvider>
  ),
});
