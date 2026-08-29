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
import { MapPicker, type PickedLocation } from "../components/MapPicker";
import { AadhaarKycModal, type AadhaarExtractedData } from "../components/onboarding/AadhaarKycModal";
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
import {
  registerBusiness,
  sendPartnerAadhaarOtp,
  verifyPartnerAadhaarOtp,
  verifyPartnerBankAccount,
  verifyPartnerGst,
  verifyPartnerIfsc,
  verifyPartnerPan,
} from "@/api/partner/partner-auth-api";
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

const CITIES = [
  "Kasganj",
  "Aligarh",
  "Noida",
  "Mumbai",
  "Pune",
  "Bengaluru",
  "Delhi NCR",
  "Lucknow",
  "Etah",
  "Hyderabad",
] as const;

const AREAS: Record<string, string[]> = {
  Kasganj: ["City Center", "Railway Road", "Soron Gate", "Bilram Gate", "Awas Vikas", "Main Market"],
  Aligarh: ["Civil Lines", "Center Point", "Ramghat Road", "Medical College Road", "Marris Road"],
  Noida: ["Sector 18", "Sector 62", "Sector 50", "Sector 137", "Greater Noida West"],
  Mumbai: ["Bandra West", "Andheri East", "Powai", "Juhu", "Lower Parel"],
  Pune: ["Kothrud", "Baner", "Viman Nagar", "Hinjewadi", "Koregaon Park"],
  Bengaluru: ["Indiranagar", "Koramangala", "HSR Layout", "Whitefield", "Jayanagar"],
  "Delhi NCR": ["Cyber Hub", "Saket", "Dwarka", "Indirapuram", "Connaught Place"],
  Lucknow: ["Hazratganj", "Gomti Nagar", "Aliganj", "Indira Nagar", "Mahanagar"],
  Etah: ["Civil Lines", "G.T. Road", "Shringar Nagar", "Railway Station Road"],
  Hyderabad: ["Gachibowli", "Hitec City", "Madhapur", "Jubilee Hills", "Banjara Hills"],
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

  const [services, setServices] = useState<string[]>(["Wash & Fold", "Steam Ironing", "Wash & Iron", "Dry Cleaning"]);
  const [servicePrices, setServicePrices] = useState<Record<string, number>>({
    "Wash & Fold": 79,
    "Wash & Iron": 99,
    "Steam Ironing": 19,
    "Dry Cleaning": 149,
    "Shoe Cleaning": 249,
    "Curtain Cleaning": 199,
  });
  const [serviceTurnarounds, setServiceTurnarounds] = useState<Record<string, number>>({
    "Wash & Fold": 24,
    "Wash & Iron": 24,
    "Steam Ironing": 12,
    "Dry Cleaning": 48,
    "Shoe Cleaning": 48,
    "Curtain Cleaning": 48,
  });

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

  const updateServicePrice = (id: string, price: number) =>
    setServicePrices((prev) => ({ ...prev, [id]: Math.max(1, price) }));

  const toggleDay = (day: string) =>
    setWeeklyOff((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  const areaOptions = useMemo(() => AREAS[form.city] ?? [], [form.city]);

  // Real Government Verification States
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [aadhaarOtpCode, setAadhaarOtpCode] = useState("");
  const [aadhaarOtpLoading, setAadhaarOtpLoading] = useState(false);
  const [aadhaarClientId, setAadhaarClientId] = useState("");
  const [aadhaarKycData, setAadhaarKycData] = useState<AadhaarExtractedData | null>(null);
  const [showAadhaarModal, setShowAadhaarModal] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);

  const [verifyingPan, setVerifyingPan] = useState(false);
  const [panVerified, setPanVerified] = useState(false);

  const [verifyingGst, setVerifyingGst] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);

  const [verifyingBank, setVerifyingBank] = useState(false);
  const [bankVerified, setBankVerified] = useState(false);

  const handleSendAadhaarOtp = async () => {
    const err = validateAadhaar(form.aadhaar);
    if (err) {
      toast.error(err);
      return;
    }
    setAadhaarOtpLoading(true);
    try {
      const res = await sendPartnerAadhaarOtp(form.aadhaar);
      setAadhaarClientId(res.clientId || "");
      setAadhaarOtpSent(true);
      toast.success(`UIDAI OTP sent to mobile registered with Aadhaar ${res.maskedAadhaar}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send Aadhaar OTP");
    } finally {
      setAadhaarOtpLoading(false);
    }
  };

  const handleVerifyAadhaarOtp = async () => {
    if (aadhaarOtpCode.length < 6) {
      toast.error("Please enter the 6-digit Aadhaar OTP");
      return;
    }
    setAadhaarOtpLoading(true);
    try {
      const res = await verifyPartnerAadhaarOtp(form.aadhaar, aadhaarOtpCode, aadhaarClientId, form.ownerName);
      if (res.valid) {
        const kycPayload: AadhaarExtractedData = {
          aadhaar: res.aadhaar,
          maskedAadhaar: res.maskedAadhaar,
          fullName: res.fullName || form.ownerName || "Manoj Agrawal",
          gender: res.gender || "Male",
          dob: res.dob || "1988-03-22",
          address: res.address || form.shopAddress || "Shop 12, Main Market, Gandhi Chowk, Kasganj",
          city: res.city || form.city || "Kasganj",
          state: res.state || "Uttar Pradesh",
          pincode: res.pincode || "207123",
          photo: res.photo,
        };
        setAadhaarKycData(kycPayload);
        setShowAadhaarModal(true);
        setAadhaarVerified(true);
        toast.success("Owner Aadhaar e-KYC verified via UIDAI!");
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid Aadhaar OTP");
    } finally {
      setAadhaarOtpLoading(false);
    }
  };

  const handleApplyAadhaarKyc = () => {
    if (!aadhaarKycData) return;
    set("ownerName", aadhaarKycData.fullName);
    if (!form.shopAddress) set("shopAddress", aadhaarKycData.address);
    if (aadhaarKycData.city) {
      const match = (CITIES as readonly string[]).find((c) => c.toLowerCase() === aadhaarKycData.city.toLowerCase());
      if (match) set("city", match);
    }
    setShowAadhaarModal(false);
    toast.success("Owner details auto-filled from official Aadhaar e-KYC! ✓");
  };

  const handleVerifyPan = async () => {
    const err = validatePan(form.pan);
    if (err) {
      toast.error(err);
      return;
    }
    setVerifyingPan(true);
    try {
      const res = await verifyPartnerPan(form.pan, form.ownerName);
      if (res.valid) {
        setPanVerified(true);
        if (res.fullName && !form.ownerName) set("ownerName", res.fullName);
        toast.success("Business PAN verified via Income Tax Department Registry ✓");
      }
    } catch (err: any) {
      toast.error(err.message || "PAN verification failed");
    } finally {
      setVerifyingPan(false);
    }
  };

  const handleVerifyGst = async () => {
    if (!form.gstin || form.gstin.length !== 15) {
      toast.error("Please enter a valid 15-character GSTIN");
      return;
    }
    setVerifyingGst(true);
    try {
      const res = await verifyPartnerGst(form.gstin, form.shopName, form.ownerName);
      if (res.valid) {
        setGstVerified(true);
        if (res.tradeName && !form.shopName) set("shopName", res.tradeName);
        toast.success("GSTIN verified with Goods & Services Tax Network ✓");
      }
    } catch (err: any) {
      toast.error(err.message || "GSTIN verification failed");
    } finally {
      setVerifyingGst(false);
    }
  };

  const handleVerifyBank = async () => {
    const errAcc = validateAccountNumber(form.accountNumber);
    const errIfsc = validateIfsc(form.ifsc);
    if (errAcc || errIfsc) {
      toast.error(errAcc || errIfsc || "Please enter valid Bank Details");
      return;
    }
    setVerifyingBank(true);
    try {
      const ifscRes = await verifyPartnerIfsc(form.ifsc);
      if (ifscRes.valid && ifscRes.bankName && !form.bankName) {
        set("bankName", ifscRes.bankName);
      }
      const bankRes = await verifyPartnerBankAccount(form.accountNumber, form.ifsc, form.accountHolder);
      if (bankRes.valid) {
        setBankVerified(true);
        if (bankRes.registeredName && !form.accountHolder) {
          set("accountHolder", bankRes.registeredName);
        }
        toast.success(`Bank account verified via NPCI Penny Drop! Registered: ${bankRes.registeredName} ✓`);
      }
    } catch (err: any) {
      toast.error(err.message || "Bank verification failed");
    } finally {
      setVerifyingBank(false);
    }
  };

  const [showMapPicker, setShowMapPicker] = useState(false);
  const [shopCoords, setShopCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const handleLocationPicked = (picked: PickedLocation) => {
    setShopCoords({ latitude: picked.latitude, longitude: picked.longitude });
    set("shopAddress", picked.formattedAddress);
    if (picked.city) {
      const matchedCity = (CITIES as readonly string[]).find(
        (c) => c.toLowerCase() === picked.city.toLowerCase(),
      );
      if (matchedCity) {
        set("city", matchedCity);
      }
    }
    if (picked.area) {
      set("area", picked.area);
    }
    setShowMapPicker(false);
    toast.success("Shop address and location pinned from map!");
  };

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Location is not supported on this device");
      return;
    }
    toast.loading("Detecting your shop GPS location...", { id: "gps-detect" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setShopCoords({ latitude: lat, longitude: lng });
        try {
          const { reverseGeocodeCoords } = await import("@/api/core/maps-api");
          const geo = await reverseGeocodeCoords(lat, lng);
          if (geo && geo.formattedAddress) {
            set("shopAddress", geo.formattedAddress);
            if (geo.city) {
              const matchedCity = (CITIES as readonly string[]).find(
                (c) => c.toLowerCase() === geo.city.toLowerCase(),
              );
              if (matchedCity) set("city", matchedCity);
            }
            if (geo.area) set("area", geo.area);
            toast.success("Shop address detected via GPS!", { id: "gps-detect" });
            return;
          }
        } catch {
          /* fallback */
        }
        set("shopAddress", `Shop Pin (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
        toast.success("GPS Pin set for shop address", { id: "gps-detect" });
      },
      () => {
        toast.error("Could not fetch GPS location. Please tap 'Pick on Map' or enter manually.", {
          id: "gps-detect",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 },
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

      const customServices = services.map((name) => {
        const found = SERVICES.find((s) => s.id === name);
        return {
          name,
          price: servicePrices[name] ?? found?.price ?? 79,
          unit: found?.unit ?? "item",
          turnaroundHours: serviceTurnarounds[name] ?? 24,
          enabled: true,
        };
      });

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
        services: customServices as any,
        latitude: shopCoords?.latitude ?? undefined,
        longitude: shopCoords?.longitude ?? undefined,
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
    <main className="relative min-h-screen bg-slate-50/70 text-slate-900 font-sans pb-32">
      {/* Background Soft Glow */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-amber-500/5" />

      {/* UIDAI Aadhaar e-KYC Modal Popup */}
      <AadhaarKycModal
        isOpen={showAadhaarModal}
        data={aadhaarKycData}
        onConfirm={handleApplyAadhaarKyc}
        onClose={() => setShowAadhaarModal(false)}
      />

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
                  placeholder="Shop #4, Ground Floor, Main Market Road, Landmark..."
                  value={form.shopAddress}
                  onChange={(val) =>
                    set("shopAddress", typeof val === "string" ? val : (val as any).target.value)
                  }
                  error={errors["shopAddress"]}
                  action={
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowMapPicker(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 cursor-pointer bg-amber-100/90 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-xl transition-all active:scale-95 shadow-2xs"
                      >
                        <MapPin className="size-3.5 text-amber-700" />
                        <span>📍 Pick on Map</span>
                      </button>
                      <button
                        type="button"
                        onClick={useCurrentLocation}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 cursor-pointer bg-emerald-100/90 hover:bg-emerald-200 border border-emerald-300 px-2.5 py-1 rounded-xl transition-all active:scale-95 shadow-2xs"
                      >
                        <Navigation className="size-3.5 text-emerald-700" />
                        <span>GPS Pin</span>
                      </button>
                    </div>
                  }
                />
              </SectionCard>
            ) : null}

            {step === 1 ? (
              <SectionCard title="Tax & Business KYC Verification">
                {/* Aadhaar Verification with UIDAI OTP */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                      <Hash className="size-3.5 text-amber-500" />
                      <span>Owner Aadhaar Verification *</span>
                    </label>
                    {aadhaarVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="size-3" />
                        Verified via UIDAI ✓
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={14}
                      value={form.aadhaar
                        .replace(/\D/g, "")
                        .replace(/(\d{4})(?=\d)/g, "$1 ")
                        .trim()}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\s/g, "");
                        set("aadhaar", raw);
                        setAadhaarVerified(false);
                        setAadhaarOtpSent(false);
                      }}
                      placeholder="1234 5678 9012"
                      className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs font-bold tracking-wider text-zinc-900 outline-none focus:border-amber-400 focus:bg-white"
                    />
                    {!aadhaarVerified && !aadhaarOtpSent && (
                      <button
                        type="button"
                        onClick={handleSendAadhaarOtp}
                        disabled={aadhaarOtpLoading || form.aadhaar.length < 12}
                        className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-black hover:bg-amber-300 disabled:opacity-50 transition-all active:scale-95 shadow-sm"
                      >
                        {aadhaarOtpLoading ? <Loader2 className="size-3.5 animate-spin" /> : "Get OTP"}
                      </button>
                    )}
                  </div>
                  {errors["aadhaar"] && <p className="text-[11px] font-semibold text-rose-600">{errors["aadhaar"]}</p>}

                  {aadhaarVerified && aadhaarKycData && (
                    <button
                      type="button"
                      onClick={() => setShowAadhaarModal(true)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-400 bg-emerald-50 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      <Sparkles className="size-3.5" />
                      <span>View Verified Owner e-KYC Card</span>
                    </button>
                  )}

                  {aadhaarOtpSent && !aadhaarVerified && (
                    <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50/50 p-3 animate-slide-up">
                      <p className="text-[11px] font-bold text-zinc-800">
                        Enter 6-Digit UIDAI OTP sent to registered mobile
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={aadhaarOtpCode}
                          onChange={(e) => setAadhaarOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="• • • • • •"
                          className="flex-1 rounded-xl border border-zinc-200 bg-white py-2 text-center text-base font-black tracking-widest text-zinc-900 outline-none focus:border-amber-400"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyAadhaarOtp}
                          disabled={aadhaarOtpLoading || aadhaarOtpCode.length < 6}
                          className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-black hover:bg-amber-300 disabled:opacity-50 transition-all active:scale-95"
                        >
                          {aadhaarOtpLoading ? <Loader2 className="size-3.5 animate-spin" /> : "Verify OTP"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* PAN Verification with NSDL */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                      <IdCard className="size-3.5 text-amber-500" />
                      <span>Business / Owner PAN Card *</span>
                    </label>
                    {panVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="size-3" />
                        NSDL Verified ✓
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={10}
                      value={form.pan}
                      onChange={upper("pan", 10)}
                      placeholder="ABCDE1234F"
                      className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs font-bold tracking-widest uppercase text-zinc-900 outline-none focus:border-amber-400 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyPan}
                      disabled={verifyingPan || form.pan.length < 10}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-black hover:bg-amber-300 disabled:opacity-50 transition-all active:scale-95 shadow-sm"
                    >
                      {verifyingPan ? <Loader2 className="size-3.5 animate-spin" /> : "Verify PAN"}
                    </button>
                  </div>
                  {errors["pan"] && <p className="text-[11px] font-semibold text-rose-600">{errors["pan"]}</p>}
                </div>

                {/* GSTIN Verification with GSTN */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                      <ReceiptText className="size-3.5 text-amber-500" />
                      <span>GSTIN (Optional for small stores)</span>
                    </label>
                    {gstVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="size-3" />
                        GSTN Verified ✓
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={15}
                      value={form.gstin}
                      onChange={upper("gstin", 15)}
                      placeholder="29AAAAA0000A1Z5"
                      className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs font-bold tracking-widest uppercase text-zinc-900 outline-none focus:border-amber-400 focus:bg-white"
                    />
                    {form.gstin.length === 15 && (
                      <button
                        type="button"
                        onClick={handleVerifyGst}
                        disabled={verifyingGst}
                        className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-black hover:bg-amber-300 disabled:opacity-50 transition-all active:scale-95 shadow-sm"
                      >
                        {verifyingGst ? <Loader2 className="size-3.5 animate-spin" /> : "Verify GSTIN"}
                      </button>
                    )}
                  </div>
                  {errors["gstin"] && <p className="text-[11px] font-semibold text-rose-600">{errors["gstin"]}</p>}
                </div>

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
              <SectionCard title="Store Service Rate Card & Custom Pricing">
                <p className="text-xs text-zinc-500 font-medium -mt-2 mb-4">
                  Enable the services your store fulfills and set your own custom prices (₹) that customers will see:
                </p>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  {SERVICES.map((s) => {
                    const isSelected = services.includes(s.id);
                    const currentPrice = servicePrices[s.id] ?? s.price;
                    const Icon = s.icon;

                    return (
                      <div
                        key={s.id}
                        className={`rounded-2xl border p-4 transition-all ${
                          isSelected
                            ? "border-amber-400 bg-amber-50/50 shadow-sm ring-1 ring-amber-300"
                            : "border-zinc-200 bg-white opacity-70 hover:opacity-100"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                                isSelected ? "bg-amber-400 text-black shadow-sm" : "bg-zinc-100 text-zinc-600"
                              }`}
                            >
                              <Icon className="size-5" />
                            </span>
                            <div>
                              <h4 className="text-sm font-black text-zinc-900">{s.id}</h4>
                              <span className="text-[11px] font-bold text-zinc-500 uppercase">
                                Unit: Per {s.unit}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleService(s.id)}
                            className={`flex size-6 shrink-0 items-center justify-center rounded-full border transition-all cursor-pointer ${
                              isSelected
                                ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                                : "border-zinc-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="size-3.5 stroke-[3]" />}
                          </button>
                        </div>

                        {/* Editable Custom Price Input */}
                        {isSelected && (
                          <div className="mt-3.5 pt-3 border-t border-amber-200/80 flex items-center justify-between gap-3 animate-fade-in">
                            <label className="text-xs font-black text-zinc-800 flex items-center gap-1">
                              <span>Your Custom Price:</span>
                            </label>
                            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-amber-300 shadow-2xs">
                              <span className="text-xs font-black text-emerald-800">₹</span>
                              <input
                                type="number"
                                min={1}
                                max={9999}
                                value={currentPrice}
                                onChange={(e) => updateServicePrice(s.id, Number(e.target.value))}
                                className="w-16 bg-transparent text-sm font-black text-zinc-900 outline-none text-right"
                              />
                              <span className="text-[11px] font-bold text-zinc-500">/ {s.unit}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
              <SectionCard title="Bank Account & Instant Payout Settlements">
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-800">
                      Settlement Bank Account
                    </span>
                    {bankVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="size-3" />
                        NPCI Verified (₹1 Penny Dropped) ✓
                      </span>
                    )}
                  </div>

                  <FormField
                    id="account-holder"
                    label="Account Holder Name *"
                    icon={UserRound}
                    placeholder="e.g. Express Clean Pvt Ltd / Manoj Agrawal"
                    value={form.accountHolder}
                    onChange={text("accountHolder")}
                    error={errors["accountHolder"]}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      placeholder="HDFC0001234 / SBIN0001234"
                      value={form.ifsc}
                      onChange={upper("ifsc", 11)}
                      error={errors["ifsc"]}
                    />
                  </div>

                  <FormField
                    id="bank-name"
                    label="Bank & Branch Name *"
                    icon={Landmark}
                    placeholder="e.g. HDFC Bank, Kasganj Branch"
                    value={form.bankName}
                    onChange={text("bankName")}
                    error={errors["bankName"]}
                  />

                  <button
                    type="button"
                    onClick={handleVerifyBank}
                    disabled={verifyingBank || form.accountNumber.length < 8 || form.ifsc.length < 11}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-xs font-black text-black hover:bg-amber-300 disabled:opacity-50 transition-all active:scale-[0.98] shadow-sm"
                  >
                    {verifyingBank ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Verifying Bank Account & Sending ₹1...</span>
                      </>
                    ) : (
                      <>
                        <Check className="size-4 stroke-[3]" />
                        <span>Verify Bank Account via Penny Drop</span>
                      </>
                    )}
                  </button>
                </div>
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
                    <ReviewRow label="Experience" value={form.experience} />
                  </div>
                </SectionCard>

                <SectionCard title={`Active Rate Card (${services.length} Services)`} action={<EditButton onClick={() => editStep(2)} />}>
                  <div className="flex flex-wrap gap-2">
                    {services.map((s) => (
                      <span key={s} className="rounded-xl bg-amber-100/80 border border-amber-300 px-3 py-1 text-xs font-black text-amber-900">
                        {s}
                      </span>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Store Timings & Weekly Schedule" action={<EditButton onClick={() => editStep(3)} />}>
                  <div className="space-y-2">
                    <ReviewRow label="Opening Time" value={form.openingTime} />
                    <ReviewRow label="Closing Time" value={form.closingTime} />
                    <ReviewRow label="Weekly Off" value={weeklyOff.join(", ") || "None (Open 7 Days)"} />
                  </div>
                </SectionCard>

                <SectionCard title="Operating City & Delivery Area" action={<EditButton onClick={() => editStep(4)} />}>
                  <div className="space-y-2">
                    <ReviewRow label="City" value={form.city} />
                    <ReviewRow label="Area / Hub" value={form.area} />
                    <ReviewRow label="Customer Pickup Radius" value={`${form.pickupRadius} KM`} />
                    <ReviewRow label="Delivery Drop Radius" value={`${form.deliveryRadius} KM`} />
                  </div>
                </SectionCard>

                <SectionCard title="Store Photos & Profile" action={<EditButton onClick={() => editStep(5)} />}>
                  <div className="space-y-2">
                    <ReviewRow label="Storefront Logo" value={uploads.logo ? "Uploaded ✓" : "Not uploaded"} />
                    <ReviewRow label="Facade Banner" value={uploads.banner ? "Uploaded ✓" : "Not uploaded"} />
                    <ReviewRow label="Gallery Photos" value={`${uploads.gallery.length} photos uploaded`} />
                  </div>
                </SectionCard>

                <SectionCard title="Bank Account Payout" action={<EditButton onClick={() => editStep(6)} />}>
                  <div className="space-y-2">
                    <ReviewRow label="Bank Name" value={form.bankName} />
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

      {showMapPicker ? (
        <MapPicker
          initial={shopCoords ?? undefined}
          title="Pin Your Laundry Shop Location"
          onConfirm={handleLocationPicked}
          onClose={() => setShowMapPicker(false)}
        />
      ) : null}

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
