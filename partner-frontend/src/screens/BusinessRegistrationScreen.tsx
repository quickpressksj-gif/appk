import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Bath,
  Blinds,
  Briefcase,
  Building2,
  CalendarOff,
  Check,
  CheckCircle2,
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
  Lock,
  Mail,
  MapPin,
  Navigation,
  Phone,
  ReceiptText,
  Send,
  ShieldCheck,
  Shirt,
  Sparkles,
  Store,
  Sun,
  UserRound,
  Wind,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  { id: "Wash & Fold", icon: Shirt, price: 79, unit: "kg" },
  { id: "Wash & Iron", icon: Wind, price: 99, unit: "kg" },
  { id: "Steam Ironing", icon: Sparkles, price: 19, unit: "pc" },
  { id: "Dry Cleaning", icon: Bath, price: 149, unit: "pc" },
  { id: "Shoe Cleaning", icon: Footprints, price: 249, unit: "pair" },
  { id: "Curtain Cleaning", icon: Blinds, price: 199, unit: "panel" },
] as const;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const CITIES = ["Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Kasganj"] as const;

const AREAS: Record<string, string[]> = {
  Bengaluru: ["Indiranagar", "Koramangala", "HSR Layout", "Whitefield", "Jayanagar"],
  Mumbai: ["Bandra West", "Andheri East", "Powai", "Juhu", "Lower Parel"],
  "Delhi NCR": ["Cyber Hub", "Sector 62", "Saket", "Dwarka", "Indirapuram"],
  Hyderabad: ["Gachibowli", "Hitec City", "Madhapur", "Jubilee Hills", "Banjara Hills"],
  Kasganj: ["City Center", "Railway Road", "Soron Gate", "Bilram Gate", "Awas Vikas"],
};

type Uploads = {
  logo: string;
  banner: string;
  gallery: string[];
};

export function BusinessRegistrationScreen() {
  const navigate = useNavigate();
  const { session, signIn, hydrating, phone } = usePartnerContext();

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [form, setForm] = useState(() => ({
    shopName: "",
    ownerName: "",
    mobile: phone || "",
    email: "",
    shopAddress: "",
    gstin: "",
    pan: "",
    aadhaar: "",
    businessType: "Laundry",
    experience: "1 - 3 years",
    openingTime: "08:00",
    closingTime: "21:00",
    emergencyClosing: "",
    city: "Bengaluru",
    area: "Indiranagar",
    pickupRadius: 5,
    deliveryRadius: 8,
    accountHolder: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
  }));

  // Route protection
  useEffect(() => {
    if (hydrating) return;
    if (!session) {
      navigate({ to: partnerRoutes.auth });
      return;
    }
    if (session.isOnboarded && !session.isVerified) {
      navigate({ to: partnerRoutes.registrationSubmitted });
      return;
    }
    if (session.isOnboarded && session.isVerified) {
      navigate({ to: partnerRoutes.dashboard });
      return;
    }
  }, [hydrating, session, navigate]);

  // Sync session details
  useEffect(() => {
    if (session) {
      setForm((prev) => ({
        ...prev,
        ownerName: prev.ownerName || session.businessName || "",
        email: prev.email || session.email || "",
        mobile: prev.mobile || phone || session.phone || "",
      }));
    }
  }, [session, phone]);

  const [services, setServices] = useState<string[]>(["Wash & Fold", "Steam Ironing"]);
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
        toast.success("Current GPS location added to shop address");
      },
      () => toast("Could not fetch location, enter the address manually"),
    );
  };

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
      toast.error(Object.values(found)[0] ?? "Please complete the required fields");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    if (step === 0) return;
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const editStep = (index: number) => {
    setStep(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    for (let i = 0; i < STEPS.length - 1; i += 1) {
      const found = validateStep(i);
      if (Object.keys(found).length > 0) {
        setStep(i);
        setErrors(found);
        toast.error(`Please complete Step ${i + 1}: ${STEPS[i]}`);
        return;
      }
    }

    setBusy(true);
    try {
      const category =
        BUSINESS_TYPES.find((t) => t.id === form.businessType)?.category ?? "laundry";

      const updated = await registerBusiness({
        businessName: form.shopName,
        ownerName: form.ownerName,
        email: form.email,
        phone: form.mobile,
        category,
        gstin: form.gstin || undefined,
        pan: form.pan,
        aadhaar: form.aadhaar,
        experience: form.experience,
        address: form.shopAddress,
        city: form.city,
        area: form.area,
        pincode: form.shopAddress.match(/\b\d{6}\b/)?.[0] ?? "560001",
        pickupRadiusKm: form.pickupRadius,
        deliveryRadiusKm: form.deliveryRadius,
        openingTime: form.openingTime,
        closingTime: form.closingTime,
        weeklyOff: weeklyOff.join(", ") || "None",
        emergencyClosing: form.emergencyClosing || undefined,
        accountHolder: form.accountHolder,
        bankName: form.bankName,
        accountNumber: form.accountNumber,
        ifsc: form.ifsc,
        logo: uploads.logo || undefined,
        banner: uploads.banner || undefined,
        gallery: uploads.gallery,
        services,
      });

      signIn(updated);
      toast.success("Registration submitted! Admin review in progress. 🎉");
      navigate({ to: partnerRoutes.registrationSubmitted });
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : "Could not submit registration.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#FFFBF2] text-[#111827] font-sans pb-32">
      {/* Background Ambience */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(#F4B400_0.75px,transparent_0.75px)] opacity-10 [background-size:24px_24px]" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pt-6 md:px-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-zinc-200/80">
          <PartnerAuthHeader badge="PARTNER ONBOARDING" withTagline={true} />

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 border border-emerald-200">
              <ShieldCheck className="size-3.5" />
              <span>Step {step + 1} of {STEPS.length}</span>
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <StepProgress steps={STEPS} current={step} onStepClick={editStep} />
        </div>

        {/* Two-Column Grid on Desktop / Single-Column on Mobile */}
        <div className="mt-8 grid grid-cols-12 gap-8 items-start">
          {/* Left / Main Form Column */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {step === 0 ? (
              <SectionCard title="Business & Owner Information">
                <FormField
                  id="shop-name"
                  label="Laundry / Shop Name *"
                  icon={Store}
                  placeholder="e.g. Express Clean Laundromat"
                  value={form.shopName}
                  onChange={text("shopName")}
                  error={errors["shopName"]}
                />
                <FormField
                  id="owner-name"
                  label="Owner Full Name *"
                  icon={UserRound}
                  placeholder="Rajesh Kumar"
                  value={form.ownerName}
                  onChange={text("ownerName")}
                  error={errors["ownerName"]}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    id="owner-mobile"
                    label="Registered Mobile *"
                    icon={Phone}
                    inputMode="numeric"
                    placeholder="98765 43210"
                    value={form.mobile}
                    onChange={digitsOnly("mobile", 10)}
                    error={errors["mobile"]}
                  />
                  <FormField
                    id="owner-email"
                    label="Email Address *"
                    icon={Mail}
                    type="email"
                    placeholder="partner@quickpress.online"
                    value={form.email}
                    onChange={text("email")}
                    error={errors["email"]}
                  />
                </div>
                <TextAreaField
                  id="shop-address"
                  label="Full Shop Address *"
                  placeholder="Shop #4, Ground Floor, Main Road, Landmark..."
                  value={form.shopAddress}
                  onChange={(e) => set("shopAddress", e.target.value)}
                  error={errors["shopAddress"]}
                  action={
                    <button
                      type="button"
                      onClick={useCurrentLocation}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:underline cursor-pointer"
                    >
                      <Navigation className="size-3" />
                      <span>Use GPS Pin</span>
                    </button>
                  }
                />
              </SectionCard>
            ) : null}

            {step === 1 ? (
              <SectionCard title="Tax & Business Details">
                <FormField
                  id="pan"
                  label="Business / Owner PAN Card *"
                  icon={IdCard}
                  placeholder="ABCDE1234F"
                  value={form.pan}
                  onChange={upper("pan", 10)}
                  error={errors["pan"]}
                />
                <FormField
                  id="aadhaar"
                  label="Aadhaar Number *"
                  icon={Hash}
                  inputMode="numeric"
                  placeholder="12-digit Aadhaar Number"
                  value={form.aadhaar}
                  onChange={digitsOnly("aadhaar", 12)}
                  error={errors["aadhaar"]}
                />
                <FormField
                  id="gstin"
                  label="GSTIN (Optional for small stores)"
                  icon={ReceiptText}
                  placeholder="29AAAAA0000A1Z5"
                  value={form.gstin}
                  onChange={upper("gstin", 15)}
                  error={errors["gstin"]}
                />
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 mb-2">
                    Business Entity Type *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {BUSINESS_TYPES.map((t) => (
                      <ChoiceChip
                        key={t.id}
                        label={t.id}
                        selected={form.businessType === t.id}
                        onClick={() => set("businessType", t.id)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 mb-2">
                    Industry Experience *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EXPERIENCE_OPTIONS.map((exp) => (
                      <ChoiceChip
                        key={exp}
                        label={exp}
                        selected={form.experience === exp}
                        onClick={() => set("experience", exp)}
                      />
                    ))}
                  </div>
                </div>
              </SectionCard>
            ) : null}

            {step === 2 ? (
              <SectionCard title="Select Provided Services & Rate Card">
                <p className="text-xs text-zinc-500 font-medium -mt-2 mb-4">
                  Select the laundry and dry cleaning services your store fulfills:
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {SERVICES.map((s) => (
                    <ServiceCard
                      key={s.id}
                      title={s.id}
                      icon={s.icon}
                      price={s.price}
                      unit={s.unit}
                      selected={services.includes(s.id)}
                      onToggle={() => toggleService(s.id)}
                    />
                  ))}
                </div>
                {errors["services"] ? (
                  <p className="text-xs font-bold text-red-600 mt-2">{errors["services"]}</p>
                ) : null}
              </SectionCard>
            ) : null}

            {step === 3 ? (
              <SectionCard title="Store Timings & Weekly Schedule">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    id="opening-time"
                    label="Opening Time *"
                    icon={Sun}
                    type="time"
                    value={form.openingTime}
                    onChange={text("openingTime")}
                    error={errors["openingTime"]}
                  />
                  <FormField
                    id="closing-time"
                    label="Closing Time *"
                    icon={Clock}
                    type="time"
                    value={form.closingTime}
                    onChange={text("closingTime")}
                    error={errors["closingTime"]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-700 mb-2">
                    Weekly Off Day (Store Closed)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((d) => (
                      <ChoiceChip
                        key={d}
                        label={d}
                        selected={weeklyOff.includes(d)}
                        onClick={() => toggleDay(d)}
                      />
                    ))}
                  </div>
                </div>
              </SectionCard>
            ) : null}

            {step === 4 ? (
              <SectionCard title="Service City & Delivery Area">
                <div className="grid grid-cols-2 gap-4">
                  <SelectField
                    id="city"
                    label="Operating City *"
                    icon={Building2}
                    options={CITIES}
                    value={form.city}
                    onChange={(val) => {
                      set("city", val);
                      set("area", AREAS[val]?.[0] ?? "");
                    }}
                    error={errors["city"]}
                  />
                  <SelectField
                    id="area"
                    label="Locality / Hub *"
                    icon={MapPin}
                    options={areaOptions}
                    value={form.area}
                    onChange={(val) => set("area", val)}
                    error={errors["area"]}
                  />
                </div>
                <SliderField
                  id="pickup-radius"
                  label="Customer Pickup Radius"
                  min={1}
                  max={25}
                  unit="km"
                  value={form.pickupRadius}
                  onChange={(val) => set("pickupRadius", val)}
                />
                <SliderField
                  id="delivery-radius"
                  label="Delivery Drop Radius"
                  min={1}
                  max={25}
                  unit="km"
                  value={form.deliveryRadius}
                  onChange={(val) => set("deliveryRadius", val)}
                />
              </SectionCard>
            ) : null}

            {step === 5 ? (
              <SectionCard title="Shop Front & Interior Photos">
                <div className="grid grid-cols-2 gap-4">
                  <UploadTile
                    label="Storefront Logo"
                    hint="Square PNG/JPG (Min 500x500)"
                    value={uploads.logo}
                    onChange={(val) => setUploads((p) => ({ ...p, logo: val }))}
                  />
                  <UploadTile
                    label="Store Facade Banner"
                    hint="Front signboard banner"
                    value={uploads.banner}
                    onChange={(val) => setUploads((p) => ({ ...p, banner: val }))}
                  />
                </div>
                <div className="mt-4">
                  <GalleryUploader
                    items={uploads.gallery}
                    onChange={(items) => setUploads((p) => ({ ...p, gallery: items }))}
                  />
                </div>
              </SectionCard>
            ) : null}

            {step === 6 ? (
              <SectionCard title="Bank Account & Payout Details">
                <FormField
                  id="account-holder"
                  label="Bank Account Holder Name *"
                  icon={UserRound}
                  placeholder="e.g. Express Clean Pvt Ltd"
                  value={form.accountHolder}
                  onChange={text("accountHolder")}
                  error={errors["accountHolder"]}
                />
                <FormField
                  id="bank-name"
                  label="Bank Name *"
                  icon={Landmark}
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                  value={form.bankName}
                  onChange={text("bankName")}
                  error={errors["bankName"]}
                />
                <FormField
                  id="account-number"
                  label="Account Number *"
                  icon={CreditCard}
                  inputMode="numeric"
                  placeholder="502001234567"
                  value={form.accountNumber}
                  onChange={digitsOnly("accountNumber", 18)}
                  error={errors["accountNumber"]}
                />
                <FormField
                  id="ifsc"
                  label="IFSC Code *"
                  icon={Banknote}
                  placeholder="HDFC0001234"
                  value={form.ifsc}
                  onChange={upper("ifsc", 11)}
                  error={errors["ifsc"]}
                />
              </SectionCard>
            ) : null}

            {step === 7 ? (
              <div className="space-y-4">
                <SectionCard title="Owner & Store Info" action={<EditButton onClick={() => editStep(0)} />}>
                  <div className="space-y-2">
                    <ReviewRow label="Shop Name" value={form.shopName} />
                    <ReviewRow label="Owner Name" value={form.ownerName} />
                    <ReviewRow label="Mobile" value={`+91 ${form.mobile}`} />
                    <ReviewRow label="Email" value={form.email} />
                    <ReviewRow label="Address" value={form.shopAddress} />
                  </div>
                </SectionCard>

                <SectionCard title="Tax & Business Entity" action={<EditButton onClick={() => editStep(1)} />}>
                  <div className="space-y-2">
                    <ReviewRow label="PAN" value={form.pan} />
                    <ReviewRow label="Aadhaar" value={form.aadhaar} />
                    <ReviewRow label="GSTIN" value={form.gstin || "Not provided (Exempt)"} />
                    <ReviewRow label="Business Entity" value={form.businessType} />
                  </div>
                </SectionCard>

                <SectionCard title={`Active Rate Card (${services.length})`} action={<EditButton onClick={() => editStep(2)} />}>
                  <div className="flex flex-wrap gap-2">
                    {services.map((s) => (
                      <span key={s} className="rounded-xl bg-amber-100/80 border border-amber-300 px-3 py-1 text-xs font-black text-amber-900">
                        {s}
                      </span>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Bank Account Payout" action={<EditButton onClick={() => editStep(6)} />}>
                  <div className="space-y-2">
                    <ReviewRow label="Bank" value={form.bankName} />
                    <ReviewRow label="Account Holder" value={form.accountHolder} />
                    <ReviewRow
                      label="Account Number"
                      value={form.accountNumber ? `•••• •••• ${form.accountNumber.slice(-4)}` : ""}
                    />
                    <ReviewRow label="IFSC Code" value={form.ifsc} />
                  </div>
                </SectionCard>
              </div>
            ) : null}
          </div>

          {/* Right Sidebar / Live Application Summary Card (Desktop) */}
          <div className="hidden lg:block lg:col-span-4 sticky top-6">
            <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#F4B400] text-[#111827] font-black text-xl shadow-xs">
                  {form.shopName ? form.shopName.slice(0, 2).toUpperCase() : "QP"}
                </div>
                <div>
                  <h4 className="text-sm font-black text-zinc-900 truncate max-w-[180px]">
                    {form.shopName || "Your Laundry Store"}
                  </h4>
                  <p className="text-[11px] font-semibold text-zinc-500">{form.city || "Operating City"}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  Onboarding Progress
                </span>
                <div className="mt-1.5 flex items-center justify-between text-xs font-bold text-zinc-700">
                  <span>Step {step + 1} of {STEPS.length}</span>
                  <span className="text-emerald-600 font-black">{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                    style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-zinc-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Selected Services</span>
                  <span className="font-bold text-zinc-900">{services.length} items</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Delivery Radius</span>
                  <span className="font-bold text-zinc-900">{form.deliveryRadius} KM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Timing</span>
                  <span className="font-bold text-zinc-900">{form.openingTime} - {form.closingTime}</span>
                </div>
              </div>

              <div className="pt-2">
                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#F4B400] font-black text-xs uppercase tracking-wider text-[#111827] shadow-sm hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>Continue To Step {step + 2}</span>
                    <ChevronRight className="size-4 stroke-[3]" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={busy}
                    className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#F4B400] font-black text-xs uppercase tracking-wider text-[#111827] shadow-sm hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {busy ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Submitting Application...</span>
                      </>
                    ) : (
                      <>
                        <Send className="size-4 stroke-[2.5]" />
                        <span>Submit Registration</span>
                      </>
                    )}
                  </button>
                )}

                {step > 0 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    className="mt-2.5 flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl border border-zinc-200 bg-white text-xs font-bold text-zinc-700 hover:bg-zinc-50 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <ChevronLeft className="size-4" />
                    <span>Previous Step</span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Bottom Action Bar (< lg) */}
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-zinc-200 p-4 shadow-2xl">
          <div className="mx-auto flex max-w-md items-center gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="flex size-13 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-700 active:scale-95 cursor-pointer"
                aria-label="Previous step"
              >
                <ChevronLeft className="size-5" />
              </button>
            ) : null}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex h-13 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#F4B400] font-black text-xs uppercase tracking-wider text-[#111827] shadow-sm active:scale-[0.98] cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight className="size-4 stroke-[3]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={busy}
                className="flex h-13 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#F4B400] font-black text-xs uppercase tracking-wider text-[#111827] shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4 stroke-[2.5]" />}
                <span>{busy ? "Submitting..." : "Submit Registration"}</span>
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
      className="flex items-center gap-1 rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-black text-amber-900 active:scale-95 transition-all cursor-pointer"
    >
      <Check className="size-3 text-emerald-600 stroke-[3]" />
      <span>Edit</span>
    </button>
  );
}
