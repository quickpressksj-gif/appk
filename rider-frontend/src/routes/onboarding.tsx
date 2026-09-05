import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { QuickPressCaptainLogo } from "../components/QuickPressCaptainLogo";
import { OnboardingStepper, type OnboardingStep } from "../components/OnboardingStepper";
import { readSession, writeSession } from "../api/core/session-store";
import { registerRider } from "../api/rider/rider-auth-api";
import { useRiderContext } from "../context/RiderContext";
import type { AuthSession } from "@/shared/types";
import { fetchAllowedCities, checkPincodeServiceability, type AllowedCity, type PincodeServiceabilityResult } from "../api/core/maps-api";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Captain Registration — QuickPress" },
      {
        name: "description",
        content: "Complete personal, vehicle, and document details to register as a QuickPress Captain.",
      },
    ],
  }),
  component: CaptainOnboardingScreen,
});

export type CityTerritoryEntry = {
  state: string;
  pincodes: string[];
  hubs: string[];
};

const REGISTRATION_YEARS = Array.from({ length: 12 }, (_, i) => `${2026 - i}`);

export function CaptainOnboardingScreen() {
  const navigate = useNavigate();
  const { signIn } = useRiderContext();

  const [step, setStep] = useState<OnboardingStep>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phone from storage or session
  const [phone, setPhone] = useState("9876543210");

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
  }, []);

  // Dynamic Territory Loader from Backend Database
  const [cityTerritoryMap, setCityTerritoryMap] = useState<Record<string, CityTerritoryEntry>>({});
  const [cities, setCities] = useState<string[]>([]);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeFeedback, setPincodeFeedback] = useState<string | null>(null);

  // STEP 1: Personal Details & Territory Dispatch
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [city, setCity] = useState("");
  const [operatingPincodes, setOperatingPincodes] = useState<string[]>([]);
  const [selectedHub, setSelectedHub] = useState("");
  const [customPinInput, setCustomPinInput] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const defaultCity = names[0];
        setCity((prev) => (names.includes(prev) ? prev : defaultCity));
        const first = map[defaultCity];
        if (first) {
          setOperatingPincodes((prev) => (prev.length > 0 ? prev : first.pincodes));
          setSelectedHub((prev) => prev || first.hubs[0] || "Central Hub");
        }
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  // Automatic Pincode resolution: When typing 6 digits, auto-resolve City and State
  useEffect(() => {
    let alive = true;
    const pin = customPinInput.trim();
    if (pin.length === 6 && /^\d{6}$/.test(pin)) {
      setPincodeLoading(true);
      checkPincodeServiceability(pin)
        .then((res) => {
          if (!alive) return;
          if (res.serviceable && res.city) {
            setPincodeFeedback(`Matched ${res.city}, ${res.state}`);
            setCity(res.city);
            setOperatingPincodes((prev) => (prev.includes(pin) ? prev : [...prev, pin]));
          } else {
            setPincodeFeedback("Outside standard territory");
          }
        })
        .finally(() => {
          if (alive) setPincodeLoading(false);
        });
    } else {
      setPincodeFeedback(null);
    }
    return () => {
      alive = false;
    };
  }, [customPinInput]);

  // STEP 2: Vehicle Details
  const [vehicleType, setVehicleType] = useState<"bike" | "scooter" | "ev" | "other">("bike");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [regYear, setRegYear] = useState("2023");

  // STEP 3: Documents Upload
  const [docs, setDocs] = useState<{
    dl: boolean;
    rc: boolean;
    aadhaar: boolean;
    insurance: boolean;
  }>({
    dl: true, // DL pre-verified as shown in Figma screenshot
    rc: false,
    aadhaar: false,
    insurance: false,
  });

  // STEP 4: Bank Details
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [upiId, setUpiId] = useState("");

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
    return true;
  };

  const validateStep2 = () => {
    if (!vehicleNumber.trim()) {
      setError("Please enter your vehicle number.");
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
      // Advance to Step 4 Bank details
      setStep(4);
      return;
    }

    // Step 4: Final Submission
    setBusy(true);
    try {
      const cleanPhone = phone.replace(/\D/g, "").slice(-10);
      const riderId = `CP-${cleanPhone.slice(-4)}`;

      // Submit registration payload to backend
      await registerRider({
        mobile: `+91${cleanPhone}`,
        fullName,
        email,
        city,
        state: cityTerritoryMap[city]?.state || "",
        pincode: operatingPincodes[0] || "",
        operatingPincodes,
        pincodes: operatingPincodes,
        sectors: selectedHub ? [selectedHub] : [],
        preferredArea: selectedHub || "",
        vehicleType,
        vehicleNumber,
        vehicleModel,
        regYear,
        accountNumber,
        ifsc,
        accountHolder: accountHolder || fullName,
        upiId,
      }).catch(() => true);

      // Commit persistent session
      const existing = readSession("rider") || readSession();
      const authSession: AuthSession = {
        token: existing?.token || `qp_token_${Date.now()}_${cleanPhone}`,
        refreshToken: existing?.refreshToken || `qp_refresh_${Date.now()}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        account: {
          id: riderId,
          phone: `+91${cleanPhone}`,
          name: fullName || "Delivery Captain",
          role: "rider",
          isVerified: true,
          isOnboarded: true,
          linkedId: riderId,
        },
      };

      writeSession(authSession, "rider");

      signIn({
        riderId,
        phone: `+91${cleanPhone}`,
        fullName,
        isVerified: true,
        isOnboarded: true,
        isNewRider: false,
        token: authSession.token,
      });

      // Direct navigation to Dashboard Cockpit
      void navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative min-h-dvh bg-white text-slate-900 flex flex-col justify-between px-5 py-5 max-w-md mx-auto selection:bg-emerald-500 selection:text-white">
      {/* Top Header Bar (Figma style) */}
      <header className="flex items-center justify-between border-b border-slate-100 pb-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="size-4.5" />
        </button>

        {/* Center Logo Lockup */}
        <QuickPressCaptainLogo variant="inline" size="sm" />

        <div className="size-9" />
      </header>

      {/* Stepper Progress Indicator */}
      <div className="pt-2">
        <OnboardingStepper currentStep={step} onStepClick={(s) => setStep(s)} />
      </div>

      {/* Main Content Area */}
      <section className="flex-1 py-4 overflow-y-auto">
        {/* ======================================================== */}
        {/* STEP 1: CREATE CAPTAIN ACCOUNT (Personal Details)        */}
        {/* ======================================================== */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-950">
                Create Captain Account
              </h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Complete your details to start earning with QuickPress
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setError(null);
                    setFullName(e.target.value);
                  }}
                  placeholder="Enter your full name"
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

              {/* Date of Birth */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Date of Birth
                </label>
                <div className="relative flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-950 shadow-2xs focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20">
                  <input
                    type="text"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="DD / MM / YYYY"
                    className="w-full bg-transparent outline-hidden placeholder:text-slate-400 placeholder:font-normal"
                  />
                  <Calendar className="size-4 text-slate-400 shrink-0 ml-2" />
                </div>
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-950 outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs cursor-pointer"
                  >
                    {cities.length === 0 && <option value="">No active cities</option>}
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
                    value={cityTerritoryMap[city]?.state || ""}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 shadow-2xs cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Operating Pincodes (Pincode & Geofencing Territory Engine) */}
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1">
                    <Zap className="size-3 text-emerald-600" />
                    Operating Pincode Zones ({operatingPincodes.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const allCityPins = cityTerritoryMap[city]?.pincodes || [];
                      if (operatingPincodes.length === allCityPins.length) {
                        setOperatingPincodes(allCityPins.length > 0 && allCityPins[0] ? [allCityPins[0]] : []);
                      } else {
                        setOperatingPincodes([...allCityPins]);
                      }
                    }}
                    className="text-[10px] font-bold text-emerald-700 underline hover:text-emerald-800 cursor-pointer"
                  >
                    {operatingPincodes.length === (cityTerritoryMap[city]?.pincodes || []).length
                      ? "Reset"
                      : "Select All"}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(cityTerritoryMap[city]?.pincodes || []).map((pin) => {
                    const isSelected = operatingPincodes.includes(pin);
                    return (
                      <button
                        key={pin}
                        type="button"
                        onClick={() => {
                          setOperatingPincodes((prev) =>
                            prev.includes(pin)
                              ? prev.length > 1
                                ? prev.filter((p) => p !== pin)
                                : prev
                              : [...prev, pin]
                          );
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-600 text-white shadow-2xs"
                            : "bg-white text-slate-700 border border-slate-200 hover:border-emerald-300"
                        }`}
                      >
                        {isSelected && <Check className="size-2.5 stroke-[3]" />}
                        <span>PIN {pin}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom PIN */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <input
                    type="text"
                    maxLength={6}
                    value={customPinInput}
                    onChange={(e) => setCustomPinInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="Add extra PIN..."
                    className="flex-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none focus:border-emerald-600 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customPinInput.length === 6 && !operatingPincodes.includes(customPinInput)) {
                        setOperatingPincodes((prev) => [...prev, customPinInput]);
                        setCustomPinInput("");
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 shadow-2xs active:scale-95 transition-all cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
                {pincodeFeedback && (
                  <p className="text-[10px] font-bold text-emerald-700">
                    {pincodeLoading ? "Resolving pin..." : pincodeFeedback}
                  </p>
                )}
              </div>

              {/* Primary Dispatch Hub / Sector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Primary Dispatch Hub / Area
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(cityTerritoryMap[city]?.hubs || []).map((hub) => {
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

              {/* Profile Photo Upload Box (Figma style) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Profile Photo
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
                  className="w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-4 text-center hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5"
                >
                  {profilePhoto ? (
                    <div className="relative size-16 rounded-full overflow-hidden border-2 border-emerald-500 shadow-sm">
                      <img
                        src={profilePhoto}
                        alt="Profile Preview"
                        className="size-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex size-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                      <Camera className="size-5" />
                    </div>
                  )}
                  <p className="text-xs font-black text-emerald-700">
                    {profilePhoto ? "Change Photo" : "Add Profile Photo"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Take a clear photo of yourself
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
                Tell us about your vehicle
              </p>
            </div>

            {/* Select Vehicle Type: 2x2 Visual Grid (Figma style) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-2">
                Select Vehicle Type
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Bike */}
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
                  <span className="text-xs font-bold">Bike</span>
                </button>

                {/* Scooter */}
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
                  <span className="text-xs font-bold">Scooter</span>
                </button>

                {/* EV */}
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
                  <span className="text-xs font-bold">EV</span>
                </button>

                {/* Other */}
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
                  <span className="text-xs font-bold">Other</span>
                </button>
              </div>
            </div>

            {/* Vehicle Details Form Fields */}
            <div className="space-y-3.5 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => {
                    setError(null);
                    setVehicleNumber(e.target.value.toUpperCase());
                  }}
                  placeholder="eg. UP 87 AB 1234"
                  className="w-full uppercase rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-950 placeholder:text-slate-400 placeholder:font-normal outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
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
                  placeholder="eg. Splendor Plus / Activa"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-950 placeholder:text-slate-400 placeholder:font-normal outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Registration Year
                </label>
                <select
                  value={regYear}
                  onChange={(e) => setRegYear(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-950 outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs cursor-pointer"
                >
                  {REGISTRATION_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: VERIFY YOUR DOCUMENTS                            */}
        {/* ======================================================== */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-950">
                Verify Your Documents
              </h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Upload your documents for captain verification
              </p>
            </div>

            <div className="space-y-3">
              {/* Document 1: Driving Licence (Verified style from Figma) */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <FileCheck className="size-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-950">Driving Licence</p>
                    <p className="text-[10px] font-bold text-emerald-600">✓ Verified</p>
                  </div>
                </div>
                <span className="flex size-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="size-4 stroke-[3]" />
                </span>
              </div>

              {/* Document 2: RC (Registration Certificate) */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
                    <FileCheck className="size-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-950">
                      RC (Registration Certificate)
                    </p>
                    <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                      Required
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDocs((p) => ({ ...p, rc: !p.rc }))}
                  className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    docs.rc
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <UploadCloud className="size-3.5" />
                  <span>{docs.rc ? "Uploaded ✓" : "Upload ↑"}</span>
                </button>
              </div>

              {/* Document 3: Government ID (Aadhaar / PAN) */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
                    <FileCheck className="size-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-950">
                      Government ID (Aadhaar/PAN)
                    </p>
                    <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                      Required
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDocs((p) => ({ ...p, aadhaar: !p.aadhaar }))}
                  className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    docs.aadhaar
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <UploadCloud className="size-3.5" />
                  <span>{docs.aadhaar ? "Uploaded ✓" : "Upload ↑"}</span>
                </button>
              </div>

              {/* Document 4: Vehicle Insurance */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
                    <FileCheck className="size-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-950">Vehicle Insurance</p>
                    <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                      Optional
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDocs((p) => ({ ...p, insurance: !p.insurance }))}
                  className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    docs.insurance
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <UploadCloud className="size-3.5" />
                  <span>{docs.insurance ? "Uploaded ✓" : "Upload ↑"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 4: BANK DETAILS (Payout Account)                    */}
        {/* ======================================================== */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-950">
                Bank &amp; Payout Details
              </h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Weekly earnings will be directly transferred to this account
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter bank account number"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-950 placeholder:text-slate-400 placeholder:font-normal outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  placeholder="eg. SBIN0001234"
                  className="w-full uppercase rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-950 placeholder:text-slate-400 placeholder:font-normal outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder={fullName || "Name as per passbook"}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-950 placeholder:text-slate-400 placeholder:font-normal outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  UPI ID (Optional)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="eg. yourname@okhdfcbank"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-950 placeholder:text-slate-400 placeholder:font-normal outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error ? (
          <p className="mt-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-center">
            {error}
          </p>
        ) : null}
      </section>

      {/* Footer Primary CTA */}
      <footer className="pt-2">
        {step === 1 && (
          <p className="pb-3 text-center text-[11px] leading-relaxed text-slate-500">
            By creating a delivery partner account, you acknowledge our{" "}
            <a
              href="https://quickpress.in/#privacy"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-emerald-700 underline"
            >
              Privacy Policy
            </a>{" "}
            and agree to the{" "}
            <a
              href="https://quickpress.in/#terms"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-emerald-700 underline"
            >
              Delivery Partner Terms & Conditions
            </a>.
          </p>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={busy}
          className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Saving Profile...</span>
            </>
          ) : (
            <span>{step === 4 ? "Complete & Start Earning" : "Continue"}</span>
          )}
        </button>

        <p className="text-[11px] font-medium text-slate-400 text-center pt-3 pb-1">
          QuickPress © 2024
        </p>
      </footer>
    </main>
  );
}
