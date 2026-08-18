import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Award } from "lucide-react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { RiderEmptyState, SectionHeading } from "../../components/RiderPrimitives";
import { RiderBellAction, RiderTopBar } from "../../components/RiderTopBar";
import { PerformanceKpiGrid } from "../../components/history/PerformancePanels";
import { PerformanceSkeleton } from "../../components/history/HistorySkeletons";
import { PullToRefreshShell } from "../../components/wallet/PullToRefreshShell";
import { useRiderResource } from "../../hooks/use-rider-resource";
import { riderRoutes } from "../../navigation/rider-routes";
import { loadRiderPerformance } from "../../data/rider-performance-adapter";

/**
 * Performance Dashboard.
 *
 * KPIs are derived only from real backend records (`GET /api/rider/dashboard`
 * and `GET /api/rider/history`). Metrics with no real source — acceptance rate,
 * on-time %, streaks, safety flags and achievement badges — are not fabricated;
 * the backend exposes no endpoint for them, so they are shown as unavailable.
 */
export function PerformanceScreen() {
  const navigate = useNavigate();
  const { data, isLoading } = useRiderResource(loadRiderPerformance);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(async () => {
    setNonce((value) => value + 1);
    toast.success("Performance refreshed");
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Performance"
          subtitle="Your delivery scorecard"
          onBack={() => navigate({ to: riderRoutes.history })}
          action={<RiderBellAction count={0} />}
        />

        {isLoading || !data ? (
          <PerformanceSkeleton />
        ) : (
          <PullToRefreshShell onRefresh={refresh}>
            <div key={nonce} className="px-5 pb-32 pt-4">
              <section>
                <SectionHeading title="Key Metrics" />
                <div className="mt-3">
                  {data.stats.length > 0 ? (
                    <PerformanceKpiGrid stats={data.stats} />
                  ) : (
                    <RiderEmptyState
                      icon={Award}
                      title="No performance data yet"
                      body="Complete deliveries and your scorecard will build itself here."
                    />
                  )}
                </div>
              </section>

              <section className="mt-6">
                <SectionHeading title="Achievements" />
                <RiderEmptyState
                  icon={Award}
                  title="Achievements are not available yet"
                  body="Badge and milestone tracking is not published by the backend yet."
                />
              </section>
            </div>
          </PullToRefreshShell>
        )}
      </div>
      <Toaster />
    </main>
  );
}
