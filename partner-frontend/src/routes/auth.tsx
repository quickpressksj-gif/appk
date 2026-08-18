import { createFileRoute } from "@tanstack/react-router";

import { PartnerProvider } from "../context/PartnerContext";
import { PartnerAuthScreen } from "../screens/PartnerAuthScreen";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Partner Login · QuickPress Partner" },
      { name: "description", content: "Sign in to your QuickPress partner store." },
      { property: "og:title", content: "Partner Login · QuickPress Partner" },
      { property: "og:description", content: "Sign in to your QuickPress partner store." },
    ],
  }),
  component: () => (
    <PartnerProvider>
      <PartnerAuthScreen />
    </PartnerProvider>
  ),
});
