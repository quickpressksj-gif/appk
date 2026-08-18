import { createFileRoute } from "@tanstack/react-router";

import { WalletScreen } from "../screens/WalletScreen";

export const Route = createFileRoute("/wallet/")({
  head: () => ({
    meta: [
      { title: "Wallet & Earnings · QuickPress Partner" },
      {
        name: "description",
        content:
          "Track wallet balance, daily and monthly earnings, transactions, settlements and withdrawals.",
      },
      { property: "og:title", content: "Wallet & Earnings · QuickPress Partner" },
      {
        property: "og:description",
        content:
          "Track wallet balance, daily and monthly earnings, transactions, settlements and withdrawals.",
      },
    ],
  }),
  component: WalletScreen,
});
