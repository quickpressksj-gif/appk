import { useNavigate } from "@tanstack/react-router";
import { MessagesSquare, Phone } from "lucide-react";
import { useMemo, useState } from "react";

import { Toaster } from "@shared/ui/sonner";

import { PartnerTopBar } from "../components/PartnerTopBar";
import { PartnerEmptyState } from "../components/PartnerPrimitives";
import { ChatBubble } from "../components/messages/ChatBubble";
import { ChatComposer } from "../components/messages/ChatComposer";
import { ChatSkeleton } from "../components/notifications/NotificationSkeletons";
import { OfflineBanner, useOnlineStatus } from "../components/notifications/OfflineBanner";
import { usePartnerResource } from "../hooks/use-partner-resource";
import { partnerRoutes } from "../navigation/partner-routes";
import {
  fetchPartnerNotificationsData,
  type ChatMessage,
} from "../data/partner-notifications-mock";

/** Sprint 3.8 — premium chat surface (UI only, local state, no backend). */
export function ChatScreen({ threadId }: { threadId: string }) {
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const { data } = usePartnerResource(fetchPartnerNotificationsData);
  const [drafts, setDrafts] = useState<ChatMessage[]>([]);

  const thread = useMemo(
    () => data?.threads.find((item) => item.id === threadId) ?? null,
    [data, threadId],
  );

  const readOnly = thread?.kind === "broadcast";
  const messages = thread ? [...thread.messages, ...drafts] : [];

  return (
    <main className="relative flex min-h-dvh flex-col overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col md:max-w-2xl lg:max-w-3xl">
        <PartnerTopBar
          title={thread?.name ?? "Conversation"}
          subtitle={thread ? `${thread.subtitle}${thread.online ? " · Online" : ""}` : "Loading"}
          onBack={() => navigate({ to: partnerRoutes.messages })}
          action={
            <button
              type="button"
              aria-label="Call contact"
              className="flex size-10 items-center justify-center rounded-2xl bg-muted text-foreground transition-all duration-300 hover:bg-accent active:scale-[0.94]"
            >
              <Phone className="size-5" />
            </button>
          }
        />

        {!data ? (
          <div className="px-5 pt-4">
            <ChatSkeleton />
          </div>
        ) : !thread ? (
          <div className="px-5 pt-4">
            <PartnerEmptyState
              icon={MessagesSquare}
              title="Conversation not found"
              body="This conversation is no longer available."
            />
          </div>
        ) : (
          <>
            <div className="animate-fade-in flex-1 space-y-3 px-5 pb-6 pt-4">
              {online ? null : (
                <OfflineBanner message="You can read messages, sending resumes when back online." />
              )}
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
            </div>

            <ChatComposer
              disabled={readOnly || !online}
              onAttach={() =>
                setDrafts((prev) => [
                  ...prev,
                  {
                    id: `draft-img-${prev.length + 1}`,
                    from: "partner",
                    type: "image",
                    text: "",
                    imageLabel: "attachment-preview.jpg",
                    time: "Now",
                    status: "sent",
                  },
                ])
              }
              onSend={(text) =>
                setDrafts((prev) => [
                  ...prev,
                  {
                    id: `draft-${prev.length + 1}`,
                    from: "partner",
                    type: "text",
                    text,
                    time: "Now",
                    status: "sent",
                  },
                ])
              }
            />
          </>
        )}
      </div>
      <Toaster />
    </main>
  );
}