import { useNavigate } from "@tanstack/react-router";
import { BarChart3, Clock3, Images, MapPinned, Store } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { PartnerBellAction, PartnerTopBar } from "../components/PartnerTopBar";
import { PartnerBottomNav } from "../components/PartnerBottomNav";
import { PullToRefresh } from "../components/dashboard/PullToRefresh";
import { SectionHeading } from "../components/PartnerPrimitives";
import { ShopEditSheet } from "../components/shop/ShopEditSheet";
import { ShopGallery } from "../components/shop/ShopGallery";
import { ShopHoursCard } from "../components/shop/ShopHoursCard";
import { ShopProfileHeader } from "../components/shop/ShopProfileHeader";
import { ShopServiceArea } from "../components/shop/ShopServiceArea";
import { ShopProfileSkeleton } from "../components/shop/ShopSkeletons";
import { ShopStatsGrid } from "../components/shop/ShopStatsGrid";
import { ShopStatusSheet } from "../components/shop/ShopStatusSheet";
import { ShopSuccessOverlay } from "../components/shop/ShopSuccessOverlay";
import { usePartnerShop } from "../context/PartnerShopContext";
import { shopStatusMeta } from "../data/partner-shop-mock";
import { partnerRoutes } from "../navigation/partner-routes";

function SectionIcon({ icon: Icon }: { icon: typeof Store }) {
  return (
    <span className="flex size-7 items-center justify-center rounded-xl bg-primary/15 text-brand-dark">
      <Icon className="size-3.5" strokeWidth={2.2} />
    </span>
  );
}

export function ShopManagementScreen() {
  const navigate = useNavigate();
  const {
    profile,
    gallery,
    hours,
    area,
    stats,
    status,
    isLoading,
    galleryLimit,
    refresh,
    updateProfile,
    setStatus,
    updateHours,
    addImage,
    removeImage,
    moveImage,
  } = usePartnerShop();

  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [galleryQuery, setGalleryQuery] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md md:max-w-3xl lg:max-w-6xl">
        <PartnerTopBar
          title="Shop Management"
          subtitle={`${shopStatusMeta(status).label} · ${profile.category}`}
          onBack={() => navigate({ to: partnerRoutes.dashboard })}
          action={<PartnerBellAction />}
        />

        <PullToRefresh onRefresh={refresh}>
          {isLoading ? (
            <ShopProfileSkeleton />
          ) : (
            <div className="animate-soft-fade px-5 pb-32 pt-4">
              <ShopProfileHeader
                profile={profile}
                status={status}
                galleryCount={gallery.length}
                onEdit={() => setEditOpen(true)}
                onChangeStatus={() => setStatusOpen(true)}
              />

              <section className="mt-7">
                <SectionHeading
                  title="Shop Statistics"
                  action={<SectionIcon icon={BarChart3} />}
                />
                <ShopStatsGrid stats={stats} />
              </section>

              <section className="mt-7">
                <SectionHeading title="Shop Gallery" action={<SectionIcon icon={Images} />} />
                <ShopGallery
                  images={gallery}
                  limit={galleryLimit}
                  query={galleryQuery}
                  onQueryChange={setGalleryQuery}
                  onAdd={() => {
                    if (addImage()) {
                      setSuccess("Photo added");
                    } else {
                      toast.error("Photo uploads aren't available yet");
                    }
                  }}
                  onRemove={(id) => {
                    removeImage(id);
                    toast.success("Photo removed");
                  }}
                  onMove={(id, direction) => moveImage(id, direction)}
                />
              </section>

              <section className="mt-7">
                <SectionHeading title="Business Hours" action={<SectionIcon icon={Clock3} />} />
                <ShopHoursCard
                  hours={hours}
                  onChange={(patch) => {
                    void updateHours(patch)
                      .then(() => toast.success("Business hours updated"))
                      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to update hours"));
                  }}
                />
              </section>

              <section className="mt-7">
                <SectionHeading title="Service Area" action={<SectionIcon icon={MapPinned} />} />
                <ShopServiceArea area={area} />
                <p className="mt-2 text-[0.66rem] font-medium text-muted-foreground">
                  Service area edits open up once the coverage API is connected.
                </p>
              </section>
            </div>
          )}
        </PullToRefresh>

        <PartnerBottomNav active="profile" />
      </div>

      <ShopEditSheet
        open={editOpen}
        initial={{
          name: profile.name,
          description: profile.description,
          contactNumber: profile.contactNumber,
          email: profile.email,
          gstNumber: profile.gstNumber,
          businessType: profile.businessType,
        }}
        onClose={() => setEditOpen(false)}
        onSave={(next) => {
          updateProfile(next);
          setEditOpen(false);
          setSuccess("Shop details saved");
        }}
      />

      <ShopStatusSheet
        open={statusOpen}
        status={status}
        onClose={() => setStatusOpen(false)}
        onSelect={(next) => {
          void setStatus(next)
            .then(() => {
              setStatusOpen(false);
              setSuccess(`Shop set to ${shopStatusMeta(next).label}`);
            })
            .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to update shop status"));
        }}
      />

      <ShopSuccessOverlay message={success} onDone={() => setSuccess(null)} />
      <Toaster />
    </main>
  );
}
