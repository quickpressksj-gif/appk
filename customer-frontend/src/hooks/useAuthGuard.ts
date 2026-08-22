import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { readSession, readToken } from "@/api/core/session-store";
import type { AuthSession } from "@/shared/types";

export function useAuthGuard(): {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
} {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const [session, setSession] = useState<AuthSession | null>(() => readSession("customer"));
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const current = readSession("customer");
    const token = readToken("customer");
    if (!current || !token) {
      const currentPath = routerState.location.pathname;
      void navigate({
        to: "/login",
        search: { redirect: currentPath } as any,
      });
    } else {
      setSession(current);
    }
    setChecked(true);
  }, [navigate, routerState.location.pathname]);

  return {
    session,
    isAuthenticated: Boolean(session && readToken("customer")),
    isLoading: !checked,
  };
}
