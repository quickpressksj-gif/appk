import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Check,
  Camera,
  Calendar,
  Bike,
  Zap,
  Truck,
  Car,
  UploadCloud,
  FileCheck,
  CheckCircle2,
  Loader2,
  Building2,
  ShieldCheck,
  Clock,
  Phone,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ExternalLink,
  HelpCircle,
  IndianRupee,
  MapPin,
  Lock,
  UserCheck,
} from "lucide-react";
import { QuickPressCaptainLogo } from "../components/QuickPressCaptainLogo";
import { OnboardingStepper, type OnboardingStep } from "../components/OnboardingStepper";
import { readSession, writeSession } from "../api/core/session-store";
import { registerRider, fetchOnboardingStatus } from "../api/rider/rider-auth-api";
import { fetchRiderProfile } from "../api/rider/rider-profile-api";
import { useRiderContext } from "../context/RiderContext";
import type { AuthSession } from "@/shared/types";
import {
  fetchAllowedCities,
  checkPincodeServiceability,
  type CityTerritoryEntry,
} from "../api/core/maps-api";
import { playSuccessChime, triggerHaptic } from "../lib/captain-audio";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Captain Registration & Verification — QuickPress" },
      {
        name: "description",
        content: "Submit personal, vehicle, and document details for QuickPress Captain admin approval.",
      },
    ],
  }),
  component: CaptainOnboardingScreen,
});

const REGISTRATION_YEARS = Array.from({ length: 12 }, (_, i) => `${2026 - i}`);

const POPULAR_BANKS = [
  "State Bank of India",
  "Punjab National Bank",
  "HDFC Bank",
  "ICICI Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank of India",
  "Axis Bank",
  "Paytm Payments Bank",
  "Airtel Payments Bank",
  "Other Nationalized Bank",
];

export function CaptainOnboardingScreen() {
  const navigate = useNavigate();
  const { signIn, signOut } = useRiderContext();

  const [step, setStep] = useState<OnboardingStep>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Status view controls
  const [isUnderReview, setIsUnderReview] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [initialChecking, setInitialChecking] = useState(true);
  const [refreshingStatus, setRefreshingStatus] = useState(false);

  // Phone from storage or session
  const [phone, setPhone] = useState("9876543210");

  // Dynamic Territory Loader from Backend Database
  const [cityTerritoryMap, setCityTerritoryMap] = useState<
    Record<string, { state: string; pincodes: string[]; hubs: string[] }>
  >({});
  const [cities, setCities] = useState<string[]>([]);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeFeedback, setPincodeFeedback] = useState<string | null>(null);

  // STEP 1: Personal Details & Safety Contacts
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [city, setCity] = useState("Kasganj");
  const [residentialAddress, setResidentialAddress] = useState("");
  const [operatingPincodes, setOperatingPincodes] = useState<string[]>(["207123"]);
  const [selectedHub, setSelectedHub] = useState("Bilram Gate Central Hub");
  const [customPinInput, setCustomPinInput] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // STEP 2: Vehicle Details
  const [vehicleType, setVehicleType] = useState<"bike" | "scooter" | "ev" | "other">("bike");
  const [vehicleBrand, setVehicleBrand] = useState("Hero");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [regYear, setRegYear] = useState("2024");
  const [fuelType, setFuelType] = useState("Petrol");

  // STEP 3: Identity & Documents
  const [dlNumber, setDlNumber] = useState("");
  const [dlExpiry, setDlExpiry] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [pan, setPan] = useState("");
  const [docs, setDocs] = useState<{
    dl: boolean;
    rc: boolean;
    aadhaar: boolean;
    pan: boolean;
  }>({
    dl: true,
    rc: true,
    aadhaar: true,
    pan: false,
  });

  // STEP 4: Bank & Payout Details
  const [bankName, setBankName] = useState("State Bank of India");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [upiId, setUpiId] = useState("");

  // Live Check Function: Check if Admin has approved the rider
  const checkLiveApprovalStatus = useCallback(async (showToast = false) => {
    try {
      setRefreshingStatus(true);
      const sess = readSession("rider") || readSession();
      const currentPhone =
        (typeof window !== "undefined"
          ? window.sessionStorage.getItem("qp.rider.pendingPhone") ||
            window.localStorage.getItem("qp.rider.pendingPhone") ||
            sess?.account?.phone ||
            phone
          : phone) || "";
      const cleanDigits = currentPhone.replace(/\D/g, "").slice(-10);

      // Check live onboarding status from backend
      const onboarding = await fetchOnboardingStatus(cleanDigits || currentPhone).catch(() => null);
      const profile = await fetchRiderProfile().catch(() => null);

      // A rider is approved ONLY if isVerified is True AND status is active or approved:
      const isVerified = Boolean(
        (onboarding?.isVerified && (onboarding?.status === "active" || onboarding?.status === "approved")) ||
        (profile?.isVerified && (profile?.status === "active" || profile?.status === "approved"))
      );

      // A rider is in "pending review" if they have submitted registration and are awaiting Admin approval:
      const isPending = Boolean(
        !isVerified && (
          onboarding?.status === "pending" ||
          profile?.status === "pending" ||
          (profile?.isOnboarded && profile?.status !== "unregistered") ||
          (sess?.account?.isOnboarded && sess?.account?.status !== "unregistered")
        )
      );

      // A rider is "unregistered" if they have NOT submitted onboarding
      const isUnregistered = Boolean(
        !isPending && !isVerified && (
          onboarding?.status === "unregistered" ||
          profile?.status === "unregistered" ||
          (!profile?.isOnboarded && !onboarding?.ok)
        )
      );

      if (isVerified) {
        setIsApproved(true);
        setIsUnderReview(false);

        // Update local session
        const existing = readSession("rider") || readSession();
        if (existing && existing.account) {
          const updatedSession: AuthSession = {
            ...existing,
            account: {
              ...existing.account,
              isVerified: true,
              status: "active",
            },
          };
          writeSession(updatedSession, "rider");
        }

        playSuccessChime();
        if (showToast) {
          toast.success("🎉 Congratulations! Your Captain account is Approved!");
        }
      } else if (isPending && !isUnregistered) {
        // Show Under Review Screen
        setIsUnderReview(true);
        setIsApproved(false);
        if (showToast) {
          toast.info("Your application is still under review by Admin. Please wait.");
        }
      } else {
        // Show 4-Step Registration Form
        setIsUnderReview(false);
        setIsApproved(false);
        if (
          profile?.fullName &&
          profile.fullName !== "Delivery Partner" &&
          profile.fullName !== "Delivery Captain" &&
          !fullName
        ) {
          setFullName(profile.fullName);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setRefreshingStatus(false);
      setInitialChecking(false);
    }
  }, [phone, fullName]);

  // Initial Load: Check session, phone, cities, and profile status
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored =
        window.sessionStorage.getItem("qp.rider.pendingPhone") ||
        window.localStorage.getItem("qp.rider.pendingPhone");
      const sess = readSession("rider") || readSession();
      if (stored) {
        setPhone(stored.replace(/\D/g, "").slice(-10));
      } else if (sess?.account?.phone) {
        setPhone(sess.account.phone.replace(/\D/g, "").slice(-10));
      }
    }

    void checkLiveApprovalStatus();
  }, [checkLiveApprovalStatus]);

  // Polling interval when in "Under Review" state
  useEffect(() => {
    if (!isUnderReview || isApproved) return;
    const interval = setInterval(() => {
      void checkLiveApprovalStatus(false);
    }, 3500);
    return () => clearInterval(interval);
  }, [isUnderReview, isApproved, checkLiveApprovalStatus]);

  // Load allowed cities from backend
  useEffect(() => {
    let alive = true;
    fetchAllowedCities().then((res) => {
      if (!alive || !Array.isArray(res)) return;
      const map: Record<string, CityTerritoryEntry> = {};
      const names: string[] = [];
      for (const c of res) {
        const cName = c.name || c.city || c.id;
        if (!cName) continue;
        names.push(cName);
        const pins = Array.isArray(c.pincodes) ? c.pincodes : [];
        const hubList: string[] = [];
        if (Array.isArray(c.zones)) {
          for (const z of c.zones) {
            if (z.name) hubList.push(z.name);
            if (z.sector && !hubList.includes(z.sector)) hubList.push(z.sector);
          }
        }
        if (Array.isArray(c.pincodeDetails)) {
          for (const pd of c.pincodeDetails) {
            if (pd.areaName && !hubList.includes(pd.areaName)) hubList.push(pd.areaName);
          }
        }
        if (hubList.length === 0) {
          hubList.push(`${cName} Central Hub`, `${cName} Sector 1`);
        }
        map[cName] = {
          state: c.state || "Uttar Pradesh",
          pincodes: pins,
          hubs: hubList,
        };
      }
      setCityTerritoryMap(map);
      setCities(names);

      if (names.length > 0 && names[0]) {
        const defaultCity = names.includes("Kasganj") ? "Kasganj" : names[0];
        setCity((prev) => (names.includes(prev) ? prev : defaultCity));
        const first = map[defaultCity];
        if (first) {
          setOperatingPincodes((prev) => (prev.length > 0 ? prev : (first.pincodes ?? [])));
          setSelectedHub((prev) => prev || first.hubs[0] || "Central Hub");
        }
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBack = () => {
    setError(null);
    if (isUnderReview || isApproved) {
      signOut();
      void navigate({ to: "/auth" });
      return;
    }
    if (step > 1) {
      setStep((prev) => (prev - 1) as OnboardingStep);
    } else {
      void navigate({ to: "/auth" });
    }
  };

  const validateStep1 = () => {
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return false;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (emergencyContactPhone && emergencyContactPhone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit emergency contact phone number.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!vehicleNumber.trim()) {
      setError("Please enter your vehicle registration plate number (e.g. UP 87 AB 1234).");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (aadhaar && aadhaar.replace(/\D/g, "").length !== 12) {
      setError("Please enter a valid 12-digit Aadhaar number.");
      return false;
    }
    if (pan && pan.trim().length !== 10) {
      setError("Please enter a valid 10-character PAN card number.");
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!accountNumber.trim()) {
      setError("Please enter your bank account number.");
      return false;
    }
    if (confirmAccountNumber && confirmAccountNumber !== accountNumber) {
      setError("Bank account numbers do not match. Please re-check.");
      return false;
    }
    if (!ifsc.trim() || ifsc.trim().length < 9) {
      setError("Please enter a valid Bank IFSC code (e.g. SBIN0001234).");
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    setError(null);

    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!validateStep2()) return;
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!validateStep3()) return;
      setStep(4);
      return;
    }

    // Step 4: Final Submission
    if (!validateStep4()) return;
    setBusy(true);

    try {
      const cleanPhone = phone.replace(/\D/g, "").slice(-10);
      const riderId = `CP-${cleanPhone.slice(-4)}`;

      // Submit registration payload to backend
      await registerRider({
        mobile: `+91${cleanPhone}`,
        fullName,
        email,
        dob,
        gender,
        emergencyContact: `${emergencyContactName} (${emergencyContactPhone})`,
        address: residentialAddress,
        city,
        state: cityTerritoryMap[city]?.state || "Uttar Pradesh",
        pincode: operatingPincodes[0] || "207123",
        operatingPincodes,
        pincodes: operatingPincodes,
        sectors: selectedHub ? [selectedHub] : [],
        preferredArea: selectedHub || "",
        profilePhoto,
        // Vehicle
        vehicleType,
        vehicleBrand,
        vehicleModel,
        vehicleNumber: vehicleNumber.toUpperCase().trim(),
        regYear,
        fuelType,
        // Documents
        dlNumber: dlNumber.toUpperCase().trim(),
        dlExpiry,
        aadhaar: aadhaar.replace(/\D/g, ""),
        pan: pan.toUpperCase().trim(),
        // Bank
        bankName,
        accountNumber,
        ifsc: ifsc.toUpperCase().trim(),
        accountHolder: accountHolder || fullName,
        upiId,
      });

      // Save local pending session
      const existing = readSession("rider") || readSession();
      const authSession: AuthSession = {
        token: existing?.token || `qp_token_${Date.now()}_${cleanPhone}`,
        refreshToken: existing?.refreshToken || `qp_refresh_${Date.now()}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        account: {
          id: riderId,
          phone: `+91${cleanPhone}`,
          name: fullName || "Delivery Captain",
          email: email || `${cleanPhone}@rider.quickpress.in`,
          city: city || "Kasganj",
          avatarInitials: (fullName || "DC")
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
          role: "rider",
          isVerified: false,
          isOnboarded: true,
          status: "pending",
          linkedId: riderId,
        },
      };

      writeSession(authSession, "rider");
      signIn({
        riderId,
        phone: `+91${cleanPhone}`,
        fullName,
        isVerified: false,
        isOnboarded: true,
        isNewRider: false,
        token: authSession.token,
      });

      triggerHaptic([100, 50, 100]);
      setIsUnderReview(true);
      toast.success("Application submitted successfully! Now pending Admin approval.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  // --------------------------------------------------------------------------
  // RENDER: Initial Loading Screen
  // --------------------------------------------------------------------------
  if (initialChecking) {
    return (
      <main className="min-h-dvh bg-white flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <QuickPressCaptainLogo variant="stacked" size="lg" />
        <div className="mt-8 flex items-center gap-2 text-xs font-bold text-slate-500">
          <Loader2 className="size-4 animate-spin text-emerald-600" />
          <span>Verifying registration status...</span>
        </div>
      </main>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: Approved State (Admin approved -> Button to open Cockpit)
  // --------------------------------------------------------------------------
  if (isApproved) {
    return (
      <main className="min-h-dvh bg-slate-50 text-slate-900 flex flex-col justify-between p-5 max-w-md mx-auto select-none">
        <header className="flex items-center justify-between border-b border-slate-200 pb-3">
          <QuickPressCaptainLogo variant="inline" size="sm" />
          <span className="flex items-center gap-1 text-[11px] font-black uppercase text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full">
            <span className="size-2 rounded-full bg-emerald-600 animate-ping" />
            Approved
          </span>
        </header>

        <section className="my-auto py-8 text-center space-y-5 animate-in zoom-in-95 duration-300">
          <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 ring-8 ring-emerald-100">
            <CheckCircle2 className="size-10 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-950">
              Welcome Aboard, Captain!
            </h1>
            <p className="text-xs font-semibold text-slate-600 max-w-xs mx-auto">
              Your profile, vehicle details, and KYC have been verified and approved by the QuickPress Admin team.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white p-4 text-left space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-bold">Captain Name:</span>
              <span className="font-black text-slate-900">{fullName || "Delivery Captain"}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-bold">Mobile:</span>
              <span className="font-mono font-bold text-slate-900">+91 {phone}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-bold">Territory:</span>
              <span className="font-bold text-emerald-800">{city} Hub</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-bold">Duty Radar:</span>
              <span className="font-black text-emerald-600 uppercase">Ready for Dispatch</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void navigate({ to: "/dashboard" })}
            className="w-full rounded-2xl bg-emerald-600 py-3.5 px-4 text-sm font-black text-white hover:bg-emerald-700 active:scale-98 transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Enter Captain Cockpit &amp; Start Duty</span>
            <span className="text-base">→</span>
          </button>
        </section>

        <footer className="text-center text-[11px] text-slate-400">
          QuickPress Fleet Logistics &bull; Kasganj Hub Operations
        </footer>
      </main>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: Under Review Screen (Pending Admin Approval)
  // --------------------------------------------------------------------------
  if (isUnderReview) {
    return (
      <main className="min-h-dvh bg-slate-50 text-slate-900 flex flex-col justify-between p-5 max-w-md mx-auto select-none">
        {/* Top Header */}
        <header className="flex items-center justify-between border-b border-slate-200 pb-3">
          <QuickPressCaptainLogo variant="inline" size="sm" />
          <span className="flex items-center gap-1.5 text-[11px] font-black uppercase text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full">
            <span className="size-2 rounded-full bg-amber-500 animate-ping" />
            Under Review
          </span>
        </header>

        {/* Content Area */}
        <section className="flex-1 py-6 space-y-4 overflow-y-auto">
          {/* Main Status Hero */}
          <div className="text-center space-y-2">
            <div className="mx-auto flex size-18 items-center justify-center rounded-3xl bg-amber-500 text-white shadow-lg shadow-amber-500/20 ring-8 ring-amber-100">
              <Clock className="size-9 stroke-[2.5]" />
            </div>
            <h1 className="text-xl font-black text-slate-950">
              Application Under Review
            </h1>
            <p className="text-xs font-medium text-slate-600 max-w-xs mx-auto">
              Your details and documents have been submitted. The QuickPress Admin is verifying your application before unlocking your Captain Cockpit.
            </p>
          </div>

          {/* Live Polling Card */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-950">
                  Verification Status
                </span>
              </div>
              <button
                type="button"
                onClick={() => void checkLiveApprovalStatus(true)}
                disabled={refreshingStatus}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-white border border-amber-300 px-2.5 py-1 rounded-lg hover:bg-amber-100 active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className={`size-3 ${refreshingStatus ? "animate-spin" : ""}`} />
                <span>{refreshingStatus ? "Checking..." : "Refresh"}</span>
              </button>
            </div>
            <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
              Once the Admin clicks <strong>"Approve Rider"</strong> in the Admin Panel, this screen will automatically unlock.
            </p>
          </div>

          {/* 3-Step Verification Timeline */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Verification Steps
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5 text-emerald-700 font-bold">
                <div className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="size-3.5 stroke-[3]" />
                </div>
                <span>1. Personal &amp; Vehicle Details Submitted</span>
              </div>

              <div className="flex items-center gap-2.5 text-amber-800 font-bold">
                <div className="flex size-6 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <Clock className="size-3.5 stroke-[2.5]" />
                </div>
                <span>2. Driving License &amp; KYC Verification (In Review)</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-400 font-medium">
                <div className="flex size-6 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Lock className="size-3.5" />
                </div>
                <span>3. Admin Approval &amp; Cockpit Duty Activation</span>
              </div>
            </div>
          </div>

          {/* Submitted Summary Details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5 shadow-2xs text-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Submitted Profile
            </h3>
            <div className="divide-y divide-slate-100 space-y-2">
              <div className="flex justify-between pt-2">
                <span className="text-slate-500 font-medium">Registered Mobile:</span>
                <span className="font-mono font-bold text-slate-900">+91 {phone}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500 font-medium">Operating City:</span>
                <span className="font-bold text-slate-900">{city || "Kasganj"}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500 font-medium">Vehicle Plate:</span>
                <span className="font-mono font-bold text-slate-900 uppercase">
                  {vehicleNumber || "Submitted"}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500 font-medium">Payout Bank:</span>
                <span className="font-bold text-slate-900">{bankName || "SBI"}</span>
              </div>
            </div>
          </div>

          {/* Need Help / Support Box */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <HelpCircle className="size-4 text-slate-400" />
              <span className="font-bold">Need assistance?</span>
            </div>
            <a
              href="tel:18002008899"
              className="font-black text-emerald-700 hover:underline flex items-center gap-1"
            >
              <Phone className="size-3" />
              <span>Call Support</span>
            </a>
          </div>
        </section>

        {/* Footer Actions */}
        <footer className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleBack}
            className="text-slate-500 font-bold hover:text-slate-800 cursor-pointer"
          >
            ← Sign in with another number
          </button>
          <button
            type="button"
            onClick={() => void checkLiveApprovalStatus(true)}
            className="text-emerald-700 font-black hover:underline cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className="size-3" />
            <span>Refresh</span>
          </button>
        </footer>
      </main>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: 4-Step Onboarding Registration Form
  // --------------------------------------------------------------------------
  return (
    <main className="relative min-h-dvh bg-white text-slate-900 flex flex-col justify-between px-5 py-5 max-w-md mx-auto selection:bg-emerald-500 selection:text-white">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between border-b border-slate-100 pb-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="size-4.5" />
        </button>

        <QuickPressCaptainLogo variant="inline" size="sm" />

        <div className="size-9" />
      </header>

      {/* Stepper Progress Indicator */}
      <div className="pt-2">
        <OnboardingStepper currentStep={step} onStepClick={(s) => setStep(s)} />
      </div>

      {/* Main Form Area */}
      <section className="flex-1 py-4 overflow-y-auto">
        {/* ======================================================== */}
        {/* STEP 1: PERSONAL DETAILS & SAFETY CONTACTS               */}
        {/* ======================================================== */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-950">
                Captain Profile &amp; Territory
              </h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Complete your identity details to register as a QuickPress Captain
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setError(null);
                    setFullName(e.target.value);
                  }}
                  placeholder="Enter your full name as per Aadhaar"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-950 placeholder:text-slate-400 placeholder:font-normal outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                />
              </div>

              {/* Mobile Number (Prefilled & Verified) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Mobile Number
                </label>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs">
                  <span>+91 {phone}</span>
                  <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <Check className="size-3 stroke-[3]" /> Verified
                  </span>
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-950 placeholder:text-slate-400 placeholder:font-normal outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                />
              </div>

              {/* Date of Birth & Gender */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="text"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="DD / MM / YYYY"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-950 shadow-2xs outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-950 outline-hidden focus:border-emerald-600 shadow-2xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Emergency Contact Name & Phone */}
              <div className="rounded-xl border border-red-100 bg-red-50/40 p-3 space-y-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-red-950 flex items-center gap-1">
                  <Phone className="size-3 text-red-600" />
                  Emergency Safety Contact
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="Contact Name"
                    className="w-full rounded-lg border border-red-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-950 placeholder:text-slate-400 shadow-2xs outline-none focus:border-red-500"
                  />
                  <input
                    type="tel"
                    maxLength={10}
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="10-digit Phone"
                    className="w-full rounded-lg border border-red-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-950 placeholder:text-slate-400 shadow-2xs outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Residential Address */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Current Residential Address
                </label>
                <input
                  type="text"
                  value={residentialAddress}
                  onChange={(e) => setResidentialAddress(e.target.value)}
                  placeholder="House/Street/Colony, Kasganj"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-950 placeholder:text-slate-400 placeholder:font-normal outline-hidden focus:border-emerald-600 shadow-2xs"
                />
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Operating City
                  </label>
                  <select
                    value={city}
                    onChange={(e) => {
                      const newCity = e.target.value;
                      setCity(newCity);
                      const matched = cityTerritoryMap[newCity];
                      if (matched) {
                        setOperatingPincodes(matched.pincodes);
                        setSelectedHub(matched.hubs[0] || "Central Hub");
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-950 outline-hidden focus:border-emerald-600 shadow-2xs cursor-pointer"
                  >
                    {cities.length === 0 && <option value="Kasganj">Kasganj</option>}
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={cityTerritoryMap[city]?.state || "Uttar Pradesh"}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 shadow-2xs cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Primary Dispatch Hub / Sector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Primary Dispatch Hub / Area
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(cityTerritoryMap[city]?.hubs || [
                    "Bilram Gate Central Hub",
                    "Soron Gate Zone",
                    "Nadarrai Gate Hub",
                  ]).map((hub: string) => {
                    const isSelected = selectedHub === hub;
                    return (
                      <button
                        key={hub}
                        type="button"
                        onClick={() => setSelectedHub(hub)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-slate-900 text-white shadow-2xs"
                            : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {hub}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Profile Photo Upload */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Captain Profile Photo
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-3.5 text-center hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5"
                >
                  {profilePhoto ? (
                    <div className="relative size-14 rounded-full overflow-hidden border-2 border-emerald-500 shadow-sm">
                      <img
                        src={profilePhoto}
                        alt="Profile Preview"
                        className="size-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                      <Camera className="size-5" />
                    </div>
                  )}
                  <p className="text-xs font-black text-emerald-700">
                    {profilePhoto ? "Change Photo" : "Upload Face Photo"}
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: VEHICLE DETAILS                                  */}
        {/* ======================================================== */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-950">
                Vehicle Details
              </h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Vehicle details for delivery dispatch and verification
              </p>
            </div>

            {/* Select Vehicle Type */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-2">
                Select Vehicle Type
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setVehicleType("bike")}
                  className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3.5 transition-all cursor-pointer ${
                    vehicleType === "bike"
                      ? "border-emerald-600 bg-emerald-50/40 text-emerald-900 shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Bike className="size-6" />
                  <span className="text-xs font-bold">Motorcycle / Bike</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVehicleType("scooter")}
                  className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3.5 transition-all cursor-pointer ${
                    vehicleType === "scooter"
                      ? "border-emerald-600 bg-emerald-50/40 text-emerald-900 shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Bike className="size-6 rotate-6" />
                  <span className="text-xs font-bold">Scooter / Activa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVehicleType("ev")}
                  className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3.5 transition-all cursor-pointer ${
                    vehicleType === "ev"
                      ? "border-emerald-600 bg-emerald-50/40 text-emerald-900 shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Zap className="size-6" />
                  <span className="text-xs font-bold">EV Bike / Scooter</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVehicleType("other")}
                  className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3.5 transition-all cursor-pointer ${
                    vehicleType === "other"
                      ? "border-emerald-600 bg-emerald-50/40 text-emerald-900 shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Truck className="size-6" />
                  <span className="text-xs font-bold">Other / Commercial</span>
                </button>
              </div>
            </div>

            {/* Vehicle Form Fields */}
            <div className="space-y-3.5 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Vehicle Registration Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => {
                    setError(null);
                    setVehicleNumber(e.target.value.toUpperCase());
                  }}
                  placeholder="eg. UP 87 AB 1234"
                  className="w-full uppercase rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-black text-slate-950 placeholder:text-slate-400 placeholder:font-normal outline-hidden focus:border-emerald-600 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Vehicle Brand
                  </label>
                  <input
                    type="text"
                    value={vehicleBrand}
                    onChange={(e) => setVehicleBrand(e.target.value)}
                    placeholder="eg. Hero / Honda"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-950 placeholder:text-slate-400 shadow-2xs outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Vehicle Model
                  </label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="eg. Splendor / Activa"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-950 placeholder:text-slate-400 shadow-2xs outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Registration Year
                  </label>
                  <select
                    value={regYear}
                    onChange={(e) => setRegYear(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-950 outline-hidden focus:border-emerald-600 shadow-2xs cursor-pointer"
                  >
                    {REGISTRATION_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Fuel Type
                  </label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-950 outline-hidden focus:border-emerald-600 shadow-2xs cursor-pointer"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Electric">Electric (EV)</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: VERIFY YOUR DOCUMENTS & IDENTITY                 */}
        {/* ======================================================== */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-950">
                Identity &amp; License Details
              </h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Required for official fleet compliance and admin approval
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Driving License Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Driving License (DL) Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={dlNumber}
                  onChange={(e) => {
                    setError(null);
                    setDlNumber(e.target.value.toUpperCase());
                  }}
                  placeholder="eg. UP87 2023 0012345"
                  className="w-full uppercase rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-black text-slate-950 placeholder:text-slate-400 placeholder:font-normal outline-hidden focus:border-emerald-600 shadow-2xs"
                />
              </div>

              {/* DL Expiry */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  DL Expiry Date
                </label>
                <input
                  type="text"
                  value={dlExpiry}
                  onChange={(e) => setDlExpiry(e.target.value)}
                  placeholder="DD / MM / YYYY"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-950 placeholder:text-slate-400 shadow-2xs outline-none focus:border-emerald-600"
                />
              </div>

              {/* Aadhaar Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Aadhaar Card Number (12-digit) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={14}
                  value={aadhaar}
                  onChange={(e) => {
                    setError(null);
                    const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
                    // Format with spaces XXXX XXXX XXXX
                    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
                    setAadhaar(formatted);
                  }}
                  placeholder="XXXX XXXX XXXX"
                  className="w-full font-mono rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-950 placeholder:text-slate-400 shadow-2xs outline-none focus:border-emerald-600"
                />
              </div>

              {/* PAN Card Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  PAN Card Number (10-digit)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={pan}
                  onChange={(e) => {
                    setError(null);
                    setPan(e.target.value.toUpperCase().slice(0, 10));
                  }}
                  placeholder="eg. ABCDE1234F"
                  className="w-full font-mono uppercase rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-950 placeholder:text-slate-400 shadow-2xs outline-none focus:border-emerald-600"
                />
              </div>

              {/* Document Confirmation Badges */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-500">
                  Document Check Readiness
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-white p-2 rounded-lg border border-slate-200">
                    <FileCheck className="size-3.5" />
                    <span>DL Ready</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-white p-2 rounded-lg border border-slate-200">
                    <FileCheck className="size-3.5" />
                    <span>Aadhaar Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 4: BANK & PAYOUT DETAILS                            */}
        {/* ======================================================== */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-950">
                Bank &amp; Weekly Payout Details
              </h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Trip earnings and bonuses will be transferred directly to this bank account
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Select Bank */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-950 outline-hidden focus:border-emerald-600 shadow-2xs cursor-pointer"
                >
                  {POPULAR_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Holder Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder={fullName || "Name as printed on bank passbook"}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-950 placeholder:text-slate-400 outline-hidden focus:border-emerald-600 shadow-2xs"
                />
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Bank Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => {
                    setError(null);
                    setAccountNumber(e.target.value.replace(/\D/g, ""));
                  }}
                  placeholder="Enter bank account number"
                  className="w-full font-mono rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-950 placeholder:text-slate-400 outline-hidden focus:border-emerald-600 shadow-2xs"
                />
              </div>

              {/* Confirm Account Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Confirm Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={confirmAccountNumber}
                  onChange={(e) => {
                    setError(null);
                    setConfirmAccountNumber(e.target.value.replace(/\D/g, ""));
                  }}
                  placeholder="Re-enter bank account number"
                  className="w-full font-mono rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-950 placeholder:text-slate-400 outline-hidden focus:border-emerald-600 shadow-2xs"
                />
              </div>

              {/* IFSC Code */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Bank IFSC Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={ifsc}
                  onChange={(e) => {
                    setError(null);
                    setIfsc(e.target.value.toUpperCase());
                  }}
                  placeholder="eg. SBIN0001234"
                  className="w-full font-mono uppercase rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-black text-slate-950 placeholder:text-slate-400 outline-hidden focus:border-emerald-600 shadow-2xs"
                />
              </div>

              {/* UPI ID (Optional) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  UPI ID for Instant Payouts (Optional)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="eg. yourname@okhdfcbank"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-950 placeholder:text-slate-400 outline-hidden focus:border-emerald-600 shadow-2xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Inline Error Display */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* Footer Navigation Bar */}
      <footer className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBack}
          disabled={busy}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
        >
          Back
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={busy}
          className="flex-1 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-black text-white hover:bg-emerald-700 active:scale-98 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Submitting Application...</span>
            </>
          ) : step === 4 ? (
            <>
              <ShieldCheck className="size-4" />
              <span>Submit Registration for Verification</span>
            </>
          ) : (
            <span>Continue to Step {step + 1} →</span>
          )}
        </button>
      </footer>
    </main>
  );
}
