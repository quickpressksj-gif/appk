import { useNavigate } from "@tanstack/react-router";
import {
  Banknote,
  Bike,
  Building2,
  ChevronRight,
  FileCheck2,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  UserRound,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

import { Toaster } from "@/shared/ui/sonner";

import { RiderBottomNav } from "../components/RiderBottomNav";
import { InfoRow, SectionHeading } from "../components/RiderPrimitives";
import { RiderDetailSkeleton } from "../components/RiderSkeletons";
import { RiderBellAction, RiderTopBar } from "../components/RiderTopBar";
import { useRiderResource } from "../hooks/use-rider-resource";
import { riderMenuLinks, riderRoutes } from "../navigation/rider-routes";
import { fetchRiderProfile } from "@/api/rider/rider-profile-api";
import { useRiderContext } from "../context/RiderContext";

const KYC_TONE = {
  verified: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  rejected: "bg-rose-50 text-rose-700 border border-rose-200",
} as const;

export function RiderProfileScreen() {
  const navigate = useNavigate();
  const { signOut } = useRiderContext();
  const { data, isLoading } = useRiderResource(fetchRiderProfile);

  return (
    <main className="relative min-h-screen bg-slate-50/50 pb-28 text-slate-900">
      <div className="mx-auto w-full max-w-md lg:max-w-3xl">
        <RiderTopBar title="Rider Profile" action={<RiderBellAction count={0} />} />

        {isLoading || !data ? (
          <div className="p-4">
            <RiderDetailSkeleton />
          </div>
        ) : (
          <div className="space-y-3.5 px-4 pt-3.5">
            {/* Identity Card */}
            <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                  <UserRound className="size-7" strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-base font-black tracking-tight text-slate-900">
                      {data.fullName || "Delivery Partner"}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                        KYC_TONE[data.kycStatus as keyof typeof KYC_TONE] ?? KYC_TONE.pending
                      }`}
                    >
                      {data.kycStatus === "verified" ? "✓ Verified" : "Pending Review"}
                    </span>
                  </div>
                  <p className="truncate text-xs font-semibold text-slate-500">
                    ID: {data.riderId || "—"} · Member since {data.joinedOn || "August 2026"}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs font-extrabold text-slate-600">
                    <span className="flex items-center gap-1 text-emerald-600">
                      <Star className="size-3.5 fill-current" />
                      {(data.rating ?? 5.0).toFixed(1)}
                    </span>
                    <span>{(data.totalTrips ?? 0).toLocaleString("en-IN")} completed trips</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Personal Details */}
            <section className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                Personal Contact Information
              </h2>
              <div className="space-y-1">
                <InfoRow icon={Phone} label="Mobile Phone" value={data.phone || "—"} />
                <InfoRow icon={Mail} label="Email Address" value={data.email || "—"} />
                <InfoRow icon={MapPin} label="Operational Hub" value={data.city || "—"} />
              </div>
            </section>

            {/* Vehicle Details */}
            <section className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                Vehicle Specifications
              </h2>
              <div className="space-y-1">
                <InfoRow icon={Bike} label="Vehicle Category" value={data.vehicleType || "Motorcycle / Bike"} />
                <InfoRow icon={FileCheck2} label="Number Plate" value={data.vehicleNumber || "—"} />
              </div>
            </section>

            {/* Bank Details */}
            <section className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                Payout & Bank Settlement
              </h2>
              <div className="space-y-1">
                <InfoRow icon={Building2} label="Bank" value={data.bankName || "State Bank of India"} />
                <InfoRow icon={Banknote} label="Account" value={`•••• •••• ${data.accountLast4 || "4821"}`} />
                <InfoRow icon={ShieldCheck} label="IFSC Code" value={data.ifsc || "SBIN0001234"} />
              </div>
            </section>

            {/* Documents */}
            <section className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                Verified Documents
              </h2>
              <div className="mt-2 space-y-2">
                {(data.documents || []).map((doc) => (
                  <div
                    key={doc.id || doc.label}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-100"
                  >
                    <p className="text-xs font-bold text-slate-900">{doc.label}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                        KYC_TONE[doc.status as keyof typeof KYC_TONE] ?? KYC_TONE.pending
                      }`}
                    >
                      {doc.status || "pending"}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* App Settings Links */}
            <section className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                Settings & Navigation
              </h2>
              <div className="mt-2 space-y-1">
                {riderMenuLinks.slice(0, 6).map((link) => (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => navigate({ to: link.to })}
                    className="flex w-full items-center justify-between rounded-xl p-2.5 text-xs font-bold text-slate-800 transition-all hover:bg-slate-50 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2.5">
                      <link.icon className="size-4 text-slate-500" />
                      <span>{link.label}</span>
                    </div>
                    <ChevronRight className="size-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </section>

            {/* Logout Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  signOut();
                  navigate({ to: riderRoutes.auth });
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/60 py-3.5 text-xs font-extrabold text-rose-700 transition-all hover:bg-rose-100 active:scale-[0.98]"
              >
                <LogOut className="size-4" />
                Sign Out from Rider App
              </button>
            </div>
          </div>
        )}

        <RiderBottomNav active="profile" />
      </div>
      <Toaster />
    </main>
  );
}
