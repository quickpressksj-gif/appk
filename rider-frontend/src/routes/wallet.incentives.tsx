import { createFileRoute } from "@tanstack/react-router";

import { IncentivesScreen } from "../screens/wallet/IncentivesScreen";

export const Route = createFileRoute("/wallet/incentives")({
  head: () => ({
    meta: [
      { title: "Incentives · QuickPress Rider" },
      { name: "description", content: "Active bonuses, quests and achievement rewards for riders." },
      { property: "og:title", content: "Incentives · QuickPress Rider" },
      { property: "og:description", content: "Active bonuses, quests and achievement rewards for riders." },
    ],
  }),
  component: IncentivesScreen,
});
