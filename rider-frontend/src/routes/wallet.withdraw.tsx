import { createFileRoute } from "@tanstack/react-router";

import { WithdrawScreen } from "../screens/wallet/WithdrawScreen";

export const Route = createFileRoute("/wallet/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw · QuickPress Rider" },
      { name: "description", content: "Move rider earnings to your bank instantly." },
      { property: "og:title", content: "Withdraw · QuickPress Rider" },
      { property: "og:description", content: "Move rider earnings to your bank instantly." },
    ],
  }),
  component: WithdrawScreen,
});
