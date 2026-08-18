import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { fetchRiderProfile } from "@/api/rider/rider-profile-api";

import {
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_SECURITY_SETTINGS,
  DEFAULT_WORK_SETTINGS,
  type NotificationSettings,
  type RiderAccountProfile,
  type RiderVehicleInfo,
  type SecuritySettings,
  type ThemeMode,
  type WorkSettings,
} from "../data/rider-settings-mock";

type RiderSettingsState = {
  profile: RiderAccountProfile;
  vehicle: RiderVehicleInfo;
  work: WorkSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  theme: ThemeMode;
};

type RiderSettingsValue = RiderSettingsState & {
  updateProfile: (patch: Partial<RiderAccountProfile>) => void;
  updateVehicle: (patch: Partial<RiderVehicleInfo>) => void;
  updateWork: <K extends keyof WorkSettings>(key: K, value: WorkSettings[K]) => void;
  updateNotification: (key: keyof NotificationSettings, value: boolean) => void;
  updateSecurity: (key: keyof SecuritySettings, value: boolean) => void;
  setTheme: (mode: ThemeMode) => void;
  resetNotifications: () => void;
};

const STORAGE_KEY = "qp-rider-settings-v1";

const RiderSettingsContext = createContext<RiderSettingsValue | null>(null);

/**
 * Account and vehicle details start empty and are hydrated from the real
 * `GET /api/rider/profile` endpoint. The previous demo identity ("Aarav
 * Sharma", a fake rider id, phone, vehicle and insurance dates) has been
 * removed: showing another person's fabricated details in a production account
 * screen is unacceptable. Fields the backend does not expose (postal address,
 * emergency contact, vehicle model, insurance/PUC expiry, photo) stay blank so
 * the UI reports them honestly as not available.
 */
const EMPTY_PROFILE: RiderAccountProfile = {
  fullName: "",
  riderId: "",
  phone: "",
  email: "",
  city: "",
  address: "",
  emergencyContact: "",
  joinedOn: "",
  rating: 0,
  totalTrips: 0,
  photoUrl: null,
  kycStatus: "pending",
};

const EMPTY_VEHICLE: RiderVehicleInfo = {
  vehicleType: "",
  vehicleNumber: "",
  model: "",
  insuranceExpiry: "",
  pucExpiry: "",
};

const INITIAL_STATE: RiderSettingsState = {
  profile: EMPTY_PROFILE,
  vehicle: EMPTY_VEHICLE,
  work: DEFAULT_WORK_SETTINGS,
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  security: DEFAULT_SECURITY_SETTINGS,
  theme: "system",
};

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = mode === "dark" || (mode === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
}

/** Client-side settings store for the Rider app (UI-only, persisted locally). */
export function RiderSettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RiderSettingsState>(INITIAL_STATE);

  // Hydrate after mount so SSR markup and first client render stay identical.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<RiderSettingsState>;
        setState((prev) => ({
          profile: { ...prev.profile, ...saved.profile },
          vehicle: { ...prev.vehicle, ...saved.vehicle },
          work: { ...prev.work, ...saved.work },
          notifications: { ...prev.notifications, ...saved.notifications },
          security: { ...prev.security, ...saved.security },
          theme: saved.theme ?? prev.theme,
        }));
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  // Hydrate the identity block from the backend profile record.
  useEffect(() => {
    let active = true;
    void fetchRiderProfile()
      .then((profile) => {
        if (!active) return;
        setState((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            fullName: profile.fullName,
            riderId: profile.riderId,
            phone: profile.phone,
            email: profile.email,
            city: profile.city,
            joinedOn: profile.joinedOn,
            rating: profile.rating,
            totalTrips: profile.totalTrips,
            kycStatus: profile.kycStatus,
          },
          vehicle: {
            ...prev.vehicle,
            vehicleType: profile.vehicleType,
            vehicleNumber: profile.vehicleNumber,
          },
        }));
      })
      .catch(() => {
        /* leave the honest empty state in place */
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
    applyTheme(state.theme);
  }, [state]);

  useEffect(() => {
    if (state.theme !== "system" || typeof window === "undefined") return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [state.theme]);

  const updateProfile = useCallback((patch: Partial<RiderAccountProfile>) => {
    setState((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
  }, []);

  const updateVehicle = useCallback((patch: Partial<RiderVehicleInfo>) => {
    setState((prev) => ({ ...prev, vehicle: { ...prev.vehicle, ...patch } }));
  }, []);

  const updateWork = useCallback(
    <K extends keyof WorkSettings>(key: K, value: WorkSettings[K]) => {
      setState((prev) => ({ ...prev, work: { ...prev.work, [key]: value } }));
    },
    [],
  );

  const updateNotification = useCallback((key: keyof NotificationSettings, value: boolean) => {
    setState((prev) => ({ ...prev, notifications: { ...prev.notifications, [key]: value } }));
  }, []);

  const updateSecurity = useCallback((key: keyof SecuritySettings, value: boolean) => {
    setState((prev) => ({ ...prev, security: { ...prev.security, [key]: value } }));
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    setState((prev) => ({ ...prev, theme: mode }));
  }, []);

  const resetNotifications = useCallback(() => {
    setState((prev) => ({ ...prev, notifications: DEFAULT_NOTIFICATION_SETTINGS }));
  }, []);

  const value = useMemo<RiderSettingsValue>(
    () => ({
      ...state,
      updateProfile,
      updateVehicle,
      updateWork,
      updateNotification,
      updateSecurity,
      setTheme,
      resetNotifications,
    }),
    [
      state,
      updateProfile,
      updateVehicle,
      updateWork,
      updateNotification,
      updateSecurity,
      setTheme,
      resetNotifications,
    ],
  );

  return <RiderSettingsContext.Provider value={value}>{children}</RiderSettingsContext.Provider>;
}

export function useRiderSettings() {
  const ctx = useContext(RiderSettingsContext);
  if (!ctx) {
    throw new Error("useRiderSettings must be used inside <RiderSettingsProvider>");
  }
  return ctx;
}