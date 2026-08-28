import { createFileRoute } from "@tanstack/react-router";

import { EarningsScreen } from "../screens/EarningsScreen";
import { requirePartnerAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/wallet")({
  beforeLoad: requirePartnerAuth,
  head: () => ({
    meta: [
      { title: "Payouts & Settlements · QuickPress Partner" },
      { name: "description", content: "Weekly payout settlements, bank transfer and payout history." },
      { property: "og:title", content: "Payouts & Settlements · QuickPress Partner" },
      { property: "og:description", content: "Weekly payout settlements, bank transfer and payout history." },
    ],
  }),
  component: EarningsScreen,
});
