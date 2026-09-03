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
import { updateRiderStatus } from "@/api/rider/rider-dashboard-api";
import { readSession } from "@/api/core/session-store";

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
const ONLINE_STORAGE_KEY = "qp.rider.isOnline";

export function RiderProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<RiderSession | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = readSession("rider") || readSession();
      if (stored) {
        return {
          riderId: stored.account.linkedId ?? stored.account.id,
          phone: stored.account.phone,
          fullName: stored.account.name,
          isVerified: stored.account.isVerified,
          isOnboarded: stored.account.isOnboarded,
          isNewRider: !stored.account.isOnboarded,
          token: stored.token,
          refreshToken: stored.refreshToken,
        };
      }
    } catch {
      /* ignore */
    }
    return null;
  });

  const [phone, setPhoneState] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return (
      window.sessionStorage.getItem(PENDING_PHONE_KEY) ||
      window.localStorage.getItem(PENDING_PHONE_KEY) ||
      ""
    );
  });

  const [isOnline, setOnlineState] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem(ONLINE_STORAGE_KEY);
    return stored !== null ? stored === "1" : true;
  });

  const [hydrating, setHydrating] = useState(false);

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

  // Background restore / sync
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
  }, [setPhone]);

  // Token refresh: keeps the access token valid while the app stays open.
  useEffect(() => startRiderAutoRefresh(), []);

  const setOnlineWithBackend = useCallback((next: boolean) => {
    setOnlineState(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(ONLINE_STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
    }
    // Update backend asynchronously without reverting local state
    void updateRiderStatus(next).catch(() => {});
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
