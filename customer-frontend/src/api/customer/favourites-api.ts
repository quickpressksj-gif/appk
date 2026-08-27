import { apiDeleteJson, apiGetJson, apiPostJson } from "../core/transport";

export type SavedServiceItem = {
  id: string;
  serviceId: string;
  title: string;
  name: string;
  price: number;
  basePrice: number;
  finalPrice: number;
  discountLabel?: string | null;
  image?: string;
  icon?: string;
  categoryId?: string;
  processingTime?: string;
  savedAt?: string;
  isSaved?: boolean;
};

export type FavouritePartnerItem = {
  id: string;
  partnerId: string;
  name: string;
  rating: number;
  reviews: string;
  reviewsCount: number;
  city: string;
  area: string;
  open: boolean;
  status: "open" | "closed";
  logo: string;
  image: string;
  minPrice: number;
  eta: string;
  isFavourite: boolean;
  savedAt?: string;
};

export async function fetchSavedServices(): Promise<SavedServiceItem[]> {
  try {
    const list = await apiGetJson<SavedServiceItem[]>("/api/services/saved");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function toggleSavedService(
  serviceId: string,
): Promise<{ ok: boolean; isSaved: boolean; message?: string }> {
  return await apiPostJson<{ ok: boolean; isSaved: boolean; message?: string }>(
    `/api/services/saved/${encodeURIComponent(serviceId)}`,
    {},
  );
}

export async function removeSavedService(serviceId: string): Promise<{ ok: boolean; isSaved: boolean }> {
  return await apiDeleteJson<{ ok: boolean; isSaved: boolean }>(
    `/api/services/saved/${encodeURIComponent(serviceId)}`,
  );
}

export async function fetchFavouritePartners(): Promise<FavouritePartnerItem[]> {
  try {
    const list = await apiGetJson<FavouritePartnerItem[]>("/api/partners/favourites");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function toggleFavouritePartner(
  partnerId: string,
): Promise<{ ok: boolean; isFavourite: boolean; message?: string }> {
  return await apiPostJson<{ ok: boolean; isFavourite: boolean; message?: string }>(
    `/api/partners/favourites/${encodeURIComponent(partnerId)}`,
    {},
  );
}

export async function removeFavouritePartner(
  partnerId: string,
): Promise<{ ok: boolean; isFavourite: boolean }> {
  return await apiDeleteJson<{ ok: boolean; isFavourite: boolean }>(
    `/api/partners/favourites/${encodeURIComponent(partnerId)}`,
  );
}
