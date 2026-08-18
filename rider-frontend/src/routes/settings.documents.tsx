import { createFileRoute } from "@tanstack/react-router";

import { DocumentsScreen } from "../screens/settings/DocumentsScreen";

export const Route = createFileRoute("/settings/documents")({
  head: () => ({
    meta: [
      { title: "Vehicle & Documents · QuickPress Rider" },
      { name: "description", content: "Vehicle information and KYC document status." },
      { property: "og:title", content: "Vehicle & Documents · QuickPress Rider" },
      { property: "og:description", content: "Vehicle information and KYC document status." },
    ],
  }),
  component: DocumentsScreen,
});
