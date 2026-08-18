/**
 * Customer settings data layer — Sprint 2.6.
 *
 *   GET /api/me/settings   theme, language, notifications, privacy
 *   PUT /api/me/settings   persist any subset of the above
 *
 * Theme is the one preference the UI must never wait for: it is mirrored into
 * localStorage so a warm start paints in the right mode before the network
 * answers, then reconciled with the server response.
 */

import { apiGetJson, apiRequest } from "../core/transport";
import { CACHE_KEYS, readCache, readStaleCache, writeCache } from "./api/cache";

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
  theme: "system",
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

/** Theme chosen on this device — available synchronously, before any fetch. */
export function readStoredTheme(): ThemeMode | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(value) ? value : null;
  } catch {
    return null;
  }
}

export function storeTheme(theme: ThemeMode): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* private mode — the in-memory choice still applies for this session */
  }
}

function normalise(value: Partial<CustomerSettings> | null | undefined): CustomerSettings {
  return {
    theme: isThemeMode(value?.theme) ? value.theme : DEFAULT_SETTINGS.theme,
    language: value?.language || DEFAULT_SETTINGS.language,
    notifications: { ...DEFAULT_SETTINGS.notifications, ...(value?.notifications ?? {}) },
    privacy: { ...DEFAULT_SETTINGS.privacy, ...(value?.privacy ?? {}) },
    updatedAt: value?.updatedAt ?? null,
  };
}

/** Cached settings (or defaults) with no network round trip. */
export function readCachedSettings(): CustomerSettings {
  const cached = readStaleCache<CustomerSettings>(CACHE_KEYS.settings);
  const theme = readStoredTheme();
  const base = normalise(cached);
  return theme ? { ...base, theme } : base;
}

/** GET /api/me/settings — cache-first, falls back to the local copy offline. */
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
    return settings;
  } catch (error) {
    const stale = readStaleCache<CustomerSettings>(CACHE_KEYS.settings);
    if (stale) return normalise(stale);
    const theme = readStoredTheme();
    if (theme) return { ...DEFAULT_SETTINGS, theme };
    throw error;
  }
}

/** PUT /api/me/settings — the cache is updated optimistically, then reconciled. */
export async function saveSettings(
  patch: Partial<CustomerSettings>,
): Promise<CustomerSettings> {
  const optimistic = normalise({ ...readCachedSettings(), ...patch });
  writeCache(CACHE_KEYS.settings, optimistic);
  if (patch.theme) storeTheme(patch.theme);

  const saved = normalise(
    await apiRequest<Partial<CustomerSettings>>("PUT", SETTINGS_ENDPOINT, { body: patch }),
  );
  writeCache(CACHE_KEYS.settings, saved);
  storeTheme(saved.theme);
  return saved;
}

/** Convenience wrapper used by the theme switcher. */
export function saveTheme(theme: ThemeMode): Promise<CustomerSettings> {
  return saveSettings({ theme });
}
