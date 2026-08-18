import { createFileRoute } from "@tanstack/react-router";

import { WalletWithdrawScreen } from "../screens/WalletWithdrawScreen";

export const Route = createFileRoute("/wallet/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw Balance · QuickPress Partner" },
      {
        name: "description",
        content: "Withdraw your QuickPress wallet balance to your settlement bank account.",
      },
      { property: "og:title", content: "Withdraw Balance · QuickPress Partner" },
      {
        property: "og:description",
        content: "Withdraw your QuickPress wallet balance to your settlement bank account.",
      },
    ],
  }),
  component: WalletWithdrawScreen,
});
