import { createFileRoute } from "@tanstack/react-router";

import { EarningsScreen } from "../screens/EarningsScreen";
import { requirePartnerAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/earnings")({
  beforeLoad: requirePartnerAuth,
  head: () => ({
    meta: [
      { title: "Partner Earnings · QuickPress Partner" },
      { name: "description", content: "Daily, weekly and monthly earnings with payout history." },
      { property: "og:title", content: "Partner Earnings · QuickPress Partner" },
      { property: "og:description", content: "Daily, weekly and monthly earnings with payout history." },
    ],
  }),
  component: EarningsScreen,
});
