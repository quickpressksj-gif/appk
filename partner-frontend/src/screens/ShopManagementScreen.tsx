import { useNavigate } from "@tanstack/react-router";
import { BarChart3, Clock3, Images, MapPinned, Store } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { PartnerLayout } from "../components/layout/PartnerLayout";
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
    <PartnerLayout
      activeTab="profile"
      title="Store Profile & Management"
      subtitle={`${shopStatusMeta(status).label} · ${profile.category || "Laundry Service"}`}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-8 md:py-6">
        <PullToRefresh onRefresh={refresh}>
          {isLoading ? (
            <ShopProfileSkeleton />
          ) : (
            <div className="animate-soft-fade space-y-6 pb-12">
              <ShopProfileHeader
                profile={profile}
                status={status}
                galleryCount={gallery.length}
                onEdit={() => setEditOpen(true)}
                onChangeStatus={() => setStatusOpen(true)}
              />

              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
                  <SectionHeading
                    title="Shop Performance"
                    action={<SectionIcon icon={BarChart3} />}
                  />
                  <div className="mt-4">
                    <ShopStatsGrid stats={stats} />
                  </div>
                </section>

                <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
                  <SectionHeading
                    title="Operating Hours"
                    action={<SectionIcon icon={Clock3} />}
                  />
                  <div className="mt-4">
                    <ShopHoursCard hours={hours} onSave={updateHours} />
                  </div>
                </section>
              </div>

              <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
                <SectionHeading
                  title="Pickup & Delivery Area"
                  action={<SectionIcon icon={MapPinned} />}
                />
                <div className="mt-4">
                  <ShopServiceArea area={area} />
                </div>
              </section>

              <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
                <SectionHeading title="Store Photos & Gallery" action={<SectionIcon icon={Images} />} />
                <div className="mt-4">
                  <ShopGallery
                    images={gallery}
                    limit={galleryLimit}
                    query={galleryQuery}
                    onQueryChange={setGalleryQuery}
                    onAdd={() => {
                      if (addImage()) {
                        setSuccess("Photo added");
                      }
                    }}
                    onRemove={removeImage}
                    onMove={moveImage}
                  />
                </div>
              </section>
            </div>
          )}
        </PullToRefresh>
      </div>

      {editOpen ? (
        <ShopEditSheet
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSave={(patch) => {
            updateProfile(patch);
            setEditOpen(false);
            setSuccess("Shop details updated");
          }}
        />
      ) : null}

      {statusOpen ? (
        <ShopStatusSheet
          current={status}
          onClose={() => setStatusOpen(false)}
          onSelect={(next) => {
            setStatus(next);
            setStatusOpen(false);
            setSuccess(`Status changed to ${shopStatusMeta(next).label}`);
          }}
        />
      ) : null}

      <ShopSuccessOverlay message={success} onDone={() => setSuccess(null)} />
      <Toaster />
    </PartnerLayout>
  );
}
