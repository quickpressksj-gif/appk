import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { PartnerSession } from "@shared/types/partner";
import {
  logout as logoutPartner,
  restorePartnerSession,
  startPartnerAutoRefresh,
} from "@backend/partner/partner-auth-api";

type PartnerContextValue = {
  session: PartnerSession | null;
  phone: string;
  /** True while the stored Firebase + JWT session is being restored on boot. */
  hydrating: boolean;
  setPhone: (phone: string) => void;
  signIn: (session: PartnerSession) => void;
  signOut: () => void;
};

const PartnerContext = createContext<PartnerContextValue | null>(null);

export function PartnerProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PartnerSession | null>(null);
  const [phone, setPhone] = useState("");
  const [hydrating, setHydrating] = useState(true);

  // Auto login: stored QuickPress JWT + live Firebase user → signed in.
  useEffect(() => {
    let active = true;
    void restorePartnerSession()
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

  // Token refresh: keeps the access token valid while the app stays open.
  useEffect(() => startPartnerAutoRefresh(), []);

  const signIn = useCallback((next: PartnerSession) => setSession(next), []);
  const signOut = useCallback(() => {
    setSession(null);
    void logoutPartner().catch(() => undefined);
  }, []);

  const value = useMemo<PartnerContextValue>(
    () => ({ session, phone, hydrating, setPhone, signIn, signOut }),
    [session, phone, hydrating, signIn, signOut],
  );

  return <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>;
}

export function usePartnerContext() {
  const ctx = useContext(PartnerContext);
  if (!ctx) {
    throw new Error("usePartnerContext must be used inside <PartnerProvider>");
  }
  return ctx;
}
