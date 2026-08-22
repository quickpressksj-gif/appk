/**
 * Customer settings data layer — Sprint 2.6.
 *
 *   GET /api/me/settings   theme, language, notifications, privacy
 *   PUT /api/me/settings   persist any subset of the above
 *
 * Theme default is ALWAYS "light". It is mirrored into localStorage so a warm
 * start paints in light mode immediately before the network answers, then
 * reconciled with the server response.
 */

import { apiGetJson, apiRequest } from "../core/transport";
import { CACHE_KEYS, readCache, readStaleCache, writeCache } from "./api/cache";
import { normalizeLanguage, readStoredLanguage, setLanguageLocally } from "@/lib/i18n";

export const SETTINGS_ENDPOINT = "/api/me/settings";

export type ThemeMode = "light" | "dark" | "system";

export type NotificationPreferences = {
  orderUpdates: boolean;
  deliveryAlerts: boolean;
  promotions: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
};

/** Stored and returned today; enforcement lands with the privacy sprint. */
export type PrivacyPreferences = {
  personalizedOffers: boolean;
  shareUsageData: boolean;
  profileVisible: boolean;
};

export type CustomerSettings = {
  theme: ThemeMode;
  language: string;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  updatedAt?: string | null;
};

export const DEFAULT_SETTINGS: CustomerSettings = {
  theme: "light",
  language: "en-IN",
  notifications: {
    orderUpdates: true,
    deliveryAlerts: true,
    promotions: true,
    email: true,
    sms: false,
    push: true,
  },
  privacy: {
    personalizedOffers: true,
    shareUsageData: false,
    profileVisible: true,
  },
};

const THEME_STORAGE_KEY = "quickpress:theme";

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

/** Theme chosen on this device — default is strictly "light". */
export function readStoredTheme(): ThemeMode | null {
  if (typeof localStorage === "undefined") return "light";
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(value) ? value : "light";
  } catch {
    return "light";
  }
}

export function storeTheme(theme: ThemeMode): void {
  if (typeof localStorage === "undefined") return;
  try {
    const safeTheme = isThemeMode(theme) ? theme : "light";
    localStorage.setItem(THEME_STORAGE_KEY, safeTheme);
  } catch {
    /* private mode */
  }
}

function normalise(value: Partial<CustomerSettings> | null | undefined): CustomerSettings {
  return {
    theme: isThemeMode(value?.theme) ? value.theme : "light",
    language: value?.language ? normalizeLanguage(value.language) : DEFAULT_SETTINGS.language,
    notifications: { ...DEFAULT_SETTINGS.notifications, ...(value?.notifications ?? {}) },
    privacy: { ...DEFAULT_SETTINGS.privacy, ...(value?.privacy ?? {}) },
    updatedAt: value?.updatedAt ?? null,
  };
}

/** Cached settings (or defaults) with no network round trip. */
export function readCachedSettings(): CustomerSettings {
  const cached = readStaleCache<CustomerSettings>(CACHE_KEYS.settings);
  const theme = readStoredTheme() ?? "light";
  const language = readStoredLanguage();
  const base = normalise(cached);
  return {
    ...base,
    theme: isThemeMode(theme) ? theme : "light",
    language: language || base.language,
  };
}

/** GET /api/me/settings — cache-first, falls back to local copy offline. */
export async function fetchSettings(
  options: { forceRefresh?: boolean; signal?: AbortSignal } = {},
): Promise<CustomerSettings> {
  if (!options.forceRefresh) {
    const fresh = readCache<CustomerSettings>(CACHE_KEYS.settings);
    if (fresh) return normalise(fresh);
  }
  try {
    const remote = await apiGetJson<Partial<CustomerSettings>>(SETTINGS_ENDPOINT, {
      signal: options.signal,
    });
    const settings = normalise(remote);
    writeCache(CACHE_KEYS.settings, settings);
    storeTheme(settings.theme);
    setLanguageLocally(settings.language);
    return settings;
  } catch (error) {
    const stale = readStaleCache<CustomerSettings>(CACHE_KEYS.settings);
    if (stale) return normalise(stale);
    const theme = readStoredTheme() ?? "light";
    const language = readStoredLanguage();
    return { ...DEFAULT_SETTINGS, theme, language };
  }
}

/** PUT /api/me/settings — the cache is updated optimistically, then reconciled with MongoDB. */
export async function saveSettings(
  patch: Partial<CustomerSettings>,
): Promise<CustomerSettings> {
  const optimistic = normalise({ ...readCachedSettings(), ...patch });
  writeCache(CACHE_KEYS.settings, optimistic);
  if (patch.theme) storeTheme(patch.theme);
  if (patch.language) setLanguageLocally(patch.language);

  const saved = normalise(
    await apiRequest<Partial<CustomerSettings>>("PUT", SETTINGS_ENDPOINT, { body: patch }),
  );
  writeCache(CACHE_KEYS.settings, saved);
  storeTheme(saved.theme);
  setLanguageLocally(saved.language);
  return saved;
}

/** Convenience wrapper used by the theme switcher. */
export function saveTheme(theme: ThemeMode): Promise<CustomerSettings> {
  return saveSettings({ theme: isThemeMode(theme) ? theme : "light" });
}
