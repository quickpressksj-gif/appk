import { useNavigate } from "@tanstack/react-router";
import { Camera, Save, UserRound } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { RiderTopBar } from "../../components/RiderTopBar";
import {
  SettingsCard,
  SettingsField,
  SettingsSuccess,
} from "../../components/settings/SettingsPrimitives";
import { useRiderSettings } from "../../context/RiderSettingsContext";
import { riderRoutes } from "../../navigation/rider-routes";

type Errors = Partial<Record<"fullName" | "email" | "phone" | "address" | "emergencyContact", string>>;

/** Account → Edit Profile: editable rider + vehicle information (UI only). */
export function EditProfileScreen() {
  const navigate = useNavigate();
  const { profile, vehicle, updateProfile, updateVehicle } = useRiderSettings();

  const [form, setForm] = useState({
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    city: profile.city,
    address: profile.address,
    emergencyContact: profile.emergencyContact,
  });
  const [vehicleForm, setVehicleForm] = useState({
    vehicleType: vehicle.vehicleType,
    model: vehicle.model,
    vehicleNumber: vehicle.vehicleNumber,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [photo, setPhoto] = useState<string | null>(profile.photoUrl);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const setField = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const next: Errors = {};
    if (form.fullName.trim().length < 3) next.fullName = "Enter your full name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email";
    if (form.phone.replace(/\D/g, "").length < 10) next.phone = "Enter a valid phone number";
    if (form.address.trim().length < 10) next.address = "Enter your full address";
    if (form.emergencyContact.replace(/\D/g, "").length < 10)
      next.emergencyContact = "Enter a valid contact number";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onPickPhoto = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  };

  const onSave = () => {
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSaving(true);
    window.setTimeout(() => {
      updateProfile({ ...form, photoUrl: photo });
      updateVehicle(vehicleForm);
      setSaving(false);
      setSuccess(true);
      window.setTimeout(() => {
        setSuccess(false);
        void navigate({ to: riderRoutes.settingsAccount });
      }, 1100);
    }, 700);
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Edit Profile"
          subtitle="Update your rider details"
          onBack={() => void navigate({ to: riderRoutes.settingsAccount })}
        />

        <div className="space-y-4 px-5 pb-32 pt-4">
          <SettingsCard title="Profile photo" caption="JPG or PNG, up to 4 MB">
            <div className="flex items-center gap-4">
              <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/15 text-brand-dark">
                {photo ? (
                  <img src={photo} alt="Preview" className="size-full object-cover" />
                ) : (
                  <UserRound className="size-8" strokeWidth={2.1} />
                )}
              </span>
              <div className="flex-1 space-y-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="ripple flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-xs font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97]"
                >
                  <Camera className="size-4" />
                  Upload photo
                </button>
                {photo ? (
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    className="w-full rounded-2xl border border-border bg-card py-3 text-xs font-black tracking-tight text-muted-foreground transition-all duration-300 active:scale-[0.97]"
                  >
                    Remove photo
                  </button>
                ) : null}
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => onPickPhoto(event.target.files?.[0])}
            />
          </SettingsCard>

          <SettingsCard title="Rider information" delay={60}>
            <SettingsField
              label="Full name"
              value={form.fullName}
              onChange={(value) => setField("fullName", value)}
              error={errors.fullName}
            />
            <SettingsField
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => setField("email", value)}
              error={errors.email}
            />
            <SettingsField
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(value) => setField("phone", value)}
              error={errors.phone}
            />
            <SettingsField
              label="Service city"
              value={form.city}
              onChange={(value) => setField("city", value)}
            />
            <SettingsField
              label="Address"
              value={form.address}
              onChange={(value) => setField("address", value)}
              error={errors.address}
            />
            <SettingsField
              label="Emergency contact"
              type="tel"
              value={form.emergencyContact}
              onChange={(value) => setField("emergencyContact", value)}
              error={errors.emergencyContact}
            />
          </SettingsCard>

          <SettingsCard title="Vehicle information" delay={120}>
            <SettingsField
              label="Vehicle type"
              value={vehicleForm.vehicleType}
              onChange={(value) => setVehicleForm((prev) => ({ ...prev, vehicleType: value }))}
            />
            <SettingsField
              label="Model"
              value={vehicleForm.model}
              onChange={(value) => setVehicleForm((prev) => ({ ...prev, model: value }))}
            />
            <SettingsField
              label="Vehicle number"
              value={vehicleForm.vehicleNumber}
              onChange={(value) => setVehicleForm((prev) => ({ ...prev, vehicleNumber: value }))}
            />
          </SettingsCard>

          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="ripple flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97] disabled:opacity-70"
          >
            <Save className="size-4" />
            {saving ? "Saving changes…" : "Save changes"}
          </button>
        </div>
      </div>

      <SettingsSuccess open={success} message="Profile updated successfully" />
      <Toaster />
    </main>
  );
}