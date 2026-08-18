import { createFileRoute } from "@tanstack/react-router";

import { EarningsScreen } from "../screens/wallet/EarningsScreen";

export const Route = createFileRoute("/wallet/earnings")({
  head: () => ({
    meta: [
      { title: "Earnings · QuickPress Rider" },
      { name: "description", content: "Daily, weekly and monthly rider earnings with KPI breakdowns." },
      { property: "og:title", content: "Earnings · QuickPress Rider" },
      { property: "og:description", content: "Daily, weekly and monthly rider earnings with KPI breakdowns." },
    ],
  }),
  component: EarningsScreen,
});
