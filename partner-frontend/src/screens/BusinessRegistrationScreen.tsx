import { useNavigate } from "@tanstack/react-router";
import {
  Banknote,
  Bath,
  Blinds,
  Briefcase,
  Building2,
  CalendarOff,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Footprints,
  Hash,
  IdCard,
  Image as ImageIcon,
  Landmark,
  Layers,
  Loader2,
  Mail,
  MapPin,
  Navigation,
  Phone,
  ReceiptText,
  Send,
  Shirt,
  Sparkles,
  Store,
  Sun,
  UserRound,
  Wind,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { PartnerAuthHeader } from "../components/PartnerAuthHeader";
import { PartnerTopBar } from "../components/PartnerTopBar";
import {
  ChoiceChip,
  FormField,
  GalleryUploader,
  ReviewRow,
  SectionCard,
  SelectField,
  ServiceCard,
  SliderField,
  StepProgress,
  TextAreaField,
  UploadTile,
} from "../components/PartnerFormPrimitives";
import { usePartnerContext } from "../context/PartnerContext";
import { partnerRoutes } from "../navigation/partner-routes";
import {
  collectErrors,
  required,
  validateAadhaar,
  validateAccountNumber,
  validateEmail,
  validateGst,
  validateIfsc,
  validateMobile,
  validatePan,
  type FieldErrors,
} from "../lib/partner-validation";
import { registerBusiness } from "@/api/partner/partner-auth-api";
import type { BusinessCategory } from "@/shared/types/partner";

/* ----------------------------- static data ----------------------------- */

const STEPS = [
  "Business Information",
  "Business Details",
  "Services",
  "Business Timing",
  "Delivery Area",
  "Shop Profile",
  "Bank Details",
  "Review & Submit",
] as const;

const BUSINESS_TYPES = [
  { id: "Laundry", category: "laundry" as BusinessCategory },
  { id: "Dry Cleaning", category: "dry-clean" as BusinessCategory },
  { id: "Steam Iron", category: "laundry" as BusinessCategory },
  { id: "Shoe Care", category: "shoe-care" as BusinessCategory },
  { id: "Premium Multi-Service", category: "premium" as BusinessCategory },
] as const;

const EXPERIENCE_OPTIONS = [
  "Less than 1 year",
  "1 - 3 years",
  "3 - 5 years",
  "5 - 10 years",
  "More than 10 years",
] as const;

const SERVICES = [
  { id: "Wash & Fold", icon: Shirt, description: "Everyday laundry by weight" },
  { id: "Dry Cleaning", icon: Sparkles, description: "Solvent care for delicates" },
  { id: "Steam Iron", icon: Wind, description: "Crisp press, per piece" },
  { id: "Premium Laundry", icon: Layers, description: "Designer & luxury garments" },
  { id: "Shoe Cleaning", icon: Footprints, description: "Sneaker and leather care" },
  { id: "Blanket Cleaning", icon: Bath, description: "Heavy bedding and quilts" },
  { id: "Curtain Cleaning", icon: Blinds, description: "Drapes and sheers" },
  { id: "Carpet Cleaning", icon: Layers, description: "Rugs and floor covers" },
] as const;

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const CITIES = ["Mumbai", "Pune", "Bengaluru", "Hyderabad", "Delhi NCR", "Chennai", "Ahmedabad"];

const AREAS: Record<string, string[]> = {
  Mumbai: ["Andheri West", "Bandra", "Powai", "Thane", "Chembur"],
  Pune: ["Koregaon Park", "Baner", "Kothrud", "Viman Nagar", "Hadapsar"],
  Bengaluru: ["Indiranagar", "Koramangala", "Whitefield", "HSR Layout", "Jayanagar"],
  Hyderabad: ["Gachibowli", "Madhapur", "Banjara Hills", "Kukatpally", "Begumpet"],
  "Delhi NCR": ["Saket", "Dwarka", "Gurugram", "Noida", "Rohini"],
  Chennai: ["Adyar", "Velachery", "Anna Nagar", "T Nagar", "OMR"],
  Ahmedabad: ["Satellite", "Bodakdev", "Maninagar", "Vastrapur", "Prahlad Nagar"],
};

/* ------------------------------- screen -------------------------------- */

type Uploads = { logo: string; banner: string; gallery: string[] };

export function BusinessRegistrationScreen() {
  const navigate = useNavigate();
  const { signIn, phone } = usePartnerContext();

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [form, setForm] = useState({
    shopName: "",
    ownerName: "",
    mobile: phone ?? "",
    email: "",
    shopAddress: "",
    gstin: "",
    pan: "",
    aadhaar: "",
    businessType: "",
    experience: "",
    openingTime: "08:00",
    closingTime: "21:00",
    emergencyClosing: "",
    city: "",
    area: "",
    pickupRadius: 5,
    deliveryRadius: 8,
    accountHolder: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
  });

  const [services, setServices] = useState<string[]>([]);
  const [weeklyOff, setWeeklyOff] = useState<string[]>(["Sun"]);
  const [uploads, setUploads] = useState<Uploads>({ logo: "", banner: "", gallery: [] });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const text = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    set(key, event.target.value as never);

  const digitsOnly =
    (key: keyof typeof form, max: number) => (event: React.ChangeEvent<HTMLInputElement>) =>
      set(key, event.target.value.replace(/\D/g, "").slice(0, max) as never);

  const upper = (key: keyof typeof form, max: number) => (event: React.ChangeEvent<HTMLInputElement>) =>
    set(key, event.target.value.toUpperCase().replace(/\s/g, "").slice(0, max) as never);

  const toggleService = (id: string) =>
    setServices((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const toggleDay = (day: string) =>
    setWeeklyOff((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  const areaOptions = useMemo(() => AREAS[form.city] ?? [], [form.city]);

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      toast("Location is not supported on this device");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set(
          "shopAddress",
          `${form.shopAddress ? `${form.shopAddress} · ` : ""}Pin ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
        );
        toast.success("Current location added to address");
      },
      () => toast("Could not fetch location, enter the address manually"),
    );
  };

  /* ------------------------------ validation ---------------------------- */

  const validateStep = (index: number): FieldErrors => {
    if (index === 0) {
      return collectErrors({
        shopName: required(form.shopName, "Shop name"),
        ownerName: required(form.ownerName, "Owner name"),
        mobile: validateMobile(form.mobile),
        email: validateEmail(form.email),
        shopAddress: required(form.shopAddress, "Shop address"),
      });
    }
    if (index === 1) {
      return collectErrors({
        gstin: validateGst(form.gstin),
        pan: validatePan(form.pan),
        aadhaar: validateAadhaar(form.aadhaar),
        businessType: required(form.businessType, "Business type"),
        experience: required(form.experience, "Experience"),
      });
    }
    if (index === 2) {
      return services.length === 0 ? { services: "Select at least one service" } : {};
    }
    if (index === 3) {
      return collectErrors({
        openingTime: required(form.openingTime, "Opening time"),
        closingTime: required(form.closingTime, "Closing time"),
      });
    }
    if (index === 4) {
      return collectErrors({
        city: required(form.city, "City"),
        area: required(form.area, "Area"),
      });
    }
    if (index === 6) {
      return collectErrors({
        accountHolder: required(form.accountHolder, "Account holder name"),
        bankName: required(form.bankName, "Bank name"),
        accountNumber: validateAccountNumber(form.accountNumber),
        ifsc: validateIfsc(form.ifsc),
      });
    }
    return {};
  };

  const goNext = () => {
    const found = validateStep(step);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast(Object.values(found)[0] ?? "Please complete the required fields");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    if (step === 0) {
      navigate({ to: partnerRoutes.otp });
      return;
    }
    setErrors({});
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const editStep = (index: number) => {
    setErrors({});
    setStep(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    for (let index = 0; index < STEPS.length - 1; index += 1) {
      const found = validateStep(index);
      if (Object.keys(found).length > 0) {
        setErrors(found);
        setStep(index);
        toast(`Please complete "${STEPS[index]}"`);
        return;
      }
    }

    setBusy(true);
    const category =
      BUSINESS_TYPES.find((type) => type.id === form.businessType)?.category ??
      ("laundry" as BusinessCategory);

    // TODO: replace with POST /api/partner/onboarding (documents + media upload)
    const session = await registerBusiness({
      businessName: form.shopName,
      ownerName: form.ownerName,
      gstin: form.gstin,
      address: form.shopAddress,
      city: form.city,
      pincode: "",
      openingTime: form.openingTime,
      closingTime: form.closingTime,
      category,
    });

    setBusy(false);
    signIn({ ...session, isOnboarded: false });
    navigate({ to: partnerRoutes.registrationSubmitted });
  };

  /* -------------------------------- render ------------------------------ */

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md">
        <PartnerTopBar title="Partner Registration" onBack={goBack} />

        <div className="px-5 pt-4">
          <PartnerAuthHeader />
        </div>

        <div className="mt-4">
          <StepProgress steps={STEPS} current={step} />
        </div>

        {/* key={step} restarts the entrance animation on every step transition */}
        <div key={step} className="animate-slide-up space-y-4 px-5 pb-40 pt-5">
          {step === 0 ? (
            <SectionCard
              title="Business Information"
              description="Tell customers who you are and where to find you."
            >
              <FormField
                id="shop-name"
                label="Shop Name *"
                icon={Store}
                placeholder="Sparkle Laundry Co."
                value={form.shopName}
                onChange={text("shopName")}
                error={errors['shopName']}
              />
              <FormField
                id="owner-name"
                label="Owner Name *"
                icon={UserRound}
                placeholder="Vikram Shetty"
                value={form.ownerName}
                onChange={text("ownerName")}
                error={errors['ownerName']}
              />
              <FormField
                id="mobile"
                label="Mobile Number *"
                icon={Phone}
                prefix="+91"
                inputMode="numeric"
                placeholder="98765 43210"
                value={form.mobile}
                onChange={digitsOnly("mobile", 10)}
                error={errors['mobile']}
              />
              <FormField
                id="email"
                label="Email *"
                icon={Mail}
                type="email"
                placeholder="owner@sparklelaundry.in"
                value={form.email}
                onChange={text("email")}
                error={errors['email']}
              />
              <TextAreaField
                id="shop-address"
                label="Shop Address *"
                placeholder="Shop 14, Sunrise Complex, Linking Road"
                value={form.shopAddress}
                onChange={(next) => set("shopAddress", next)}
                error={errors['shopAddress']}
              />
              <button
                type="button"
                onClick={useCurrentLocation}
                className="ripple focus-key flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-[0.72rem] font-bold tracking-tight text-foreground shadow-soft active:scale-[0.97]"
              >
                <Navigation className="size-3.5 text-brand-green" strokeWidth={2.6} />
                Use current location
              </button>
            </SectionCard>
          ) : null}

          {step === 1 ? (
            <SectionCard
              title="Business Details"
              description="Used for verification and payouts compliance."
            >
              <FormField
                id="gstin"
                label="GST Number (Optional)"
                icon={ReceiptText}
                placeholder="27ABCDE1234F1Z5"
                value={form.gstin}
                onChange={upper("gstin", 15)}
                error={errors['gstin']}
                hint="Leave blank if your business is not GST registered"
              />
              <FormField
                id="pan"
                label="PAN *"
                icon={IdCard}
                placeholder="ABCDE1234F"
                value={form.pan}
                onChange={upper("pan", 10)}
                error={errors['pan']}
              />
              <FormField
                id="aadhaar"
                label="Aadhaar *"
                icon={Hash}
                inputMode="numeric"
                placeholder="1234 5678 9012"
                value={form.aadhaar}
                onChange={digitsOnly("aadhaar", 12)}
                error={errors['aadhaar']}
              />
              <SelectField
                id="business-type"
                label="Business Type *"
                icon={Briefcase}
                value={form.businessType}
                onChange={(next) => set("businessType", next)}
                options={BUSINESS_TYPES.map((type) => type.id)}
                placeholder="Select business type"
                error={errors['businessType']}
              />
              <SelectField
                id="experience"
                label="Experience *"
                icon={Building2}
                value={form.experience}
                onChange={(next) => set("experience", next)}
                options={EXPERIENCE_OPTIONS}
                placeholder="Select experience"
                error={errors['experience']}
              />
            </SectionCard>
          ) : null}

          {step === 2 ? (
            <SectionCard
              title="Services"
              description="Pick every service your shop can fulfil. You can refine pricing later."
            >
              <div className="space-y-2.5">
                {SERVICES.map((service) => (
                  <ServiceCard
                    key={service.id}
                    label={service.id}
                    description={service.description}
                    icon={service.icon}
                    selected={services.includes(service.id)}
                    onClick={() => {
                      toggleService(service.id);
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next['services'];
                        return next;
                      });
                    }}
                  />
                ))}
              </div>
              {errors['services'] ? (
                <p className="animate-soft-fade text-[0.68rem] font-semibold text-destructive">
                  {errors['services']}
                </p>
              ) : (
                <p className="text-[0.68rem] font-medium text-muted-foreground">
                  {services.length} service{services.length === 1 ? "" : "s"} selected
                </p>
              )}
            </SectionCard>
          ) : null}

          {step === 3 ? (
            <SectionCard
              title="Business Timing"
              description="Customers only see slots inside your working hours."
            >
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  id="opening-time"
                  label="Opening Time *"
                  icon={Sun}
                  type="time"
                  value={form.openingTime}
                  onChange={text("openingTime")}
                  error={errors['openingTime']}
                />
                <FormField
                  id="closing-time"
                  label="Closing Time *"
                  icon={Clock}
                  type="time"
                  value={form.closingTime}
                  onChange={text("closingTime")}
                  error={errors['closingTime']}
                />
              </div>

              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-widest text-muted-foreground">
                  Weekly Off
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {WEEK_DAYS.map((day) => (
                    <ChoiceChip
                      key={day}
                      label={day}
                      selected={weeklyOff.includes(day)}
                      onClick={() => toggleDay(day)}
                    />
                  ))}
                </div>
              </div>

              <FormField
                id="emergency-closing"
                label="Emergency Closing (Optional)"
                icon={CalendarOff}
                type="date"
                value={form.emergencyClosing}
                onChange={text("emergencyClosing")}
                hint="Mark a date when the shop will stay shut"
              />
            </SectionCard>
          ) : null}

          {step === 4 ? (
            <SectionCard
              title="Delivery Area"
              description="Interface only for this sprint — mapping goes live later."
            >
              <SelectField
                id="city"
                label="Select City *"
                icon={MapPin}
                value={form.city}
                onChange={(next) => {
                  set("city", next);
                  set("area", "");
                }}
                options={CITIES}
                placeholder="Select city"
                error={errors['city']}
              />
              <SelectField
                id="area"
                label="Select Area *"
                icon={Navigation}
                value={form.area}
                onChange={(next) => set("area", next)}
                options={areaOptions}
                placeholder={form.city ? "Select area" : "Select a city first"}
                error={errors['area']}
              />
              <SliderField
                id="pickup-radius"
                label="Pickup Radius"
                value={form.pickupRadius}
                onChange={(next) => set("pickupRadius", next)}
              />
              <SliderField
                id="delivery-radius"
                label="Delivery Radius"
                value={form.deliveryRadius}
                onChange={(next) => set("deliveryRadius", next)}
              />
            </SectionCard>
          ) : null}

          {step === 5 ? (
            <>
              <SectionCard
                title="Shop Profile"
                description="Placeholder uploads — files are not sent anywhere yet."
              >
                <div className="grid grid-cols-2 gap-3">
                  <UploadTile
                    label="Shop Logo"
                    icon={Store}
                    value={uploads.logo}
                    onPick={(name) => setUploads((prev) => ({ ...prev, logo: name }))}
                    onClear={() => setUploads((prev) => ({ ...prev, logo: "" }))}
                  />
                  <UploadTile
                    label="Shop Banner"
                    icon={ImageIcon}
                    value={uploads.banner}
                    onPick={(name) => setUploads((prev) => ({ ...prev, banner: name }))}
                    onClear={() => setUploads((prev) => ({ ...prev, banner: "" }))}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Shop Gallery" description="Add up to 5 photos of your shop.">
                <GalleryUploader
                  images={uploads.gallery}
                  max={5}
                  onAdd={(name) =>
                    setUploads((prev) => ({
                      ...prev,
                      gallery: name ? [...prev.gallery, name].slice(0, 5) : prev.gallery,
                    }))
                  }
                  onRemove={(index) =>
                    setUploads((prev) => ({
                      ...prev,
                      gallery: prev.gallery.filter((_, i) => i !== index),
                    }))
                  }
                />
              </SectionCard>
            </>
          ) : null}

          {step === 6 ? (
            <SectionCard
              title="Bank Details"
              description="Weekly payouts are settled to this account."
            >
              <FormField
                id="account-holder"
                label="Account Holder Name *"
                icon={UserRound}
                placeholder="Vikram Shetty"
                value={form.accountHolder}
                onChange={text("accountHolder")}
                error={errors['accountHolder']}
              />
              <FormField
                id="bank-name"
                label="Bank Name *"
                icon={Landmark}
                placeholder="HDFC Bank"
                value={form.bankName}
                onChange={text("bankName")}
                error={errors['bankName']}
              />
              <FormField
                id="account-number"
                label="Account Number *"
                icon={CreditCard}
                inputMode="numeric"
                placeholder="502001234567"
                value={form.accountNumber}
                onChange={digitsOnly("accountNumber", 18)}
                error={errors['accountNumber']}
              />
              <FormField
                id="ifsc"
                label="IFSC Code *"
                icon={Banknote}
                placeholder="HDFC0001234"
                value={form.ifsc}
                onChange={upper("ifsc", 11)}
                error={errors['ifsc']}
              />
            </SectionCard>
          ) : null}

          {step === 7 ? (
            <>
              <SectionCard
                title="Business Information"
                action={<EditButton onClick={() => editStep(0)} />}
              >
                <div className="space-y-2">
                  <ReviewRow label="Shop Name" value={form.shopName} />
                  <ReviewRow label="Owner Name" value={form.ownerName} />
                  <ReviewRow label="Mobile" value={form.mobile ? `+91 ${form.mobile}` : ""} />
                  <ReviewRow label="Email" value={form.email} />
                  <ReviewRow label="Address" value={form.shopAddress} />
                </div>
              </SectionCard>

              <SectionCard
                title="Business Details"
                action={<EditButton onClick={() => editStep(1)} />}
              >
                <div className="space-y-2">
                  <ReviewRow label="GST" value={form.gstin || "Not provided"} />
                  <ReviewRow label="PAN" value={form.pan} />
                  <ReviewRow label="Aadhaar" value={form.aadhaar} />
                  <ReviewRow label="Business Type" value={form.businessType} />
                  <ReviewRow label="Experience" value={form.experience} />
                </div>
              </SectionCard>

              <SectionCard title="Services" action={<EditButton onClick={() => editStep(2)} />}>
                <div className="flex flex-wrap gap-2">
                  {services.length === 0 ? (
                    <span className="text-[0.7rem] font-medium text-muted-foreground">
                      No services selected
                    </span>
                  ) : (
                    services.map((service) => (
                      <span
                        key={service}
                        className="rounded-xl bg-primary/12 px-2.5 py-1 text-[0.66rem] font-bold text-brand-dark"
                      >
                        {service}
                      </span>
                    ))
                  )}
                </div>
              </SectionCard>

              <SectionCard
                title="Business Timing"
                action={<EditButton onClick={() => editStep(3)} />}
              >
                <div className="space-y-2">
                  <ReviewRow label="Opening" value={form.openingTime} />
                  <ReviewRow label="Closing" value={form.closingTime} />
                  <ReviewRow label="Weekly Off" value={weeklyOff.join(", ") || "None"} />
                  <ReviewRow
                    label="Emergency Closing"
                    value={form.emergencyClosing || "Not planned"}
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="Delivery Area"
                action={<EditButton onClick={() => editStep(4)} />}
              >
                <div className="space-y-2">
                  <ReviewRow label="City" value={form.city} />
                  <ReviewRow label="Area" value={form.area} />
                  <ReviewRow label="Pickup Radius" value={`${form.pickupRadius} km`} />
                  <ReviewRow label="Delivery Radius" value={`${form.deliveryRadius} km`} />
                </div>
              </SectionCard>

              <SectionCard title="Shop Profile" action={<EditButton onClick={() => editStep(5)} />}>
                <div className="space-y-2">
                  <ReviewRow label="Logo" value={uploads.logo || "Not uploaded"} />
                  <ReviewRow label="Banner" value={uploads.banner || "Not uploaded"} />
                  <ReviewRow label="Gallery" value={`${uploads.gallery.length} of 5 photos`} />
                </div>
              </SectionCard>

              <SectionCard title="Bank Details" action={<EditButton onClick={() => editStep(6)} />}>
                <div className="space-y-2">
                  <ReviewRow label="Account Holder" value={form.accountHolder} />
                  <ReviewRow label="Bank" value={form.bankName} />
                  <ReviewRow
                    label="Account Number"
                    value={
                      form.accountNumber
                        ? `•••• ${form.accountNumber.slice(-4)}`
                        : ""
                    }
                  />
                  <ReviewRow label="IFSC" value={form.ifsc} />
                </div>
              </SectionCard>
            </>
          ) : null}
        </div>

        {/* Sticky step navigation */}
        <div className="glass-panel fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              className="ripple focus-key flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-soft active:scale-[0.95]"
              aria-label="Previous step"
            >
              <ChevronLeft className="size-5" />
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="ripple focus-key flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97]"
              >
                Continue
                <ChevronRight className="size-4" strokeWidth={2.8} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={busy}
                aria-busy={busy}
                className="ripple focus-key flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97] disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" strokeWidth={2.6} />
                )}
                {busy ? "Submitting" : "Submit Registration"}
              </button>
            )}
          </div>
        </div>
      </div>
      <Toaster />
    </main>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="focus-key flex items-center gap-1 rounded-xl bg-muted px-2.5 py-1.5 text-[0.65rem] font-bold tracking-tight text-foreground transition-colors hover:bg-accent active:scale-95"
    >
      <Check className="size-3 text-brand-green" strokeWidth={3} />
      Edit
    </button>
  );
}
