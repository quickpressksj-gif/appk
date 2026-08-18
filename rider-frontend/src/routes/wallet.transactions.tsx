import { createFileRoute } from "@tanstack/react-router";

import { TransactionsScreen } from "../screens/wallet/TransactionsScreen";

export const Route = createFileRoute("/wallet/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions · QuickPress Rider" },
      { name: "description", content: "Credits, debits, tips and settlements in one ledger." },
      { property: "og:title", content: "Transactions · QuickPress Rider" },
      { property: "og:description", content: "Credits, debits, tips and settlements in one ledger." },
    ],
  }),
  component: TransactionsScreen,
});
