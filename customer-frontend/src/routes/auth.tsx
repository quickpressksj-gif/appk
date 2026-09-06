import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  beforeLoad: ({ search }: { search: Record<string, unknown> }) => {
    throw redirect({
      to: "/login",
      search,
      replace: true,
    });
  },
  component: () => null,
});
