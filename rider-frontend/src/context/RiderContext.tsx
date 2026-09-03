import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { RiderSession } from "@/shared/types/rider";
import {
  logout as logoutRider,
  restoreRiderSession,
  startRiderAutoRefresh,
} from "@/api/rider/rider-auth-api";
import { fetchRiderDashboard, updateRiderStatus } from "@/api/rider/rider-dashboard-api";

type RiderContextValue = {
  session: RiderSession | null;
  phone: string;
  isOnline: boolean;
  /** True while the stored Firebase + JWT session is being restored on boot. */
  hydrating: boolean;
  setPhone: (phone: string) => void;
  setOnline: (next: boolean) => void;
  signIn: (session: RiderSession) => void;
  signOut: () => void;
};

const RiderContext = createContext<RiderContextValue | null>(null);

const PENDING_PHONE_KEY = "qp.rider.pendingPhone";

export function RiderProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<RiderSession | null>(null);
  const [phone, setPhoneState] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return (
      window.sessionStorage.getItem(PENDING_PHONE_KEY) ||
      window.localStorage.getItem(PENDING_PHONE_KEY) ||
      ""
    );
  });
  const [isOnline, setOnline] = useState(true);
  const [hydrating, setHydrating] = useState(true);

  const setPhone = useCallback((value: string) => {
    setPhoneState(value);
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(PENDING_PHONE_KEY, value);
        window.localStorage.setItem(PENDING_PHONE_KEY, value);
      } catch {
        /* ignore */
      }
    }
  }, []);

  // Auto login: stored QuickPress JWT + live Firebase user → signed in.
  useEffect(() => {
    let active = true;
    void restoreRiderSession()
      .then((restored) => {
        if (!active) return;
        if (restored) {
          setSession(restored);
          if (restored.phone) setPhone(restored.phone);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setHydrating(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Hydrate the online/offline flag from the backend so a refresh reflects truth.
  useEffect(() => {
    let active = true;
    if (!session?.token) return;
    void fetchRiderDashboard()
      .then((dashboard) => {
        if (active) setOnline(dashboard.isOnline);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [session]);

  // Token refresh: keeps the access token valid while the app stays open.
  useEffect(() => startRiderAutoRefresh(), []);

  const setOnlineWithBackend = useCallback((next: boolean) => {
    setOnline(next);
    void updateRiderStatus(next).catch(() => {
      // Revert on failure so the UI never claims a status the backend rejected.
      setOnline(!next);
    });
  }, []);

  const signIn = useCallback(
    (next: RiderSession) => {
      setSession(next);
      if (next.phone) setPhone(next.phone);
    },
    [setPhone],
  );
  const signOut = useCallback(() => {
    setSession(null);
    void logoutRider().catch(() => undefined);
  }, []);

  const value = useMemo<RiderContextValue>(
    () => ({ session, phone, isOnline, hydrating, setPhone, setOnline: setOnlineWithBackend, signIn, signOut }),
    [session, phone, isOnline, hydrating, setPhone, setOnlineWithBackend, signIn, signOut],
  );

  return <RiderContext.Provider value={value}>{children}</RiderContext.Provider>;
}

export function useRiderContext() {
  const ctx = useContext(RiderContext);
  if (!ctx) {
    throw new Error("useRiderContext must be used inside <RiderProvider>");
  }
  return ctx;
}
