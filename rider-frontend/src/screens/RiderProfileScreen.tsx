import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BadgeCheck,
  Bike,
  CheckCircle2,
  FileCheck,
  Globe,
  LogOut,
  Phone,
  Power,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { RiderLayout } from "../components/layout/RiderLayout";
import { useRiderContext } from "../context/RiderContext";

export function RiderProfileScreen() {
  const navigate = useNavigate();
  const { session, signOut, isOnline, setOnline } = useRiderContext();
  const [lang, setLang] = useState<"en" | "hi">("en");

  const captainName = session?.fullName || "Delivery Captain";
  const captainId = session?.riderId || "CP-9821";
  const phone = session?.phone || "+91 98765 43210";

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
        {/* Profile Card (Partner style) */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex size-16 sm:size-18 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-black text-2xl shadow-md">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-200">
                  Verified Captain
                </span>
                <span className="text-xs font-bold text-slate-400">ID: {captainId}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 mt-1 truncate">
                {captainName}
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{phone}</p>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Bike className="size-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900">Registered Delivery Vehicle</h3>
                <p className="text-[11px] font-medium text-slate-500">Two Wheeler · Active Duty</p>
              </div>
            </div>
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Active
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Vehicle Type</p>
              <p className="font-bold text-slate-900">Motorcycle (Bike)</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Plate Number</p>
              <p className="font-bold text-slate-900 uppercase">UP 87 AB 1234</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Fuel Type</p>
              <p className="font-bold text-slate-900">Petrol</p>
            </div>
          </div>
        </div>

        {/* KYC Documents Verification */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
            Verified Documents
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <FileCheck className="size-4 text-emerald-600" />
                <span className="font-bold text-slate-900">Driving Licence</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="size-3" /> Verified
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <FileCheck className="size-4 text-emerald-600" />
                <span className="font-bold text-slate-900">Vehicle RC Book</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="size-3" /> Verified
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <FileCheck className="size-4 text-emerald-600" />
                <span className="font-bold text-slate-900">Aadhaar Card (Govt ID)</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="size-3" /> Verified
              </span>
            </div>
          </div>
        </div>

        {/* Preferences & Language */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Globe className="size-4.5 text-slate-600" />
              <span className="text-xs font-bold text-slate-900">Application Language</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = lang === "en" ? "hi" : "en";
                setLang(next);
                toast.success(next === "hi" ? "भाषा बदलकर हिंदी कर दी गई" : "Language set to English");
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              {lang === "en" ? "English" : "हिंदी"}
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="size-4" />
            <span>Logout From Account</span>
          </button>
        </div>
      </div>
    </RiderLayout>
  );
}
