import { useNavigate } from "@tanstack/react-router";
import {
  Bike,
  Camera,
  CalendarDays,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldAlert,
  Star,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { InfoRow } from "../../components/RiderPrimitives";
import { RiderTopBar } from "../../components/RiderTopBar";
import {
  SettingsBadge,
  SettingsCard,
  SettingsSkeleton,
  SettingsSuccess,
} from "../../components/settings/SettingsPrimitives";
import { useRiderSettings } from "../../context/RiderSettingsContext";
import { riderRoutes } from "../../navigation/rider-routes";

/** Account → Profile: rider information, photo and quick edit access. */
export function AccountProfileScreen() {
  const navigate = useNavigate();
  const { profile, vehicle, updateProfile } = useRiderSettings();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 420);
    return () => window.clearTimeout(timer);
  }, []);

  const onPickPhoto = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Photo must be under 4 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateProfile({ photoUrl: String(reader.result) });
      setSuccess(true);
      window.setTimeout(() => setSuccess(false), 1200);
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Profile"
          subtitle="Your rider account"
          onBack={() => void navigate({ to: riderRoutes.settings })}
        />

        {loading ? (
          <SettingsSkeleton rows={3} />
        ) : (
          <div className="space-y-4 px-5 pb-32 pt-4">
            <section className="card-soft animate-rise border border-border p-5">
              <div className="flex items-center gap-4">
                <span className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/15 text-brand-dark">
                  {profile.photoUrl ? (
                    <img src={profile.photoUrl} alt="Profile" className="size-full object-cover" />
                  ) : (
                    <UserRound className="size-8" strokeWidth={2.1} />
                  )}
                  <button
                    type="button"
                    aria-label="Change profile photo"
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-0 right-0 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-cta transition-all duration-300 active:scale-90"
                  >
                    <Camera className="size-3.5" strokeWidth={2.4} />
                  </button>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-black tracking-tight text-foreground">
                    {profile.fullName}
                  </p>
                  <p className="truncate text-[0.7rem] font-semibold text-muted-foreground">
                    {profile.riderId}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3 text-[0.7rem] font-bold text-muted-foreground">
                    <span className="flex items-center gap-1 text-brand-green">
                      <Star className="size-3.5 fill-current" />
                      {profile.rating.toFixed(2)}
                    </span>
                    <span>{profile.totalTrips.toLocaleString("en-IN")} trips</span>
                  </div>
                </div>
                <SettingsBadge
                  label={`KYC ${profile.kycStatus}`}
                  tone={profile.kycStatus === "verified" ? "success" : "warning"}
                />
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => onPickPhoto(event.target.files?.[0])}
              />

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => void navigate({ to: riderRoutes.settingsAccountEdit })}
                  className="ripple flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-xs font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97]"
                >
                  <Pencil className="size-4" />
                  Edit profile
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-xs font-black tracking-tight text-foreground transition-all duration-300 active:scale-[0.97]"
                >
                  <Camera className="size-4" />
                  Change photo
                </button>
              </div>
            </section>

            <SettingsCard title="Rider information" delay={60}>
              <div>
                <InfoRow icon={Phone} label="Phone" value={profile.phone} />
                <InfoRow icon={Mail} label="Email" value={profile.email} />
                <InfoRow icon={MapPin} label="Service city" value={profile.city} />
                <InfoRow icon={MapPin} label="Address" value={profile.address} />
                <InfoRow icon={ShieldAlert} label="Emergency contact" value={profile.emergencyContact} />
                <InfoRow icon={CalendarDays} label="Rider since" value={profile.joinedOn} />
              </div>
            </SettingsCard>

            <SettingsCard title="Vehicle information" delay={120}>
              <div>
                <InfoRow icon={Bike} label="Vehicle type" value={vehicle.vehicleType} />
                <InfoRow icon={Bike} label="Model" value={vehicle.model} />
                <InfoRow icon={Bike} label="Vehicle number" value={vehicle.vehicleNumber} />
                <InfoRow icon={CalendarDays} label="Insurance valid till" value={vehicle.insuranceExpiry} />
                <InfoRow icon={CalendarDays} label="PUC valid till" value={vehicle.pucExpiry} />
              </div>
              <button
                type="button"
                onClick={() => void navigate({ to: riderRoutes.settingsDocuments })}
                className="mt-3 w-full rounded-2xl border border-border bg-card py-3 text-xs font-black tracking-tight text-foreground transition-all duration-300 active:scale-[0.97]"
              >
                Manage vehicle & documents
              </button>
            </SettingsCard>
          </div>
        )}
      </div>

      <SettingsSuccess open={success} message="Profile photo updated" />
      <Toaster />
    </main>
  );
}