import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Camera,
  ChevronRight,
  Clock,
  CreditCard,
  Crown,
  Gift,
  Globe,
  Headphones,
  Heart,
  HelpCircle,
  LifeBuoy,
  Loader2,
  Lock,
  Monitor,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  Package,
  Pencil,
  RefreshCw,
  Phone,
  Plus,
  Receipt,
  Settings,
  ShieldAlert,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Truck,
  User,
  Wallet,
  WifiOff,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { BottomNav } from "@/components/home/BottomNav";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { Toaster } from "@/shared/ui/sonner";
import {
  deleteCustomerAccount,
  fetchProfileData,
  logout,
  updateProfile,
  updateProfilePhoto,
  validateProfile,
  type ProfileData,
} from "@/api/customer/profile-api";
import { isOnline, onNetworkChange } from "@/api/customer/api/network";
import type { NotificationPreferences, ThemeMode } from "@/api/customer/settings-api";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { readSavedLocation } from "@/api/customer/services/location-service";
import defaultAvatar from "@/shared/assets/default-avatar.jpg";


const THEME_OPTIONS: { id: ThemeMode; label: string; icon: LucideIcon }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

const NOTIFICATION_ROWS: { id: keyof NotificationPreferences; label: string; note: string }[] = [
  { id: "orderUpdates", label: "Order updates", note: "Pickup, wash and delivery status" },
  { id: "deliveryAlerts", label: "Delivery alerts", note: "When your rider is on the way" },
  { id: "promotions", label: "Offers & promotions", note: "Discounts and cashback deals" },
  { id: "email", label: "Email", note: "Invoices and receipts" },
  { id: "sms", label: "SMS", note: "Critical updates only" },
  { id: "push", label: "Push notifications", note: "On this device" },
];

/** Accessible on/off switch built from the design tokens. */
function Toggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 disabled:opacity-50 ${
        checked ? "bg-brand-green" : "bg-muted"
      }`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-card shadow-soft transition-transform duration-300 ${
          checked ? "translate-x-[1.35rem]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — QuickPress Account, Wallet & Membership" },
      {
        name: "description",
        content:
          "Manage your QuickPress account: edit profile, saved addresses, payment methods, wallet balance, Premium membership, orders and support — all in one place.",
      },
      { property: "og:title", content: "My Profile — QuickPress Account, Wallet & Membership" },
      {
        property: "og:description",
        content:
          "Edit your profile, manage addresses and payments, top up your QuickPress wallet and track your Premium membership.",
      },
    ],
  }),
  component: ProfileScreen,
});

type Row = {
  id: string;
  label: string;
  note?: string;
  icon: LucideIcon;
  tone?: "default" | "danger";
  action?: () => void;
  trailing?: "chevron" | "switch" | "soon";
};

function SectionHeading({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 className="text-[15px] font-bold tracking-tight text-foreground">{title}</h2>
      {action ? (
        <button
          type="button"
          className="text-xs font-bold text-brand-green transition-opacity active:opacity-60"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}

function RowList({ rows }: { rows: Row[] }) {
  return (
    <div className="card-soft mt-4 overflow-hidden border border-border">
      {rows.map((row, index) => (
        <button
          key={row.id}
          type="button"
          onClick={row.action}
          className={`ripple flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-300 hover:bg-muted/70 active:bg-muted ${
            index > 0 ? "border-t border-border" : ""
          }`}
        >
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-xs border border-border/40 dark:bg-zinc-900 dark:border-zinc-800 ${
              row.tone === "danger"
                ? "text-destructive"
                : "text-brand-dark"
            }`}
          >
            <row.icon className="size-[1.1rem]" strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={`block truncate text-sm font-bold ${
                row.tone === "danger" ? "text-destructive" : "text-foreground"
              }`}
            >
              {row.label}
            </span>
            {row.note ? (
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {row.note}
              </span>
            ) : null}
          </span>
          {row.trailing === "soon" ? (
            <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Soon
            </span>
          ) : (
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          )}
        </button>
      ))}
    </div>
  );
}

function ProfileScreen() {
  useAuthGuard();
  const navigate = useNavigate();
  const [data, setData] = useState<ProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", city: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [offline, setOffline] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const photoInput = useRef<HTMLInputElement | null>(null);
  const settings = useAppSettings();
  const activeLocation = readSavedLocation();

  const load = useCallback(async (forceRefresh = false) => {
    setLoadError(null);
    try {
      const next = await fetchProfileData({ forceRefresh });
      setData(next);
      setForm({ name: next.user.name, email: next.user.email, city: next.user.city });
    } catch {
      setLoadError(
        isOnline()
          ? "We couldn't load your profile."
          : "You're offline. Connect to load your profile.",
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setOffline(!isOnline());
    return onNetworkChange((online) => {
      setOffline(!online);
      if (online) void load(true);
    });
  }, [load]);

  const retry = async () => {
    setRetrying(true);
    await load(true);
    setRetrying(false);
  };

  /** POST /api/profile/photo — read locally, upload as a data URL. */
  const handlePhotoFile = async (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Choose a JPG or PNG image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be 5 MB or smaller");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("read-failed"));
        reader.readAsDataURL(file);
      });
      const avatarUrl = await updateProfilePhoto(dataUrl);
      setData((prev) => (prev ? { ...prev, user: { ...prev.user, avatarUrl } } : prev));
      toast.success("Profile photo updated");
    } catch {
      toast.error("Couldn't update your photo. Please try again.");
    } finally {
      setUploading(false);
      if (photoInput.current) photoInput.current.value = "";
    }
  };

  const soon = (label: string) => toast(`${label} — coming soon`);

  const themeLabel =
    THEME_OPTIONS.find((option) => option.id === settings.settings.theme)?.label ?? "System";
  const enabledNotifications = NOTIFICATION_ROWS.filter(
    (row) => settings.settings.notifications[row.id],
  ).length;

  const changeTheme = async (mode: ThemeMode) => {
    try {
      await settings.setTheme(mode);
      toast.success(`${THEME_OPTIONS.find((o) => o.id === mode)?.label} theme applied`);
    } catch {
      toast.error("Couldn't save your theme");
    }
  };

  const changeLanguage = async (code: string) => {
    try {
      await settings.setLanguage(code);
      toast.success(code.startsWith("hi") ? "भाषा हिन्दी में सेट की गई" : "Language set to English");
    } catch {
      toast.error("Couldn't save language preference");
    }
  };

  const toggleNotification = async (key: keyof NotificationPreferences) => {
    try {
      await settings.toggleNotification(key);
      toast.success("Notification preference updated");
    } catch {
      toast.error("Couldn't save that preference");
    }
  };

  const handleSave = async () => {
    if (!data) return;
    const errors = validateProfile(form);
    setFormErrors(errors as Record<string, string>);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      const payloadCity = activeLocation?.city || form.city || "Kasganj";
      const saved = await updateProfile({ name: form.name, email: form.email, city: payloadCity });
      setData({ ...data, user: { ...data.user, ...saved } });
      setEditing(false);
      toast.success("Profile updated");
    } catch {
      toast.error(
        isOnline() ? "Couldn't save your profile" : "You're offline — changes not saved",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
    setLogoutOpen(false);
    toast.success("You've been logged out");
    navigate({ to: "/home" });
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteCustomerAccount();
      setDeleting(false);
      setDeleteOpen(false);
      toast.success("Your QuickPress account has been permanently deleted.");
      navigate({ to: "/login" });
    } catch {
      setDeleting(false);
      toast.error("Couldn't delete your account. Please try again.");
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-white dark:bg-zinc-950">
      <div className="relative mx-auto w-full max-w-md">
        {/* Top app bar */}
        <header className="glass-panel sticky top-0 z-30 flex items-center justify-between gap-3 border-x-0 border-t-0 px-5 py-3">
          <h1 className="text-lg font-bold tracking-tight text-foreground">My Profile</h1>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => navigate({ to: "/notifications" })}
              className="relative flex size-10 items-center justify-center rounded-2xl bg-white text-foreground shadow-xs border border-border/50 transition-all duration-300 hover:bg-accent active:scale-[0.94] dark:bg-zinc-900 dark:border-zinc-800"
            >
              <Bell className="size-5" />
              {data && data.user.unreadNotifications > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-secondary-foreground">
                  {data.user.unreadNotifications}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              aria-label="Settings"
              onClick={() => setSettingsOpen(true)}
              className="flex size-10 items-center justify-center rounded-2xl bg-white text-foreground shadow-xs border border-border/50 transition-all duration-300 hover:bg-accent active:scale-[0.94] dark:bg-zinc-900 dark:border-zinc-800"
            >
              <Settings className="size-5" />
            </button>
          </div>
        </header>

        {offline ? (
          <div className="mx-5 mt-4 flex items-center gap-2 rounded-2xl border border-border bg-muted/70 px-4 py-2.5 text-xs font-semibold text-muted-foreground">
            <WifiOff className="size-4 shrink-0" />
            You're offline — showing your last saved profile.
          </div>
        ) : null}

        {!data && loadError ? (
          <div className="px-5 py-16 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-destructive/10 text-destructive">
              <ShieldAlert className="size-6" />
            </span>
            <h2 className="mt-4 text-base font-bold tracking-tight text-foreground">
              {loadError}
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Check your connection and try again.
            </p>
            <button
              type="button"
              onClick={retry}
              disabled={retrying}
              className="ripple mx-auto mt-5 flex h-11 items-center justify-center gap-2 rounded-3xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97] disabled:opacity-60"
            >
              {retrying ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Try again
            </button>
          </div>
        ) : null}

        {!data && !loadError ? (
          <>
            <ProfileSkeleton />
          </>
        ) : null}

        {data ? (
          <div className="px-5 pb-32 pt-5">
            {/* Profile header — GET /api/profile */}
            <section className="card-soft relative overflow-hidden border border-border bg-gradient-to-br from-primary/25 via-card to-secondary/15 p-5">
              <div className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-primary/25 blur-2xl" />
              <div className="relative flex items-start gap-4">
                <div className="relative shrink-0">
                  <img
                    src={data.user.avatarUrl || defaultAvatar}
                    alt={`${data.user.name}'s profile photo`}
                    className="size-20 rounded-full object-cover shadow-soft border-2 border-white/80 dark:border-zinc-800 bg-white"
                  />
                  <button
                    type="button"
                    aria-label="Upload profile photo"
                    disabled={uploading}
                    onClick={() => photoInput.current?.click()}
                    className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-soft transition-transform duration-300 active:scale-[0.9]"
                  >
                    {uploading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Camera className="size-4" />
                    )}
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-lg font-bold leading-tight tracking-tight text-foreground">
                      {data.user.name}
                    </p>
                    {data.user.verified ? (
                      <BadgeCheck className="size-[1.05rem] shrink-0 text-brand-green" />
                    ) : null}
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="size-3.5 shrink-0" />
                    <span className="truncate">{data.user.phone}</span>
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="size-3.5 shrink-0" />
                    <span className="truncate">{data.user.email}</span>
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0 text-primary" />
                    <span className="truncate">
                      {activeLocation?.area
                        ? `${activeLocation.area}, ${activeLocation.city || ""}`
                        : (activeLocation?.city || data.user.city || "Kasganj, Uttar Pradesh")}
                    </span>
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                    <Clock className="size-3.5 shrink-0" />
                    Member since {data.user.memberSince}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditing(true)}
                className="ripple mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-3xl bg-primary text-sm font-bold text-primary-foreground shadow-cta transition-all duration-300 hover:brightness-[1.03] active:scale-[0.97]"
              >
                <Pencil className="size-4" />
                Edit Profile
              </button>
            </section>

            {/* Quick stats */}
            <section className="mt-4 grid grid-cols-2 gap-3">
              {[
                {
                  id: "orders",
                  label: "Total Orders",
                  value: String(data.stats?.totalOrders ?? 0),
                  icon: Package,
                  action: () => navigate({ to: "/history" }),
                },
                {
                  id: "points",
                  label: "Loyalty Points",
                  value: (data.stats?.rewardPoints ?? 0).toLocaleString("en-IN"),
                  icon: Star,
                  action: () => navigate({ to: "/referral" }),
                },
                {
                  id: "wallet",
                  label: "Wallet Balance",
                  value: `₹${(data.stats?.walletBalance ?? 0).toLocaleString("en-IN")}`,
                  icon: Wallet,
                  action: () => navigate({ to: "/wallet" }),
                },
                {
                  id: "addresses",
                  label: "Saved Addresses",
                  value: String(data.stats?.savedAddresses ?? 0),
                  icon: MapPin,
                  action: () => navigate({ to: "/addresses" }),
                },
              ].map((stat, index) => (
                <button
                  key={stat.id}
                  type="button"
                  onClick={stat.action} className="card-soft ripple flex flex-col items-start gap-3 border border-border p-4 text-left transition-all duration-300 hover:border-primary/60 active:scale-[0.96]"
                >
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-white text-brand-green shadow-xs border border-border/40 dark:bg-zinc-900 dark:border-zinc-800">
                    <stat.icon className="size-5" />
                  </span>
                  <span>
                    <span className="animate-pop block text-lg font-bold leading-tight text-foreground">
                      {stat.value}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-semibold text-muted-foreground">
                      {stat.label}
                    </span>
                  </span>
                </button>
              ))}
            </section>

            {/* Account — GET /api/addresses, GET /api/payment-methods, GET /api/orders, GET /api/wallet */}
            <section className="mt-8">
              <SectionHeading title="Account" />
              <RowList
                rows={[
                  {
                    id: "referral",
                    label: "Refer & Earn (Loyalty Points)",
                    note: "Share code, earn 50 Loyalty Points per friend",
                    icon: Gift,
                    action: () => navigate({ to: "/referral" }),
                  },
                  {
                    id: "wallet",
                    label: "QuickPress Wallet & Funds",
                    note: `₹${(data.stats?.walletBalance ?? 0).toLocaleString("en-IN")} · Add money & instant cashbacks`,
                    icon: Wallet,
                    action: () => navigate({ to: "/wallet" }),
                  },
                  {
                    id: "personal",
                    label: "Personal Information",
                    note: "Name, phone, email",
                    icon: User,
                    action: () => setEditing(true),
                  },
                  {
                    id: "addresses",
                    label: "Manage Addresses",
                    note: `${data.stats.savedAddresses} saved addresses`,
                    icon: MapPin,
                    action: () => navigate({ to: "/addresses" }),
                  },
                  {
                    id: "payments",
                    label: "Payment Methods",
                    note: "UPI, cards & netbanking",
                    icon: CreditCard,
                    action: () => navigate({ to: "/payment-methods" }),
                  },
                  {
                    id: "orders",
                    label: "My Orders",
                    note: `${data.stats.totalOrders} total orders · live & history`,
                    icon: Package,
                    action: () => navigate({ to: "/history" }),
                  },
                  {
                    id: "invoices",
                    label: "Invoices",
                    note: "GST bills & receipts",
                    icon: Receipt,
                    action: () => navigate({ to: "/invoices" }),
                  },
                  {
                    id: "services",
                    label: "Saved Services",
                    note: "Your go-to laundry services",
                    icon: Heart,
                    action: () => soon("Saved services"),
                  },
                  {
                    id: "stores",
                    label: "Favourite Laundry Stores",
                    note: "Partners you order from most",
                    icon: Sparkles,
                    action: () => soon("Favourite stores"),
                  },
                ]}
              />
            </section>

            {/* Support */}
            <section className="mt-8">
              <SectionHeading title="Support" />
              <RowList
                rows={[
                  {
                    id: "help",
                    label: "Help Center",
                    note: "Guides & quick answers",
                    icon: LifeBuoy,
                    action: () => navigate({ to: "/help" }),
                  },
                  {
                    id: "chat",
                    label: "Live Chat",
                    note: "Average reply in 2 min",
                    icon: MessageCircle,
                    action: () => navigate({ to: "/help" }),
                  },
                  {
                    id: "call",
                    label: "Call Support",
                    note: "1800 123 4567 · 24×7",
                    icon: Headphones,
                    action: () => navigate({ to: "/help" }),
                  },
                  {
                    id: "faq",
                    label: "FAQ",
                    note: "Pickups, pricing & refunds",
                    icon: HelpCircle,
                    action: () => navigate({ to: "/help" }),
                  },
                  {
                    id: "report",
                    label: "Report an Issue",
                    note: "Damaged, missing or delayed",
                    icon: ShieldAlert,
                    action: () => soon("Report an issue"),
                  },
                ]}
              />
            </section>

            {/* Account settings */}
            <section className="mt-8">
              <SectionHeading title="Account Settings" />
              <RowList
                rows={[
                  {
                    id: "notifications",
                    label: "Notifications",
                    note: `${enabledNotifications} of ${NOTIFICATION_ROWS.length} alerts on`,
                    icon: Bell,
                    action: () => setSettingsOpen(true),
                  },
                  {
                    id: "language",
                    label: "Language",
                    note: settings.settings.language === "en-IN" ? "English (India)" : settings.settings.language,
                    icon: Globe,
                    action: () => setSettingsOpen(true),
                  },
                  {
                    id: "theme",
                    label: "Appearance",
                    note: `${themeLabel} theme`,
                    icon: Moon,
                    action: () => setSettingsOpen(true),
                  },
                  {
                    id: "security",
                    label: "Security",
                    note: "App lock & login devices",
                    icon: Lock,
                    action: () => soon("Security"),
                  },
                  {
                    id: "delete",
                    label: "Delete Account",
                    note: "Permanently remove your data",
                    icon: Trash2,
                    tone: "danger",
                    action: () => setDeleteOpen(true),
                  },
                ]}
              />
            </section>

            {/* Logout — POST /api/logout */}
            <button
              type="button"
              onClick={() => setLogoutOpen(true)}
              className="ripple mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-3xl border-2 border-destructive/50 bg-destructive/5 text-sm font-bold text-destructive transition-all duration-300 hover:bg-destructive/10 active:scale-[0.97]"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </div>
        ) : null}
      </div>

      {/* Edit profile / Personal Information popup dialog — PUT /api/profile */}
      {editing && data ? (
        <div className="fixed inset-0 z-[999] flex items-start justify-center p-4 pt-6 sm:pt-10 overflow-y-auto">
          <div
            onClick={() => setEditing(false)}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />
          <div className="relative w-full max-w-[420px] max-h-[86vh] flex flex-col rounded-3xl bg-card text-foreground shadow-[0_25px_60px_rgba(0,0,0,0.35)] border border-border/80 overflow-hidden z-10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5 bg-muted/20">
              <div>
                <h2 className="text-base font-black tracking-tight text-foreground">Personal Information</h2>
                <p className="text-[11px] font-medium text-muted-foreground">Edit your profile details</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setEditing(false)}
                className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-all active:scale-90"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Scrollable Popup Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 [scrollbar-width:thin]">
              {/* Profile Photo */}
              <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-muted/30 border border-border/60">
                <div className="relative size-14 shrink-0">
                  <img
                    src={data.user.avatarUrl || defaultAvatar}
                    alt={data.user.name}
                    className="size-14 rounded-2xl object-cover border-2 border-primary/20 bg-muted"
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => photoInput.current?.click()}
                    className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                  >
                    <Camera className="size-3" />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground">Profile Picture</p>
                  <p className="text-[10px] text-muted-foreground">JPG or PNG, up to 5 MB</p>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => photoInput.current?.click()}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                  >
                    {uploading ? <Loader2 className="size-3 animate-spin" /> : null}
                    {uploading ? "Uploading..." : "Change Photo"}
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Full Name
                </label>
                <input
                  value={form.name}
                  aria-invalid={Boolean(formErrors['name'])}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Enter your full name"
                  className={`h-10 w-full rounded-xl border bg-background px-3 text-xs font-semibold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                    formErrors['name'] ? "border-destructive focus:border-destructive focus:ring-destructive/20" : "border-border"
                  }`}
                />
                {formErrors['name'] ? (
                  <span className="mt-1 block text-[10px] font-semibold text-destructive">
                    {formErrors['name']}
                  </span>
                ) : null}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  aria-invalid={Boolean(formErrors['email'])}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="name@example.com"
                  className={`h-10 w-full rounded-xl border bg-background px-3 text-xs font-semibold text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                    formErrors['email'] ? "border-destructive focus:border-destructive focus:ring-destructive/20" : "border-border"
                  }`}
                />
                {formErrors['email'] ? (
                  <span className="mt-1 block text-[10px] font-semibold text-destructive">
                    {formErrors['email']}
                  </span>
                ) : null}
              </div>

              {/* Phone Number (Verified) */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Mobile Number
                </label>
                <div className="flex h-10 items-center justify-between rounded-xl border border-border/80 bg-muted/30 px-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Phone className="size-3.5 text-muted-foreground/70" />
                    <span className="font-semibold text-foreground">{data.user.phone}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary/15 px-1.5 py-0.5 text-[10px] font-bold text-brand-green">
                    <BadgeCheck className="size-3" /> Verified
                  </span>
                </div>
              </div>

              {/* Detected Location Card */}
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-brand-dark">
                      <MapPin className="size-3" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Current Service Area
                      </p>
                      <p className="truncate text-xs font-bold text-foreground">
                        {activeLocation?.area || activeLocation?.city || data.user.city || "Kasganj"}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {[activeLocation?.city, activeLocation?.state].filter(Boolean).join(", ") || "Uttar Pradesh, India"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      void navigate({ to: "/location-search" });
                    }}
                    className="shrink-0 rounded-lg border border-border bg-card px-2 py-1 text-[10px] font-bold text-foreground shadow-2xs hover:bg-muted active:scale-95"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-border/50 bg-muted/20 px-5 py-3 flex gap-2.5">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="h-10 flex-1 rounded-xl border border-border bg-card text-xs font-bold text-foreground hover:bg-muted active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || !form.name.trim()}
                onClick={handleSave}
                className="h-10 flex-[2] inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-sm hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Logout confirmation sheet */}
      {logoutOpen ? (
        <div className="fixed inset-0 z-[999] flex items-start justify-center p-4 pt-12 sm:pt-16 overflow-y-auto">
          <div
            onClick={() => setLogoutOpen(false)}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl border border-border z-10">
            <div className="flex flex-col items-center text-center">
              <span className="flex size-14 items-center justify-center rounded-3xl bg-destructive/10 text-destructive">
                <LogOut className="size-6" />
              </span>
              <h2 className="mt-3 text-base font-bold tracking-tight text-foreground">
                Logout of QuickPress?
              </h2>
              <p className="mt-1.5 text-xs text-muted-foreground">
                You'll need to sign in again to book pickups and track your orders.
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setLogoutOpen(false)}
                className="ripple h-11 flex-1 rounded-xl border border-border bg-card text-xs font-bold text-foreground hover:bg-muted active:scale-[0.97]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loggingOut}
                onClick={handleLogout}
                className="ripple flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-destructive text-xs font-bold text-destructive-foreground hover:brightness-105 active:scale-[0.97] disabled:opacity-60"
              >
                {loggingOut ? <Loader2 className="size-4 animate-spin" /> : null}
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete Account confirmation sheet */}
      {deleteOpen ? (
        <div className="fixed inset-0 z-[999] flex items-start justify-center p-4 pt-12 sm:pt-16 overflow-y-auto">
          <div
            onClick={() => setDeleteOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl border border-destructive/30 z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <span className="flex size-14 items-center justify-center rounded-3xl bg-destructive/15 text-destructive ring-8 ring-destructive/10">
                <Trash2 className="size-6" />
              </span>
              <h2 className="mt-4 text-base font-black tracking-tight text-foreground">
                Delete QuickPress Account?
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                This action is <span className="font-bold text-destructive">permanent and irreversible</span>. All your saved addresses, payment methods, profile details, active orders, and wallet balance will be deleted immediately.
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="ripple h-11 flex-1 rounded-xl border border-border bg-card text-xs font-bold text-foreground hover:bg-muted active:scale-[0.97] disabled:opacity-50"
              >
                Keep Account
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteAccount}
                className="ripple flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-destructive text-xs font-black text-destructive-foreground hover:brightness-105 active:scale-[0.97] disabled:opacity-60 shadow-md"
              >
                {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-3.5" />}
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Settings sheet — GET/PUT /api/me/settings */}
      {settingsOpen ? (
        <div className="fixed inset-0 z-[999] flex items-start justify-center p-4 pt-6 sm:pt-10 overflow-y-auto">
          <div
            onClick={() => setSettingsOpen(false)}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />
          <div className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-card p-6 shadow-2xl border border-border z-10">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-base font-bold tracking-tight text-foreground">Settings</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setSettingsOpen(false)}
                className="flex size-8 items-center justify-center rounded-full bg-muted text-foreground hover:bg-accent transition-transform active:scale-[0.94]"
              >
                <X className="size-4" />
              </button>
            </div>

            {settings.offline ? (
              <p className="mt-4 flex items-center gap-2 rounded-2xl bg-muted/70 px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                <WifiOff className="size-4 shrink-0" />
                You're offline — preferences will sync when you reconnect.
              </p>
            ) : null}
            {settings.error ? (
              <p className="mt-4 flex items-center justify-between gap-2 rounded-2xl bg-destructive/10 px-4 py-2.5 text-xs font-semibold text-destructive">
                {settings.error}
                <button
                  type="button"
                  onClick={() => void settings.reload()}
                  className="shrink-0 font-bold underline"
                >
                  Retry
                </button>
              </p>
            ) : null}

            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Appearance
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map((option) => {
                const active = settings.settings.theme === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    disabled={settings.saving}
                    onClick={() => void changeTheme(option.id)}
                    className={`flex flex-col items-center gap-2 rounded-3xl border p-3 text-xs font-bold transition-all duration-300 active:scale-[0.96] disabled:opacity-60 ${
                      active
                        ? "border-primary bg-primary/15 text-foreground"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <option.icon className="size-5" />
                    {option.label}
                  </button>
                );
              })}
            </div>

            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Notifications
            </p>
            <div className="card-soft mt-2 overflow-hidden border border-border">
              {NOTIFICATION_ROWS.map((row, index) => (
                <div
                  key={row.id}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    index > 0 ? "border-t border-border" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-foreground">
                      {row.label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{row.note}</span>
                  </span>
                  <Toggle
                    label={row.label}
                    checked={settings.settings.notifications[row.id]}
                    disabled={settings.saving}
                    onChange={() => void toggleNotification(row.id)}
                  />
                </div>
              ))}
            </div>

            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Language
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[
                { id: "en-IN", label: "English (India)" },
                { id: "hi-IN", label: "हिन्दी" },
              ].map((language) => {
                const active = settings.settings.language === language.id;
                return (
                  <button
                    key={language.id}
                    type="button"
                    aria-pressed={active}
                    disabled={settings.saving}
                    onClick={() => void changeLanguage(language.id)}
                    className={`rounded-3xl border p-3 text-xs font-bold transition-all duration-300 active:scale-[0.96] disabled:opacity-60 ${
                      active
                        ? "border-primary bg-primary/15 text-foreground"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {language.label}
                  </button>
                );
              })}
            </div>

            {settings.loading ? (
              <p className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Syncing your preferences…
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Hidden picker used by both photo buttons — POST /api/profile/photo */}
      <input
        ref={photoInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => void handlePhotoFile(event.target.files?.[0])}
      />

      {editing || logoutOpen || settingsOpen || deleteOpen ? null : <BottomNav active="profile" />}
      <Toaster position="top-center" />
    </main>
  );
}
