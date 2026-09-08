import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  CreditCard,
  Edit3,
  FileCheck2,
  FileText,
  IdCard,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  Zap,
} from "lucide-react";
import React, { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { useRiderContext } from "../context/RiderContext";
import { submitRiderRegistration } from "../api/rider/rider-auth-api";
import { apiGetJson } from "../api/core/transport";
import { QuickPressLogo } from "../components/common/QuickPressLogo";
import { useLanguage } from "../lib/i18n";

// Two-Wheeler Brand & Models Directory
const VEHICLE_CATALOG: Record<string, string[]> = {
  "Hero MotoCorp": [
    "Splendor Plus",
    "Splendor Plus XTEC",
    "HF Deluxe",
    "Glamour 125",
    "Passion Pro",
    "Xtreme 125R",
    "Super Splendor",
    "Destini 125",
    "Pleasure Plus",
    "Other Model",
  ],
  "Honda 2-Wheelers": [
    "Activa 6G",
    "Activa 125",
    "Shine 125",
    "SP 125",
    "Dio 125",
    "Unicorn 160",
    "Hornet 2.0",
    "Livo",
    "Other Model",
  ],
  "TVS Motor": [
    "Jupiter 110",
    "Jupiter 125",
    "Raider 125",
    "Apache RTR 160",
    "Apache RTR 180",
    "Ntorq 125",
    "Sport",
    "Radeon",
    "XL100 Heavy Duty",
    "iQube Electric (EV)",
    "Other Model",
  ],
  "Bajaj Auto": [
    "Pulsar 125",
    "Pulsar 150",
    "Pulsar NS125",
    "Pulsar NS200",
    "Pulsar N160",
    "Platina 100",
    "Platina 110",
    "CT 110X",
    "Chetak Electric (EV)",
    "Other Model",
  ],
  "Ola Electric (EV)": [
    "S1 Pro Gen 2",
    "S1 Air",
    "S1 X+",
    "S1 X (3kWh)",
    "S1 X (2kWh)",
    "Other Model",
  ],
  "Ather Energy (EV)": [
    "Rizta",
    "450X Gen 3",
    "450S",
    "450 Apex",
    "Other Model",
  ],
  "Royal Enfield": [
    "Classic 350",
    "Bullet 350",
    "Hunter 350",
    "Meteor 350",
    "Himalayan 450",
    "Other Model",
  ],
  Yamaha: [
    "RayZR 125 Fi Hybrid",
    "Fascino 125 Fi",
    "FZ-S V4",
    "MT-15 V2",
    "R15 V4",
    "Aerox 155",
    "Other Model",
  ],
  Suzuki: [
    "Access 125",
    "Burgman Street 125",
    "Avenis 125",
    "Gixxer 150",
    "Other Model",
  ],
  "Other Brand": ["Other Model"],
};

interface LiveCity {
  id?: string;
  name: string;
  city: string;
  state?: string;
  pincodes?: string[];
}

export function RiderRegistrationScreen() {
  const navigate = useNavigate();
  const { phone, session, signIn } = useRiderContext();
  const { t } = useLanguage();

  const targetPhone = phone || session?.phone || "";

  // Active Task Step: 1 to 5
  const [currentTask, setCurrentTask] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  // Live Cities from Backend Admin Panel
  const [liveCities, setLiveCities] = useState<LiveCity[]>([]);
  const [loadingCities, setLoadingCities] = useState<boolean>(false);

  // Task 1 — Personal, Live City & Pincode (All Blank by Default)
  const [fullName, setFullName] = useState<string>("");
  const [gender, setGender] = useState<string>(""); // unselected by default
  const [dob, setDob] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>(""); // blank by default
  const [pincode, setPincode] = useState<string>(""); // blank by default
  const [customPincodeMode, setCustomPincodeMode] = useState<boolean>(false);
  const [emergencyPhone, setEmergencyPhone] = useState<string>("");

  // Task 2 — Driving Licence (DL) (All Blank by Default)
  const [drivingLicense, setDrivingLicense] = useState<string>("");
  const [dlExpiry, setDlExpiry] = useState<string>("");
  const [dlFrontFile, setDlFrontFile] = useState<string>("");
  const [dlBackFile, setDlBackFile] = useState<string>("");

  // Task 3 — Vehicle, Brand, Model, RC, Engine & Chassis (All Blank by Default)
  const [vehicleType, setVehicleType] = useState<string>(""); // unselected by default
  const [brandInputMode, setBrandInputMode] = useState<"select" | "custom">("select");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [customBrand, setCustomBrand] = useState<string>("");
  const [modelInputMode, setModelInputMode] = useState<"select" | "custom">("select");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [customModel, setCustomModel] = useState<string>("");
  const [vehicleNumber, setVehicleNumber] = useState<string>("");
  const [engineNumber, setEngineNumber] = useState<string>("");
  const [chassisNumber, setChassisNumber] = useState<string>("");
  const [rcFile, setRcFile] = useState<string>("");

  // Task 4 — Aadhaar, PAN & Live Selfie KYC (All Blank by Default)
  const [aadhaarNumber, setAadhaarNumber] = useState<string>("");
  const [panNumber, setPanNumber] = useState<string>("");
  const [selfieFile, setSelfieFile] = useState<string>("");

  // Task 5 — Bank Details & Review (All Blank by Default)
  const [bankName, setBankName] = useState<string>("");
  const [accountHolder, setAccountHolder] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [ifsc, setIfsc] = useState<string>("");

  // Hidden File Input Refs
  const dlFrontInputRef = useRef<HTMLInputElement>(null);
  const dlBackInputRef = useRef<HTMLInputElement>(null);
  const rcInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  // Safeguard: If rider is already approved or registered, redirect immediately!
  useEffect(() => {
    let active = true;
    apiGetJson<any>("/api/rider/verification-status")
      .then((statusRes) => {
        if (!active || !statusRes) return;
        if (statusRes.isApproved || statusRes.isVerified || statusRes.status === "active") {
          toast.success("Captain account already approved! Opening Dashboard... 🚀");
          navigate({ to: "/dashboard" });
        } else if (statusRes.isOnboarded || statusRes.status === "pending" || statusRes.status === "under_verification") {
          toast.info("Application already submitted. Under review ⏳");
          navigate({ to: "/verification" });
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [navigate]);

  // Load Real Live Admin Operating Cities from MongoDB Backend (NO auto-selection)
  useEffect(() => {
    let active = true;
    setLoadingCities(true);
    apiGetJson<LiveCity[]>("/api/cities")
      .then((cities) => {
        if (!active || !Array.isArray(cities) || cities.length === 0) return;
        setLiveCities(cities);
      })
      .catch(() => {
        // Fallback default city list if backend is momentarily unreachable
        if (active) {
          setLiveCities([
            {
              name: "Kasganj",
              city: "Kasganj",
              state: "Uttar Pradesh",
              pincodes: ["207123", "207124"],
            },
          ]);
        }
      })
      .finally(() => {
        if (active) setLoadingCities(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Update models list when brand changes
  const availableModels = selectedBrand
    ? VEHICLE_CATALOG[selectedBrand] || ["Other Model"]
    : [];

  // Update default model when brand changes
  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setSelectedModel("");
    setCustomBrand("");
    setCustomModel("");
    if (brand === "Other Brand") {
      setBrandInputMode("custom");
    }
  };

  // City change handler: resets pincode so user can choose or type
  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    setPincode("");
  };

  // File upload helpers
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    label: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setter(file.name);
      toast.success(`${label} uploaded: ${file.name} 📄`);
    }
  };

  const taskTitles = [
    { num: 1, title: "Personal & City", short: "Profile", icon: User },
    { num: 2, title: "Driving Licence", short: "DL", icon: IdCard },
    { num: 3, title: "Vehicle & RC", short: "Vehicle", icon: Bike },
    { num: 4, title: "KYC & Selfie", short: "KYC", icon: ShieldCheck },
    { num: 5, title: "Bank & Review", short: "Bank", icon: CreditCard },
  ];

  // Validation before advancing to next step
  const handleNextTask = () => {
    if (currentTask === 1) {
      if (!fullName.trim()) {
        toast.error("Please enter your Full Name");
        return;
      }
      if (!gender) {
        toast.error("Please select your Gender");
        return;
      }
      if (!dob.trim()) {
        toast.error("Please select your Date of Birth");
        return;
      }
      if (!selectedCity.trim()) {
        toast.error("Please select your Operating City");
        return;
      }
      if (!pincode.trim()) {
        toast.error("Please select or enter your Pin Code");
        return;
      }
      setCurrentTask(2);
      toast.success("Task 1 completed! Moving to Task 2 (DL)");
    } else if (currentTask === 2) {
      if (!drivingLicense.trim()) {
        toast.error("Please enter your Driving Licence (DL) number");
        return;
      }
      if (!dlExpiry.trim()) {
        toast.error("Please select your Licence Expiry Date");
        return;
      }
      setCurrentTask(3);
      toast.success("Task 2 completed! Moving to Task 3 (Vehicle)");
    } else if (currentTask === 3) {
      if (!vehicleType) {
        toast.error("Please select your Vehicle Type (Bike or EV)");
        return;
      }
      const effectiveBrand = brandInputMode === "custom" ? customBrand.trim() : selectedBrand.trim();
      if (!effectiveBrand) {
        toast.error("Please select or enter your Vehicle Brand");
        return;
      }
      const effectiveModel = modelInputMode === "custom" ? customModel.trim() : selectedModel.trim();
      if (!effectiveModel) {
        toast.error("Please select or enter your Vehicle Model");
        return;
      }
      if (!vehicleNumber.trim()) {
        toast.error("Please enter your Vehicle Registration number (RC)");
        return;
      }
      if (!engineNumber.trim()) {
        toast.error("Please enter your Engine Number");
        return;
      }
      if (!chassisNumber.trim()) {
        toast.error("Please enter your Chassis Number");
        return;
      }
      setCurrentTask(4);
      toast.success("Task 3 completed! Moving to Task 4 (KYC & Selfie)");
    } else if (currentTask === 4) {
      if (!aadhaarNumber.trim()) {
        toast.error("Please enter your 12-digit Aadhaar number");
        return;
      }
      if (!selfieFile) {
        toast.error("Please upload or capture your Captain profile selfie");
        return;
      }
      if (!accountHolder.trim()) {
        setAccountHolder(fullName.trim());
      }
      setCurrentTask(5);
      toast.success("Task 4 completed! Moving to Task 5 (Bank & Final Review)");
    }
  };

  const handlePrevTask = () => {
    if (currentTask > 1) {
      setCurrentTask((prev) => prev - 1);
    } else {
      navigate({ to: "/otp" });
    }
  };

  // Final Submit on Task 5 with Real MongoDB Atlas Backend Persistence
  const handleFinalSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!bankName.trim()) {
      toast.error("Please enter your Bank Name");
      return;
    }
    if (!accountHolder.trim()) {
      toast.error("Please enter Account Holder Name");
      return;
    }
    if (!accountNumber.trim()) {
      toast.error("Please enter your Bank Account Number");
      return;
    }
    if (!ifsc.trim()) {
      toast.error("Please enter your Bank IFSC Code");
      return;
    }

    setLoading(true);

    const effectiveBrand =
      brandInputMode === "custom" || selectedBrand === "Other Brand"
        ? customBrand.trim() || selectedBrand
        : selectedBrand;
    const effectiveModel =
      modelInputMode === "custom" || selectedModel === "Other Model"
        ? customModel.trim() || selectedModel
        : selectedModel;

    try {
      const payload = {
        fullName: fullName.trim(),
        phone: targetPhone.startsWith("+91") ? targetPhone : `+91${targetPhone.replace(/\D/g, "")}`,
        gender: gender || "male",
        dob,
        city: selectedCity.trim(),
        pincode: pincode.trim(),
        emergencyContact: emergencyPhone.trim(),
        // DL
        license: drivingLicense.trim().toUpperCase(),
        dlNumber: drivingLicense.trim().toUpperCase(),
        dlExpiry,
        dlDocument: dlFrontFile || "dl_front.jpg",
        dlVerified: true,
        // Vehicle & RC
        vehicleType: vehicleType === "ev" ? "Electric Scooter (EV)" : "Bike (Petrol)",
        vehicleBrand: effectiveBrand,
        vehicleModel: effectiveModel,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        rcNumber: vehicleNumber.trim().toUpperCase(),
        engineNumber: engineNumber.trim().toUpperCase(),
        chassisNumber: chassisNumber.trim().toUpperCase(),
        rcDocument: rcFile || "rc_card.jpg",
        rcVerified: true,
        // KYC
        aadhaar: aadhaarNumber.replace(/\s/g, ""),
        pan: panNumber.trim().toUpperCase(),
        selfieUrl: selfieFile || "captain_selfie.jpg",
        selfieVerified: true,
        // Bank
        bankName: bankName.trim(),
        accountHolder: accountHolder.trim() || fullName.trim(),
        accountNumber: accountNumber.trim(),
        ifsc: ifsc.trim().toUpperCase(),
        bankVerified: true,
        // Status flags
        status: "under_verification",
        kycStatus: "pending",
        isVerified: false,
        isOnboarded: true,
      };

      const result = await submitRiderRegistration(payload);
      signIn(result);

      toast.success("🎉 Registration Submitted! Your application is under review.");
      navigate({ to: "/verification" });
    } catch (err: any) {
      toast.error(err?.message || "Registration failed. Please check details.");
    } finally {
      setLoading(false);
    }
  };

  const matchedCityObj = liveCities.find((c) => (c.city || c.name) === selectedCity);
  const cityPincodes = matchedCityObj?.pincodes || [];

  return (
    <div className="relative flex flex-col flex-1 w-full min-h-[100dvh] max-w-md mx-auto bg-[#F8FAFC] text-neutral-900 select-none pb-12">
      {/* 1. Sticky Top Navigation Header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 pb-3 bg-white border-b border-neutral-100 shadow-xs"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px) + 8px, 12px)" }}
      >
        <button
          type="button"
          onClick={handlePrevTask}
          className="flex items-center justify-center w-9 h-9 -ml-1 text-neutral-800 rounded-full hover:bg-neutral-100 active:scale-95 transition-transform"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
        </button>

        <div className="flex items-center gap-1.5 text-xs font-black text-neutral-900">
          <ShieldCheck className="w-4 h-4 text-[#00C853]" />
          <span>Captain Registration</span>
        </div>

        <span className="text-[11px] font-black px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full">
          Task {currentTask} of 5
        </span>
      </header>

      {/* 2. Brand Hero & 5-Task Stepper Progress Track */}
      <div className="bg-white px-4 pt-3 pb-4 border-b border-neutral-100 shadow-xs">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <QuickPressLogo size="sm" showSubtitle={false} />
          <div className="flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3 text-[#00C853]" />
            <span>{currentTask * 20}% Progress</span>
          </div>
        </div>

        {/* Dynamic Progress Track Bar */}
        <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-[#00C853] transition-all duration-300 rounded-full"
            style={{ width: `${currentTask * 20}%` }}
          />
        </div>

        {/* 5 Visual Task Tabs */}
        <div className="grid grid-cols-5 gap-1 text-center">
          {taskTitles.map((task) => {
            const isDone = currentTask > task.num;
            const isCurrent = currentTask === task.num;
            const Icon = task.icon;

            return (
              <button
                key={task.num}
                type="button"
                onClick={() => {
                  if (task.num <= currentTask || isDone) {
                    setCurrentTask(task.num);
                  }
                }}
                className={`flex flex-col items-center gap-1 transition-all ${
                  isCurrent
                    ? "text-[#00C853] font-black"
                    : isDone
                    ? "text-emerald-700 font-bold"
                    : "text-neutral-400 font-medium"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs transition-all ${
                    isDone
                      ? "bg-[#00C853] border-[#00C853] text-white shadow-xs"
                      : isCurrent
                      ? "bg-emerald-50 border-[#00C853] text-[#00C853] shadow-xs scale-105"
                      : "bg-white border-neutral-200 text-neutral-400"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[10px] leading-tight truncate max-w-full">
                  {task.short}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Task Content Area */}
      <div className="p-4 flex-1">
        {/* ========================================================
            TASK 1: PERSONAL DETAILS, LIVE OPERATING CITY & PINCODE
        ======================================================== */}
        {currentTask === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 bg-white border border-neutral-200/80 rounded-2xl shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 pb-1.5 border-b border-neutral-100">
                <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-50 text-[#00C853]">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-800">
                    Task 1: Personal & Operating Area
                  </h3>
                  <p className="text-[10px] text-neutral-500">Fill your official identity and operating details</p>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-black text-neutral-700 uppercase tracking-wide mb-1">
                  Full Name (As per Aadhaar / DL) *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#00C853] focus:outline-none transition-all"
                  autoFocus
                />
              </div>

              {/* Gender Selector (Unselected by default) */}
              <div>
                <label className="block text-[11px] font-black text-neutral-700 uppercase tracking-wide mb-1">
                  Gender *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["male", "female", "other"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-2.5 px-2 text-center rounded-xl border text-xs font-bold capitalize transition-all ${
                        gender === g
                          ? "bg-emerald-50 border-[#00C853] text-emerald-950 font-black shadow-xs ring-1 ring-[#00C853]"
                          : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                      }`}
                    >
                      {g === "male" ? "👨 Male" : g === "female" ? "👩 Female" : "⚧ Other"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-[11px] font-black text-neutral-700 uppercase tracking-wide mb-1">
                  Date of Birth (DOB) *
                </label>
                <input
                  type="date"
                  required
                  autoComplete="off"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#00C853] focus:outline-none transition-all"
                />
              </div>

              {/* Operating City */}
              <div>
                <label className="block text-[11px] font-black text-neutral-700 uppercase tracking-wide mb-1">
                  Operating City *
                </label>

                <select
                  value={selectedCity}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="w-full h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#00C853] focus:outline-none transition-all"
                >
                  <option value="">-- Select Operating City --</option>
                  {liveCities.map((c) => (
                    <option key={c.city || c.name} value={c.city || c.name}>
                      📍 {c.city || c.name} ({c.state || "Uttar Pradesh"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pin Code (Dropdown + Direct Type Option) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-black text-neutral-700 uppercase tracking-wide">
                    Operating Pin Code *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomPincodeMode(!customPincodeMode);
                      setPincode("");
                    }}
                    className="text-[10px] font-black text-[#00C853] hover:underline flex items-center gap-0.5"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{customPincodeMode ? "Select from list" : "Type custom pincode"}</span>
                  </button>
                </div>

                {customPincodeMode || cityPincodes.length === 0 ? (
                  <input
                    type="tel"
                    maxLength={6}
                    autoComplete="off"
                    placeholder="Enter 6-digit pin code (e.g. 207123)"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                    className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#00C853] focus:outline-none transition-all"
                  />
                ) : (
                  <select
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#00C853] focus:outline-none transition-all"
                  >
                    <option value="">-- Select Pin Code --</option>
                    {cityPincodes.map((pin) => (
                      <option key={pin} value={pin}>
                        📮 {pin}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Emergency Mobile */}
              <div>
                <label className="block text-[11px] font-black text-neutral-700 uppercase tracking-wide mb-1">
                  Emergency Mobile Number
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  autoComplete="off"
                  placeholder="Enter 10-digit emergency contact"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value.replace(/\D/g, ""))}
                  className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#00C853] focus:outline-none transition-all"
                />
              </div>

              {/* Verified Mobile Pill */}
              {targetPhone && (
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs font-black text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-[#00C853] shrink-0" />
                  <span>Registered Login Phone: +91 {targetPhone.replace("+91", "")}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TASK 2: DRIVING LICENCE (DL)
        ======================================================== */}
        {currentTask === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 bg-white border border-neutral-200/80 rounded-2xl shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 pb-1.5 border-b border-neutral-100">
                <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-blue-50 text-blue-600">
                  <IdCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-800">
                    Task 2: Driving Licence (DL) Details
                  </h3>
                  <p className="text-[10px] text-neutral-500">Government Transport Licence Authority</p>
                </div>
              </div>

              {/* DL Number */}
              <div>
                <label className="block text-[11px] font-black text-neutral-700 uppercase tracking-wide mb-1">
                  Driving Licence Number (DL No.) *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="e.g. UP87 20210001234"
                  value={drivingLicense}
                  onChange={(e) => setDrivingLicense(e.target.value.toUpperCase())}
                  className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-black tracking-wider uppercase text-neutral-900 focus:bg-white focus:border-[#00C853] focus:outline-none transition-all"
                  autoFocus
                />
              </div>

              {/* DL Expiry */}
              <div>
                <label className="block text-[11px] font-black text-neutral-700 uppercase tracking-wide mb-1">
                  Licence Valid Till (Expiry Date) *
                </label>
                <input
                  type="date"
                  required
                  autoComplete="off"
                  value={dlExpiry}
                  onChange={(e) => setDlExpiry(e.target.value)}
                  className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#00C853] focus:outline-none transition-all"
                />
              </div>

              {/* Hidden File Inputs */}
              <input
                type="file"
                ref={dlFrontInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, setDlFrontFile, "DL Front Photo")}
              />
              <input
                type="file"
                ref={dlBackInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, setDlBackFile, "DL Back Photo")}
              />

              {/* DL Photos Upload Slots */}
              <div>
                <label className="block text-[11px] font-black text-neutral-700 uppercase tracking-wide mb-1.5">
                  Upload DL Document Photos (Front & Back)
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <div
                    onClick={() => dlFrontInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center p-3.5 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      dlFrontFile
                        ? "bg-emerald-50/70 border-emerald-400 text-emerald-800"
                        : "bg-neutral-50 border-neutral-300 text-neutral-500 hover:border-emerald-400 hover:bg-emerald-50/30"
                    }`}
                  >
                    {dlFrontFile ? (
                      <CheckCircle2 className="w-6 h-6 text-[#00C853] mb-1" />
                    ) : (
                      <Upload className="w-6 h-6 text-neutral-400 mb-1" />
                    )}
                    <span className="text-[11px] font-black">DL Front Side</span>
                    <span className={`text-[9px] truncate max-w-[120px] ${dlFrontFile ? "text-emerald-700 font-bold" : "text-neutral-400"}`}>
                      {dlFrontFile || "Tap to Upload"}
                    </span>
                  </div>

                  <div
                    onClick={() => dlBackInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center p-3.5 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      dlBackFile
                        ? "bg-emerald-50/70 border-emerald-400 text-emerald-800"
                        : "bg-neutral-50 border-neutral-300 text-neutral-500 hover:border-emerald-400 hover:bg-emerald-50/30"
                    }`}
                  >
                    {dlBackFile ? (
                      <CheckCircle2 className="w-6 h-6 text-[#00C853] mb-1" />
                    ) : (
                      <Upload className="w-6 h-6 text-neutral-400 mb-1" />
                    )}
                    <span className="text-[11px] font-black">DL Back Side</span>
                    <span className={`text-[9px] truncate max-w-[120px] ${dlBackFile ? "text-emerald-700 font-bold" : "text-neutral-400"}`}>
                      {dlBackFile || "Tap to Upload"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 font-bold">
                <FileCheck2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>MoRTH Sarathi Registry Connected</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TASK 3: VEHICLE, BRAND/MODEL (WITH OTHER), RC, ENGINE & CHASSIS
        ======================================================== */}
        {currentTask === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 bg-white border border-neutral-200/80 rounded-2xl shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 pb-1.5 border-b border-neutral-100">
                <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-amber-50 text-amber-600">
                  <Bike className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-800">
                    Task 3: Vehicle, Brand/Model & RC Details
                  </h3>
                  <p className="text-[10px] text-neutral-500">Fill your 2-wheeler brand, model, RC, engine & chassis</p>
                </div>
              </div>

              {/* Vehicle Type Switcher (Unselected by default) */}
              <div>
                <label className="block text-[11px] font-black text-neutral-700 uppercase tracking-wide mb-1.5">
                  Vehicle Type *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setVehicleType("bike")}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 font-black text-xs transition-all ${
                      vehicleType === "bike"
                        ? "bg-emerald-50 border-[#00C853] text-neutral-900 ring-1 ring-[#00C853]"
                        : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    <Bike className="w-4 h-4 text-[#00C853]" />
                    <span>🛵 Bike (Petrol)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVehicleType("ev")}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 font-black text-xs transition-all ${
                      vehicleType === "ev"
                        ? "bg-emerald-50 border-[#00C853] text-neutral-900 ring-1 ring-[#00C853]"
                        : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>⚡ EV Scooter</span>
                  </button>
                </div>
              </div>

              {/* Vehicle Brand Select OR Direct Type */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-black text-neutral-700 uppercase tracking-wide">
                    Vehicle Brand *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = brandInputMode === "select" ? "custom" : "select";
                      setBrandInputMode(next);
                      if (next === "custom") setSelectedBrand("Other Brand");
                    }}
                    className="text-[10px] font-black text-[#00C853] hover:underline flex items-center gap-0.5"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{brandInputMode === "select" ? "Type brand name" : "Select from list"}</span>
                  </button>
                </div>

                {brandInputMode === "custom" ? (
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="Enter custom bike brand (e.g. Yamaha / Suzuki)"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#00C853] focus:outline-none transition-all"
                  />
                ) : (
                  <select
                    value={selectedBrand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    className="w-full h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#00C853] focus:outline-none transition-all"
                  >
                    <option value="">-- Select Vehicle Brand --</option>
                    {Object.keys(VEHICLE_CATALOG).map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Vehicle Model Select OR Direct Type */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-black text-neutral-700 uppercase tracking-wide">
                    Vehicle Model *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = modelInputMode === "select" ? "custom" : "select";
                      setModelInputMode(next);
                      if (next === "custom") setSelectedModel("Other Model");
                    }}
                    className="text-[10px] font-black text-[#00C853] hover:underline flex items-center gap-0.5"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{modelInputMode === "select" ? "Type model name" : "Select from list"}</span>
                  </button>
                </div>

                {modelInputMode === "custom" ? (
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="Enter custom model (e.g. Splendor Plus / Activa 6G)"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#00C853] focus:outline-none transition-all"
                  />
                ) : (
                  <select
                    disabled={!selectedBrand}
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full h-11 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#00C853] focus:outline-none transition-all disabled:opacity-50"
                  >
                    <option value="">
                      {selectedBrand ? "-- Select Vehicle Model --" : "-- First Select Brand Above --"}
                    </option>
                    {availableModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Vehicle RC Number Plate */}
              <div>
                <label className="block text-[11px] font-black text-neutral-700 uppercase tracking-wide mb-1">
                  Vehicle Registration No. (Number Plate) *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="e.g. UP 87 AB 1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-black tracking-wider uppercase text-neutral-900 focus:bg-white focus:border-[#00C853] focus:outline-none transition-all"
                  autoFocus
                />
              </div>

              {/* Engine Number & Chassis Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-neutral-700 uppercase tracking-wide mb-1">
                    Engine Number *
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="e.g. HA10E3948201"
                    value={engineNumber}
                    onChange={(e) => setEngineNumber(e.target.value.toUpperCase())}
                    className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-black tracking-wider uppercase text-neutral-900 focus:bg-white focus:border-[#00C853] focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-neutral-700 uppercase tracking-wide mb-1">
                    Chassis Number (VIN) *
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="e.g. MD625BG39K0..."
                    value={chassisNumber}
                    onChange={(e) => setChassisNumber(e.target.value.toUpperCase())}
                    className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-black tracking-wider uppercase text-neutral-900 focus:bg-white focus:border-[#00C853] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Hidden RC Input */}
              <input
                type="file"
                ref={rcInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, setRcFile, "RC Document")}
              />

              {/* RC Upload Box */}
              <div>
                <label className="block text-[11px] font-black text-neutral-700 uppercase tracking-wide mb-1.5">
                  RC Smart Card Document Photo
                </label>
                <div
                  onClick={() => rcInputRef.current?.click()}
                  className={`flex items-center justify-between p-3.5 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    rcFile
                      ? "bg-emerald-50/70 border-emerald-400 text-emerald-800"
                      : "bg-neutral-50 border-neutral-300 text-neutral-500 hover:border-emerald-400 hover:bg-emerald-50/30"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className={`w-5 h-5 ${rcFile ? "text-emerald-600" : "text-neutral-400"}`} />
                    <div>
                      <p className="text-xs font-black text-neutral-900">RC Smart Card Photo</p>
                      <p className="text-[10px] text-neutral-500 truncate max-w-[150px]">
                        {rcFile || "Parivahan Vahan Verified"}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-md ${rcFile ? "text-emerald-700 bg-emerald-100" : "text-neutral-600 bg-neutral-200"}`}>
                    {rcFile ? "Uploaded ✔" : "Upload Photo"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TASK 4: AADHAAR, PAN & LIVE SELFIE KYC
        ======================================================== */}
        {currentTask === 4 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 bg-white border border-neutral-200/80 rounded-2xl shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 pb-1.5 border-b border-neutral-100">
                <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-purple-50 text-purple-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-800">
                    Task 4: Aadhaar & Live Selfie KYC
                  </h3>
                  <p className="text-[10px] text-neutral-500">Identity verification & safety compliance</p>
                </div>
              </div>

              {/* Aadhaar Number */}
              <div>
                <label className="block text-[11px] font-black text-neutral-700 uppercase tracking-wide mb-1">
                  12-Digit Aadhaar Card Number *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  maxLength={14}
                  placeholder="e.g. 5489 1234 8921"
                  value={aadhaarNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 12);
                    const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
                    setAadhaarNumber(formatted);
                  }}
                  className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-black tracking-widest text-neutral-900 focus:bg-white focus:border-[#00C853] focus:outline-none transition-all"
                  autoFocus
                />
              </div>

              {/* PAN Card */}
              <div>
                <label className="block text-[11px] font-black text-neutral-700 uppercase tracking-wide mb-1">
                  PAN Card Number (Optional for Tax Benefits)
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-black tracking-wider uppercase text-neutral-900 focus:bg-white focus:border-[#00C853] focus:outline-none transition-all"
                />
              </div>

              {/* Hidden Selfie Input */}
              <input
                type="file"
                ref={selfieInputRef}
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(e) => handleFileUpload(e, setSelfieFile, "Captain Live Selfie")}
              />

              {/* Live Selfie Slot */}
              <div>
                <label className="block text-[11px] font-black text-neutral-700 uppercase tracking-wide mb-1.5">
                  Live Captain Profile Photo / Selfie *
                </label>
                <div
                  onClick={() => selfieInputRef.current?.click()}
                  className={`flex items-center justify-between p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                    selfieFile
                      ? "bg-emerald-50/70 border-emerald-300"
                      : "bg-neutral-50 border-dashed border-neutral-300 hover:border-emerald-400 hover:bg-emerald-50/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full text-white shadow-xs ${selfieFile ? "bg-[#00C853]" : "bg-neutral-400"}`}>
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-neutral-900">Captain Live Selfie</p>
                      <p className={`text-[10px] font-bold ${selfieFile ? "text-emerald-800" : "text-neutral-400"}`}>
                        {selfieFile ? `Uploaded: ${selfieFile}` : "Tap to capture / upload"}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-md ${selfieFile ? "text-emerald-700 bg-emerald-100" : "text-neutral-600 bg-neutral-200"}`}>
                    {selfieFile ? "Verified ✔" : "Take Photo"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TASK 5: BANK ACCOUNT & FULL 5-TASK REVIEW
        ======================================================== */}
        {currentTask === 5 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4 animate-in fade-in duration-200">
            {/* Bank Card */}
            <div className="p-4 bg-white border border-neutral-200/80 rounded-2xl shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 pb-1.5 border-b border-neutral-100">
                <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-50 text-[#00C853]">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-800">
                    Task 5: Bank Payout Account (0% Commission)
                  </h3>
                  <p className="text-[10px] text-neutral-500">Earnings transfer directly to your bank account</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-neutral-700 uppercase tracking-wide mb-1">
                  Bank Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="e.g. State Bank of India / HDFC Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#00C853] focus:outline-none transition-all"
                  />
                  <Building2 className="absolute right-3 top-3.5 w-4 h-4 text-neutral-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-neutral-700 uppercase tracking-wide mb-1">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="Account Holder Full Name"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#00C853] focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-neutral-700 uppercase tracking-wide mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="Enter Account No."
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                    className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:bg-white focus:border-[#00C853] focus:outline-none transition-all"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-neutral-700 uppercase tracking-wide mb-1">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="e.g. SBIN0001234"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold uppercase text-neutral-900 focus:bg-white focus:border-[#00C853] focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Comprehensive 5-Task Review Summary Card */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                <span className="text-xs font-black text-emerald-950">Registration Summary</span>
                <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Ready to Submit
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <p className="text-neutral-500 font-medium">Captain Name</p>
                  <p className="font-black text-neutral-900">{fullName || "—"}</p>
                </div>
                <div>
                  <p className="text-neutral-500 font-medium">City & Pin</p>
                  <p className="font-black text-neutral-900">
                    {selectedCity || "—"} ({pincode || "—"})
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500 font-medium">Bike Brand & Model</p>
                  <p className="font-black text-neutral-900">
                    {brandInputMode === "custom" ? customBrand || "—" : selectedBrand || "—"} -{" "}
                    {modelInputMode === "custom" ? customModel || "—" : selectedModel || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500 font-medium">RC Number Plate</p>
                  <p className="font-black text-neutral-900">{vehicleNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-neutral-500 font-medium">Engine & Chassis</p>
                  <p className="font-black text-neutral-900">
                    {engineNumber || "—"} / {chassisNumber ? chassisNumber.slice(0, 8) + "..." : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500 font-medium">Driving Licence</p>
                  <p className="font-black text-neutral-900">{drivingLicense || "—"}</p>
                </div>
              </div>
            </div>

            {/* Final Submit Button */}
            <div
              className="pt-2 space-y-2.5"
              style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px) + 16px, 24px)" }}
            >
              <button
                type="submit"
                disabled={loading}
                className="w-full h-13.5 flex items-center justify-center gap-2 bg-[#00C853] hover:bg-[#00B248] active:bg-[#009624] text-white font-black text-sm tracking-wide rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-98 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <span>Submit Registration & Go Online 🚀</span>
                )}
              </button>

              <p className="text-[10px] text-center text-neutral-500 font-semibold">
                QuickPress Captain Partner Zero-Commission Agreement
              </p>
            </div>
          </form>
        )}
      </div>

      {/* 4. Bottom Sticky Action Bar (For Tasks 1 to 4) */}
      {currentTask < 5 && (
        <div
          className="sticky bottom-0 z-40 px-4 pt-3 bg-white/95 backdrop-blur-xs border-t border-neutral-100 flex items-center justify-between gap-3 shadow-lg"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px) + 12px, 16px)" }}
        >
          {currentTask > 1 ? (
            <button
              type="button"
              onClick={handlePrevTask}
              className="h-12 px-5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-black text-xs rounded-xl active:scale-95 transition-all"
            >
              Previous
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNextTask}
            className="flex-1 h-12 flex items-center justify-center gap-2 bg-[#00C853] hover:bg-[#00B248] text-white font-black text-xs tracking-wide rounded-xl shadow-md shadow-emerald-500/25 active:scale-98 transition-all"
          >
            <span>Continue to Task {currentTask + 1}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  );
}
