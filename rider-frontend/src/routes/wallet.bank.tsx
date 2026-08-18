import { createFileRoute } from "@tanstack/react-router";

import { BankDetailsScreen } from "../screens/wallet/BankDetailsScreen";

export const Route = createFileRoute("/wallet/bank")({
  head: () => ({
    meta: [
      { title: "Bank Details · QuickPress Rider" },
      { name: "description", content: "Linked payout account and settlement schedule." },
      { property: "og:title", content: "Bank Details · QuickPress Rider" },
      { property: "og:description", content: "Linked payout account and settlement schedule." },
    ],
  }),
  component: BankDetailsScreen,
});
