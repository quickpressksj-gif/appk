import { createFileRoute } from "@tanstack/react-router";

import { ReviewsScreen } from "../screens/ReviewsScreen";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews & Ratings · QuickPress Partner" },
      {
        name: "description",
        content:
          "Read every customer review, reply to feedback and track rating analytics across your services.",
      },
      { property: "og:title", content: "Reviews & Ratings · QuickPress Partner" },
      {
        property: "og:description",
        content:
          "Read every customer review, reply to feedback and track rating analytics across your services.",
      },
    ],
  }),
  component: ReviewsScreen,
});
