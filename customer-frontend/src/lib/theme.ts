/**
 * Theme runtime — Sprint 2.6.
 *
 * The chosen mode lives in localStorage (so a warm start paints correctly
 * before any request resolves) and is mirrored to the backend through
 * `PUT /api/me/settings`. "system" follows the OS preference live.
 */

import { readStoredTheme, storeTheme, type ThemeMode } from "@/api/customer/settings-api";

export type { ThemeMode };

export function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") return systemPrefersDark() ? "dark" : "light";
  return mode;
}

/** Toggle the `dark` class the design tokens key off. */
export function applyTheme(mode: ThemeMode): "light" | "dark" {
  const resolved = resolveTheme(mode);
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
    root.style.colorScheme = resolved;
    root.dataset['theme'] = mode;
  }
  return resolved;
}

/**
 * Apply the stored theme and keep "system" in sync with the OS.
 * Returns an unsubscribe function.
 */
export function initTheme(): () => void {
  const stored = readStoredTheme() ?? "system";
  applyTheme(stored);

  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if ((readStoredTheme() ?? "system") === "system") applyTheme("system");
  };
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Persist locally and repaint immediately; the API call happens separately. */
export function setThemeLocally(mode: ThemeMode): void {
  storeTheme(mode);
  applyTheme(mode);
}
