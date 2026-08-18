import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  GALLERY_MAX_IMAGES,
  businessHoursMock,
  galleryMock,
  serviceAreaMock,
  shopProfileMock,
  shopStatisticsMock,
  type BusinessHours,
  type GalleryImage,
  type ServiceArea,
  type ShopProfile,
  type ShopStatistics,
  type ShopStatusId,
} from "../data/partner-shop-mock";

const GALLERY_TINTS = [
  "from-primary/30 to-secondary/15",
  "from-secondary/30 to-primary/15",
  "from-primary/20 to-primary/5",
  "from-secondary/25 to-secondary/10",
];

export type ShopEditableFields = Pick<
  ShopProfile,
  "name" | "description" | "contactNumber" | "email" | "gstNumber" | "businessType"
>;

type PartnerShopValue = {
  profile: ShopProfile;
  gallery: GalleryImage[];
  hours: BusinessHours;
  area: ServiceArea;
  stats: ShopStatistics;
  status: ShopStatusId;
  isLoading: boolean;
  galleryLimit: number;
  refresh: () => Promise<void>;
  updateProfile: (patch: ShopEditableFields) => void;
  setStatus: (next: ShopStatusId) => void;
  updateHours: (patch: Partial<BusinessHours>) => void;
  addImage: () => boolean;
  removeImage: (id: string) => void;
  moveImage: (id: string, direction: -1 | 1) => void;
};

const PartnerShopContext = createContext<PartnerShopValue | null>(null);

export function PartnerShopProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ShopProfile>(shopProfileMock);
  const [gallery, setGallery] = useState<GalleryImage[]>(galleryMock);
  const [hours, setHours] = useState<BusinessHours>(businessHoursMock);
  const [status, setStatusState] = useState<ShopStatusId>("online");
  const [isLoading, setIsLoading] = useState(true);

  // Skeleton pass so the module matches the rest of the partner app.
  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 650);
    return () => window.clearTimeout(timer);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    setIsLoading(false);
  }, []);

  const updateProfile = useCallback((patch: ShopEditableFields) => {
    setProfile((current) => ({ ...current, ...patch }));
  }, []);

  const setStatus = useCallback((next: ShopStatusId) => {
    setStatusState(next);
    setHours((current) => ({
      ...current,
      temporarilyClosed: next === "temporarily_closed",
      holidayMode: next === "vacation" ? true : current.holidayMode,
    }));
  }, []);

  const updateHours = useCallback((patch: Partial<BusinessHours>) => {
    setHours((current) => ({ ...current, ...patch }));
  }, []);

  const addImage = useCallback(() => {
    let added = false;
    setGallery((current) => {
      if (current.length >= GALLERY_MAX_IMAGES) return current;
      added = true;
      const index = current.length + 1;
      return [
        ...current,
        {
          id: `img-${Date.now()}`,
          title: `Shop Photo ${index}`,
          tag: "Uploaded",
          tint: GALLERY_TINTS[index % GALLERY_TINTS.length] ?? "from-primary/25 to-secondary/15",
          uploadedOn: "Just now",
        },
      ];
    });
    return added;
  }, []);

  const removeImage = useCallback((id: string) => {
    setGallery((current) => current.filter((image) => image.id !== id));
  }, []);

  const moveImage = useCallback((id: string, direction: -1 | 1) => {
    setGallery((current) => {
      const index = current.findIndex((image) => image.id === id);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= current.length) return current;
      const copy = [...current];
      const moved = copy[index] as GalleryImage;
      copy[index] = copy[next] as GalleryImage;
      copy[next] = moved;
      return copy;
    });
  }, []);

  const value = useMemo<PartnerShopValue>(
    () => ({
      profile,
      gallery,
      hours,
      area: serviceAreaMock,
      stats: shopStatisticsMock,
      status,
      isLoading,
      galleryLimit: GALLERY_MAX_IMAGES,
      refresh,
      updateProfile,
      setStatus,
      updateHours,
      addImage,
      removeImage,
      moveImage,
    }),
    [
      profile,
      gallery,
      hours,
      status,
      isLoading,
      refresh,
      updateProfile,
      setStatus,
      updateHours,
      addImage,
      removeImage,
      moveImage,
    ],
  );

  return <PartnerShopContext.Provider value={value}>{children}</PartnerShopContext.Provider>;
}

export function usePartnerShop() {
  const context = useContext(PartnerShopContext);
  if (!context) throw new Error("usePartnerShop must be used inside PartnerShopProvider");
  return context;
}
