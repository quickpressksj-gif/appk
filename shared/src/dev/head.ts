/**
 * Head metadata for the single QuickPress developer panel.
 * Shared so every mount point (`/dev`) advertises identical metadata.
 */
export const developerPanelHead = () => ({
  meta: [
    { title: "QuickPress Developer Panel — seed, simulate & inspect" },
    {
      name: "description",
      content:
        "Internal QuickPress developer panel: reset and seed the shared mock database, generate customers, partners, riders and orders, switch roles, advance order status, inspect API traffic and simulate notifications.",
    },
    { property: "og:title", content: "QuickPress Developer Panel" },
    {
      property: "og:description",
      content:
        "Seed and reset QuickPress test data, switch roles, simulate the full order lifecycle and inspect every API call.",
    },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "robots", content: "noindex" },
  ],
});
