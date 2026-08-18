import { useNavigate } from "@tanstack/react-router";
import { Navigation2 } from "lucide-react";

import { Toaster } from "@/shared/ui/sonner";

import { RiderEmptyState, RiderPrimaryButton } from "../components/RiderPrimitives";
import { RiderTopBar } from "../components/RiderTopBar";
import { riderRoutes } from "../navigation/rider-routes";

/**
 * Legacy live-navigation prototype.
 *
 * This screen simulated turn-by-turn navigation: fabricated route steps, a fake
 * ticking ETA and a developer state-switcher for "GPS disabled" / "poor
 * network" / "rerouting". None of it was connected to a positioning or routing
 * service, so it cannot ship to riders.
 *
 * Real navigation is `/navigate/$orderId` (RiderNavigationScreen): it loads the
 * order from `GET /api/rider/orders/{id}`, geocodes and routes through the Maps
 * API, and streams live GPS fixes to the backend.
 */
export function LiveNavigationScreen() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Live Navigation"
          subtitle="Turn-by-turn guidance"
          onBack={() => navigate({ to: riderRoutes.orders })}
        />

        <div className="px-5 pb-32 pt-4">
          <RiderEmptyState
            icon={Navigation2}
            title="Start navigation from the order"
            body="Open the delivery in Orders and tap Navigate to get live routing, ETA and GPS tracking for that trip."
          />
          <div className="mt-4">
            <RiderPrimaryButton onClick={() => navigate({ to: riderRoutes.orders })}>
              Go to Orders
            </RiderPrimaryButton>
          </div>
        </div>
      </div>
      <Toaster />
    </main>
  );
}
