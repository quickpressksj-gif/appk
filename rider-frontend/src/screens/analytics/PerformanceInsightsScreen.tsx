import { useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import { Toaster } from "@/shared/ui/sonner";

import { RiderEmptyState, SectionHeading } from "../../components/RiderPrimitives";
import { RiderBellAction, RiderTopBar } from "../../components/RiderTopBar";
import { riderRoutes } from "../../navigation/rider-routes";

/**
 * Performance insights & active bonuses.
 *
 * MISSING BACKEND ENDPOINTS: there is no rider insights endpoint and no
 * `GET /api/rider/incentives`. The fabricated insight cards, comparison
 * percentages and incentive board previously sourced from
 * `rider-analytics-mock` have been removed from this production screen.
 */
export function PerformanceInsightsScreen() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Insights"
          subtitle="Smart tips from your history"
          onBack={() => navigate({ to: riderRoutes.analytics })}
          action={<RiderBellAction count={0} />}
        />

        <div className="px-5 pb-32 pt-4">
          <SectionHeading title="Performance Insights" />
          <RiderEmptyState
            icon={Sparkles}
            title="Insights are not available yet"
            body="Performance insights and active bonuses will appear here once the backend publishes them."
          />
        </div>
      </div>
      <Toaster />
    </main>
  );
}
