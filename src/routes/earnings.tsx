import { createFileRoute } from "@tanstack/react-router";

import { PartnerProvider } from "../context/PartnerContext";
import { EarningsScreen } from "../screens/EarningsScreen";

export const Route = createFileRoute("/earnings")({
  head: () => ({
    meta: [
      { title: "Partner Earnings · QuickPress Partner" },
      { name: "description", content: "Daily, weekly and monthly earnings with payout history." },
      { property: "og:title", content: "Partner Earnings · QuickPress Partner" },
      { property: "og:description", content: "Daily, weekly and monthly earnings with payout history." },
    ],
  }),
  component: () => (
    <PartnerProvider>
      <EarningsScreen />
    </PartnerProvider>
  ),
});
