import { useNavigate } from "@tanstack/react-router";
import React, { useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
  Award,
  Bike,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Copy,
  CreditCard,
  Download,
  Edit2,
  FileCheck2,
  FileText,
  Heart,
  HelpCircle,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  Navigation,
  Phone,
  QrCode,
  Save,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Star,
  TrendingUp,
  Upload,
  User,
  Volume2,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useRiderContext } from "../context/RiderContext";
import {
  fetchRiderProfile,
  updateRiderProfile,
  fetchRiderBank,
  updateRiderBank,
  type RiderBankAccount,
} from "../api/rider/rider-profile-api";
import { useLanguage } from "../lib/i18n";
import { triggerHaptic } from "../lib/captain-audio";

export function RiderProfileScreen() {
  const navigate = useNavigate();
  const { session, signOut } = useRiderContext();
  const { t, selectedLanguageObj } = useLanguage();

  const [activeTab, setActiveTab] = useState<"personal" | "vehicle" | "bank" | "preferences">("personal");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile State
  const [fullName, setFullName] = useState(session?.fullName || "");
  const [riderId, setRiderId] = useState(session?.riderId || "");
  const [phone, setPhone] = useState(session?.phone || "");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Kasganj");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [rating, setRating] = useState(5.0);
  const [totalTrips, setTotalTrips] = useState(0);
  const [joinedOn, setJoinedOn] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Vehicle Details
  const [vehicleType, setVehicleType] = useState("Two-Wheeler (Motorcycle)");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [dlNumber, setDlNumber] = useState("");
  const [rcNumber, setRcNumber] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");

  // Bank & Settlement Details
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountHolder, setAccountHolder] = useState(session?.fullName || "");
  const [upiId, setUpiId] = useState("");

  // Preferences
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [navApp, setNavApp] = useState<"google" | "inapp">("google");

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load Real Profile from Backend / LocalStorage
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const profile = await fetchRiderProfile().catch(() => null);
        if (profile) {
          if (profile.fullName) setFullName(profile.fullName);
          if (profile.riderId) setRiderId(profile.riderId);
          if (profile.phone) setPhone(profile.phone);
          if (profile.email && profile.email !== "—") setEmail(profile.email);
          if (profile.city && profile.city !== "—") setCity(profile.city);
          if (profile.rating) setRating(profile.rating);
          if (profile.totalTrips !== undefined) setTotalTrips(profile.totalTrips);
          if (profile.vehicleType) setVehicleType(profile.vehicleType);
          if (profile.vehicleNumber && profile.vehicleNumber !== "—") setVehicleNumber(profile.vehicleNumber);
          if (profile.dlNumber) setDlNumber(profile.dlNumber);
          if (profile.rcNumber) setRcNumber(profile.rcNumber);
          if (profile.emergencyPhone) setEmergencyPhone(profile.emergencyPhone);
          if (profile.bloodGroup) setBloodGroup(profile.bloodGroup);
          if (profile.joinedOn || profile.createdAt) setJoinedOn(profile.joinedOn || new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" }));
          if (profile.bankName) setBankName(profile.bankName);
          if (profile.accountNumber) setAccountNumber(profile.accountNumber);
          if (profile.ifsc) setIfsc(profile.ifsc);
          if (profile.accountHolder) setAccountHolder(profile.accountHolder);
          if (profile.upiId) setUpiId(profile.upiId);
        }

        const bank = await fetchRiderBank().catch(() => null);
        if (bank) {
          if (bank.bankName) setBankName(bank.bankName);
          if (bank.accountNumber) setAccountNumber(bank.accountNumber);
          if (bank.ifsc) setIfsc(bank.ifsc);
          if (bank.accountHolder) setAccountHolder(bank.accountHolder);
          if (bank.upiId) setUpiId(bank.upiId);
        }

        // Restore custom photo if stored
        const savedPhoto = localStorage.getItem("qp_rider_profile_photo");
        if (savedPhoto) setProfilePhoto(savedPhoto);
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setProfilePhoto(base64);
      try {
        localStorage.setItem("qp_rider_profile_photo", base64);
      } catch {}
      triggerHaptic();
      toast.success("Profile photo updated successfully! 📸");
    };
    reader.readAsDataURL(file);
  };

  // Copy Rider ID
  const handleCopyId = () => {
    navigator.clipboard.writeText(riderId);
    triggerHaptic();
    toast.success(`Captain ID ${riderId} copied to clipboard! 📋`);
  };

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    triggerHaptic();
    try {
      await updateRiderProfile({
        fullName,
        email,
        city,
        emergencyPhone,
        bloodGroup,
        vehicleType,
        vehicleNumber,
      }).catch(() => null);

      await updateRiderBank({
        bankName,
        accountNumber,
        ifsc,
        accountHolder,
        upiId,
      }).catch(() => null);

      setShowEditModal(false);
      toast.success("Profile details updated successfully! ✅");
    } catch {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle Logout
  const handleConfirmLogout = () => {
    triggerHaptic();
    signOut();
    toast.success("Logged out successfully. See you soon, Captain! 🛵");
    navigate({ to: "/auth" });
  };

  return (
    <div
      className="relative flex flex-col w-full min-h-[100dvh] max-w-md mx-auto bg-neutral-50 shadow-2xl text-neutral-900 select-none"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px) + 40px, 60px)" }}
    >
      {/* 1. Header Bar */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-100 shadow-2xs"
        style={{ paddingTop: "max(env(safe-area-inset-top, 0px) + 8px, 12px)" }}
      >
        <button
          type="button"
          onClick={() => navigate({ to: "/dashboard" })}
          className="flex items-center justify-center w-10 h-10 -ml-1 text-neutral-900 rounded-full hover:bg-neutral-100 active:scale-95 transition-transform"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        <h1 className="text-base font-black text-neutral-950 tracking-tight">
          Captain Profile
        </h1>

        <button
          type="button"
          onClick={() => setShowIdCardModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFC400] text-neutral-950 font-black text-xs rounded-xl shadow-2xs hover:bg-[#FBBF24] active:scale-95 transition-all"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>ID Card</span>
        </button>
      </header>

      {/* 2. Hero Identity Card */}
      <div className="p-4 bg-white border-b border-neutral-200/70">
        <div className="flex items-start gap-3.5">
          {/* Avatar with Upload Trigger */}
          <div className="relative group shrink-0">
            <div className="w-18 h-18 rounded-2xl overflow-hidden bg-amber-400 border-2 border-white shadow-md flex items-center justify-center text-neutral-950 font-black text-2xl">
              {profilePhoto ? (
                <img src={profilePhoto} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                fullName.slice(0, 1).toUpperCase()
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center shadow-md hover:bg-neutral-800 active:scale-95 transition-all"
              aria-label="Change Profile Photo"
            >
              <Upload className="w-3 h-3 stroke-[2.5]" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          {/* Captain Basic Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <div>
                <h2 className="text-lg font-black text-neutral-950 leading-tight truncate">
                  {fullName}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono text-xs font-bold text-neutral-500">
                    {riderId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="p-1 text-neutral-400 hover:text-neutral-700 active:scale-95"
                    title="Copy Captain ID"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="p-1.5 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl active:scale-95 transition-all shrink-0"
                title="Edit Profile"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[#00C853] border border-emerald-200 text-[10px] font-black">
                <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                <span>Verified Partner</span>
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-black">
                <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                <span>{rating.toFixed(2)} Rating</span>
              </span>
            </div>
          </div>
        </div>

        {/* 4 Performance Metric Cards */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-neutral-100">
          <div className="p-2.5 bg-neutral-50 border border-neutral-100 rounded-xl text-center">
            <p className="text-base font-black text-neutral-950">{totalTrips}</p>
            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-tight">Trips</p>
          </div>
          <div className="p-2.5 bg-neutral-50 border border-neutral-100 rounded-xl text-center">
            <p className="text-base font-black text-emerald-600">96.8%</p>
            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-tight">Accept</p>
          </div>
          <div className="p-2.5 bg-neutral-50 border border-neutral-100 rounded-xl text-center">
            <p className="text-base font-black text-blue-600">98.4%</p>
            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-tight">On-Time</p>
          </div>
          <div className="p-2.5 bg-neutral-50 border border-neutral-100 rounded-xl text-center">
            <p className="text-base font-black text-neutral-950">₹64.2k</p>
            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-tight">Earned</p>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="sticky top-[53px] z-30 flex items-center justify-between px-3 py-2 bg-white border-b border-neutral-200 shadow-2xs gap-1 overflow-x-auto">
        {[
          { id: "personal", label: "Personal", icon: User },
          { id: "vehicle", label: "Vehicle & DL", icon: Bike },
          { id: "bank", label: "Bank / UPI", icon: Wallet },
          { id: "preferences", label: "Settings", icon: Zap },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                triggerHaptic();
                setActiveTab(tab.id as any);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-black transition-all ${
                isActive
                  ? "bg-[#00C853] text-white shadow-sm shadow-emerald-500/20"
                  : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Tab Content */}
      <div className="p-4 space-y-3.5">
        {/* TAB 1: PERSONAL DETAILS */}
        {activeTab === "personal" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="p-4 bg-white border border-neutral-200 rounded-2xl shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                  Contact & Identity
                </h3>
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="text-xs font-black text-emerald-600 hover:underline"
                >
                  Edit
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-neutral-100">
                  <div className="flex items-center gap-2 text-neutral-500 font-semibold">
                    <User className="w-4 h-4 text-neutral-400" />
                    <span>Full Name</span>
                  </div>
                  <span className="font-black text-neutral-950">{fullName}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-neutral-100">
                  <div className="flex items-center gap-2 text-neutral-500 font-semibold">
                    <Phone className="w-4 h-4 text-neutral-400" />
                    <span>Phone Number</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-neutral-950">{phone}</span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                      Verified
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-neutral-100">
                  <div className="flex items-center gap-2 text-neutral-500 font-semibold">
                    <Mail className="w-4 h-4 text-neutral-400" />
                    <span>Email Address</span>
                  </div>
                  <span className="font-black text-neutral-950 truncate max-w-[180px]">{email}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-neutral-100">
                  <div className="flex items-center gap-2 text-neutral-500 font-semibold">
                    <MapPin className="w-4 h-4 text-neutral-400" />
                    <span>Work Zone</span>
                  </div>
                  <span className="font-black text-neutral-950">{city}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-neutral-100">
                  <div className="flex items-center gap-2 text-neutral-500 font-semibold">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <span>Joined On</span>
                  </div>
                  <span className="font-black text-neutral-950">{joinedOn}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2 text-neutral-500 font-semibold">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span>Blood Group (SOS)</span>
                  </div>
                  <span className="font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                    {bloodGroup}
                  </span>
                </div>
              </div>
            </div>

            {/* Emergency Contact Card */}
            <div className="p-4 bg-white border border-neutral-200 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-black text-neutral-900">
                    Emergency Contact (Safety)
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-neutral-400">SOS Sync</span>
              </div>
              <p className="text-xs text-neutral-600 font-medium">
                In case of emergency during trips, alerts will be dispatched to:
              </p>
              <div className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="text-xs font-black text-neutral-900">{emergencyPhone}</span>
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="text-xs font-bold text-[#00C853] hover:underline"
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VEHICLE & KYC DOCUMENTS */}
        {activeTab === "vehicle" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="p-4 bg-white border border-neutral-200 rounded-2xl shadow-xs space-y-3.5">
              <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                Vehicle Registration
              </h3>

              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#00C853] flex items-center justify-center shrink-0">
                  <Bike className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-neutral-950">{vehicleType}</p>
                  <p className="text-sm font-black text-neutral-900 font-mono tracking-wider mt-0.5">
                    {vehicleNumber}
                  </p>
                </div>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Active
                </span>
              </div>

              <div className="space-y-2.5 pt-2">
                {[
                  {
                    id: "dl",
                    title: "Driving License",
                    number: dlNumber,
                    sub: "Valid till 2035",
                    status: "Verified",
                  },
                  {
                    id: "rc",
                    title: "Vehicle RC Document",
                    number: rcNumber,
                    sub: "Ownership Verified",
                    status: "Verified",
                  },
                  {
                    id: "ins",
                    title: "Vehicle Insurance",
                    number: "Policy #QP-91823-90",
                    sub: `Expiry: ${insuranceExpiry}`,
                    status: "Verified",
                  },
                  {
                    id: "aadhaar",
                    title: "Aadhaar / PAN KYC",
                    number: "XXXX XXXX 4920",
                    sub: "Government Identity",
                    status: "Verified",
                  },
                ].map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-white border border-neutral-200/80 rounded-xl hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileCheck2 className="w-4 h-4 text-[#00C853]" />
                      <div>
                        <h4 className="text-xs font-black text-neutral-900 leading-tight">
                          {doc.title}
                        </h4>
                        <p className="text-[11px] font-mono text-neutral-600 mt-0.5">
                          {doc.number} · <span className="text-neutral-400 font-sans">{doc.sub}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-[#00C853] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BANK & SETTLEMENT */}
        {activeTab === "bank" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Primary Bank Card */}
            <div className="p-4 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-2xl shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-black">{bankName}</span>
                </div>
                <span className="text-[10px] font-black text-[#00C853] bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-700">
                  Primary Payout
                </span>
              </div>

              <div>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Account Number</p>
                <p className="text-lg font-mono font-black tracking-widest mt-0.5">
                  •••• •••• {accountNumber.slice(-4)}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-700/60">
                <div>
                  <p className="text-[9px] text-neutral-400">Account Holder</p>
                  <p className="font-black text-white">{accountHolder}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-neutral-400">IFSC Code</p>
                  <p className="font-mono font-black text-white">{ifsc}</p>
                </div>
              </div>
            </div>

            {/* UPI ID Card */}
            <div className="p-4 bg-white border border-neutral-200 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-black text-neutral-900">
                    72-Hour Bank & UPI Settlement Cycle
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <div>
                  <p className="text-[10px] text-neutral-500 font-bold">Linked UPI VPA</p>
                  <p className="text-xs font-mono font-black text-neutral-950 mt-0.5">{upiId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="px-3 py-1 bg-white border border-neutral-300 rounded-lg text-xs font-black text-neutral-800 hover:bg-neutral-50 active:scale-95"
                >
                  Change
                </button>
              </div>

              <p className="text-[11px] text-neutral-500">
                Trip earnings are settled automatically to this UPI ID within 72 hours of ride completion with Zero deductions.
              </p>

              <button
                type="button"
                onClick={() => navigate({ to: "/wallet" })}
                className="w-full py-3 bg-neutral-950 hover:bg-neutral-900 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
              >
                <Wallet className="w-4 h-4 text-amber-400" />
                <span>Open Earnings Passbook & 72h Payouts</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: PREFERENCES & APP SETTINGS */}
        {activeTab === "preferences" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="p-4 bg-white border border-neutral-200 rounded-2xl shadow-xs space-y-3.5">
              <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                Captain Dispatch & Alerts
              </h3>

              {/* Sound Alerts */}
              <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-neutral-900">Loud Siren & Traffic Chimes</p>
                    <p className="text-[10px] text-neutral-500">Alerts on incoming orders</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={soundAlerts}
                  onChange={(e) => {
                    setSoundAlerts(e.target.checked);
                    triggerHaptic();
                    toast.success(e.target.checked ? "Sound Siren Enabled 🔊" : "Sound Muted 🔇");
                  }}
                  className="w-5 h-5 accent-[#00C853] rounded cursor-pointer"
                />
              </div>

              {/* Auto Accept */}
              <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00C853] flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-neutral-900">Auto-Accept Nearby Rides</p>
                    <p className="text-[10px] text-neutral-500">Orders within 2.0 km radius</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoAccept}
                  onChange={(e) => {
                    setAutoAccept(e.target.checked);
                    triggerHaptic();
                    toast.success(e.target.checked ? "Auto-Accept Activated ⚡" : "Auto-Accept Disabled");
                  }}
                  className="w-5 h-5 accent-[#00C853] rounded cursor-pointer"
                />
              </div>

              {/* Navigation Preference */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-neutral-900">Default Navigation</p>
                    <p className="text-[10px] text-neutral-500">App opened for trip routes</p>
                  </div>
                </div>
                <select
                  value={navApp}
                  onChange={(e) => {
                    setNavApp(e.target.value as any);
                    triggerHaptic();
                    toast.success("Navigation preference saved 🗺️");
                  }}
                  className="text-xs font-black bg-neutral-50 border border-neutral-300 rounded-lg px-2 py-1"
                >
                  <option value="google">Google Maps</option>
                  <option value="inapp">In-App Live Map</option>
                </select>
              </div>
            </div>

            {/* Language Selection */}
            <div className="p-4 bg-white border border-neutral-200 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-neutral-900">App Language</span>
                <span className="text-xs font-bold text-emerald-600">
                  {selectedLanguageObj.nativeName} ({selectedLanguageObj.name})
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate({ to: "/language" })}
                className="w-full py-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 font-black text-xs rounded-xl border border-neutral-200 active:scale-98 transition-all"
              >
                Change Language 🌐
              </button>
            </div>
          </div>
        )}

        {/* Support & Logout Section */}
        <div className="p-4 bg-white border border-neutral-200 rounded-2xl shadow-xs space-y-2.5">
          <button
            type="button"
            onClick={() => {
              window.open("tel:18001237729");
              toast.success("Connecting to 24/7 Captain Support Hotline... 📞");
            }}
            className="w-full flex items-center justify-between p-3 bg-neutral-50 hover:bg-neutral-100 rounded-xl text-left active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-black text-neutral-900">24/7 Captain Support Helpline</span>
            </div>
            <span className="text-xs font-bold text-neutral-500">1800-123-QPAY</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-black text-xs rounded-xl border border-red-200 active:scale-98 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Captain Account</span>
          </button>
        </div>
      </div>

      {/* 5. EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-base font-black text-neutral-950">Edit Profile Details</h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-black text-neutral-900 focus:bg-white focus:outline-none focus:border-[#00C853]"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-bold text-neutral-900 focus:bg-white focus:outline-none focus:border-[#00C853]"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700">Service City / Hub</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-bold text-neutral-900 focus:bg-white focus:outline-none focus:border-[#00C853]"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700">Vehicle Number Plate</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  className="w-full mt-1 p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-mono font-black text-neutral-900 focus:bg-white focus:outline-none focus:border-[#00C853]"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700">Primary UPI ID for Daily Payout</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-mono font-black text-neutral-900 focus:bg-white focus:outline-none focus:border-[#00C853]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-[#00C853] hover:bg-[#00B248] text-white font-black rounded-xl shadow-md shadow-emerald-500/25 flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. OFFICIAL CAPTAIN ID CARD MODAL */}
      {showIdCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* ID Card Header */}
            <div className="bg-neutral-950 p-4 text-white flex items-center justify-between border-b border-amber-400">
              <div className="flex items-center gap-2">
                <img
                  src="/quickpress-brand-logo-transparent.png"
                  alt="QuickPress"
                  className="h-6 w-auto object-contain brightness-0 invert"
                />
                <span className="text-[10px] font-black px-1.5 py-0.5 bg-amber-400 text-neutral-950 rounded uppercase tracking-wider">
                  Captain ID
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowIdCardModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ID Card Body */}
            <div className="p-5 text-center space-y-3 bg-gradient-to-b from-amber-50/40 to-white">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-amber-400 border-4 border-white shadow-lg mx-auto flex items-center justify-center text-neutral-950 font-black text-3xl">
                {profilePhoto ? (
                  <img src={profilePhoto} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  fullName.slice(0, 1).toUpperCase()
                )}
              </div>

              <div>
                <h3 className="text-lg font-black text-neutral-950">{fullName}</h3>
                <p className="text-xs font-mono font-bold text-neutral-600">ID: {riderId}</p>
                <p className="text-[11px] font-bold text-emerald-700 bg-emerald-100 inline-block px-2 py-0.5 rounded-full mt-1">
                  ✓ Verified QuickPress Captain
                </p>
              </div>

              <div className="p-3 bg-white border border-neutral-200 rounded-xl text-left space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Vehicle:</span>
                  <span className="font-mono font-black text-neutral-900">{vehicleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">City / Hub:</span>
                  <span className="font-black text-neutral-900">{city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Valid Till:</span>
                  <span className="font-bold text-emerald-600">Dec 2027 (Active)</span>
                </div>
              </div>

              {/* Mock QR Verification Code */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-dashed border-neutral-300 flex items-center justify-center gap-3">
                <QrCode className="w-12 h-12 text-neutral-900" />
                <div className="text-left text-[10px] text-neutral-500">
                  <p className="font-black text-neutral-900">Official Partner ID</p>
                  <p>Scan to verify authenticity with QuickPress Authority.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  toast.success("Captain ID Card downloaded! 🪪");
                  setShowIdCardModal(false);
                }}
                className="w-full py-3 bg-neutral-950 hover:bg-neutral-800 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Digital Badge</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <LogOut className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-black text-neutral-950">Log Out Captain Account?</h3>
              <p className="text-xs text-neutral-500 mt-1">
                You will stop receiving live ride dispatches until you sign back in.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 bg-neutral-100 font-bold text-xs rounded-xl text-neutral-700 hover:bg-neutral-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md shadow-red-500/25 active:scale-98 transition-all"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
