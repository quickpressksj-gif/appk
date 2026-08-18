import { createFileRoute } from "@tanstack/react-router";

import { DeveloperPanel } from "@/shared/dev/DeveloperPanel";
import { developerPanelHead } from "@/shared/dev/head";

// Thin wrapper: the panel itself lives in `shared/src/dev` so all four apps
// mount the exact same developer tooling.
export const Route = createFileRoute("/dev")({
  head: developerPanelHead,
  component: DeveloperPanel,
});
