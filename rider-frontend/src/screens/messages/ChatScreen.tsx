import { useNavigate } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";

import { Toaster } from "@/shared/ui/sonner";

import { RiderEmptyState } from "../../components/RiderPrimitives";
import { RiderTopBar } from "../../components/RiderTopBar";
import { riderRoutes } from "../../navigation/rider-routes";

/**
 * Chat thread.
 *
 * MISSING BACKEND ENDPOINT: there is no chat/message API. The previous
 * implementation simulated incoming replies, typing indicators and read
 * receipts locally, which is fake functionality in production; it has been
 * removed. The route stays reachable and reports the feature honestly.
 */
export function ChatScreen() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Chat"
          subtitle="Conversation"
          onBack={() => navigate({ to: riderRoutes.messages })}
        />

        <div className="px-5 pb-32 pt-4">
          <RiderEmptyState
            icon={MessageSquare}
            title="This conversation is unavailable"
            body="In-app messaging is not enabled yet. Call the customer or partner from the order screen instead."
          />
        </div>
      </div>
      <Toaster />
    </main>
  );
}
