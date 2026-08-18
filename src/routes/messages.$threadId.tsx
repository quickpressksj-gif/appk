import { createFileRoute } from "@tanstack/react-router";

import { PartnerProvider } from "../context/PartnerContext";
import { ChatScreen } from "../screens/ChatScreen";

export const Route = createFileRoute("/messages/$threadId")({
  head: () => ({
    meta: [
      { title: "Conversation · QuickPress Partner" },
      { name: "description", content: "Chat with customers, riders, support and admin." },
      { property: "og:title", content: "Conversation · QuickPress Partner" },
      { property: "og:description", content: "Chat with customers, riders, support and admin." },
    ],
  }),
  component: ChatRoute,
});

function ChatRoute() {
  const { threadId } = Route.useParams();
  return (
    <PartnerProvider>
      <ChatScreen threadId={threadId} />
    </PartnerProvider>
  );
}