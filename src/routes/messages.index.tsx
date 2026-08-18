import { createFileRoute } from "@tanstack/react-router";

import { PartnerProvider } from "../context/PartnerContext";
import { MessagesScreen } from "../screens/MessagesScreen";

export const Route = createFileRoute("/messages/")({
  head: () => ({
    meta: [
      { title: "Messages · QuickPress Partner" },
      {
        name: "description",
        content: "Customer, order, support and admin conversations for your store.",
      },
      { property: "og:title", content: "Messages · QuickPress Partner" },
      {
        property: "og:description",
        content: "Customer, order, support and admin conversations for your store.",
      },
    ],
  }),
  component: () => (
    <PartnerProvider>
      <MessagesScreen />
    </PartnerProvider>
  ),
});