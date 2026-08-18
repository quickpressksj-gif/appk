// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
//
// PRODUCTION PARTNER ENTRY POINT (default)
// ----------------------------------------
// The root build IS the deployed Partner application. It used to compile the
// legacy mock-backed Partner Console in ./src; production now compiles the real
// API-connected Partner app in ./partner-frontend/src (same code that
// `cd partner-frontend && npm run build` produces), while ./src is kept intact
// for legacy/development use.
//
// CUSTOMER PREVIEW SWITCH
// -----------------------
// Production/build output is UNCHANGED: `vite build` at the root still compiles
// the Partner app. Only the dev server (the Lovable preview) defaults to the
// existing migrated Customer app in ./customer-frontend/src so it can be
// manually tested. Override explicitly at any time:
//   QUICKPRESS_APP=partner  -> Partner in dev too
//   QUICKPRESS_APP=customer -> Customer for build as well
// No Partner/Customer source or per-app config is modified by this switch.
import { fileURLToPath } from "node:url";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const resolvePath = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

const explicitApp = process.env["QUICKPRESS_APP"];
const isDevServer = process.argv.includes("dev") || process.argv.includes("serve");
const APP =
  explicitApp === "customer" || explicitApp === "partner"
    ? explicitApp
    : isDevServer
      ? "customer"
      : "partner";
const APP_SRC_DIR = APP === "customer" ? "customer-frontend/src" : "partner-frontend/src";
const PARTNER_SRC = resolvePath(`./${APP_SRC_DIR}/`);


export default defineConfig({
  tanstackStart: {
    // Build the selected application source instead of the legacy ./src app.
    srcDirectory: APP_SRC_DIR,
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },

  vite: {
    // Resolve bare package imports made from files under ./shared (and ./backend),
    // which are outside the app source directory.
    plugins: [
      {
        name: "quickpress-resolve-external-workspace-deps",
        enforce: "pre" as const,
        async resolveId(this: any, source: string, importer: string | undefined, options: any) {
          if (!importer) return null;
          const normalized = importer.split("\\").join("/");
          if (!/\/(shared|backend)\/src\//.test(normalized)) return null;
          if (
            source.startsWith(".") ||
            source.startsWith("/") ||
            source.startsWith("@shared/") ||
            source.startsWith("@backend/") ||
            source.startsWith("virtual:") ||
            source.startsWith("node:")
          ) {
            return null;
          }
          const resolved = await this.resolve(source, `${PARTNER_SRC}router.tsx`, {
            ...options,
            skipSelf: true,
          });
          return resolved ?? null;
        },
      },
    ],
    resolve: {
      alias: [
        // "@/..." must point at the Partner app source, not the legacy ./src app.
        { find: /^@\//, replacement: PARTNER_SRC },
        { find: /^@shared\//, replacement: `${resolvePath("./shared/src/")}` },
        { find: /^@backend\//, replacement: `${resolvePath("./backend/src/")}` },
      ],
    },
  },
});
