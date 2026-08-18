import { useNavigate } from "@tanstack/react-router";
import { Award } from "lucide-react";

import { Toaster } from "@/shared/ui/sonner";

import { RiderEmptyState, SectionHeading } from "../../components/RiderPrimitives";
import { RiderBellAction, RiderTopBar } from "../../components/RiderTopBar";
import { riderRoutes } from "../../navigation/rider-routes";

/**
 * Achievements & badges.
 *
 * MISSING BACKEND ENDPOINT: the FastAPI backend exposes no rider achievements,
 * badge or goal endpoint (no `GET /api/rider/achievements`). The screen used to
 * render fixture badges/goals from `rider-analytics-mock`; that production use of
 * fake data has been removed. The screen, route and navigation are preserved and
 * show an honest unavailable state until a real endpoint exists.
 */
export function AchievementsScreen() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Achievements"
          subtitle="Badges, streaks and goals"
          onBack={() => navigate({ to: riderRoutes.analytics })}
          action={<RiderBellAction count={0} />}
        />

        <div className="px-5 pb-32 pt-4">
          <SectionHeading title="Badges & Goals" />
          <RiderEmptyState
            icon={Award}
            title="Achievements are not available yet"
            body="Badges, streaks and daily goals will appear here once achievement tracking is live."
          />
        </div>
      </div>
      <Toaster />
    </main>
  );
}
