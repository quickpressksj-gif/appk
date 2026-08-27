/**
 * Home Service — orchestrates the Home Screen load.
 *
 * Load order matches the product spec:
 *
 *   Profile → Location → Banners → Categories → Nearby Partners →
 *   Recommended Services → Offers → Notifications Count
 *
 * Profile and location resolve first because nearby partners depend on the
 * resolved location. Everything after that loads in parallel, and each section
 * settles independently so one failing endpoint never blanks the screen.
 */

import { clearCache } from "../api/cache";
import { ApiError } from "../api/http-client";
import type {
  Banner,
  Category,
  Offer,
  Partner,
  PopularService,
  Profile,
  RecentOrder,
  Recommendation,
} from "../home-api";
import type { SavedLocation } from "../location";
import { fetchBanners } from "./banner-service";
import { fetchCategories } from "./category-service";
import { fetchLocation } from "./location-service";
import { fetchUnreadNotificationCount } from "./notification-service";
import { fetchOffers } from "./offer-service";
import { fetchNearbyPartners } from "./partner-service";
import { fetchProfile } from "./profile-service";
import {
  fetchPopularServices,
  fetchRecentOrders,
  fetchRecommendations,
} from "./recommendation-service";

export type SectionKey =
  | "profile"
  | "location"
  | "banners"
  | "categories"
  | "partners"
  | "popular"
  | "recommendations"
  | "offers"
  | "recentOrders"
  | "notifications";

export type SectionState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export type HomeSections = {
  profile: SectionState<Profile>;
  location: SectionState<SavedLocation>;
  banners: SectionState<Banner[]>;
  categories: SectionState<Category[]>;
  partners: SectionState<Partner[]>;
  popular: SectionState<PopularService[]>;
  recommendations: SectionState<Recommendation[]>;
  offers: SectionState<Offer[]>;
  recentOrders: SectionState<RecentOrder[]>;
  notifications: SectionState<number>;
};

export const IDLE_SECTION: SectionState<never> = { data: null, loading: true, error: null };

export function initialSections(): HomeSections {
  return {
    profile: { data: null, loading: true, error: null },
    location: { data: null, loading: true, error: null },
    banners: { data: null, loading: true, error: null },
    categories: { data: null, loading: true, error: null },
    partners: { data: null, loading: true, error: null },
    popular: { data: null, loading: true, error: null },
    recommendations: { data: null, loading: true, error: null },
    offers: { data: null, loading: true, error: null },
    recentOrders: { data: null, loading: true, error: null },
    notifications: { data: null, loading: true, error: null },
  };
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.userMessage;
  return "Something went wrong. Please try again.";
}

export type LoadHomeOptions = {
  forceRefresh?: boolean | undefined;
  signal?: AbortSignal | undefined;
  /** Called as each section settles so the UI can render progressively. */
  onSection: <K extends SectionKey>(key: K, state: HomeSections[K]) => void;
};

function settle<T>(
  key: SectionKey,
  promise: Promise<T>,
  onSection: LoadHomeOptions["onSection"],
): Promise<void> {
  return promise.then(
    (data) => {
      onSection(key as never, { data, loading: false, error: null } as never);
    },
    (error: unknown) => {
      onSection(key as never, { data: null, loading: false, error: errorMessage(error) } as never);
    },
  );
}

/** Load every Home Screen section. Resolves once all sections have settled. */
export async function loadHome(options: LoadHomeOptions): Promise<void> {
  const { forceRefresh, signal, onSection } = options;
  const shared = { forceRefresh, signal } as const;

  // Sab independent sections turant parallel me start hote hain; sirf partners
  // location par depend karta hai, isliye wahi await hota hai.
  const profilePromise = settle("profile", fetchProfile(shared), onSection);

  const locationPromise = fetchLocation(shared).then(
    (location) => {
      onSection("location", { data: location, loading: false, error: null });
      return location;
    },
    (error: unknown) => {
      onSection("location", { data: null, loading: false, error: errorMessage(error) });
      return null as SavedLocation | null;
    },
  );

  const partnersPromise = locationPromise.then((location) =>
    settle("partners", fetchNearbyPartners({ ...shared, location }), onSection),
  );

  const popularPromise = locationPromise.then((location) =>
    settle("popular", fetchPopularServices({ ...shared, location }), onSection),
  );

  await Promise.all([
    profilePromise,
    partnersPromise,
    popularPromise,
    settle("banners", fetchBanners(shared), onSection),
    settle("categories", fetchCategories(shared), onSection),
    settle("recommendations", fetchRecommendations(shared), onSection),
    settle("offers", fetchOffers(shared), onSection),
    settle("recentOrders", fetchRecentOrders(shared), onSection),
    settle("notifications", fetchUnreadNotificationCount(shared), onSection),
  ]);
}

/** Pull-to-refresh: drop cached Home data so every endpoint is re-read. */
export function invalidateHomeCache() {
  clearCache();
}
