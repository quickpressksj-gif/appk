import { useNavigate } from "@tanstack/react-router";
import {
  Award,
  ChevronRight,
  LogOut,
  Mail,
  MapPin,
  PhoneCall,
  Settings2,
  Sparkles,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { PartnerTopBar } from "../components/PartnerTopBar";
import { PartnerBottomNav } from "../components/PartnerBottomNav";
import { PartnerDetailSkeleton } from "../components/PartnerSkeletons";
import { SectionHeading, StatCard } from "../components/PartnerPrimitives";
import { usePartnerContext } from "../context/PartnerContext";
import { usePartnerResource } from "../hooks/use-partner-resource";
import { partnerMenuLinks, partnerRoutes } from "../navigation/partner-routes";
import { fetchPartnerProfile } from "@/api/partner/partner-profile-api";

export function PartnerProfileScreen() {
  const navigate = useNavigate();
  const { signOut } = usePartnerContext();
  const { data: profile } = usePartnerResource(fetchPartnerProfile);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md">
        <PartnerTopBar title="Partner Profile" onBack={() => navigate({ to: partnerRoutes.dashboard })} />

        {!profile ? (
          <PartnerDetailSkeleton />
        ) : (
          <div className="px-5 pb-32 pt-4">
            <section className="card-soft flex items-center gap-4 border border-border p-4">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-primary/15 text-brand-dark">
                <Sparkles className="size-7" strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-black tracking-tight text-foreground">
                  {profile.businessName}
                </p>
                <p className="truncate text-[0.72rem] font-semibold text-muted-foreground">
                  {profile.ownerName} · {profile.partnerId}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-brand-green">
                  <Award className="size-3" /> {profile.tier} Partner
                </span>
              </div>
            </section>

            <section className="mt-5 grid grid-cols-2 gap-3">
              <StatCard icon={Star} label="Rating" value={`${profile.rating}`} delay={0} />
              <StatCard
                icon={Award}
                label="Total Orders"
                value={`${profile.totalOrders.toLocaleString("en-IN")}`}
                tone="green"
                delay={45}
              />
            </section>

            <section className="mt-6">
              <SectionHeading title="Contact" />
              <div className="card-soft mt-4 divide-y divide-border border border-border">
                {[
                  { icon: PhoneCall, label: profile.phone },
                  { icon: Mail, label: profile.email },
                  { icon: MapPin, label: `${profile.city} · Joined ${profile.joinedOn}` },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3 px-4 py-3.5">
                    <row.icon className="size-4 shrink-0 text-muted-foreground" />
                    <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                      {row.label}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6">
              <SectionHeading title="Manage" />
              <div className="card-soft mt-4 divide-y divide-border border border-border">
                {partnerMenuLinks.map((link) => (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => navigate({ to: link.to })}
                    className="ripple flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-300 hover:bg-accent/60"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
                      <link.icon className="size-4" strokeWidth={2.1} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold tracking-tight text-foreground">
                      {link.label}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </section>

            <button
              type="button"
              onClick={() => {
                signOut();
                toast.success("Signed out");
                navigate({ to: partnerRoutes.auth });
              }}
              className="ripple mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-sm font-bold tracking-tight text-destructive transition-all duration-300 active:scale-[0.97]"
            >
              <LogOut className="size-4" />
              Sign out
            </button>

            <button
              type="button"
              onClick={() => navigate({ to: partnerRoutes.settings })}
              className="mt-4 flex w-full items-center justify-center gap-1.5 text-[0.72rem] font-bold tracking-tight text-brand-green"
            >
              <Settings2 className="size-3.5" /> Business Settings
            </button>
          </div>
        )}

        <PartnerBottomNav active="profile" />
      </div>
      <Toaster />
    </main>
  );
}
