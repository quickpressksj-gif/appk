import { createFileRoute } from "@tanstack/react-router";

import { WalletHomeScreen } from "../screens/wallet/WalletHomeScreen";

export const Route = createFileRoute("/wallet/")({
  head: () => ({
    meta: [
      { title: "Rider Wallet · QuickPress Rider" },
      { name: "description", content: "Balance, earnings, incentives and payouts for riders." },
      { property: "og:title", content: "Rider Wallet · QuickPress Rider" },
      { property: "og:description", content: "Balance, earnings, incentives and payouts for riders." },
    ],
  }),
  component: WalletHomeScreen,
});
