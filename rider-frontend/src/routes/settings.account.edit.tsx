import { createFileRoute } from "@tanstack/react-router";

import { EditProfileScreen } from "../screens/settings/EditProfileScreen";

export const Route = createFileRoute("/settings/account/edit")({
  head: () => ({
    meta: [
      { title: "Edit Profile · QuickPress Rider" },
      { name: "description", content: "Update your name, contact, address and vehicle information." },
      { property: "og:title", content: "Edit Profile · QuickPress Rider" },
      { property: "og:description", content: "Update your name, contact, address and vehicle information." },
    ],
  }),
  component: EditProfileScreen,
});
