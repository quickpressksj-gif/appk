import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Bath,
  Bell,
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
  Globe,
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
  Search,
  Send,
  ShieldCheck,
  Shirt,
  Sparkles,
  Store,
  Sun,
  UserRound,
  Volume2,
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
  PartnerAgreementSignaturePad,
  type AgreementSignatureData,
} from "../components/onboarding/PartnerAgreementSignaturePad";
import { testPartnerSoundAndVibration } from "../lib/partner-order-alert-sound";
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
import { useLanguage } from "../lib/i18n";
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
import {
  fetchMasterCatalogServices,
  fetchApprovedOperatingCities,
  type MasterCatalogItem,
  type ApprovedCityItem,
} from "@/api/partner/partner-services-api";
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

const SERVICES: (MasterCatalogItem & { category?: string })[] = [
  // ⚡ 1. Steam Ironing (Pressing by Piece)
  { id: "Shirt Steam Iron", name: "Shirt Steam Iron", price: 15, unit: "pc", defaultHours: 12, category: "iron", desc: "Crisp wrinkle-free hanger finish for formal and casual shirts." },
  { id: "T-Shirt Steam Iron", name: "T-Shirt Steam Iron", price: 12, unit: "pc", defaultHours: 12, category: "iron", desc: "Gentle temperature-controlled steam press for cotton and polo tees." },
  { id: "Trouser / Jeans Steam Iron", name: "Trouser / Jeans Steam Iron", price: 15, unit: "pc", defaultHours: 12, category: "iron", desc: "Sharp razor creases and flat line press for pants and denim." },
  { id: "Kurta / Pyjama Steam Iron", name: "Kurta / Pyjama Steam Iron", price: 25, unit: "pc", defaultHours: 12, category: "iron", desc: "Traditional ethnic wear wrinkle-free steam pressing." },
  { id: "Saree Steam Press", name: "Saree Steam Press", price: 59, unit: "pc", defaultHours: 12, category: "iron", desc: "Delicate temperature steam finish with roller packaging." },
  { id: "Blazer / Coat Steam Iron", name: "Blazer / Coat Steam Iron", price: 69, unit: "pc", defaultHours: 12, category: "iron", desc: "Form-retaining 3D vertical steam pressing for coats." },
  { id: "Bedsheet Steam Iron", name: "Bedsheet Steam Iron", price: 29, unit: "pc", defaultHours: 12, category: "iron", desc: "Large flat linen steam press and crisp hotel-fold." },

  // 👔 2. Dry Cleaning (Special Care by Piece)
  { id: "Shirt Dry Clean", name: "Shirt Dry Clean", price: 79, unit: "pc", defaultHours: 36, category: "dry-clean", desc: "Eco-friendly solvent stain removal and crisp collar finish." },
  { id: "Trouser / Jeans Dry Clean", name: "Trouser / Jeans Dry Clean", price: 79, unit: "pc", defaultHours: 36, category: "dry-clean", desc: "Deep solvent cleaning, spot treatment and sharp creasing." },
  { id: "2-Piece Suit Dry Clean", name: "2-Piece Suit Dry Clean", price: 249, unit: "set", defaultHours: 48, category: "dry-clean", desc: "Blazer + Trouser tailored luxury solvent care and hanger pack." },
  { id: "3-Piece Suit Dry Clean", name: "3-Piece Suit Dry Clean", price: 349, unit: "set", defaultHours: 48, category: "dry-clean", desc: "Jacket + Waistcoat + Trouser complete executive dry clean." },
  { id: "Blazer / Coat Dry Clean", name: "Blazer / Coat Dry Clean", price: 149, unit: "pc", defaultHours: 48, category: "dry-clean", desc: "Solvent stain removal and shape preservation for suits." },
  { id: "Winter Jacket / Bomber Dry Clean", name: "Winter Jacket / Bomber Dry Clean", price: 199, unit: "pc", defaultHours: 48, category: "dry-clean", desc: "Padded and down jacket deep soil and grime extraction." },
  { id: "Woolen Sweater / Cardigan Dry Clean", name: "Woolen Sweater / Cardigan Dry Clean", price: 119, unit: "pc", defaultHours: 36, category: "dry-clean", desc: "Anti-shrink pure wool cleaning and de-pilling treatment." },
  { id: "Sherwani / Indo-Western Dry Clean", name: "Sherwani / Indo-Western Dry Clean", price: 399, unit: "pc", defaultHours: 48, category: "dry-clean", desc: "Heavy bridal and wedding wear solvent spa with bead care." },

  // 🧺 3. Wash & Fold / Laundry
  { id: "Wash & Fold (Per Kg)", name: "Wash & Fold (Per Kg)", price: 79, unit: "kg", defaultHours: 24, category: "wash", desc: "Daily wear clothes washed, dried & neatly folded." },
  { id: "Wash & Steam Iron (Per Kg)", name: "Wash & Steam Iron (Per Kg)", price: 99, unit: "kg", defaultHours: 24, category: "wash", desc: "Wash with fabric conditioner & professional steam ironing." },
  { id: "Bed Sheet Wash & Fold", name: "Bed Sheet Wash & Fold", price: 59, unit: "pc", defaultHours: 24, category: "wash", desc: "Hygienic warm water sanitization and neat folding." },
  { id: "Towel & Bath Linen Wash", name: "Towel & Bath Linen Wash", price: 29, unit: "pc", defaultHours: 24, category: "wash", desc: "Deep disinfectant wash and extra fluff drying." },

  // ✨ 4. Premium Saree & Silk Care
  { id: "Silk Saree Dry Clean & Roll Polish", name: "Silk Saree Dry Clean & Roll Polish", price: 249, unit: "pc", defaultHours: 48, category: "premium", desc: "Delicate pure silk wash, stain removal and roll polish finish." },
  { id: "Heavy Zari / Bridal Lehenga Spa", name: "Heavy Zari / Bridal Lehenga Spa", price: 499, unit: "pc", defaultHours: 72, category: "premium", desc: "Delicate stone and zari embroidery protection with hand finishing." },
  { id: "Designer Gown / Anarkali Dry Clean", name: "Designer Gown / Anarkali Dry Clean", price: 299, unit: "pc", defaultHours: 48, category: "premium", desc: "Multi-layer delicate fabric solvent extraction." },

  // 👟 5. Footwear & Bag Spa
  { id: "Sneakers & Sports Shoes Deep Clean", name: "Sneakers & Sports Shoes Deep Clean", price: 249, unit: "pair", defaultHours: 48, category: "shoe-care", desc: "Deep sonic foam scrubbing, deodorizing and sole whitening." },
  { id: "Leather Shoes Cleaning & Polish", name: "Leather Shoes Cleaning & Polish", price: 299, unit: "pair", defaultHours: 48, category: "shoe-care", desc: "Wax buffing, leather cream nourishment and mirror shine." },
  { id: "Backpack & Handbag Cleaning", name: "Backpack & Handbag Cleaning", price: 199, unit: "pc", defaultHours: 48, category: "shoe-care", desc: "Deep soil extraction, zipper conditioning and fabric sanitization." },

  // 🪟 6. Home Care, Blankets & Curtains
  { id: "Single Blanket / Quilt Wash", name: "Single Blanket / Quilt Wash", price: 249, unit: "pc", defaultHours: 48, category: "home-care", desc: "Winter comforter sanitized, washed & sun fluff-dried." },
  { id: "Double Blanket / Heavy Rajai Wash", name: "Double Blanket / Heavy Rajai Wash", price: 349, unit: "pc", defaultHours: 48, category: "home-care", desc: "Heavy double winter quilt deep allergen extraction." },
  { id: "Curtain Cleaning (Per Panel)", name: "Curtain Cleaning (Per Panel)", price: 199, unit: "panel", defaultHours: 36, category: "home-care", desc: "Dust-free steam extraction and anti-shrink washing." },
  { id: "Carpet / Rug Deep Shampoo", name: "Carpet / Rug Deep Shampoo", price: 449, unit: "carpet", defaultHours: 48, category: "home-care", desc: "Industrial fibre deep shampoo wash and stain extraction." },

  // 🚀 7. Express Priority Turnaround
  { id: "Express Laundry (6 Hours)", name: "Express Laundry (6 Hours)", price: 129, unit: "kg", defaultHours: 6, category: "express", desc: "Priority wash, tumble dry and pack within 6 hours." },
  { id: "Express Steam Ironing (4 Hours)", name: "Express Steam Ironing (4 Hours)", price: 25, unit: "pc", defaultHours: 4, category: "express", desc: "Superfast urgent wardrobe pressing within 4 hours." },
];

const SERVICE_CATEGORY_TABS = [
  { id: "all", label: "All Items" },
  { id: "iron", label: "⚡ Steam Iron" },
  { id: "dry-clean", label: "👔 Dry Clean" },
  { id: "wash", label: "🧺 Wash & Fold" },
  { id: "premium", label: "✨ Saree & Silk" },
  { id: "shoe-care", label: "👟 Shoes & Bags" },
  { id: "home-care", label: "🪟 Blankets & Home" },
  { id: "express", label: "🚀 Express" },
] as const;

function resolveServiceIcon(s: MasterCatalogItem) {
  const name = (s.name || s.id).toLowerCase();
  if (name.includes("iron") || name.includes("press")) return Wind;
  if (name.includes("dry") || name.includes("suit") || name.includes("coat") || name.includes("blazer")) return Bath;
  if (name.includes("saree") || name.includes("silk") || name.includes("lehenga") || name.includes("gown")) return Sparkles;
  if (name.includes("shoe") || name.includes("sneaker") || name.includes("bag")) return Footprints;
  if (name.includes("curtain") || name.includes("carpet") || name.includes("blanket") || name.includes("rajai") || name.includes("quilt")) return Blinds;
  if (name.includes("express")) return Sparkles;
  return Shirt;
}

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
  const { openLanguageModal, language, t } = useLanguage();

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
    city: "Kasganj",
    area: "City Center",
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

  // Sync session details safely without auto-filling phone numbers into ownerName
  useEffect(() => {
    if (session) {
      const isValidHumanName = (val?: string) => {
        if (!val) return false;
        const clean = val.trim();
        // If string contains only digits, +, -, () or is a phone number, reject it
        if (/^\+?[\d\s\-()]+$/.test(clean)) return false;
        // Must contain at least 2 alphabet characters
        return /[a-zA-Z]{2,}/.test(clean);
      };

      setForm((prev) => ({
        ...prev,
        ownerName:
          prev.ownerName ||
          (isValidHumanName(session.ownerName) ? (session.ownerName as string) : "") ||
          (isValidHumanName(session.businessName) ? (session.businessName as string) : "") ||
          "",
        email: prev.email || session.email || "",
        mobile: prev.mobile || phone || session.phone || "",
      }));
    }
  }, [session, phone]);

  const [catalogServices, setCatalogServices] = useState<(MasterCatalogItem & { category?: string })[]>(SERVICES);
  const [serviceCategoryTab, setServiceCategoryTab] = useState<string>("all");
  const [serviceSearchQuery, setServiceSearchQuery] = useState<string>("");
  const [services, setServices] = useState<string[]>([
    "Shirt Steam Iron",
    "T-Shirt Steam Iron",
    "Trouser / Jeans Steam Iron",
    "Shirt Dry Clean",
    "Trouser / Jeans Dry Clean",
    "Wash & Fold (Per Kg)",
    "Wash & Steam Iron (Per Kg)",
  ]);
  const [servicePrices, setServicePrices] = useState<Record<string, number>>({
    "Wash & Fold": 79,
    "Wash & Iron": 99,
    "Steam Ironing": 19,
    "Dry Cleaning": 149,
    "Saree Care": 249,
    "Shoe Cleaning": 249,
    "Blanket Wash": 349,
    "Curtain Cleaning": 199,
    "Express Laundry": 129,
  });
  const [serviceTurnarounds, setServiceTurnarounds] = useState<Record<string, number>>({
    "Wash & Fold": 24,
    "Wash & Iron": 24,
    "Steam Ironing": 12,
    "Dry Cleaning": 48,
    "Saree Care": 48,
    "Shoe Cleaning": 48,
    "Blanket Wash": 48,
    "Curtain Cleaning": 36,
    "Express Laundry": 12,
  });

  // Fetch real-time Master Service Catalog from Admin Panel / Backend
  useEffect(() => {
    let alive = true;
    fetchMasterCatalogServices().then((items) => {
      if (alive && items.length > 0) {
        setCatalogServices(items);
        setServicePrices((prev) => {
          const next = { ...prev };
          for (const it of items) {
            if (next[it.id] === undefined) next[it.id] = it.price;
          }
          return next;
        });
        setServiceTurnarounds((prev) => {
          const next = { ...prev };
          for (const it of items) {
            if (next[it.id] === undefined) next[it.id] = it.defaultHours;
          }
          return next;
        });
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  // Dynamic Approved Operating Cities & Zones from Admin Panel
  const [approvedCities, setApprovedCities] = useState<string[]>(["Kasganj"]);
  const [approvedAreas, setApprovedAreas] = useState<Record<string, string[]>>({
    Kasganj: ["City Center", "Railway Road", "Soron Gate", "Bilram Gate", "Awas Vikas", "Main Market"],
  });

  useEffect(() => {
    let alive = true;
    fetchApprovedOperatingCities().then((cities) => {
      if (alive && Array.isArray(cities) && cities.length > 0) {
        const cityNames = cities.map((c) => c.name || c.city || c.id);
        const map: Record<string, string[]> = {};
        for (const c of cities) {
          const name = c.name || c.city || c.id;
          map[name] = Array.isArray(c.areas) && c.areas.length > 0 ? c.areas : ["City Center", "Main Market"];
        }
        setApprovedCities(cityNames);
        setApprovedAreas(map);

        setForm((prev) => {
          if (!cityNames.includes(prev.city)) {
            const firstCity = cityNames[0];
            return {
              ...prev,
              city: firstCity,
              area: map[firstCity]?.[0] || "",
            };
          }
          return prev;
        });
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const [agreementData, setAgreementData] = useState<AgreementSignatureData | null>(null);

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

  const updateServiceTurnaround = (id: string, hours: number) =>
    setServiceTurnarounds((prev) => ({ ...prev, [id]: hours }));

  const toggleDay = (day: string) =>
    setWeeklyOff((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  const areaOptions = useMemo(() => approvedAreas[form.city] ?? AREAS[form.city] ?? ["City Center", "Main Market"], [approvedAreas, form.city]);

  // Order Notification & Siren Permissions
  const [notifPermission, setNotifPermission] = useState<string>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
        if (perm === "granted") {
          toast.success("Order Notifications & High-Priority Alerts enabled! ✓");
        } else {
          toast.error("Notification permission was not granted. Please allow in browser/phone settings.");
        }
      } catch {
        toast.info("Notifications requested.");
      }
    } else {
      toast.success("Push Notification subsystem ready!");
    }
  };

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
  const [panData, setPanData] = useState<{
    panNumber: string;
    fullName: string;
    category: string;
    status: string;
    verifiedAt: string;
  } | null>(null);

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
        const entityChar = form.pan.charAt(3).toUpperCase();
        const categoryMap: Record<string, string> = {
          P: "Individual / Sole Proprietor",
          C: "Company (Private / Public)",
          F: "Partnership Firm / LLP",
          H: "Hindu Undivided Family (HUF)",
          A: "Association of Persons (AOP)",
          T: "Trust / Society",
        };
        const verifiedName = res.fullName || form.ownerName || "Registered Taxpayer";
        setPanData({
          panNumber: form.pan,
          fullName: verifiedName,
          category: categoryMap[entityChar] || "Individual / Sole Proprietor",
          status: "ACTIVE & OPERATIVE (Linked with Aadhaar)",
          verifiedAt: new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
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

    // Enforce Legal Merchant SLA Digital Signature
    if (!agreementData || !agreementData.signatureUrl || !agreementData.consentAgreed) {
      setStep(STEPS.length - 1);
      toast.error("Please review and digitally sign the Merchant SLA Agreement before submitting!");
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      return;
    }

    setBusy(true);
    try {
      const category =
        BUSINESS_TYPES.find((t) => t.id === form.businessType)?.category ?? "laundry";

      const customServices = services.map((name) => {
        const found = catalogServices.find((s) => s.id === name || s.name === name);
        return {
          name,
          price: servicePrices[name] ?? found?.price ?? 79,
          unit: found?.unit ?? "item",
          turnaroundHours: serviceTurnarounds[name] ?? found?.defaultHours ?? 24,
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
        agreementSigned: true,
        signatureUrl: agreementData.signatureUrl,
        signedAt: agreementData.signedAt,
        signedByName: agreementData.signerName,
        agreementVersion: agreementData.agreementVersion,
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

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={openLanguageModal}
              className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-900 shadow-2xs hover:bg-amber-100 active:scale-95 transition-all cursor-pointer"
            >
              <Globe className="size-3.5 text-amber-700" />
              <span className="uppercase">{language}</span>
            </button>

            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 border border-emerald-200">
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

                {/* Upgraded Official Income Tax Department / NSDL PAN Card Verification UI */}
                <div className="rounded-3xl border border-zinc-200 bg-white p-5 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                      <IdCard className="size-4 text-amber-500" />
                      <span>Business / Owner PAN Card *</span>
                    </label>
                    {panVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black text-emerald-800 border border-emerald-300 shadow-2xs">
                        <CheckCircle2 className="size-3.5" />
                        Income Tax Registry Verified ✓
                      </span>
                    )}
                  </div>

                  {panVerified && panData ? (
                    /* Official Government of India / NSDL PAN Card UI */
                    <div className="rounded-2xl border-2 border-slate-700/20 bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 text-white p-4.5 shadow-md relative overflow-hidden animate-fade-in">
                      {/* Hologram / Security watermark pattern */}
                      <div className="pointer-events-none absolute -right-10 -bottom-10 size-40 rounded-full bg-amber-400/10 blur-xl" />
                      <div className="pointer-events-none absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-400 via-emerald-400 to-sky-400" />

                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                        <div>
                          <div className="text-[10px] font-black tracking-wider text-amber-400 uppercase">
                            आयकर विभाग / INCOME TAX DEPARTMENT
                          </div>
                          <div className="text-[9px] font-semibold text-zinc-300">
                            भारत सरकार / GOVT. OF INDIA
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 rounded-full text-[9px] font-black text-emerald-300">
                          <ShieldCheck className="size-3 text-emerald-400" />
                          <span>NSDL / Protean Validated</span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div>
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
                            Permanent Account Number
                          </span>
                          <div className="text-xl font-mono font-black tracking-widest text-amber-300 mt-0.5">
                            {panData.panNumber.slice(0, 5)} {panData.panNumber.slice(5, 9)} {panData.panNumber.slice(9)}
                          </div>
                          <div className="text-xs font-bold text-white mt-1">
                            {panData.fullName}
                          </div>
                        </div>

                        <div className="space-y-1 text-right sm:text-right text-[10px]">
                          <div>
                            <span className="text-zinc-400 font-medium">Entity Type: </span>
                            <span className="font-bold text-zinc-200">{panData.category}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 font-medium">Status: </span>
                            <span className="font-bold text-emerald-400">Active & Operative ✓</span>
                          </div>
                          <div className="text-[9px] text-zinc-400 pt-0.5">
                            Verified on {panData.verifiedAt}
                          </div>
                        </div>
                      </div>

                      {/* Re-verify action */}
                      <div className="mt-3 pt-2.5 border-t border-white/10 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setPanVerified(false);
                            setPanData(null);
                          }}
                          className="text-[10px] font-bold text-zinc-400 hover:text-amber-300 underline cursor-pointer"
                        >
                          Change / Re-enter PAN Number
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* PAN Input Flow */
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={10}
                          value={form.pan}
                          onChange={upper("pan", 10)}
                          placeholder="ABCDE1234F"
                          className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs font-bold tracking-widest uppercase text-zinc-900 outline-none focus:border-amber-400 focus:bg-white transition-all shadow-2xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyPan}
                          disabled={verifyingPan || form.pan.length < 10}
                          className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-black hover:bg-amber-300 disabled:opacity-50 transition-all active:scale-95 shadow-sm cursor-pointer"
                        >
                          {verifyingPan ? <Loader2 className="size-3.5 animate-spin" /> : "Verify PAN"}
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-medium">
                        Standard 10-character PAN format: 5 letters (AAAAA), 4 digits (0000), 1 letter (A).
                      </p>
                    </div>
                  )}

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
                <p className="text-xs text-zinc-500 font-medium -mt-2 mb-3">
                  Select the specific garment services your store provides and configure custom prices (₹):
                </p>

                {/* Search Bar & Selected Items Counter */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={serviceSearchQuery}
                      onChange={(e) => setServiceSearchQuery(e.target.value)}
                      placeholder="Search items (e.g. T-Shirt Iron, Shirt Dry Clean, Blanket...)"
                      className="w-full rounded-2xl border border-zinc-200 bg-white pl-10 pr-4 py-2.5 text-xs font-bold text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/50 shadow-2xs"
                    />
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="rounded-xl bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-900 border border-amber-300 shadow-2xs">
                      {services.length} Selected
                    </span>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none">
                  {SERVICE_CATEGORY_TABS.map((tab) => {
                    const isActive = serviceCategoryTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setServiceCategoryTab(tab.id)}
                        className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${
                          isActive
                            ? "bg-zinc-900 text-white shadow-xs"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-200/60"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Grid of Itemized Services */}
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  {catalogServices
                    .filter((s) => {
                      if (serviceCategoryTab !== "all") {
                        const cat = (s as any).category;
                        const lower = (s.name || s.id).toLowerCase();
                        if (serviceCategoryTab === "iron" && !(cat === "iron" || lower.includes("iron") || lower.includes("press"))) return false;
                        if (serviceCategoryTab === "dry-clean" && !(cat === "dry-clean" || lower.includes("dry") || lower.includes("suit") || lower.includes("blazer") || lower.includes("jacket") || lower.includes("woolen") || lower.includes("sherwani"))) return false;
                        if (serviceCategoryTab === "wash" && !(cat === "wash" || lower.includes("wash") || lower.includes("fold") || lower.includes("towel"))) return false;
                        if (serviceCategoryTab === "premium" && !(cat === "premium" || lower.includes("saree") || lower.includes("silk") || lower.includes("lehenga") || lower.includes("gown"))) return false;
                        if (serviceCategoryTab === "shoe-care" && !(cat === "shoe-care" || lower.includes("shoe") || lower.includes("sneaker") || lower.includes("bag"))) return false;
                        if (serviceCategoryTab === "home-care" && !(cat === "home-care" || lower.includes("blanket") || lower.includes("curtain") || lower.includes("carpet") || lower.includes("rajai") || lower.includes("quilt"))) return false;
                        if (serviceCategoryTab === "express" && !(cat === "express" || lower.includes("express"))) return false;
                      }
                      if (serviceSearchQuery.trim()) {
                        const q = serviceSearchQuery.trim().toLowerCase();
                        const lower = (s.name || s.id).toLowerCase();
                        const desc = (s.desc || "").toLowerCase();
                        if (!lower.includes(q) && !desc.includes(q)) return false;
                      }
                      return true;
                    })
                    .map((s) => {
                      const isSelected = services.includes(s.id);
                      const currentPrice = servicePrices[s.id] ?? s.price;
                      const Icon = resolveServiceIcon(s);

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

                          {/* Editable Custom Price & Turnaround Input */}
                          {isSelected && (
                            <div className="mt-3.5 pt-3 border-t border-amber-200/80 space-y-3 animate-fade-in">
                              <div className="flex items-center justify-between gap-3">
                                <label className="text-xs font-black text-zinc-800 flex items-center gap-1">
                                  <span>Custom Rate:</span>
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

                              <div className="flex items-center justify-between gap-3 pt-1 border-t border-amber-200/50">
                                <label className="text-xs font-black text-zinc-800 flex items-center gap-1">
                                  <Clock className="size-3.5 text-amber-500" />
                                  <span>Turnaround Time:</span>
                                </label>
                                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-amber-300 shadow-2xs">
                                  <input
                                    type="number"
                                    min={1}
                                    max={168}
                                    value={serviceTurnarounds[s.id] ?? s.defaultHours ?? 24}
                                    onChange={(e) =>
                                      updateServiceTurnaround(
                                        s.id,
                                        Math.max(1, Number(e.target.value) || 1),
                                      )
                                    }
                                    placeholder="24"
                                    className="w-14 bg-transparent text-sm font-black text-zinc-900 outline-none text-right"
                                  />
                                  <span className="text-[11px] font-bold text-zinc-500">Hours (घंटे)</span>
                                </div>
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
                    options={approvedCities}
                    value={form.city}
                    onChange={(val) => {
                      set("city", val);
                      set("area", approvedAreas[val]?.[0] ?? "");
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

                {/* Merchant High-Priority Order Siren & Native Alert Permissions Card */}
                <div className="rounded-3xl border border-amber-300/80 bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-amber-100/40 p-5 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="size-4.5 text-amber-600 animate-pulse" />
                      <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wider">
                        High-Priority Order Siren & Permissions
                      </h4>
                    </div>
                    <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">
                      Background Ready
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-600 leading-snug">
                    QuickPress uses high-frequency alert chimes so your store never misses incoming customer orders even when phone screen is locked or in background.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="flex items-center justify-between rounded-xl bg-white/90 border border-amber-200 p-2.5 text-xs font-semibold text-zinc-800">
                      <span>Order Push Alerts</span>
                      {notifPermission === "granted" ? (
                        <span className="text-emerald-700 font-bold text-[11px]">Enabled ✓</span>
                      ) : (
                        <button
                          type="button"
                          onClick={requestNotificationPermission}
                          className="rounded-lg bg-amber-400 px-2 py-0.5 text-[10px] font-black text-black hover:bg-amber-300 transition-all cursor-pointer"
                        >
                          Enable 🔔
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/90 border border-amber-200 p-2.5 text-xs font-semibold text-zinc-800">
                      <span>Battery Saver Exemption</span>
                      <span className="text-emerald-700 font-bold text-[11px]">Active ✓</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={requestNotificationPermission}
                      className="flex items-center justify-center gap-1.5 rounded-2xl bg-white border border-amber-300 py-2.5 text-xs font-black text-zinc-900 hover:bg-amber-50 shadow-2xs active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <Bell className="size-3.5 text-amber-600" />
                      <span>{notifPermission === "granted" ? "Alerts Enabled ✓" : "Grant Alert Permission"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        testPartnerSoundAndVibration();
                        toast.success("Playing merchant order siren chime & vibration test!");
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-2xl bg-amber-400 py-2.5 text-xs font-black text-black hover:bg-amber-300 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <Volume2 className="size-3.5" />
                      <span>Test Order Siren Chime</span>
                    </button>
                  </div>
                </div>

                {/* Legal Merchant SLA Franchise Agreement & Digital Signature Pad */}
                <PartnerAgreementSignaturePad
                  ownerName={form.ownerName}
                  storeName={form.shopName}
                  aadhaar={form.aadhaar}
                  pan={form.pan}
                  city={form.city}
                  onSignatureConfirmed={setAgreementData}
                />
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
