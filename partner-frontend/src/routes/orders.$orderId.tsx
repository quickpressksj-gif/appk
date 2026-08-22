import { createFileRoute } from "@tanstack/react-router";

import { OrderDetailsScreen } from "../screens/OrderDetailsScreen";

export const Route = createFileRoute("/orders/$orderId")({
  head: () => ({
    meta: [
      { title: "Order Details · QuickPress Partner" },
      { name: "description", content: "Order items, timeline and status actions for your store." },
      { property: "og:title", content: "Order Details · QuickPress Partner" },
      { property: "og:description", content: "Order items, timeline and status actions for your store." },
    ],
  }),
  component: OrderDetailsRoute,
});

function OrderDetailsRoute() {
  const { orderId } = Route.useParams();
  return <OrderDetailsScreen orderId={orderId} />;
}
