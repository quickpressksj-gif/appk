/**
 * Customer settings + theme hook — Sprint 2.6.
 *
 * Reads GET /api/me/settings cache-first so the Settings sheet opens with the
 * last known values, then refreshes. Saves are optimistic: the UI flips
 * instantly and rolls back if the request fails, and the theme is always
 * applied locally first so switching never waits on the network.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import {
  DEFAULT_SETTINGS,
  fetchSettings,
  readCachedSettings,
  saveSettings,
  type CustomerSettings,
  type NotificationPreferences,
  type ThemeMode,
} from "@/api/customer/settings-api";
import { isOnline, onNetworkChange } from "@/api/customer/api/network";
import { setThemeLocally } from "@/lib/theme";
import { setLanguageLocally } from "@/lib/i18n";

export type SettingsState = {
  settings: CustomerSettings;
  loading: boolean;
  saving: boolean;
  error: string | null;
  offline: boolean;
  reload: () => Promise<void>;
  setTheme: (mode: ThemeMode) => Promise<void>;
  setLanguage: (language: string) => Promise<void>;
  toggleNotification: (key: keyof NotificationPreferences) => Promise<void>;
};

export function useAppSettings(): SettingsState {
  const [settings, setSettings] = useState<CustomerSettings>(readCachedSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    const cached = readCachedSettings();
    setSettings(cached);
    setThemeLocally(cached.theme);
    setLanguageLocally(cached.language);
    try {
      const fresh = await fetchSettings({ forceRefresh });
      if (!mounted.current) return;
      setSettings(fresh);
      setThemeLocally(fresh.theme);
      setLanguageLocally(fresh.language);
    } catch {
      if (!mounted.current) return;
      setError("Couldn't load your settings");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setOffline(!isOnline());
    return onNetworkChange((online) => {
      setOffline(!online);
      if (online) void load(true);
    });
  }, [load]);

  const persist = useCallback(
    async (patch: Partial<CustomerSettings>) => {
      const previous = settings;
      const optimistic = {
        ...settings,
        ...patch,
        notifications: patch.notifications
          ? { ...settings.notifications, ...patch.notifications }
          : settings.notifications,
        privacy: patch.privacy
          ? { ...settings.privacy, ...patch.privacy }
          : settings.privacy,
      } as CustomerSettings;

      setSettings(optimistic);
      if (patch.theme) setThemeLocally(patch.theme);
      if (patch.language) setLanguageLocally(patch.language);

      setSaving(true);
      setError(null);
      try {
        const saved = await saveSettings(patch);
        if (!mounted.current) return;
        setSettings(saved);
        setThemeLocally(saved.theme);
        setLanguageLocally(saved.language);
      } catch {
        if (!mounted.current) return;
        setSettings(previous);
        setThemeLocally(previous.theme);
        setLanguageLocally(previous.language);
        setError(isOnline() ? "Couldn't save your changes" : "You're offline — changes not saved");
        throw new Error("settings-save-failed");
      } finally {
        if (mounted.current) setSaving(false);
      }
    },
    [settings],
  );

  return {
    settings,
    loading,
    saving,
    error,
    offline,
    reload: () => load(true),
    setTheme: (mode) => persist({ theme: mode }),
    setLanguage: (language) => persist({ language }),
    toggleNotification: (key) =>
      persist({
        notifications: {
          ...settings.notifications,
          [key]: !settings.notifications[key],
        },
      }),
  };
}
