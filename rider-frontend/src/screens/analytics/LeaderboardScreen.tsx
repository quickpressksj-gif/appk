import { useNavigate } from "@tanstack/react-router";
import { Trophy } from "lucide-react";

import { Toaster } from "@/shared/ui/sonner";

import { RiderEmptyState, SectionHeading } from "../../components/RiderPrimitives";
import { RiderBellAction, RiderTopBar } from "../../components/RiderTopBar";
import { riderRoutes } from "../../navigation/rider-routes";

/**
 * Rider leaderboard.
 *
 * MISSING BACKEND ENDPOINT: there is no rider leaderboard/ranking endpoint on the
 * FastAPI backend. The fabricated rider names, ranks, scores and earnings that
 * previously came from `rider-analytics-mock` have been removed from this
 * production screen. Route, navigation and layout are preserved.
 */
export function LeaderboardScreen() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Leaderboard"
          subtitle="Where you stand today"
          onBack={() => navigate({ to: riderRoutes.analytics })}
          action={<RiderBellAction count={0} />}
        />

        <div className="px-5 pb-32 pt-4">
          <SectionHeading title="Top Riders" />
          <RiderEmptyState
            icon={Trophy}
            title="Leaderboard is not available yet"
            body="Rankings will appear here once rider leaderboard data is published by the backend."
          />
        </div>
      </div>
      <Toaster />
    </main>
  );
}
