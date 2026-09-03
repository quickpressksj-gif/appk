import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "@/shared/lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" },
      { name: "theme-color", content: "#FACC15" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { title: "QuickPress Captain — Delivery Partner App" },
      { name: "description", content: "QuickPress Captain Delivery Partner App" },
      { name: "author", content: "QuickPress" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-white" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-white text-slate-950 antialiased selection:bg-amber-400 selection:text-black" suppressHydrationWarning>
        <div className="android-shell bg-white min-h-dvh shadow-2xl relative overflow-x-hidden">
          {children}
        </div>
        <Scripts />
      </body>
    </html>
  );
}

import { RiderProvider } from "../context/RiderContext";
import { LanguageProvider } from "../lib/i18n";
import { LanguageSelectionModal } from "../components/common/LanguageSelectionModal";
import { readSession } from "@/api/core/session-store";

// v1.0.2: QuickPress Captain Dedicated Android App
function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const location = useLocation();
  const navigate = useNavigate();

  // 📱 Android Hardware Back Button listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBack = () => {
      const pathname = window.location.pathname;
      const rootRoutes = ["/", "/auth", "/dashboard", "/registration-submitted"];
      if (!rootRoutes.includes(pathname)) {
        window.history.back();
      }
    };

    const capApp = (window as any).Capacitor?.Plugins?.App;
    let listenerHandle: any = null;
    if (capApp?.addListener) {
      capApp.addListener("backButton", handleBack).then((h: any) => {
        listenerHandle = h;
      }).catch(() => undefined);
    }

    return () => {
      if (listenerHandle?.remove) {
        listenerHandle.remove();
      }
    };
  }, []);

  // 🛡️ Global Strict Authentication & Onboarding Guard
  useEffect(() => {
    const pathname = location.pathname;
    const publicPaths = ["/", "/auth", "/otp"];
    const isPublic = publicPaths.some(
      (p) => pathname === p || pathname.startsWith("/auth") || pathname.startsWith("/otp")
    );
    if (isPublic) return;

    const sess = readSession("rider") || readSession();
    if (!sess || !sess.token) {
      if (pathname !== "/auth") {
        void navigate({ to: "/auth" });
      }
      return;
    }

    if (sess.status === "suspended" || (sess as any).isSuspended) {
      if (pathname !== "/suspended") {
        void navigate({ to: "/suspended" });
      }
      return;
    }

    const isOnboarded = sess.isOnboarded ?? sess.account?.isOnboarded;
    if (isOnboarded === false && pathname !== "/registration") {
      void navigate({ to: "/registration" });
      return;
    }

    const isVerified =
      (sess.isVerified ?? sess.account?.isVerified) ||
      sess.status === "active" ||
      sess.account?.status === "active";
    if (!isVerified && pathname !== "/registration" && pathname !== "/registration-submitted") {
      void navigate({ to: "/registration-submitted" });
      return;
    }
  }, [location.pathname, navigate]);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <RiderProvider>
          {/* Global High-Animation Language Selection Onboarding Screen */}
          <LanguageSelectionModal />
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </RiderProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
