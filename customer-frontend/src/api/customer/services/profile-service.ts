/**
 * Profile Service — GET /api/profile
 *
 * Provides the Home header's dynamic fields: customer name, initials, profile
 * image and the greeting. Cached locally so a warm start paints instantly.
 */

import { API_ENDPOINTS } from "../api/config";
import { CACHE_KEYS, readCache, readStaleCache, writeCache } from "../api/cache";
import { apiGet, resolveResource } from "../api/http-client";
import type { Profile } from "../home-api";

export type { Profile };

/** Time-of-day greeting shown above the customer name. */
export function greetingFor(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning,";
  if (hour < 17) return "Good Afternoon,";
  return "Good Evening,";
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "QP";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "QP";
}

import { readToken } from "@/api/core/session-store";

export function fetchProfile(options: { forceRefresh?: boolean | undefined; signal?: AbortSignal | undefined } = {}) {
  const token = readToken();
  if (!token) {
    return Promise.resolve({
      id: "guest",
      name: "Guest User",
      phone: "",
      email: "",
      initials: "GU",
      avatarUrl: "",
    } as Profile);
  }
  return resolveResource<Profile>({
    forceRefresh: options.forceRefresh,
    request: async () => {
      const profile = await apiGet<Profile>(API_ENDPOINTS.profile, { signal: options.signal });
      return { ...profile, initials: profile.initials || initialsFor(profile.name) };
    },
    readCache: () => readCache<Profile>(CACHE_KEYS.profile),
    readStaleCache: () => readStaleCache<Profile>(CACHE_KEYS.profile),
    writeCache: (value) => writeCache(CACHE_KEYS.profile, value),
  });
}
