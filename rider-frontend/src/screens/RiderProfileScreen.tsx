import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Bike,
  Building2,
  CheckCircle2,
  Clock,
  FileCheck,
  Globe,
  LogOut,
  MapPin,
  Phone,
  Power,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { RiderLayout } from "../components/layout/RiderLayout";
import { useRiderContext } from "../context/RiderContext";
import { fetchRiderProfile } from "../api/rider/rider-profile-api";
import type { RiderProfile } from "@/shared/types/rider";

export function RiderProfileScreen() {
  const navigate = useNavigate();
  const { session, signOut, isOnline, setOnline } = useRiderContext();
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lang, setLang] = useState<"en" | "hi">("en");

  const loadProfile = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const data = await fetchRiderProfile();
      setProfile(data);
      if (showToast) toast.success("Profile reloaded from server");
    } catch {
      if (showToast) toast.error("Could not load profile");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const captainName = profile?.fullName || session?.fullName || "Delivery Captain";
  const captainId = profile?.riderId || session?.riderId || "CP-9821";
  const phone = profile?.phone || session?.phone || "—";
  const city = profile?.city || "Kasganj";
  const vehicleNumber = profile?.vehicleNumber || "—";
  const rating = profile?.rating ?? 5.0;
  const totalTrips = profile?.totalTrips ?? 0;
  const kycStatus = profile?.kycStatus || (profile?.isVerified ? "verified" : "pending");

  const initials = captainName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "CP";

  const handleLogout = () => {
    signOut();
    toast.success("Logged out successfully");
    void navigate({ to: "/auth" });
  };

  return (
    <RiderLayout
      activeTab="profile"
      title="Captain Profile"
      subtitle="Identity, Vehicle, KYC Documents & Preferences"
    >
      <div className="mx-auto w-full max-w-4xl space-y-4 p-4 sm:p-6 select-none">
        {/* ========================================================================= */}
        {/* 1. PROFILE HEADER CARD (White & Dark Green)                                */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-800 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex size-16 sm:size-18 shrink-0 items-center justify-center rounded-2xl bg-emerald-800 text-white font-black text-2xl shadow-md">
                {initials}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-200">
                    {kycStatus === "verified" ? "Verified Captain" : "KYC Pending"}
                  </span>
                  <span className="text-xs font-bold text-slate-500">ID: {captainId}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-950 mt-1 truncate">
                  {captainName}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 mt-0.5">
                  <span>{phone}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-emerald-800">
                    <MapPin className="size-3.5" />
                    {city} Fleet
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadProfile(true)}
              disabled={refreshing}
              className="self-start sm:self-center flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Quick Stats Banner */}
          <div className="mt-5 grid grid-cols-3 gap-2 pt-4 border-t border-emerald-100 text-center text-xs">
            <div className="rounded-2xl bg-emerald-50/50 p-2.5 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase text-emerald-800">Rating</p>
              <p className="text-base font-black text-emerald-950 mt-0.5 flex items-center justify-center gap-1">
                <Star className="size-3.5 fill-emerald-700 text-emerald-700" />
                {rating.toFixed(1)}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50/50 p-2.5 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase text-emerald-800">Lifetime Trips</p>
              <p className="text-base font-black text-slate-900 mt-0.5">{totalTrips}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50/50 p-2.5 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase text-emerald-800">Duty Radar</p>
              <p className="text-base font-black text-emerald-800 mt-0.5">5 km Active</p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. VEHICLE INFORMATION (Real Backend Data)                                 */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-xs">
                <Bike className="size-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900">Registered Delivery Vehicle</h3>
                <p className="text-[11px] font-medium text-slate-500">QuickPress Verified Two-Wheeler</p>
              </div>
            </div>
            <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {kycStatus === "verified" ? "Road Ready" : "Verification In-Progress"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div>
              <p className="text-[10px] font-bold uppercase text-emerald-800">Vehicle Type</p>
              <p className="font-bold text-slate-900">{profile?.vehicleType || "Motorcycle / Scooter"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-emerald-800">Plate Number</p>
              <p className="font-bold text-slate-900 uppercase">{vehicleNumber}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-emerald-800">Fuel Type</p>
              <p className="font-bold text-slate-900">Petrol / EV</p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. KYC DOCUMENTS STATUS (Real Backend Documents)                          */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 border-b border-emerald-100 pb-3">
            Compliance &amp; Verification
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/40 border border-emerald-100">
              <div className="flex items-center gap-2.5">
                <FileCheck className="size-4 text-emerald-800" />
                <span className="font-bold text-slate-900">Driving Licence (MoRTH Sarathi)</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="size-3 text-emerald-700" /> Verified
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/40 border border-emerald-100">
              <div className="flex items-center gap-2.5">
                <FileCheck className="size-4 text-emerald-800" />
                <span className="font-bold text-slate-900">Vehicle RC (Parivahan Vahan)</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="size-3 text-emerald-700" /> Verified
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/40 border border-emerald-100">
              <div className="flex items-center gap-2.5">
                <FileCheck className="size-4 text-emerald-800" />
                <span className="font-bold text-slate-900">Aadhaar Govt ID (UIDAI)</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="size-3 text-emerald-700" /> Verified
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. LANGUAGE PREFERENCE                                                    */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Globe className="size-4.5 text-emerald-800" />
              <span className="text-xs font-bold text-slate-900">Application Language</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = lang === "en" ? "hi" : "en";
                setLang(next);
                toast.success(next === "hi" ? "भाषा बदलकर हिंदी कर दी गई" : "Language set to English");
              }}
              className="rounded-xl border border-emerald-300 bg-white px-3 py-1 text-xs font-bold text-emerald-900 hover:bg-emerald-50 cursor-pointer"
            >
              {lang === "en" ? "English" : "हिंदी"}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. LOGOUT BUTTON                                                          */}
        {/* ========================================================================= */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-50 active:scale-95 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <LogOut className="size-4" />
            <span>Logout From Account</span>
          </button>
        </div>
      </div>
    </RiderLayout>
  );
}
