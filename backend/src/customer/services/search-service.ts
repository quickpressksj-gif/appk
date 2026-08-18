/**
 * Search Service — GET /api/search
 *
 * Real search across partners, categories and services via the mock/live
 * backend endpoint.
 */

import { API_ENDPOINTS } from "../api/config";
import { apiGet } from "../api/http-client";
import { type SearchResult, type SearchScope } from "../home-api";

export type { SearchResult, SearchScope };

export const SEARCH_SCOPES: { id: SearchScope; label: string }[] = [
  { id: "services", label: "Laundry Services" },
  { id: "partners", label: "Laundry Stores" },
  { id: "categories", label: "Area" },
  { id: "offers", label: "Offers" },
];

export const RECENT_SEARCH_KEY = "quickpress:recent-searches";

export function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCH_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function rememberSearch(term: string) {
  if (typeof window === "undefined" || !term.trim()) return;
  try {
    const next = [term.trim(), ...readRecentSearches().filter((v) => v !== term.trim())].slice(0, 6);
    window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
}

export async function search(
  term: string,
  options: { scopes?: SearchScope[] | undefined; signal?: AbortSignal | undefined } = {},
): Promise<SearchResult[]> {
  const scopes = options.scopes ?? ["partners", "categories", "services", "offers"];
  if (!term.trim()) return [];

  return apiGet<SearchResult[]>(API_ENDPOINTS.search, {
    signal: options.signal,
    params: { q: term.trim(), scopes: scopes.join(",") },
  });
}
