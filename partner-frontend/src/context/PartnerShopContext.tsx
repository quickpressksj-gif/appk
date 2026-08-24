import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { BusinessSettings, PartnerProfile } from "@/shared/types/partner";
import {
  fetchBusinessSettings,
  fetchPartnerProfile,
  updateBusinessSettings,
  updatePartnerProfile,
  uploadPartnerLogo,
  uploadPartnerBanner,
} from "@/api/partner/partner-profile-api";
import { fetchEarnings } from "@/api/partner/partner-earnings-api";

import {
  GALLERY_MAX_IMAGES,
  type BusinessHours,
  type GalleryImage,
  type ServiceArea,
  type ShopProfile,
  type ShopStatistics,
  type ShopStatusId,
} from "../data/partner-shop-mock";

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
  error: string | null;
  galleryLimit: number;
  refresh: () => Promise<void>;
  updateProfile: (patch: Partial<ShopProfile>) => Promise<void>;
  uploadLogo: (base64Image: string) => Promise<string>;
  uploadBanner: (base64Image: string) => Promise<string>;
  setStatus: (next: ShopStatusId) => Promise<void>;
  updateHours: (patch: Partial<BusinessHours>) => Promise<void>;
  /** No upload endpoint exists yet — always reports unavailable. */
  addImage: () => boolean;
  removeImage: (id: string) => void;
  moveImage: (id: string, direction: -1 | 1) => void;
};

const EMPTY_PROFILE: ShopProfile = {
  shopId: "",
  name: "",
  ownerName: "",
  description: "",
  category: "",
  businessType: "",
  rating: 0,
  reviewCount: 0,
  verification: "pending",
  contactNumber: "",
  email: "",
  gstNumber: "",
  logoTint: "from-primary/35 to-secondary/25",
  bannerTint: "from-primary/30 via-secondary/20 to-primary/10",
};

const EMPTY_HOURS: BusinessHours = {
  openingTime: "",
  closingTime: "",
  weeklyOff: "None",
  holidayMode: false,
  temporarilyClosed: false,
};

const EMPTY_AREA: ServiceArea = {
  city: "",
  area: "",
  pickupRadiusKm: 0,
  deliveryRadiusKm: 0,
};

const EMPTY_STATS: ShopStatistics = {
  totalOrders: 0,
  completedOrders: 0,
  activeCustomers: 0,
  averageRating: 0,
  revenue: 0,
};

function toShopProfile(profile: PartnerProfile): ShopProfile {
  const logo = profile.logo || profile.logoUrl || profile.image;
  const banner = profile.banner || profile.bannerUrl || profile.cover;
  return {
    shopId: profile.partnerId,
    name: profile.businessName,
    ownerName: profile.ownerName,
    description: profile.description || "",
    category: profile.category || "Laundry Service",
    businessType: profile.category || "Laundry & Dry Clean",
    rating: profile.rating,
    reviewCount: profile.totalOrders,
    verification: profile.isVerified ? "verified" : (profile.status === "rejected" ? "rejected" : "pending"),
    contactNumber: profile.phone,
    email: profile.email,
    gstNumber: profile.gstin || "",
    logo: logo,
    logoUrl: logo,
    banner: banner,
    bannerUrl: banner,
    cover: banner,
    image: logo || banner,
    logoTint: "from-primary/35 to-secondary/25",
    bannerTint: "from-primary/30 via-secondary/20 to-primary/10",
  };
}

function statusFromSettings(settings: BusinessSettings): ShopStatusId {
  if (!settings.isStoreOpen) return "offline";
  if (!settings.acceptingNewOrders) return "busy";
  return "online";
}

export function PartnerShopProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ShopProfile>(EMPTY_PROFILE);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [hours, setHours] = useState<BusinessHours>(EMPTY_HOURS);
  const [area, setArea] = useState<ServiceArea>(EMPTY_AREA);
  const [stats, setStats] = useState<ShopStatistics>(EMPTY_STATS);
  const [status, setStatusState] = useState<ShopStatusId>("offline");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [profileDoc, settingsDoc, earnings] = await Promise.all([
        fetchPartnerProfile(),
        fetchBusinessSettings(),
        fetchEarnings().catch(() => null),
      ]);
      setProfile(toShopProfile(profileDoc));
      setSettings(settingsDoc);
      setStatusState(statusFromSettings(settingsDoc));
      setHours({
        openingTime: settingsDoc.openingTime,
        closingTime: settingsDoc.closingTime,
        weeklyOff: settingsDoc.weeklyOff,
        holidayMode: false,
        temporarilyClosed: !settingsDoc.isStoreOpen,
      });
      setArea({
        city: profileDoc.city,
        area: "",
        pickupRadiusKm: settingsDoc.pickupRadiusKm,
        deliveryRadiusKm: 0,
      });
      setStats({
        totalOrders: profileDoc.totalOrders,
        completedOrders: earnings?.completedOrders ?? 0,
        activeCustomers: 0,
        averageRating: profileDoc.rating,
        revenue: earnings?.month ?? 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shop details");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(() => load(), [load]);

  const uploadLogo = useCallback(async (base64Image: string) => {
    const res = await uploadPartnerLogo(base64Image);
    const url = res.url;
    setProfile((current) => ({
      ...current,
      logo: url,
      logoUrl: url,
      image: url,
    }));
    return url;
  }, []);

  const uploadBanner = useCallback(async (base64Image: string) => {
    const res = await uploadPartnerBanner(base64Image);
    const url = res.url;
    setProfile((current) => ({
      ...current,
      banner: url,
      bannerUrl: url,
      cover: url,
    }));
    return url;
  }, []);

  const updateProfile = useCallback(async (patch: Partial<ShopProfile>) => {
    const payload: Partial<PartnerProfile> = {};
    if (patch.name !== undefined) payload.businessName = patch.name;
    if (patch.email !== undefined) payload.email = patch.email;
    if (patch.contactNumber !== undefined) payload.phone = patch.contactNumber;
    if (patch.description !== undefined) payload.description = patch.description;
    if (patch.category !== undefined) payload.category = patch.category;
    if (patch.gstNumber !== undefined) payload.gstin = patch.gstNumber;
    if (patch.logo !== undefined) payload.logo = patch.logo;
    if (patch.banner !== undefined) payload.banner = patch.banner;

    const doc = await updatePartnerProfile(payload);
    setProfile((current) => ({
      ...current,
      ...patch,
      name: doc.profile.businessName || current.name,
      email: doc.profile.email || current.email,
      contactNumber: doc.profile.phone || current.contactNumber,
      logo: doc.profile.logo || current.logo,
      banner: doc.profile.banner || current.banner,
    }));
  }, []);

  const setStatus = useCallback(async (next: ShopStatusId) => {
    const isStoreOpen = next !== "offline" && next !== "temporarily_closed" && next !== "vacation";
    const acceptingNewOrders = next === "online";
    const updated = await updateBusinessSettings({ isStoreOpen, acceptingNewOrders });
    setStatusState(next);
    setSettings((current) => (current ? { ...current, ...updated.patch } : current));
    setHours((current) => ({
      ...current,
      temporarilyClosed: next === "temporarily_closed" || next === "vacation",
    }));
  }, []);

  const updateHours = useCallback(async (patch: Partial<BusinessHours>) => {
    const body: Partial<BusinessSettings> = {};
    if (patch.openingTime !== undefined) body.openingTime = patch.openingTime;
    if (patch.closingTime !== undefined) body.closingTime = patch.closingTime;
    if (patch.weeklyOff !== undefined) body.weeklyOff = patch.weeklyOff;
    if (Object.keys(body).length > 0) {
      await updateBusinessSettings(body);
    }
    setHours((current) => ({ ...current, ...patch }));
  }, []);

  // No gallery/upload endpoint exists on the backend yet.
  const addImage = useCallback(() => false, []);
  const removeImage = useCallback((_id: string) => {}, []);
  const moveImage = useCallback((_id: string, _direction: -1 | 1) => {}, []);

  const value = useMemo<PartnerShopValue>(
    () => ({
      profile,
      gallery: [],
      hours,
      area,
      stats,
      status,
      isLoading,
      error,
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
      hours,
      area,
      stats,
      status,
      isLoading,
      error,
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

const PartnerShopContext = createContext<PartnerShopValue | null>(null);

export function usePartnerShop() {
  const context = useContext(PartnerShopContext);
  if (!context) throw new Error("usePartnerShop must be used inside PartnerShopProvider");
  return context;
}
