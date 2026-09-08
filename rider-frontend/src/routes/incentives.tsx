import { createFileRoute } from "@tanstack/react-router";
import { RiderIncentivesScreen } from "../screens/RiderIncentivesScreen";
import { requireRiderAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/incentives")({
  beforeLoad: () => {
    requireRiderAuth();
  },
  head: () => ({
    meta: [
      { title: "Incentives & Targets — QuickPress Captain" },
      {
        name: "description",
        content: "Track daily trip milestone targets, peak hour rush quests, weekly streaks, and zero-commission bonuses.",
      },
    ],
  }),
  component: RiderIncentivesScreen,
});
