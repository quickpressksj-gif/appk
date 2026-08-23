import { useNavigate } from "@tanstack/react-router";
import {
  Banknote,
  Bike,
  Building2,
  Calendar,
  CreditCard,
  FileCheck2,
  IdCard,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  CheckCircle2,
  Sparkles,
  MapPinCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";
import { submitRiderRegistration } from "@/api/rider/rider-auth-api";
import { apiGetJson } from "@/api/core/transport";

import {
  ChoiceChips,
  OnboardingStepper,
  ReviewGroup,
  StepShell,
  TextField,
  UploadTile,
  VehiclePicker,
} from "../components/onboarding/OnboardingPrimitives";
import { RiderTopBar } from "../components/RiderTopBar";
import { useRiderContext } from "../context/RiderContext";
import {
  BANKS,
  EMPLOYMENT_TYPES,
  GENDERS,
  IDENTITY_UPLOADS,
  LICENSE_UPLOADS,
  ONBOARDING_STEPS,
  SHIFTS,
  STATES,
  VEHICLE_OPTIONS,
  VEHICLE_UPLOADS,
  emptyRiderForm,
  type RiderOnboardingForm,
} from "../data/rider-onboarding-mock";
import {
  compact,
  required,
  validateAadhaar,
  validateAccountNumber,
  validateDob,
  validateEmail,
  validateIfsc,
  validateLicense,
  validateMobile,
  validateName,
  validatePan,
  validatePincode,
  validateVehicleNumber,
} from "../lib/rider-validation";
import { riderRoutes } from "../navigation/rider-routes";

type Errors = Record<string, string>;

type AllowedCity = {
  id: string;
  name: string;
  city: string;
  state: string;
  status: string;
  pickupRadius?: string;
};

const DEFAULT_ALLOWED_CITIES: AllowedCity[] = [
  { id: "CI-1", name: "Kasganj", city: "Kasganj", state: "Uttar Pradesh", status: "Live" },
  { id: "CI-2", name: "Aligarh", city: "Aligarh", state: "Uttar Pradesh", status: "Live" },
  { id: "CI-3", name: "Noida", city: "Noida", state: "Uttar Pradesh", status: "Live" },
  { id: "CI-4", name: "Mumbai", city: "Mumbai", state: "Maharashtra", status: "Live" },
  { id: "CI-5", name: "Pune", city: "Pune", state: "Maharashtra", status: "Live" },
  { id: "CI-6", name: "Bengaluru", city: "Bengaluru", state: "Karnataka", status: "Pilot" },
];

function validateStep(step: number, form: RiderOnboardingForm): Errors {
  switch (step) {
    case 1:
      return compact({
        fullName: validateName(form.fullName),
        mobile: validateMobile(form.mobile),
        email: validateEmail(form.email),
        dob: validateDob(form.dob),
      });
    case 2:
      return compact({
        address: required(form.address, "Current address"),
        city: required(form.city, "City"),
        state: required(form.state, "State"),
        pincode: validatePincode(form.pincode),
      });
    case 3:
      return compact({ aadhaar: validateAadhaar(form.aadhaar), pan: validatePan(form.pan) });
    case 4:
      return compact({ license: validateLicense(form.license) });
    case 5:
      return compact({
        vehicleNumber: validateVehicleNumber(form.vehicleNumber),
        rcNumber: required(form.rcNumber, "RC number"),
        insuranceNumber: required(form.insuranceNumber, "Insurance number"),
      });
    case 6:
      return compact({
        accountHolder: required(form.accountHolder, "Account holder name"),
        bankName: required(form.bankName, "Bank name"),
        accountNumber: validateAccountNumber(form.accountNumber),
        ifsc: validateIfsc(form.ifsc),
      });
    case 7:
      return compact({
        preferredCity: required(form.preferredCity, "Preferred city"),
        preferredArea: required(form.preferredArea, "Preferred area"),
      });
    default:
      return {};
  }
}

export function RiderRegistrationScreen() {
  const navigate = useNavigate();
  const { phone, signIn } = useRiderContext();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RiderOnboardingForm>(() => ({
    ...emptyRiderForm,
    mobile:
      phone ||
      (typeof window !== "undefined"
        ? window.sessionStorage.getItem("qp.rider.pendingPhone") ||
          window.localStorage.getItem("qp.rider.pendingPhone") ||
          ""
        : ""),
  }));
  const [uploads, setUploads] = useState<Record<string, string>>({});
  const [uploadPreviews, setUploadPreviews] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  // Dynamic Allowed Cities from Admin Console / API
  const [allowedCities, setAllowedCities] = useState<AllowedCity[]>(DEFAULT_ALLOWED_CITIES);
  const [loadingCities, setLoadingCities] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadCities() {
      try {
        const res = await apiGetJson<AllowedCity[]>("/api/cities", { anonymous: true });
        if (active && Array.isArray(res) && res.length > 0) {
          setAllowedCities(res);
        }
      } catch {
        // Safe fallback
      } finally {
        if (active) setLoadingCities(false);
      }
    }
    void loadCities();
    return () => {
      active = false;
    };
  }, []);

  const cityOptions = useMemo(
    () => allowedCities.map((c) => c.name || c.city).filter(Boolean),
    [allowedCities],
  );

  useEffect(() => {
    if (phone && !form.mobile) {
      setForm((prev) => ({ ...prev, mobile: phone }));
    }
  }, [phone, form.mobile]);

  const set = <K extends keyof RiderOnboardingForm>(key: K, value: RiderOnboardingForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const handleCitySelect = (selectedCityName: string, isPreference: boolean = false) => {
    const matched = allowedCities.find(
      (c) =>
        (c.name || c.city || "").toLowerCase() === selectedCityName.toLowerCase(),
    );
    if (isPreference) {
      set("preferredCity", selectedCityName);
    } else {
      set("city", selectedCityName);
      if (matched?.state) {
        set("state", matched.state);
      }
      if (!form.preferredCity) {
        set("preferredCity", selectedCityName);
      }
    }
  };

  const handleUpload = (slotId: string, fileName: string, dataUrl?: string) => {
    setUploads((p) => ({ ...p, [slotId]: fileName }));
    if (dataUrl) {
      setUploadPreviews((p) => ({ ...p, [slotId]: dataUrl }));
    }
  };

  const handleClearUpload = (slotId: string) => {
    setUploads((p) => {
      const next = { ...p };
      delete next[slotId];
      return next;
    });
    setUploadPreviews((p) => {
      const next = { ...p };
      delete next[slotId];
      return next;
    });
  };

  const vehicleLabel = useMemo(
    () => VEHICLE_OPTIONS.find((v) => v.id === form.vehicleType)?.label ?? "Bike",
    [form.vehicleType],
  );

  const goNext = () => {
    const stepErrors = validateStep(step, form);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      toast.error("Please fill all required fields correctly.");
      return;
    }
    setErrors({});
    if (step < ONBOARDING_STEPS.length) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goBack = () => {
    if (step === 1) {
      return;
    }
    setStep(step - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    for (let i = 1; i <= 7; i += 1) {
      const stepErrors = validateStep(i, form);
      if (Object.keys(stepErrors).length) {
        setStep(i);
        setErrors(stepErrors);
        toast.error("Some details require attention before submitting.");
        return;
      }
    }

    setBusy(true);
    try {
      // Build documents list with labels and images
      const documentPayload = [
        { id: "doc-aadhaar-front", label: "Aadhaar Card Front", name: uploads["aadhaarFront"] || "Aadhaar Front", status: "pending", dataUrl: uploadPreviews["aadhaarFront"] },
        { id: "doc-aadhaar-back", label: "Aadhaar Card Back", name: uploads["aadhaarBack"] || "Aadhaar Back", status: "pending", dataUrl: uploadPreviews["aadhaarBack"] },
        { id: "doc-pan", label: "PAN Card", name: uploads["panCard"] || "PAN Card", status: "pending", dataUrl: uploadPreviews["panCard"] },
        { id: "doc-license-front", label: "Driving License Front", name: uploads["licenseFront"] || "License Front", status: "pending", dataUrl: uploadPreviews["licenseFront"] },
        { id: "doc-license-back", label: "Driving License Back", name: uploads["licenseBack"] || "License Back", status: "pending", dataUrl: uploadPreviews["licenseBack"] },
        { id: "doc-rc", label: "Vehicle RC Document", name: uploads["rcDoc"] || "RC Document", status: "pending", dataUrl: uploadPreviews["rcDoc"] },
        { id: "doc-insurance", label: "Insurance Policy", name: uploads["insuranceDoc"] || "Insurance", status: "pending", dataUrl: uploadPreviews["insuranceDoc"] },
        { id: "doc-vehicle-photo", label: "Vehicle Photo", name: uploads["vehiclePhoto"] || "Vehicle Photo", status: "pending", dataUrl: uploadPreviews["vehiclePhoto"] },
      ].filter((d) => Boolean(d.name && d.name !== d.label) || Boolean(d.dataUrl));

      const payload = {
        ...form,
        documents: documentPayload,
      };

      const updatedSession = await submitRiderRegistration(payload);
      signIn(updatedSession);
      toast.success("Rider registration submitted successfully! 🎉");
      navigate({ to: riderRoutes.registrationSubmitted });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Registration failed. Please check your details and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const jumpTo = (target: number) => {
    setStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const meta = ONBOARDING_STEPS[step - 1]!;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md lg:max-w-3xl">
        <RiderTopBar
          title="Rider Registration"
          subtitle={`Step ${step} of ${ONBOARDING_STEPS.length} · Onboarding`}
          showBack={step > 1}
          onBack={goBack}
        />

        <OnboardingStepper steps={ONBOARDING_STEPS} current={step} />

        <div className="px-4 pb-36 pt-4 sm:px-6 sm:pt-6">
          {/* STEP 1: Personal Details */}
          {step === 1 ? (
            <StepShell stepKey={step} title={meta.title} caption={meta.caption}>
              <TextField
                id="fullName"
                label="Full Name"
                icon={UserRound}
                value={form.fullName}
                onChange={(v) => set("fullName", v)}
                placeholder="Arjun Mehta"
                error={errors["fullName"]}
              />
              <TextField
                id="mobile"
                label="Mobile Number"
                icon={Phone}
                value={form.mobile}
                onChange={(v) => set("mobile", v.replace(/\D/g, ""))}
                placeholder="98765 43210"
                inputMode="numeric"
                maxLength={10}
                error={errors["mobile"]}
              />
              <TextField
                id="email"
                label="Email Address"
                icon={Mail}
                type="email"
                value={form.email}
                onChange={(v) => set("email", v)}
                placeholder="you@example.com"
                inputMode="email"
                error={errors["email"]}
              />
              <TextField
                id="dob"
                label="Date of Birth"
                icon={Calendar}
                type="date"
                value={form.dob}
                onChange={(v) => set("dob", v)}
                error={errors["dob"]}
              />
              <ChoiceChips
                label="Gender"
                options={GENDERS}
                value={form.gender}
                onChange={(v) => set("gender", v)}
              />
            </StepShell>
          ) : null}

          {/* STEP 2: Address & Admin Allowed City */}
          {step === 2 ? (
            <StepShell stepKey={step} title={meta.title} caption={meta.caption}>
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 mb-2">
                <p className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
                  <MapPinCheck className="size-4 text-brand-green" />
                  <span>Admin Approved Operating Cities Only</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Select your active operational city. QuickPress operations are live in these hubs.
                </p>
              </div>

              <TextField
                id="address"
                label="Current Physical Address"
                icon={MapPin}
                multiline
                value={form.address}
                onChange={(v) => set("address", v)}
                placeholder="Flat / House No., Street, Landmark, Locality"
                error={errors["address"]}
              />

              <div>
                <ChoiceChips
                  label="Operational City (Allowed by Admin)"
                  options={cityOptions}
                  value={form.city}
                  onChange={(v) => handleCitySelect(v, false)}
                  columns={2}
                />
                {errors["city"] ? (
                  <p role="alert" className="mt-1 text-[0.68rem] font-semibold text-destructive">
                    {errors["city"]}
                  </p>
                ) : null}
              </div>

              <div>
                <ChoiceChips
                  label="State"
                  options={STATES}
                  value={form.state}
                  onChange={(v) => set("state", v)}
                  columns={2}
                />
                {errors["state"] ? (
                  <p role="alert" className="mt-1 text-[0.68rem] font-semibold text-destructive">
                    {errors["state"]}
                  </p>
                ) : null}
              </div>

              <TextField
                id="pincode"
                label="PIN Code"
                icon={MapPin}
                value={form.pincode}
                onChange={(v) => set("pincode", v.replace(/\D/g, ""))}
                placeholder="207123"
                inputMode="numeric"
                maxLength={6}
                error={errors["pincode"]}
              />
            </StepShell>
          ) : null}

          {/* STEP 3: Identity Verification */}
          {step === 3 ? (
            <StepShell stepKey={step} title={meta.title} caption={meta.caption}>
              <TextField
                id="aadhaar"
                label="Aadhaar Number (12 Digits)"
                icon={FileCheck2}
                value={form.aadhaar}
                onChange={(v) => set("aadhaar", v.replace(/\D/g, ""))}
                placeholder="1234 5678 9012"
                inputMode="numeric"
                maxLength={12}
                error={errors["aadhaar"]}
              />
              <TextField
                id="pan"
                label="PAN Number (10 Characters)"
                icon={CreditCard}
                value={form.pan}
                onChange={(v) => set("pan", v)}
                placeholder="ABCDE1234F"
                maxLength={10}
                uppercase
                error={errors["pan"]}
              />
              <div className="space-y-2.5 pt-2">
                <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                  KYC Photo Uploads (Optional in preview)
                </p>
                {IDENTITY_UPLOADS.map((slot) => (
                  <UploadTile
                    key={slot.id}
                    id={slot.id}
                    label={slot.label}
                    hint={slot.hint}
                    fileName={uploads[slot.id]}
                    previewUrl={uploadPreviews[slot.id]}
                    onSelect={(name, dataUrl) => handleUpload(slot.id, name, dataUrl)}
                    onClear={() => handleClearUpload(slot.id)}
                  />
                ))}
              </div>
            </StepShell>
          ) : null}

          {/* STEP 4: Driving License */}
          {step === 4 ? (
            <StepShell stepKey={step} title={meta.title} caption={meta.caption}>
              <TextField
                id="license"
                label="Driving License Number"
                icon={IdCard}
                value={form.license}
                onChange={(v) => set("license", v)}
                placeholder="DL-0420110012345"
                maxLength={16}
                uppercase
                error={errors["license"]}
              />
              <div className="space-y-2.5 pt-2">
                <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                  Driving License Photos
                </p>
                {LICENSE_UPLOADS.map((slot) => (
                  <UploadTile
                    key={slot.id}
                    id={slot.id}
                    label={slot.label}
                    hint={slot.hint}
                    fileName={uploads[slot.id]}
                    previewUrl={uploadPreviews[slot.id]}
                    onSelect={(name, dataUrl) => handleUpload(slot.id, name, dataUrl)}
                    onClear={() => handleClearUpload(slot.id)}
                  />
                ))}
              </div>
            </StepShell>
          ) : null}

          {/* STEP 5: Vehicle Details */}
          {step === 5 ? (
            <StepShell stepKey={step} title={meta.title} caption={meta.caption}>
              <VehiclePicker
                options={VEHICLE_OPTIONS}
                value={form.vehicleType}
                onChange={(v) => set("vehicleType", v)}
              />
              <TextField
                id="vehicleNumber"
                label="Vehicle Registration Plate Number"
                icon={Bike}
                value={form.vehicleNumber}
                onChange={(v) => set("vehicleNumber", v)}
                placeholder="UP 87 AB 1234"
                maxLength={14}
                uppercase
                error={errors["vehicleNumber"]}
              />
              <TextField
                id="rcNumber"
                label="RC Certificate Number"
                icon={FileCheck2}
                value={form.rcNumber}
                onChange={(v) => set("rcNumber", v)}
                placeholder="RC-2022-998812"
                uppercase
                error={errors["rcNumber"]}
              />
              <TextField
                id="insuranceNumber"
                label="Vehicle Insurance Policy Number"
                icon={ShieldCheck}
                value={form.insuranceNumber}
                onChange={(v) => set("insuranceNumber", v)}
                placeholder="INS-77665544"
                uppercase
                error={errors["insuranceNumber"]}
              />
              <div className="space-y-2.5 pt-2">
                <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
                  Vehicle Documents & Photo
                </p>
                {VEHICLE_UPLOADS.map((slot) => (
                  <UploadTile
                    key={slot.id}
                    id={slot.id}
                    label={slot.label}
                    hint={slot.hint}
                    fileName={uploads[slot.id]}
                    previewUrl={uploadPreviews[slot.id]}
                    onSelect={(name, dataUrl) => handleUpload(slot.id, name, dataUrl)}
                    onClear={() => handleClearUpload(slot.id)}
                  />
                ))}
              </div>
            </StepShell>
          ) : null}

          {/* STEP 6: Bank Payout Details */}
          {step === 6 ? (
            <StepShell stepKey={step} title={meta.title} caption={meta.caption}>
              <TextField
                id="accountHolder"
                label="Account Holder Name (As per Bank)"
                icon={UserRound}
                value={form.accountHolder}
                onChange={(v) => set("accountHolder", v)}
                placeholder="Arjun Mehta"
                error={errors["accountHolder"]}
              />
              <ChoiceChips
                label="Bank Name"
                options={BANKS}
                value={form.bankName}
                onChange={(v) => set("bankName", v)}
                columns={2}
              />
              {errors["bankName"] ? (
                <p role="alert" className="text-[0.68rem] font-semibold text-destructive">
                  {errors["bankName"]}
                </p>
              ) : null}
              <TextField
                id="accountNumber"
                label="Bank Account Number"
                icon={Banknote}
                value={form.accountNumber}
                onChange={(v) => set("accountNumber", v.replace(/\D/g, ""))}
                placeholder="00012345678901"
                inputMode="numeric"
                maxLength={18}
                error={errors["accountNumber"]}
              />
              <TextField
                id="ifsc"
                label="IFSC Code"
                icon={Building2}
                value={form.ifsc}
                onChange={(v) => set("ifsc", v)}
                placeholder="SBIN0001234"
                maxLength={11}
                uppercase
                error={errors["ifsc"]}
              />
            </StepShell>
          ) : null}

          {/* STEP 7: Working Preferences & Preferred City */}
          {step === 7 ? (
            <StepShell stepKey={step} title={meta.title} caption={meta.caption}>
              <div>
                <ChoiceChips
                  label="Preferred Delivery City (Admin Approved)"
                  options={cityOptions}
                  value={form.preferredCity}
                  onChange={(v) => handleCitySelect(v, true)}
                  columns={2}
                />
                {errors["preferredCity"] ? (
                  <p role="alert" className="mt-1 text-[0.68rem] font-semibold text-destructive">
                    {errors["preferredCity"]}
                  </p>
                ) : null}
              </div>

              <TextField
                id="preferredArea"
                label="Preferred Local Area / Zone"
                icon={MapPin}
                value={form.preferredArea}
                onChange={(v) => set("preferredArea", v)}
                placeholder="e.g. Awas Vikas, Main Market, Station Road"
                error={errors["preferredArea"]}
              />
              <ChoiceChips
                label="Employment Type"
                options={EMPLOYMENT_TYPES}
                value={form.employmentType}
                onChange={(v) => set("employmentType", v)}
                columns={2}
              />
              <ChoiceChips
                label="Shift Preference"
                options={SHIFTS}
                value={form.shift}
                onChange={(v) => set("shift", v)}
                columns={3}
              />
            </StepShell>
          ) : null}

          {/* STEP 8: Review & Submit */}
          {step === 8 ? (
            <StepShell stepKey={step} title={meta.title} caption={meta.caption}>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 mb-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>Ready for Verification</span>
                </div>
                <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                  Review all your submitted specifications. Once submitted, your profile will be sent to the Operations Admin for fast review and fleet activation.
                </p>
              </div>

              <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                <ReviewGroup
                  title="Personal Details"
                  onEdit={() => jumpTo(1)}
                  rows={[
                    { label: "Full Name", value: form.fullName },
                    { label: "Mobile", value: form.mobile },
                    { label: "Email", value: form.email },
                    { label: "Date of Birth", value: form.dob },
                    { label: "Gender", value: form.gender },
                  ]}
                />
                <ReviewGroup
                  title="Address & Operating City"
                  onEdit={() => jumpTo(2)}
                  rows={[
                    { label: "Address", value: form.address },
                    { label: "Operating City", value: form.city },
                    { label: "State", value: form.state },
                    { label: "PIN Code", value: form.pincode },
                  ]}
                />
                <ReviewGroup
                  title="Identity & KYC"
                  onEdit={() => jumpTo(3)}
                  rows={[
                    { label: "Aadhaar", value: form.aadhaar },
                    { label: "PAN", value: form.pan },
                    {
                      label: "Documents",
                      value: `${IDENTITY_UPLOADS.filter((s) => uploads[s.id]).length}/3 attached`,
                    },
                  ]}
                />
                <ReviewGroup
                  title="Driving License"
                  onEdit={() => jumpTo(4)}
                  rows={[
                    { label: "License No.", value: form.license },
                    {
                      label: "Photos",
                      value: `${LICENSE_UPLOADS.filter((s) => uploads[s.id]).length}/2 attached`,
                    },
                  ]}
                />
                <ReviewGroup
                  title="Vehicle Specs"
                  onEdit={() => jumpTo(5)}
                  rows={[
                    { label: "Vehicle Type", value: vehicleLabel },
                    { label: "Plate Number", value: form.vehicleNumber },
                    { label: "RC Number", value: form.rcNumber },
                    { label: "Insurance", value: form.insuranceNumber },
                  ]}
                />
                <ReviewGroup
                  title="Bank Payout Details"
                  onEdit={() => jumpTo(6)}
                  rows={[
                    { label: "Account Holder", value: form.accountHolder },
                    { label: "Bank", value: form.bankName },
                    {
                      label: "Account Number",
                      value: form.accountNumber
                        ? `•••• •••• ${form.accountNumber.slice(-4)}`
                        : "—",
                    },
                    { label: "IFSC Code", value: form.ifsc },
                  ]}
                />
                <ReviewGroup
                  title="Working Preferences"
                  onEdit={() => jumpTo(7)}
                  rows={[
                    { label: "Preferred City", value: form.preferredCity },
                    { label: "Preferred Area", value: form.preferredArea },
                    { label: "Availability", value: form.employmentType },
                    { label: "Shift", value: form.shift },
                  ]}
                />
              </div>
            </StepShell>
          ) : null}
        </div>

        {/* Mobile-Friendly Sticky Bottom Bar */}
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t border-border bg-card/95 px-4 py-3.5 backdrop-blur-md lg:max-w-3xl pb-[calc(0.875rem+env(safe-area-inset-bottom))]">
          <div className="flex gap-3 items-center">
            {step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                className="ripple h-12 flex-1 rounded-2xl border border-border bg-card text-xs font-bold tracking-tight text-foreground transition-all duration-300 active:scale-[0.97]"
              >
                Back
              </button>
            ) : null}
            {step < ONBOARDING_STEPS.length ? (
              <button
                type="button"
                onClick={goNext}
                className="ripple h-12 flex-[2] rounded-2xl bg-primary text-xs font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97]"
              >
                Continue to Step {step + 1}
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={handleSubmit}
                className="ripple h-12 flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-primary text-xs font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97] disabled:opacity-70"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Submit for Verification
              </button>
            )}
          </div>
        </div>
      </div>
      <Toaster />
    </main>
  );
}
