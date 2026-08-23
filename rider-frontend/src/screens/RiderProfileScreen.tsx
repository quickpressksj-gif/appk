import { useNavigate } from "@tanstack/react-router";
import {
  Banknote,
  Bike,
  Building2,
  ChevronRight,
  FileCheck2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";

import { Toaster } from "@/shared/ui/sonner";

import { RiderBottomNav } from "../components/RiderBottomNav";
import { InfoRow, SectionHeading } from "../components/RiderPrimitives";
import { RiderDetailSkeleton } from "../components/RiderSkeletons";
import { RiderBellAction, RiderTopBar } from "../components/RiderTopBar";
import { useRiderResource } from "../hooks/use-rider-resource";
import { riderMenuLinks } from "../navigation/rider-routes";
import { fetchRiderProfile } from "@/api/rider/rider-profile-api";

const KYC_TONE = {
  verified: "bg-secondary/10 text-brand-green",
  pending: "bg-primary/15 text-brand-dark",
  rejected: "bg-destructive/10 text-destructive",
} as const;

export function RiderProfileScreen() {
  const navigate = useNavigate();
  const { data, isLoading } = useRiderResource(fetchRiderProfile);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md">
        <RiderTopBar title="Rider Profile" action={<RiderBellAction count={1} />} />

        {isLoading || !data ? (
          <RiderDetailSkeleton />
        ) : (
          <div className="px-5 pb-32 pt-4">
            <section className="card-soft flex items-center gap-4 border border-border p-5">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/15 text-brand-dark">
                <UserRound className="size-7" strokeWidth={2.1} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-black tracking-tight text-foreground">
                  {data.fullName || "Delivery Partner"}
                </p>
                <p className="truncate text-[0.7rem] font-semibold text-muted-foreground">
                  {data.riderId || "—"} · Since {data.joinedOn || "August 2026"}
                </p>
                <div className="mt-1.5 flex items-center gap-3 text-[0.7rem] font-bold text-muted-foreground">
                  <span className="flex items-center gap-1 text-brand-green">
                    <Star className="size-3.5 fill-current" />
                    {(data.rating ?? 5.0).toFixed(1)}
                  </span>
                  <span>{(data.totalTrips ?? 0).toLocaleString("en-IN")} trips</span>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider ${
                  KYC_TONE[data.kycStatus as keyof typeof KYC_TONE] ?? KYC_TONE.pending
                }`}
              >
                KYC {data.kycStatus || "pending"}
              </span>
            </section>

            <section className="card-soft mt-4 border border-border p-4">
              <SectionHeading title="Personal Details" />
              <div className="mt-2">
                <InfoRow icon={Phone} label="Phone" value={data.phone || "—"} />
                <InfoRow icon={Mail} label="Email" value={data.email || "—"} />
                <InfoRow icon={MapPin} label="Service City" value={data.city || "—"} />
              </div>
            </section>

            <section className="card-soft mt-4 border border-border p-4">
              <SectionHeading title="Vehicle Details" />
              <div className="mt-2">
                <InfoRow icon={Bike} label="Vehicle Type" value={data.vehicleType || "Bike"} />
                <InfoRow icon={FileCheck2} label="Vehicle Number" value={data.vehicleNumber || "—"} />
              </div>
            </section>

            <section className="card-soft mt-4 border border-border p-4">
              <SectionHeading title="Bank Details" />
              <div className="mt-2">
                <InfoRow icon={Building2} label="Bank" value={data.bankName || "State Bank of India"} />
                <InfoRow icon={Banknote} label="Account" value={`•••• ${data.accountLast4 || "4821"}`} />
                <InfoRow icon={ShieldCheck} label="IFSC" value={data.ifsc || "SBIN0001234"} />
              </div>
            </section>

            <section className="card-soft mt-4 border border-border p-4">
              <SectionHeading title="Documents" />
              <div className="mt-3 space-y-2">
                {(data.documents || []).map((doc) => (
                  <div
                    key={doc.id || doc.label}
                    className="flex items-center justify-between rounded-2xl bg-muted px-3 py-2.5"
                  >
                    <p className="text-xs font-bold tracking-tight text-foreground">{doc.label}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${
                        KYC_TONE[doc.status as keyof typeof KYC_TONE] ?? KYC_TONE.pending
                      }`}
                    >
                      {doc.status || "pending"}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-4 space-y-2">
              {riderMenuLinks.map((link, index) => (
                <button
                  key={link.id}
                  type="button" onClick={() => navigate({ to: link.to })}
                  className="card-soft ripple flex w-full items-center gap-3 border border-border p-4 text-left transition-all duration-300 active:scale-[0.985]"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
                    <link.icon className="size-4" strokeWidth={2.2} />
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm font-bold tracking-tight text-foreground">
                    {link.label}
                  </p>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </section>
          </div>
        )}

        <RiderBottomNav active="profile" />
      </div>
      <Toaster />
    </main>
  );
}
