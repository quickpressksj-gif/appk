import { useNavigate } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";

import { Toaster } from "@/shared/ui/sonner";

import { RiderEmptyState } from "../../components/RiderPrimitives";
import { RiderTopBar } from "../../components/RiderTopBar";
import { riderRoutes } from "../../navigation/rider-routes";

/**
 * Announcements.
 *
 * MISSING BACKEND ENDPOINT: the FastAPI backend publishes no rider
 * announcements/campaign feed. The fabricated campaign, incentive and
 * maintenance posts previously loaded from `rider-notifications-mock` have been
 * removed from this production screen; the route stays reachable and states
 * honestly that there is nothing to show yet.
 */
export function AnnouncementsScreen() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Announcements"
          subtitle="Campaigns, incentives and system updates"
          onBack={() => navigate({ to: riderRoutes.notifications })}
        />

        <div className="px-5 pb-32 pt-4">
          <RiderEmptyState
            icon={Megaphone}
            title="No announcements available"
            body="Company announcements will appear here once they are published by QuickPress."
          />
        </div>
      </div>
      <Toaster />
    </main>
  );
}
