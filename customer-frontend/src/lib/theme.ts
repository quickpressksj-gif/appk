/**
 * Theme runtime — Sprint 2.6.
 *
 * CRITICAL RULE: Default theme is ALWAYS "light" (never dark by default).
 *
 * The chosen mode lives in localStorage (so a warm start paints correctly
 * before any request resolves) and is mirrored to the backend through
 * `PUT /api/me/settings`.
 */

import { readStoredTheme, storeTheme, type ThemeMode } from "@/api/customer/settings-api";

export type { ThemeMode };

export const DEFAULT_THEME: ThemeMode = "light";

export function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveTheme(mode: ThemeMode | null | undefined): "light" | "dark" {
  if (mode === "dark") return "dark";
  if (mode === "system") return systemPrefersDark() ? "dark" : "light";
  return "light";
}

/** Toggle the `dark` class the design tokens key off. */
export function applyTheme(mode: ThemeMode | null | undefined): "light" | "dark" {
  const targetMode = mode === "dark" || mode === "system" ? mode : "light";
  const resolved = resolveTheme(targetMode);
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
    root.style.colorScheme = resolved;
    root.dataset["theme"] = targetMode;
  }
  return resolved;
}

/**
 * Apply the stored theme and keep "system" in sync with the OS.
 * Default is strictly "light".
 * Returns an unsubscribe function.
 */
export function initTheme(): () => void {
  const stored = readStoredTheme() ?? "light";
  applyTheme(stored);

  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if ((readStoredTheme() ?? "light") === "system") applyTheme("system");
  };
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Persist locally and repaint immediately; the API call happens separately. */
export function setThemeLocally(mode: ThemeMode): void {
  const safeMode = mode === "dark" || mode === "system" ? mode : "light";
  storeTheme(safeMode);
  applyTheme(safeMode);
}
