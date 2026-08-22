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
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";
import { submitRiderRegistration } from "@/api/rider/rider-auth-api";

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
  RIDER_CITIES,
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
    mobile: phone || (typeof window !== "undefined" ? window.sessionStorage.getItem("qp.rider.pendingPhone") || window.localStorage.getItem("qp.rider.pendingPhone") || "" : ""),
  }));
  const [uploads, setUploads] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

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

  const vehicleLabel = useMemo(
    () => VEHICLE_OPTIONS.find((v) => v.id === form.vehicleType)?.label ?? "Bike",
    [form.vehicleType],
  );

  const goNext = () => {
    const stepErrors = validateStep(step, form);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      toast("Please fix the highlighted fields");
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
        toast("Some details need attention");
        return;
      }
    }
    setBusy(true);
    try {
      const updatedSession = await submitRiderRegistration(form);
      signIn(updatedSession);
      toast.success("Rider registration submitted successfully!");
      navigate({ to: riderRoutes.registrationSubmitted });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed. Please check your details and try again.");
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

        <div className="px-5 pb-40 pt-5">
          {step === 1 ? (
            <StepShell stepKey={step} title={meta.title} caption={meta.caption}>
              <TextField
                id="fullName"
                label="Full Name"
                icon={UserRound}
                value={form.fullName}
                onChange={(v) => set("fullName", v)}
                placeholder="Arjun Mehta"
                error={errors['fullName']}
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
                error={errors['mobile']}
              />
              <TextField
                id="email"
                label="Email"
                icon={Mail}
                type="email"
                value={form.email}
                onChange={(v) => set("email", v)}
                placeholder="you@example.com"
                inputMode="email"
                error={errors['email']}
              />
              <TextField
                id="dob"
                label="Date of Birth"
                icon={Calendar}
                type="date"
                value={form.dob}
                onChange={(v) => set("dob", v)}
                error={errors['dob']}
              />
              <ChoiceChips
                label="Gender"
                options={GENDERS}
                value={form.gender}
                onChange={(v) => set("gender", v)}
              />
            </StepShell>
          ) : null}

          {step === 2 ? (
            <StepShell stepKey={step} title={meta.title} caption={meta.caption}>
              <TextField
                id="address"
                label="Current Address"
                icon={MapPin}
                multiline
                value={form.address}
                onChange={(v) => set("address", v)}
                placeholder="Flat / building, street, landmark"
                error={errors['address']}
              />
              <ChoiceChips
                label="City"
                options={RIDER_CITIES}
                value={form.city}
                onChange={(v) => set("city", v)}
                columns={2}
              />
              {errors['city'] ? (
                <p role="alert" className="text-[0.68rem] font-semibold text-destructive">
                  {errors['city']}
                </p>
              ) : null}
              <ChoiceChips
                label="State"
                options={STATES}
                value={form.state}
                onChange={(v) => set("state", v)}
                columns={2}
              />
              {errors['state'] ? (
                <p role="alert" className="text-[0.68rem] font-semibold text-destructive">
                  {errors['state']}
                </p>
              ) : null}
              <TextField
                id="pincode"
                label="PIN Code"
                icon={MapPin}
                value={form.pincode}
                onChange={(v) => set("pincode", v.replace(/\D/g, ""))}
                placeholder="400053"
                inputMode="numeric"
                maxLength={6}
                error={errors['pincode']}
              />
            </StepShell>
          ) : null}

          {step === 3 ? (
            <StepShell stepKey={step} title={meta.title} caption={meta.caption}>
              <TextField
                id="aadhaar"
                label="Aadhaar Number"
                icon={FileCheck2}
                value={form.aadhaar}
                onChange={(v) => set("aadhaar", v.replace(/\D/g, ""))}
                placeholder="1234 5678 9012"
                inputMode="numeric"
                maxLength={12}
                error={errors['aadhaar']}
              />
              <TextField
                id="pan"
                label="PAN Number"
                icon={CreditCard}
                value={form.pan}
                onChange={(v) => set("pan", v)}
                placeholder="ABCDE1234F"
                maxLength={10}
                uppercase
                error={errors['pan']}
              />
              <div className="space-y-2 pt-1">
                {IDENTITY_UPLOADS.map((slot) => (
                  <UploadTile
                    key={slot.id}
                    id={slot.id}
                    label={slot.label}
                    hint={slot.hint}
                    fileName={uploads[slot.id]}
                    onSelect={(name) => setUploads((p) => ({ ...p, [slot.id]: name }))}
                    onClear={() =>
                      setUploads((p) => {
                        const next = { ...p };
                        delete next[slot.id];
                        return next;
                      })
                    }
                  />
                ))}
              </div>
            </StepShell>
          ) : null}

          {step === 4 ? (
            <StepShell stepKey={step} title={meta.title} caption={meta.caption}>
              <TextField
                id="license"
                label="Driving License Number"
                icon={IdCard}
                value={form.license}
                onChange={(v) => set("license", v)}
                placeholder="MH0220210012345"
                maxLength={16}
                uppercase
                error={errors['license']}
              />
              <div className="space-y-2 pt-1">
                {LICENSE_UPLOADS.map((slot) => (
                  <UploadTile
                    key={slot.id}
                    id={slot.id}
                    label={slot.label}
                    hint={slot.hint}
                    fileName={uploads[slot.id]}
                    onSelect={(name) => setUploads((p) => ({ ...p, [slot.id]: name }))}
                    onClear={() =>
                      setUploads((p) => {
                        const next = { ...p };
                        delete next[slot.id];
                        return next;
                      })
                    }
                  />
                ))}
              </div>
            </StepShell>
          ) : null}

          {step === 5 ? (
            <StepShell stepKey={step} title={meta.title} caption={meta.caption}>
              <VehiclePicker
                options={VEHICLE_OPTIONS}
                value={form.vehicleType}
                onChange={(v) => set("vehicleType", v)}
              />
              <TextField
                id="vehicleNumber"
                label="Vehicle Number"
                icon={Bike}
                value={form.vehicleNumber}
                onChange={(v) => set("vehicleNumber", v)}
                placeholder="MH 02 CX 4821"
                maxLength={13}
                uppercase
                error={errors['vehicleNumber']}
              />
              <TextField
                id="rcNumber"
                label="RC Number"
                icon={FileCheck2}
                value={form.rcNumber}
                onChange={(v) => set("rcNumber", v)}
                placeholder="RC-2021-884213"
                uppercase
                error={errors['rcNumber']}
              />
              <TextField
                id="insuranceNumber"
                label="Insurance Number"
                icon={ShieldCheck}
                value={form.insuranceNumber}
                onChange={(v) => set("insuranceNumber", v)}
                placeholder="INS-99213345"
                uppercase
                error={errors['insuranceNumber']}
              />
              <div className="space-y-2 pt-1">
                {VEHICLE_UPLOADS.map((slot) => (
                  <UploadTile
                    key={slot.id}
                    id={slot.id}
                    label={slot.label}
                    hint={slot.hint}
                    fileName={uploads[slot.id]}
                    onSelect={(name) => setUploads((p) => ({ ...p, [slot.id]: name }))}
                    onClear={() =>
                      setUploads((p) => {
                        const next = { ...p };
                        delete next[slot.id];
                        return next;
                      })
                    }
                  />
                ))}
              </div>
            </StepShell>
          ) : null}

          {step === 6 ? (
            <StepShell stepKey={step} title={meta.title} caption={meta.caption}>
              <TextField
                id="accountHolder"
                label="Account Holder"
                icon={UserRound}
                value={form.accountHolder}
                onChange={(v) => set("accountHolder", v)}
                placeholder="Arjun Mehta"
                error={errors['accountHolder']}
              />
              <ChoiceChips
                label="Bank Name"
                options={BANKS}
                value={form.bankName}
                onChange={(v) => set("bankName", v)}
                columns={2}
              />
              {errors['bankName'] ? (
                <p role="alert" className="text-[0.68rem] font-semibold text-destructive">
                  {errors['bankName']}
                </p>
              ) : null}
              <TextField
                id="accountNumber"
                label="Account Number"
                icon={Banknote}
                value={form.accountNumber}
                onChange={(v) => set("accountNumber", v.replace(/\D/g, ""))}
                placeholder="000123456789"
                inputMode="numeric"
                maxLength={18}
                error={errors['accountNumber']}
              />
              <TextField
                id="ifsc"
                label="IFSC Code"
                icon={Building2}
                value={form.ifsc}
                onChange={(v) => set("ifsc", v)}
                placeholder="HDFC0000241"
                maxLength={11}
                uppercase
                error={errors['ifsc']}
              />
            </StepShell>
          ) : null}

          {step === 7 ? (
            <StepShell stepKey={step} title={meta.title} caption={meta.caption}>
              <ChoiceChips
                label="Preferred City"
                options={RIDER_CITIES}
                value={form.preferredCity}
                onChange={(v) => set("preferredCity", v)}
                columns={2}
              />
              {errors['preferredCity'] ? (
                <p role="alert" className="text-[0.68rem] font-semibold text-destructive">
                  {errors['preferredCity']}
                </p>
              ) : null}
              <TextField
                id="preferredArea"
                label="Preferred Area"
                icon={MapPin}
                value={form.preferredArea}
                onChange={(v) => set("preferredArea", v)}
                placeholder="Andheri West, Jogeshwari"
                error={errors['preferredArea']}
              />
              <ChoiceChips
                label="Availability"
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

          {step === 8 ? (
            <StepShell stepKey={step} title={meta.title} caption={meta.caption}>
              <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                <ReviewGroup
                  title="Personal Details"
                  onEdit={() => jumpTo(1)}
                  rows={[
                    { label: "Full name", value: form.fullName },
                    { label: "Mobile", value: form.mobile },
                    { label: "Email", value: form.email },
                    { label: "Date of birth", value: form.dob },
                    { label: "Gender", value: form.gender },
                  ]}
                />
                <ReviewGroup
                  title="Address"
                  onEdit={() => jumpTo(2)}
                  rows={[
                    { label: "Address", value: form.address },
                    { label: "City", value: form.city },
                    { label: "State", value: form.state },
                    { label: "PIN code", value: form.pincode },
                  ]}
                />
                <ReviewGroup
                  title="Identity"
                  onEdit={() => jumpTo(3)}
                  rows={[
                    { label: "Aadhaar", value: form.aadhaar },
                    { label: "PAN", value: form.pan },
                    {
                      label: "Documents",
                      value: `${IDENTITY_UPLOADS.filter((s) => uploads[s.id]).length}/3 uploaded`,
                    },
                  ]}
                />
                <ReviewGroup
                  title="Driving"
                  onEdit={() => jumpTo(4)}
                  rows={[
                    { label: "License", value: form.license },
                    {
                      label: "Documents",
                      value: `${LICENSE_UPLOADS.filter((s) => uploads[s.id]).length}/2 uploaded`,
                    },
                  ]}
                />
                <ReviewGroup
                  title="Vehicle"
                  onEdit={() => jumpTo(5)}
                  rows={[
                    { label: "Type", value: vehicleLabel },
                    { label: "Vehicle number", value: form.vehicleNumber },
                    { label: "RC number", value: form.rcNumber },
                    { label: "Insurance", value: form.insuranceNumber },
                    {
                      label: "Documents",
                      value: `${VEHICLE_UPLOADS.filter((s) => uploads[s.id]).length}/3 uploaded`,
                    },
                  ]}
                />
                <ReviewGroup
                  title="Bank Details"
                  onEdit={() => jumpTo(6)}
                  rows={[
                    { label: "Account holder", value: form.accountHolder },
                    { label: "Bank", value: form.bankName },
                    {
                      label: "Account",
                      value: form.accountNumber
                        ? `••••${form.accountNumber.slice(-4)}`
                        : "",
                    },
                    { label: "IFSC", value: form.ifsc },
                  ]}
                />
                <ReviewGroup
                  title="Working Preferences"
                  onEdit={() => jumpTo(7)}
                  rows={[
                    { label: "Preferred city", value: form.preferredCity },
                    { label: "Preferred area", value: form.preferredArea },
                    { label: "Availability", value: form.employmentType },
                    { label: "Shift", value: form.shift },
                  ]}
                />
              </div>
            </StepShell>
          ) : null}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t border-border bg-card/95 px-5 py-4 backdrop-blur lg:max-w-3xl">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={goBack}
              className="ripple flex-1 rounded-2xl border border-border bg-card py-4 text-sm font-black tracking-tight text-foreground transition-all duration-300 active:scale-[0.97]"
            >
              Back
            </button>
            {step < ONBOARDING_STEPS.length ? (
              <button
                type="button"
                onClick={goNext}
                className="ripple flex-[2] rounded-2xl bg-primary py-4 text-sm font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97]"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={handleSubmit}
                className="ripple flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97] disabled:opacity-70"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                Submit Application
              </button>
            )}
          </div>
        </div>
      </div>
      <Toaster />
    </main>
  );
}
