import {
  BadgeCheck,
  Building2,
  Camera,
  Clock3,
  ImageIcon,
  Loader2,
  Pencil,
  ShieldAlert,
  ShieldX,
  Star,
  Store,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { usePartnerShop } from "../../context/PartnerShopContext";
import { shopStatusMeta, type ShopProfile, type ShopStatusId } from "../../data/partner-shop-mock";

const TONE_CLASS: Record<string, string> = {
  green: "bg-secondary/15 text-brand-green-dark",
  muted: "bg-muted text-muted-foreground",
  amber: "bg-primary/20 text-brand-dark",
  red: "bg-destructive/10 text-destructive",
};

export function ShopStatusBadge({ status }: { status: ShopStatusId }) {
  const meta = shopStatusMeta(status);
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.64rem] font-black uppercase tracking-wider ${
        TONE_CLASS[meta.tone] ?? TONE_CLASS["muted"]
      }`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

function VerificationChip({ status }: { status: ShopProfile["verification"] }) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-brand-green-dark">
        <BadgeCheck className="size-3" /> Verified
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-brand-dark">
        <ShieldAlert className="size-3" /> Verification pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-destructive">
      <ShieldX className="size-3" /> Rejected
    </span>
  );
}

import { compressImage } from "../../lib/image-compression";

/** Banner + logo + identity block at the top of Shop Management. */
export function ShopProfileHeader({
  profile,
  status,
  galleryCount,
  onEdit,
  onChangeStatus,
}: {
  profile: ShopProfile;
  status: ShopStatusId;
  galleryCount: number;
  onEdit: () => void;
  onChangeStatus: () => void;
}) {
  const { uploadLogo, uploadBanner } = usePartnerShop();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const bannerImg = profile.banner || profile.bannerUrl || profile.cover;
  const logoImg = profile.logo || profile.logoUrl || profile.image;

  const handleBannerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const dataUrl = await compressImage(file, {
        maxWidth: 1600,
        maxHeight: 1000,
        quality: 0.85,
      });
      await uploadBanner(dataUrl);
      toast.success("Shop banner updated successfully! Customers will see this now.");
    } catch (err) {
      console.error("Banner upload error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to upload banner.");
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const dataUrl = await compressImage(file, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.85,
      });
      await uploadLogo(dataUrl);
      toast.success("Shop logo updated successfully! Customers will see this now.");
    } catch (err) {
      console.error("Logo upload error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to upload logo.");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  return (
    <section className="animate-rise card-soft overflow-hidden border border-border">
      {/* Hidden file inputs */}
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleBannerSelect}
      />
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleLogoSelect}
      />

      <div
        className={`relative flex h-36 items-end overflow-hidden bg-linear-to-br ${profile.bannerTint} md:h-48`}
        aria-label="Shop banner"
      >
        {bannerImg ? (
          <img
            src={bannerImg}
            alt={`${profile.name} banner`}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
            Shop Banner
          </span>
        )}

        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Change banner button */}
        <button
          type="button"
          onClick={() => bannerInputRef.current?.click()}
          disabled={uploadingBanner}
          className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-card/90 backdrop-blur-md px-3 py-1.5 text-[0.66rem] font-black text-foreground shadow-soft transition-all duration-300 active:scale-[0.95] hover:bg-card"
        >
          {uploadingBanner ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Camera className="size-3.5 text-primary" />
          )}
          {bannerImg ? "Change Banner" : "Upload Banner"}
        </button>

        <div className="relative z-10 flex w-full items-center justify-between gap-2 px-4 pb-3">
          <ShopStatusBadge status={status} />
          <button
            type="button"
            onClick={onChangeStatus}
            className="ripple rounded-full bg-card/90 px-3 py-1.5 text-[0.64rem] font-bold tracking-tight text-foreground shadow-soft transition-all duration-300 active:scale-[0.96]"
          >
            Change status
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 px-4 pb-4 pt-4 sm:flex sm:items-center">
        {/* Shop logo avatar with upload trigger */}
        <div className="relative -mt-10 group">
          <div
            className={`flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-card bg-linear-to-br ${profile.logoTint} text-brand-dark shadow-soft`}
          >
            {logoImg ? (
              <img
                src={logoImg}
                alt={`${profile.name} logo`}
                className="size-full object-cover"
              />
            ) : (
              <Store className="size-6" strokeWidth={2.2} />
            )}
          </div>
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            disabled={uploadingLogo}
            title="Change shop logo"
            className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform duration-300 hover:scale-110 active:scale-95"
          >
            {uploadingLogo ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Camera className="size-3" />
            )}
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-base font-black tracking-tight text-foreground">
              {profile.name}
            </h2>
          </div>
          <p className="truncate text-[0.72rem] font-semibold text-muted-foreground">
            {profile.ownerName} · {profile.shopId}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <VerificationChip status={profile.verification} />
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-muted-foreground">
              <Building2 className="size-3" /> {profile.category || "Laundry Service"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="ripple col-span-2 flex items-center justify-center gap-1.5 rounded-2xl bg-primary px-3.5 py-2.5 text-[0.7rem] font-black tracking-tight text-primary-foreground transition-all duration-300 active:scale-[0.96] sm:col-span-1 sm:shrink-0"
        >
          <Pencil className="size-3.5" /> Edit Shop
        </button>
      </div>

      <p className="border-t border-border px-4 py-3.5 text-[0.78rem] font-medium leading-relaxed text-muted-foreground">
        {profile.description}
      </p>

      <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
        <div className="px-3 py-3 text-center">
          <p className="flex items-center justify-center gap-1 text-sm font-black tracking-tight text-foreground">
            <Star className="size-3.5 text-brand-dark" /> {profile.rating}
          </p>
          <p className="text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">
            {profile.reviewCount} reviews
          </p>
        </div>
        <div className="px-3 py-3 text-center">
          <p className="flex items-center justify-center gap-1 text-sm font-black tracking-tight text-foreground">
            <ImageIcon className="size-3.5 text-brand-dark" /> {galleryCount}
          </p>
          <p className="text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">
            Gallery photos
          </p>
        </div>
        <div className="px-3 py-3 text-center">
          <p className="flex items-center justify-center gap-1 text-sm font-black tracking-tight text-foreground">
            <Clock3 className="size-3.5 text-brand-dark" /> {profile.businessType.split(" ")[0]}
          </p>
          <p className="text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">
            Business type
          </p>
        </div>
      </div>
    </section>
  );
}
