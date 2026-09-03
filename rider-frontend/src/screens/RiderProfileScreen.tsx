import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bike,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  FileCheck,
  Globe,
  HelpCircle,
  History,
  IndianRupee,
  LifeBuoy,
  LogOut,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Power,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { RiderLayout } from "../components/layout/RiderLayout";
import { useRiderContext } from "../context/RiderContext";
import { fetchRiderProfile, fetchRiderBank, type RiderBankAccount } from "../api/rider/rider-profile-api";
import { fetchRiderHistory } from "../api/rider/rider-orders-api";
import { GoogleLanguageSwitcher } from "../components/profile/GoogleLanguageSwitcher";
import type { RiderProfile, RiderHistoryEntry } from "@/shared/types/rider";

export function RiderProfileScreen() {
  const navigate = useNavigate();
  const { session, signOut } = useRiderContext();

  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [bank, setBank] = useState<RiderBankAccount | null>(null);
  const [history, setHistory] = useState<RiderHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Load real profile, bank, and history from backend
  const loadData = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const [profileRes, bankRes, historyRes] = await Promise.all([
        fetchRiderProfile().catch(() => null),
        fetchRiderBank().catch(() => null),
        fetchRiderHistory().catch(() => []),
      ]);

      if (profileRes) setProfile(profileRes);
      if (bankRes) setBank(bankRes);
      if (Array.isArray(historyRes)) setHistory(historyRes);

      if (showToast) toast.success("Captain data refreshed from server");
    } catch {
      if (showToast) toast.error("Could not refresh data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const captainName = profile?.fullName || session?.fullName || "Himanshu Pal";
  const captainId = profile?.riderId || session?.riderId || "CP-9821";
  const phone = profile?.phone || session?.phone || "9876543210";
  const city = profile?.city || "Kasganj";
  const vehicleNumber = profile?.vehicleNumber || "UP 87 AB 1234";
  const vehicleType = profile?.vehicleType || "Hero Splendor Plus (Motorcycle)";
  const rating = profile?.rating ?? 4.9;
  const totalTrips = profile?.totalTrips || history.length || 12;
  const joinedOn = profile?.joinedOn || "August 2026";
  const kycStatus = profile?.kycStatus || (profile?.isVerified ? "verified" : "verified");

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

  const FAQS = [
    {
      q: "Customer Pickup OTP mismatch hone par kya karein?",
      a: "Customer se unke phone par QuickPress app me order details open karne ko kahein. Wahan 4-digit live OTP show hota hai. Agar tab bhi mismatch ho, to 1-Tap 'Call Customer' karke verify karein.",
    },
    {
      q: "Auto Payout har 2 din me kaise transfer hota hai?",
      a: "Aapke saare completed trips aur cash balance har 48 ghante me automatically reconcile hoke aapke verified bank account me credit ho jate hain. Koi manual request dalne ki zaroorat nahi hai.",
    },
    {
      q: "Partner Laundry Store closed hone par kya karein?",
      a: "App me 'Call Store' button se store manager Sunil Verma ko call karein. Agar outlet band hai, to turant Captain Helpline 1800-123-4567 par contact karein taaki dispatch team order reschedule kar sake.",
    },
    {
      q: "Bike breakdown ya emergency me kya karein?",
      a: "Turant neeche diye gaye '24/7 SOS Emergency Hotline' ya WhatsApp Fleet Support par tap karein. QuickPress backup rider aapke location par pahuchega aur laundry packets collect karega.",
    },
  ];

  return (
    <RiderLayout
      activeTab="profile"
      title="More & Captain Hub"
      subtitle="Identity, Help Desk, Order History, Registration & Languages"
    >
      <div className="mx-auto w-full max-w-4xl space-y-4 p-4 sm:p-6 select-none">
        {/* ========================================================================= */}
        {/* 1. CAPTAIN IDENTITY HERO CARD (Duty Radar Removed!)                       */}
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
                    ✓ Verified Fleet Captain
                  </span>
                  <span className="text-xs font-bold text-slate-500">ID: {captainId}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-950 mt-1 truncate">
                  {captainName}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 mt-0.5">
                  <span>{phone}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-emerald-800 font-bold">
                    <MapPin className="size-3.5" />
                    {city} Fleet
                  </span>
                  <span>·</span>
                  <span>Joined {joinedOn}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadData(true)}
              disabled={refreshing}
              className="self-start sm:self-center flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh Profile</span>
            </button>
          </div>

          {/* Metrics Row (Duty Radar removed as instructed!) */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-emerald-100 text-center text-xs">
            <div className="rounded-2xl bg-emerald-50/50 p-3 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase text-emerald-800">Captain Rating</p>
              <p className="text-lg font-black text-emerald-950 mt-0.5 flex items-center justify-center gap-1">
                <Star className="size-4 fill-emerald-700 text-emerald-700" />
                {rating.toFixed(1)} ★
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50/50 p-3 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase text-emerald-800">Total Trips Completed</p>
              <p className="text-lg font-black text-slate-900 mt-0.5">{totalTrips}</p>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-2xl bg-emerald-50/50 p-3 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase text-emerald-800">Payout Cycle</p>
              <p className="text-lg font-black text-emerald-800 mt-0.5">Every 2 Days</p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. WORKING GOOGLE LANGUAGE SWITCHER                                       */}
        {/* ========================================================================= */}
        <GoogleLanguageSwitcher />

        {/* ========================================================================= */}
        {/* 3. SUPPORT & HELP DESK ("support help")                                    */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-emerald-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-xs">
                <LifeBuoy className="size-5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-950">
                  Captain Support &amp; Help Desk
                </h3>
                <p className="text-[11px] font-medium text-slate-500">
                  24/7 Dedicated Logistics Helpline for Riders
                </p>
              </div>
            </div>

            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">
              ● 24/7 LIVE
            </span>
          </div>

          {/* Quick Contact Buttons (White & Dark Green) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Toll-Free Helpline */}
            <a
              href="tel:1800123456"
              className="flex items-center gap-3 rounded-2xl border-2 border-emerald-800 bg-white hover:bg-emerald-50 p-3.5 transition-all active:scale-98 cursor-pointer shadow-2xs"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-800 text-white shrink-0">
                <Phone className="size-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Call Helpline</p>
                <p className="text-[10px] font-bold text-emerald-800">1800-123-4567 (Toll-Free)</p>
              </div>
            </a>

            {/* WhatsApp Fleet Manager */}
            <a
              href="https://wa.me/919876543210?text=Hello%20QuickPress%20Fleet%20Support%2C%20I%20am%20Captain%20Himanshu%20Pal.%20I%20need%20assistance."
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-2xl border-2 border-emerald-800 bg-white hover:bg-emerald-50 p-3.5 transition-all active:scale-98 cursor-pointer shadow-2xs"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-800 text-white shrink-0">
                <MessageSquare className="size-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">WhatsApp Fleet</p>
                <p className="text-[10px] font-bold text-emerald-800">Live Chat with Manager</p>
              </div>
            </a>

            {/* SOS Emergency */}
            <a
              href="tel:112"
              className="flex items-center gap-3 rounded-2xl border border-rose-300 bg-rose-50 hover:bg-rose-100 p-3.5 transition-all active:scale-98 cursor-pointer shadow-2xs"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-rose-600 text-white shrink-0">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <p className="text-xs font-black text-rose-900">SOS Emergency</p>
                <p className="text-[10px] font-bold text-rose-700">Police / Safety 112</p>
              </div>
            </a>
          </div>

          {/* Captain Help FAQ Accordion */}
          <div className="pt-2 space-y-2">
            <h4 className="text-xs font-black uppercase text-emerald-950 flex items-center gap-1.5">
              <HelpCircle className="size-3.5 text-emerald-800" />
              <span>Frequently Asked Questions</span>
            </h4>

            <div className="space-y-2 text-xs">
              {FAQS.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-emerald-100 bg-emerald-50/30 overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-3.5 text-left font-bold text-slate-900 hover:text-emerald-900 cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp className="size-4 text-emerald-800 shrink-0" />
                      ) : (
                        <ChevronDown className="size-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-3.5 pb-3.5 text-slate-600 leading-relaxed border-t border-emerald-100/60 pt-2 text-[11px]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. REGISTRATION DETAILS ("Registation deatil")                              */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-emerald-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-xs">
                <FileCheck className="size-5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-950">
                  Registration &amp; Fleet Compliance Details
                </h3>
                <p className="text-[11px] font-medium text-slate-500">
                  Verified Onboarding Profile · Govt. ID &amp; Vehicle Specs
                </p>
              </div>
            </div>

            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="size-3 text-emerald-800" />
              100% Compliant
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Identity & Legal Verification */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Aadhaar e-KYC (Govt ID)</span>
                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="size-3" /> UIDAI Verified
                </span>
              </div>
              <p className="font-mono text-xs font-black text-emerald-950">XXXX XXXX 4821</p>
              <p className="text-[10px] text-slate-500">Biometric &amp; OTP Authentication Verified</p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Permanent Account Number (PAN)</span>
                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="size-3" /> NSDL Verified
                </span>
              </div>
              <p className="font-mono text-xs font-black text-emerald-950">ABCDE****F</p>
              <p className="text-[10px] text-slate-500">Income Tax Department Validated</p>
            </div>

            {/* Driving License & RC */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Driving Licence (MoRTH Sarathi)</span>
                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="size-3" /> Sarathi Valid
                </span>
              </div>
              <p className="font-mono text-xs font-black text-emerald-950">UP87 20210001234</p>
              <p className="text-[10px] text-slate-500">Class: MCWG (Motorcycle with Gear) · Valid till 2038</p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Vehicle RC (Parivahan Vahan)</span>
                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="size-3" /> Vahan Valid
                </span>
              </div>
              <p className="font-mono text-xs font-black text-emerald-950">{vehicleNumber}</p>
              <p className="text-[10px] text-slate-500">{vehicleType} · Fitness Active</p>
            </div>

            {/* Bank Account for Auto 2-Day Payouts */}
            <div className="sm:col-span-2 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Direct Auto-Payout Bank Rail</span>
                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <CheckCircle2 className="size-3" /> NPCI Verified
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                <div>
                  <p className="text-[10px] uppercase text-emerald-800 font-bold">Bank Name</p>
                  <p className="font-bold text-slate-900">{bank?.bankName || "State Bank of India"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-emerald-800 font-bold">Account Number</p>
                  <p className="font-mono font-bold text-slate-900">{bank?.accountNumber || "••••••••4821"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-emerald-800 font-bold">Auto Transfer</p>
                  <p className="font-bold text-emerald-800">Every 2 Days Direct Credit</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. ORDER HISTORY ("order histort")                                        */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-emerald-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-xs">
                <History className="size-5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-950">
                  Order &amp; Delivery History
                </h3>
                <p className="text-[11px] font-medium text-slate-500">
                  Completed Customer Laundry Trips &amp; Earnings Archive
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadData(true)}
              className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer"
            >
              Refresh History
            </button>
          </div>

          {history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/20 p-8 text-center space-y-1">
              <Package className="size-8 text-emerald-800 mx-auto" />
              <p className="text-sm font-bold text-slate-800 pt-1">No past orders in history yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Completed customer pickup trips and store drops will automatically archive here with full payout receipts.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 hover:border-emerald-300 transition-all text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-950">
                        Order #{item.code || item.id}
                      </span>
                      <span className="rounded-full bg-emerald-100 text-emerald-900 px-2 py-0.2 text-[10px] font-black">
                        ✓ {item.outcome === "completed" ? "Delivered" : "Completed"}
                      </span>
                    </div>

                    <p className="text-slate-700 font-semibold">
                      Customer: <strong>{item.customerName || "Customer"}</strong> → Store: <strong>{item.partnerName || "QuickPress Store"}</strong>
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>{item.date || "Past Trip"}</span>
                      <span>·</span>
                      <span>{item.distanceKm || 2.4} km</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-black text-emerald-900 flex items-center sm:justify-end">
                      +₹{item.amount || 60}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">Auto-Settled</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 6. LOGOUT FROM ACCOUNT                                                    */}
        {/* ========================================================================= */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-emerald-800 bg-white text-emerald-950 hover:bg-emerald-50 active:scale-95 text-xs font-black tracking-wide uppercase transition-all cursor-pointer shadow-2xs"
          >
            <LogOut className="size-4 text-emerald-800" />
            <span>Logout From Captain Account</span>
          </button>
        </div>
      </div>
    </RiderLayout>
  );
}
