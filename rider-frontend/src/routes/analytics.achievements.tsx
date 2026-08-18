import { createFileRoute } from "@tanstack/react-router";

import { AchievementsScreen } from "../screens/analytics/AchievementsScreen";

const TITLE = "Achievements · QuickPress Rider";
const DESCRIPTION =
  "Delivery milestones, rating badges, streak rewards and daily goal progress for riders.";

export const Route = createFileRoute("/analytics/achievements")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: AchievementsScreen,
});
