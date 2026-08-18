import { useNavigate } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";

import { Toaster } from "@/shared/ui/sonner";

import { RiderEmptyState, RiderPrimaryButton } from "../../components/RiderPrimitives";
import { RiderBellAction, RiderTopBar } from "../../components/RiderTopBar";
import { riderRoutes } from "../../navigation/rider-routes";

/**
 * Analytics dashboard.
 *
 * MISSING BACKEND ENDPOINT: the FastAPI backend exposes no rider analytics
 * aggregate (no KPI ranges, trend series, goals or incentive board). The whole
 * screen previously rendered `rider-analytics-mock` fixtures — fabricated
 * earnings, trends and goals — which must not ship to riders.
 *
 * Metrics that DO have a real source are shown on Performance, which derives
 * them from `GET /api/rider/dashboard` and `GET /api/rider/history`.
 */
export function AnalyticsDashboardScreen() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Analytics"
          subtitle="Earnings and delivery trends"
          onBack={() => navigate({ to: riderRoutes.dashboard })}
          action={<RiderBellAction count={0} />}
        />

        <div className="px-5 pb-32 pt-4">
          <RiderEmptyState
            icon={BarChart3}
            title="Analytics are not available yet"
            body="Trend charts, goals and bonus tracking need backend analytics that are not published yet."
          />
          <div className="mt-4">
            <RiderPrimaryButton onClick={() => navigate({ to: riderRoutes.performance })}>
              View Performance
            </RiderPrimaryButton>
          </div>
        </div>
      </div>
      <Toaster />
    </main>
  );
}
