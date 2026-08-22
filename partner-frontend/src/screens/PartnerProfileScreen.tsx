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

import { PartnerLayout } from "../components/layout/PartnerLayout";
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
    <PartnerLayout
      activeTab="profile"
      title="Partner Profile"
      subtitle={profile ? `${profile.businessName} · ID: ${profile.partnerId}` : "Account Details"}
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-6">
        {!profile ? (
          <PartnerDetailSkeleton />
        ) : (
          <div className="animate-soft-fade space-y-6 pb-12">
            {/* Top Identity Card */}
            <section className="flex flex-col sm:flex-row items-center gap-4 rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-primary/20 text-brand-dark font-black text-2xl">
                {profile.businessName.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="truncate text-xl font-black text-foreground">
                  {profile.businessName}
                </p>
                <p className="truncate text-xs font-semibold text-muted-foreground">
                  {profile.ownerName} · Store ID: {profile.partnerId}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  <Award className="size-3.5" /> {profile.tier || "Verified"} Partner
                </span>
              </div>
            </section>

            {/* Stats Row */}
            <section className="grid grid-cols-2 gap-4">
              <StatCard icon={Star} label="Customer Rating" value={`${profile.rating || 5.0}`} delay={0} />
              <StatCard
                icon={Award}
                label="Completed Orders"
                value={`${(profile.totalOrders || 0).toLocaleString("en-IN")}`}
                tone="green"
                delay={45}
              />
            </section>

            {/* Contact Details */}
            <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
              <SectionHeading title="Store Contact & Location" />
              <div className="mt-4 divide-y divide-border/60">
                {[
                  { icon: PhoneCall, label: profile.phone },
                  { icon: Mail, label: profile.email || "partner@quickpress.com" },
                  { icon: MapPin, label: `${profile.city} · Joined ${profile.joinedOn || "2024"}` },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                    <row.icon className="size-4 shrink-0 text-muted-foreground" />
                    <p className="truncate text-xs font-bold text-foreground">
                      {row.label}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Navigation Menu */}
            <section className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
              <SectionHeading title="Partner Settings & Tools" />
              <div className="mt-4 divide-y divide-border/60">
                {partnerMenuLinks.map((link) => (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => navigate({ to: link.to })}
                    className="flex w-full items-center gap-3 py-3.5 text-left transition-colors hover:bg-muted/40 first:pt-0 last:pb-0"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-brand-dark">
                      <link.icon className="size-4" strokeWidth={2.1} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground">{link.label}</p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </section>

            {/* Sign Out Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  void signOut();
                  void navigate({ to: partnerRoutes.auth });
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 py-3 text-xs font-bold text-destructive transition-colors hover:bg-destructive/20"
              >
                <LogOut className="size-4" />
                <span>Sign Out from Partner Console</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <Toaster />
    </PartnerLayout>
  );
}
