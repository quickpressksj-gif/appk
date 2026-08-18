import { createFileRoute } from "@tanstack/react-router";

import { DeliveryHistoryDetailScreen } from "../screens/history/DeliveryHistoryDetailScreen";

export const Route = createFileRoute("/history/$deliveryId")({
  head: () => ({
    meta: [
      { title: "Delivery Details · QuickPress Rider" },
      { name: "description", content: "Trip timeline, earnings breakdown and customer feedback." },
      { property: "og:title", content: "Delivery Details · QuickPress Rider" },
      { property: "og:description", content: "Trip timeline, earnings breakdown and customer feedback." },
    ],
  }),
  component: HistoryDetailRoute,
});

function HistoryDetailRoute() {
  const { deliveryId } = Route.useParams();
  return <DeliveryHistoryDetailScreen deliveryId={deliveryId} />;
}
