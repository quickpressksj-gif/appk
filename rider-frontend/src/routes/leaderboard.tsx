import { createFileRoute } from "@tanstack/react-router";
import { RiderLeaderboardScreen } from "../screens/RiderLeaderboardScreen";
import { requireRiderAuth } from "../lib/auth-guard";

export const Route = createFileRoute("/leaderboard")({
  beforeLoad: () => {
    requireRiderAuth();
  },
  head: () => ({
    meta: [
      { title: "City Leaderboard — QuickPress Captain" },
      {
        name: "description",
        content: "QuickPress Captain City Leaderboard, Weekly Prize Pool, and Top Captains Ranking",
      },
    ],
  }),
  component: RiderLeaderboardScreen,
});
