import { createFileRoute } from "@tanstack/react-router";

import { ChatScreen } from "../screens/messages/ChatScreen";

export const Route = createFileRoute("/messages/$threadId")({
  head: () => ({
    meta: [
      { title: "Chat · QuickPress Rider" },
      {
        name: "description",
        content: "Rider chat with delivery status, read receipts and quick replies.",
      },
      { property: "og:title", content: "Chat · QuickPress Rider" },
      {
        property: "og:description",
        content: "Rider chat with delivery status, read receipts and quick replies.",
      },
    ],
  }),
  component: ChatScreen,
});
