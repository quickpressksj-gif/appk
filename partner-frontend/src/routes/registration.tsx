import { createFileRoute } from "@tanstack/react-router";

import { PartnerProvider } from "../context/PartnerContext";
import { BusinessRegistrationScreen } from "../screens/BusinessRegistrationScreen";

export const Route = createFileRoute("/registration")({
  head: () => ({
    meta: [
      { title: "Business Registration · QuickPress Partner" },
      { name: "description", content: "Register your laundry business on QuickPress." },
      { property: "og:title", content: "Business Registration · QuickPress Partner" },
      { property: "og:description", content: "Register your laundry business on QuickPress." },
    ],
  }),
  component: () => (
    <PartnerProvider>
      <BusinessRegistrationScreen />
    </PartnerProvider>
  ),
});
