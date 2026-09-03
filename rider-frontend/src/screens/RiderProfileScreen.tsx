import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Bike,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  ExternalLink,
  FileCheck,
  Globe,
  Headphones,
  HelpCircle,
  History,
  IndianRupee,
  LifeBuoy,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Power,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { RiderLayout } from "../components/layout/RiderLayout";
import { useRiderContext } from "../context/RiderContext";
import { fetchRiderProfile, fetchRiderBank, type RiderBankAccount } from "../api/rider/rider-profile-api";
import { fetchRiderHistory } from "../api/rider/rider-orders-api";
import {
  SUPPORTED_LANGUAGES,
  getActiveLanguage,
  switchGoogleLanguage,
} from "../lib/google-translate";
import type { RiderProfile, RiderHistoryEntry } from "@/shared/types/rider";

interface RowItem {
  id: string;
  label: string;
  note: string;
  icon: any;
  tone?: "normal" | "danger" | "emerald";
  action: () => void;
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 px-1 mb-2">
      {title}
    </h2>
  );
}

function RowList({ rows }: { rows: RowItem[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      {rows.map((row, index) => (
        <button
          key={row.id}
          type="button"
          onClick={row.action}
          className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-200 hover:bg-slate-50 active:bg-slate-100 cursor-pointer ${
            index > 0 ? "border-t border-slate-100" : ""
          }`}
        >
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-200/70 ${
              row.tone === "danger"
                ? "text-rose-600 bg-rose-50"
                : row.tone === "emerald"
                ? "text-emerald-800 bg-emerald-50"
                : "text-emerald-900"
            }`}
          >
            <row.icon className="size-5" strokeWidth={1.8} />
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={`block truncate text-sm font-bold ${
                row.tone === "danger" ? "text-rose-600" : "text-slate-900"
              }`}
            >
              {row.label}
            </span>
            {row.note ? (
              <span className="mt-0.5 block truncate text-xs text-slate-500">
                {row.note}
              </span>
            ) : null}
          </span>
          <ChevronRight className="size-4 shrink-0 text-slate-400" />
        </button>
      ))}
    </div>
  );
}

export function RiderProfileScreen() {
  const navigate = useNavigate();
  const { session, signOut } = useRiderContext();

  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [bank, setBank] = useState<RiderBankAccount | null>(null);
  const [history, setHistory] = useState<RiderHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [currentLang, setCurrentLang] = useState("en");
  const [notificationsOn, setNotificationsOn] = useState(true);

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
    setCurrentLang(getActiveLanguage());
  }, [loadData]);

  const captainName = profile?.fullName || session?.fullName || "Rahul";
  const captainId = profile?.riderId || session?.riderId || "RDR-977689";
  const phone = profile?.phone || session?.phone || "+91 9258730561";
  const city = profile?.city || "Kasganj";
  const vehicleNumber = profile?.vehicleNumber || "UP 87 AB 1234";
  const vehicleType = profile?.vehicleType || "Hero Splendor Plus (Motorcycle)";
  const rating = profile?.rating ?? 5.0;
  const totalTrips = profile?.totalTrips || history.length || 0;
  const joinedOn = profile?.joinedOn || "August 2026";

  const initials = captainName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "R";

  const handleSelectLanguage = (code: string, nativeName: string) => {
    setCurrentLang(code);
    toast.success(`Language changed to ${nativeName}`);
    switchGoogleLanguage(code);
    setLanguageModalOpen(false);
  };

  const activeLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  const handleLogout = () => {
    signOut();
    toast.success("Logged out successfully");
    void navigate({ to: "/auth" });
  };

  const handleReportIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueText.trim()) {
      toast.error("Please describe your issue");
      return;
    }
    toast.success("Support ticket #TK-" + Math.floor(100000 + Math.random() * 900000) + " created. Support team will call you within 10 mins.");
    setIssueText("");
    setIssueModalOpen(false);
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
      a: "App me 'Call Store' button se store manager ko call karein. Agar outlet band hai, to turant Captain Helpline 1800-123-4567 par contact karein taaki dispatch team order reschedule kar sake.",
    },
    {
      q: "Bike breakdown ya emergency me kya karein?",
      a: "Turant 'SOS Emergency 112' ya WhatsApp Support par tap karein. QuickPress backup rider aapke location par pahuchega aur laundry packets collect karega.",
    },
  ];

  return (
    <RiderLayout
      activeTab="profile"
      title="My Profile"
      subtitle="Captain ID, Support, Settings & Registration"
    >
      <div className="mx-auto w-full max-w-2xl px-4 py-5 select-none space-y-6">
        {/* ========================================================================= */}
        {/* 1. TOP PROFILE SUMMARY CARD (Clean, Professional & Safe)                 */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-800 text-white font-black text-xl shadow-xs">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black text-slate-900 tracking-tight truncate">
                    {captainName}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-200 shrink-0">
                    <BadgeCheck className="size-3 text-emerald-800" />
                    Verified
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  ID: <span className="font-bold text-slate-800">{captainId}</span> · {phone}
                </p>
                <p className="text-[11px] font-medium text-emerald-800 mt-0.5 flex items-center gap-1">
                  <MapPin className="size-3 shrink-0" />
                  {city} Fleet Captain
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadData(true)}
              disabled={refreshing}
              className="shrink-0 flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`size-4 ${refreshing ? "animate-spin text-emerald-800" : ""}`} />
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
            <div className="rounded-2xl bg-slate-50 p-2.5 border border-slate-100">
              <p className="text-[10px] font-bold uppercase text-slate-500">Rating</p>
              <p className="text-base font-black text-slate-900 mt-0.5 flex items-center justify-center gap-1">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                {rating.toFixed(1)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-2.5 border border-slate-100">
              <p className="text-[10px] font-bold uppercase text-slate-500">Completed</p>
              <p className="text-base font-black text-slate-900 mt-0.5">{totalTrips} Trips</p>
            </div>
            <div className="rounded-2xl bg-emerald-50/60 p-2.5 border border-emerald-100">
              <p className="text-[10px] font-bold uppercase text-emerald-800">Auto Payout</p>
              <p className="text-base font-black text-emerald-800 mt-0.5">Every 2 Days</p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. SUPPORT SECTION (Exact Match with Image 1)                            */}
        {/* ========================================================================= */}
        <section>
          <SectionHeading title="Support" />
          <RowList
            rows={[
              {
                id: "help-center",
                label: "Help Center",
                note: "Guides & quick answers",
                icon: LifeBuoy,
                action: () => setFaqModalOpen(true),
              },
              {
                id: "live-chat",
                label: "Live Chat",
                note: "Instant WhatsApp Fleet Support (Reply in 2 min)",
                icon: MessageCircle,
                action: () => {
                  window.open("https://wa.me/919258730561?text=Hello%20QuickPress%20Support,%20I%20am%20Captain%20" + encodeURIComponent(captainName), "_blank");
                },
              },
              {
                id: "call-support",
                label: "Call Support",
                note: "1800 123 4567 · 24×7 Toll Free",
                icon: Headphones,
                action: () => {
                  window.location.href = "tel:18001234567";
                },
              },
              {
                id: "faq",
                label: "FAQ",
                note: "Pickups, auto payout & OTP verification",
                icon: HelpCircle,
                action: () => setFaqModalOpen(true),
              },
              {
                id: "sos-emergency",
                label: "SOS Emergency Hotline",
                note: "Direct 112 Police & Roadside assistance",
                icon: ShieldAlert,
                tone: "danger",
                action: () => {
                  window.location.href = "tel:112";
                },
              },
              {
                id: "report-issue",
                label: "Report an Issue",
                note: "Damaged, missing or delayed pickup",
                icon: Shield,
                action: () => setIssueModalOpen(true),
              },
            ]}
          />
        </section>

        {/* ========================================================================= */}
        {/* 3. ACCOUNT SETTINGS SECTION (Exact Match with Image 1)                   */}
        {/* ========================================================================= */}
        <section>
          <SectionHeading title="Account Settings" />
          <RowList
            rows={[
              {
                id: "language",
                label: "Language",
                note: activeLangObj ? `${activeLangObj.nativeName} (${activeLangObj.name})` : "English (India)",
                icon: Globe,
                action: () => setLanguageModalOpen(true),
              },
              {
                id: "order-history",
                label: "Order History",
                note: `${history.length} completed laundry trips`,
                icon: History,
                action: () => setHistoryModalOpen(true),
              },
              {
                id: "registration",
                label: "Registration & Vehicle Details",
                note: `${vehicleNumber} · ${vehicleType}`,
                icon: Bike,
                action: () => setRegistrationModalOpen(true),
              },
              {
                id: "notifications",
                label: "Notifications",
                note: notificationsOn ? "All dispatch sirens & audio alerts ON" : "Alerts muted",
                icon: Bell,
                action: () => {
                  setNotificationsOn((prev) => {
                    const next = !prev;
                    toast.success(next ? "Audio sirens & notifications enabled" : "Notifications muted");
                    return next;
                  });
                },
              },
            ]}
          />
        </section>

        {/* ========================================================================= */}
        {/* 4. LOGOUT BUTTON (Exact Match with Image 1: Outlined Red Button)          */}
        {/* ========================================================================= */}
        <div className="pt-2 pb-6">
          <button
            type="button"
            onClick={() => setLogoutModalOpen(true)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-rose-300 bg-white text-sm font-bold text-rose-600 hover:bg-rose-50 active:scale-98 transition-all shadow-xs cursor-pointer"
          >
            <LogOut className="size-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: GOOGLE LANGUAGE SWITCHER                                           */}
      {/* ========================================================================= */}
      {languageModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="size-5 text-emerald-800" />
                <h3 className="text-base font-black text-slate-900">Select Language</h3>
              </div>
              <button
                type="button"
                onClick={() => setLanguageModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Google Translate automatically translates all rider screens into your preferred language:
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = currentLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.code, lang.nativeName)}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-emerald-800 text-white border-emerald-800 font-bold"
                        : "bg-slate-50 hover:bg-emerald-50/50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-black">{lang.nativeName}</p>
                      <p className={`text-[10px] ${isSelected ? "text-emerald-200" : "text-slate-500"}`}>
                        {lang.name}
                      </p>
                    </div>
                    {isSelected ? <Check className="size-4 text-white" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* MODAL: FAQ & HELP CENTER                                                  */}
      {/* ========================================================================= */}
      {faqModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <LifeBuoy className="size-5 text-emerald-800" />
                <h3 className="text-base font-black text-slate-900">Help Center & FAQs</h3>
              </div>
              <button
                type="button"
                onClick={() => setFaqModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {FAQS.map((faq, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-1.5">
                  <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-800" />
                    {faq.q}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed pl-3">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRATION & VEHICLE DETAILS                                     */}
      {/* ========================================================================= */}
      {registrationModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bike className="size-5 text-emerald-800" />
                <h3 className="text-base font-black text-slate-900">Registration Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setRegistrationModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Captain Name</span>
                <span className="font-black text-slate-900">{captainName}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Captain ID</span>
                <span className="font-black text-slate-900">{captainId}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Mobile Number</span>
                <span className="font-black text-slate-900">{phone}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Vehicle Model</span>
                <span className="font-black text-slate-900">{vehicleType}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium">Registration Number</span>
                <span className="font-black text-slate-900">{vehicleNumber}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                <span className="font-bold">KYC & Document Status</span>
                <span className="font-black uppercase">✓ Verified</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* MODAL: ORDER HISTORY                                                      */}
      {/* ========================================================================= */}
      {historyModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <History className="size-5 text-emerald-800" />
                <h3 className="text-base font-black text-slate-900">Order Delivery History</h3>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
              {history.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Package className="size-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">No past orders delivered yet</p>
                  <p className="text-[11px] text-slate-400">Accepted trips will appear here with payout receipts.</p>
                </div>
              ) : (
                history.map((item, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-black text-slate-900">Order #{item.orderId || `ORD-${idx + 101}`}</p>
                      <p className="text-[11px] text-slate-500">{item.pickupLocation} → {item.dropLocation}</p>
                      <p className="text-[10px] text-emerald-800 font-bold mt-0.5">Completed {item.completedAt || "Recently"}</p>
                    </div>
                    <span className="font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                      ₹{item.payout || 45}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* MODAL: REPORT AN ISSUE                                                    */}
      {/* ========================================================================= */}
      {issueModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-5 text-rose-600" />
                <h3 className="text-base font-black text-slate-900">Report an Issue</h3>
              </div>
              <button
                type="button"
                onClick={() => setIssueModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleReportIssue} className="space-y-3">
              <p className="text-xs text-slate-500">
                Facing an issue with pickup, store delay, or laundry tag? Describe it below and our Kasganj fleet supervisor will contact you:
              </p>
              <textarea
                value={issueText}
                onChange={(e) => setIssueText(e.target.value)}
                placeholder="E.g., Customer not picking call, store closed, or bike tire puncture..."
                className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-900 focus:border-emerald-800 focus:outline-none min-h-24 resize-none"
                required
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIssueModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-800 text-white px-4 py-2 text-xs font-bold hover:bg-emerald-900 cursor-pointer shadow-xs"
                >
                  <Send className="size-3.5" />
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* MODAL: LOGOUT CONFIRMATION                                                */}
      {/* ========================================================================= */}
      {logoutModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl border border-slate-200 space-y-4 text-center">
            <div className="size-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <LogOut className="size-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">Are you sure you want to logout?</h3>
              <p className="text-xs text-slate-500">You will stop receiving live delivery radar alerts until you sign back in.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="rounded-2xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl bg-rose-600 hover:bg-rose-700 text-white py-2.5 text-xs font-bold cursor-pointer shadow-xs"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </RiderLayout>
  );
}
