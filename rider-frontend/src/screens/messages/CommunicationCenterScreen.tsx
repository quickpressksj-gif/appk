import { useNavigate } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";

import { Toaster } from "@/shared/ui/sonner";

import { RiderEmptyState } from "../../components/RiderPrimitives";
import { RiderTopBar } from "../../components/RiderTopBar";
import { riderRoutes } from "../../navigation/rider-routes";

/**
 * Communication Center.
 *
 * MISSING BACKEND ENDPOINT: the FastAPI backend has no messaging/chat service
 * for riders (no threads, no message send, no realtime channel). The simulated
 * customer/partner/support threads from `rider-notifications-mock` have been
 * removed from this production screen so riders are never shown fake
 * conversations they cannot actually reply to.
 */
export function CommunicationCenterScreen() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Messages"
          subtitle="Chat with customers, partners and support"
          onBack={() => navigate({ to: riderRoutes.notifications })}
        />

        <div className="px-5 pb-32 pt-4">
          <RiderEmptyState
            icon={MessageSquare}
            title="Messaging is not available yet"
            body="In-app chat is not enabled on this account. Use the call buttons on an active order to reach the customer or partner."
          />
        </div>
      </div>
      <Toaster />
    </main>
  );
}
