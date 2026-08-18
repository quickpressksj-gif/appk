import { createFileRoute } from "@tanstack/react-router";

import { PartnerProvider } from "../context/PartnerContext";
import { PartnerOrdersProvider } from "../context/PartnerOrdersContext";
import { OrdersScreen } from "../screens/OrdersScreen";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "Partner Orders · QuickPress Partner" },
      { name: "description", content: "Manage incoming, processing and ready QuickPress orders." },
      { property: "og:title", content: "Partner Orders · QuickPress Partner" },
      { property: "og:description", content: "Manage incoming, processing and ready QuickPress orders." },
    ],
  }),
  component: () => (
    <PartnerProvider>
      <PartnerOrdersProvider>
        <OrdersScreen />
      </PartnerOrdersProvider>
    </PartnerProvider>
  ),
});
