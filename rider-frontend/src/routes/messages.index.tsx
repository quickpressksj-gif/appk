import { createFileRoute } from "@tanstack/react-router";

import { CommunicationCenterScreen } from "../screens/messages/CommunicationCenterScreen";

export const Route = createFileRoute("/messages/")({
  head: () => ({
    meta: [
      { title: "Communication Center · QuickPress Rider" },
      {
        name: "description",
        content: "Chat and call customers, partners and support, plus admin broadcasts.",
      },
      { property: "og:title", content: "Communication Center · QuickPress Rider" },
      {
        property: "og:description",
        content: "Chat and call customers, partners and support, plus admin broadcasts.",
      },
    ],
  }),
  component: CommunicationCenterScreen,
});
