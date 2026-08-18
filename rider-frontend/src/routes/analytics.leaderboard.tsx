import { createFileRoute } from "@tanstack/react-router";

import { LeaderboardScreen } from "../screens/analytics/LeaderboardScreen";

const TITLE = "Leaderboard · QuickPress Rider";
const DESCRIPTION =
  "City, area, weekly and monthly rider rankings with top performer standings.";

export const Route = createFileRoute("/analytics/leaderboard")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: LeaderboardScreen,
});
