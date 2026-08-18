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
  FileText,
  Gift,
  Globe,
  Headphones,
  Heart,
  HelpCircle,
  Info,
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
  Shield,
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
            className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${
              row.tone === "danger"
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/15 text-brand-dark"
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
  const navigate = useNavigate();
  const [data, setData] = useState<ProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", city: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [offline, setOffline] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const photoInput = useRef<HTMLInputElement | null>(null);
  const settings = useAppSettings();

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

  const toggleNotification = async (key: keyof NotificationPreferences) => {
    try {
      await settings.toggleNotification(key);
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
      const saved = await updateProfile(form);
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

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md">
        {/* Top app bar */}
        <header className="glass-panel sticky top-0 z-30 flex items-center justify-between gap-3 border-x-0 border-t-0 px-5 py-3">
          <h1 className="text-lg font-bold tracking-tight text-foreground">My Profile</h1>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => soon("Notifications")}
              className="relative flex size-10 items-center justify-center rounded-2xl bg-muted text-foreground transition-all duration-300 hover:bg-accent active:scale-[0.94]"
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
              className="flex size-10 items-center justify-center rounded-2xl bg-muted text-foreground transition-all duration-300 hover:bg-accent active:scale-[0.94]"
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
                  {data.user.avatarUrl ? (
                    <img
                      src={data.user.avatarUrl}
                      alt={`${data.user.name}'s profile photo`}
                      className="size-20 rounded-4xl object-cover shadow-soft"
                    />
                  ) : (
                    <span className="flex size-20 items-center justify-center rounded-4xl bg-brand-dark text-2xl font-black tracking-tight text-primary shadow-soft">
                      {data.user.initials}
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label="Upload profile photo"
                    disabled={uploading}
                    onClick={() => photoInput.current?.click()}
                    className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border-2 border-card bg-secondary text-secondary-foreground shadow-soft transition-transform duration-300 active:scale-[0.9]"
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
                  {data.user.city ? (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" />
                      <span className="truncate">{data.user.city}</span>
                    </p>
                  ) : null}
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
                  value: String(data.stats.totalOrders),
                  icon: Package,
                  action: () => navigate({ to: "/history" }),
                },
                {
                  id: "points",
                  label: "Reward Points",
                  value: data.stats.rewardPoints.toLocaleString("en-IN"),
                  icon: Star,
                  action: () => soon("Rewards"),
                },
                {
                  id: "wallet",
                  label: "Wallet Balance",
                  value: `₹${data.stats.walletBalance.toLocaleString("en-IN")}`,
                  icon: Wallet,
                  action: () => soon("Wallet"),
                },
                {
                  id: "addresses",
                  label: "Saved Addresses",
                  value: String(data.stats.savedAddresses),
                  icon: MapPin,
                  action: () => navigate({ to: "/addresses" }),
                },
              ].map((stat, index) => (
                <button
                  key={stat.id}
                  type="button"
                  onClick={stat.action} className="card-soft ripple flex flex-col items-start gap-3 border border-border p-4 text-left transition-all duration-300 hover:border-primary/60 active:scale-[0.96]"
                >
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-secondary/10 text-brand-green">
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

            {/* Account — GET /api/addresses, GET /api/payment-methods, GET /api/orders */}
            <section className="mt-8">
              <SectionHeading title="Account" />
              <RowList
                rows={[
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
                    note: "Live pickups & deliveries",
                    icon: Package,
                    action: () => navigate({ to: "/history" }),
                  },
                  {
                    id: "history",
                    label: "Order History",
                    note: `${data.stats.totalOrders} completed orders`,
                    icon: Receipt,
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

            {/* Wallet — GET /api/wallet */}
            <section id="wallet" className="mt-8 scroll-mt-20">
              <SectionHeading title="QuickPress Wallet" action="View all" />

              <div className="card-soft mt-4 overflow-hidden border border-border">
                <div className="relative overflow-hidden bg-gradient-to-br from-brand-dark to-brand-green p-5">
                  <div className="pointer-events-none absolute -bottom-14 -right-10 size-40 rounded-full bg-primary/30 blur-2xl" />
                  <p className="relative text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                    Wallet Balance
                  </p>
                  <p className="animate-pop relative mt-1 text-3xl font-black tracking-tight text-background">
                    ₹{data.wallet.balance.toLocaleString("en-IN")}
                  </p>
                  <div className="relative mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => soon("Add money")}
                      className="ripple flex h-10 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-primary text-xs font-bold text-primary-foreground transition-transform duration-300 active:scale-[0.96]"
                    >
                      <Plus className="size-4" />
                      Add Money
                    </button>
                    <button
                      type="button"
                      onClick={() => soon("Cashback rewards")}
                      className="ripple flex h-10 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-background/15 text-xs font-bold text-background backdrop-blur transition-transform duration-300 active:scale-[0.96]"
                    >
                      <Gift className="size-4" />
                      Cashback ₹{data.wallet.cashbackEarned}
                    </button>
                  </div>
                </div>

                <div className="px-4 pb-2 pt-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Transaction History
                  </p>
                </div>
                {data.wallet.transactions.map((txn, index) => (
                  <div
                    key={txn.id}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      index > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-2xl ${
                        txn.kind === "credit"
                          ? "bg-secondary/10 text-brand-green"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {txn.kind === "credit" ? (
                        <ArrowDownLeft className="size-4" />
                      ) : (
                        <ArrowUpRight className="size-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-foreground">
                        {txn.title}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">{txn.note}</span>
                    </span>
                    <span
                      className={`shrink-0 text-sm font-bold ${
                        txn.kind === "credit" ? "text-brand-green" : "text-foreground"
                      }`}
                    >
                      {txn.kind === "credit" ? "+" : "−"}₹{txn.amount}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Membership — GET /api/membership */}
            <section className="mt-8">
              <SectionHeading title="Membership" />
              <div className="card-soft mt-4 border border-primary/40 bg-gradient-to-br from-primary/20 via-card to-card p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-dark text-primary">
                    <Crown className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {data.membership.plan}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Renews on {data.membership.renewsOn}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                      data.membership.active
                        ? "bg-secondary/15 text-brand-green"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {data.membership.active ? "Active" : "Expired"}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-green to-primary transition-all duration-700"
                      style={{
                        width: `${Math.round(
                          (data.membership.daysLeft / data.membership.totalDays) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
                    {data.membership.daysLeft} days left · saved ₹
                    {data.membership.savedThisYear.toLocaleString("en-IN")} this year
                  </p>
                </div>

                <div className="mt-4 grid gap-2">
                  {[
                    { id: "pickup", label: "Priority Pickup", icon: Truck },
                    { id: "discount", label: "Exclusive Discounts", icon: Gift },
                    { id: "delivery", label: "Free Delivery", icon: Sparkles },
                  ].map((benefit) => (
                    <div
                      key={benefit.id}
                      className="flex items-center gap-2.5 rounded-2xl bg-card/70 px-3 py-2"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-brand-green">
                        <benefit.icon className="size-4" />
                      </span>
                      <span className="text-xs font-bold text-foreground">{benefit.label}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => soon("Membership renewal")}
                  className="ripple mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-3xl bg-brand-dark text-sm font-bold text-primary transition-all duration-300 active:scale-[0.97]"
                >
                  <Crown className="size-4" />
                  Renew Membership
                </button>
              </div>
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

            {/* Legal */}
            <section className="mt-8">
              <SectionHeading title="Legal" />
              <RowList
                rows={[
                  {
                    id: "privacy",
                    label: "Privacy Policy",
                    icon: Shield,
                    action: () => soon("Privacy policy"),
                  },
                  {
                    id: "terms",
                    label: "Terms & Conditions",
                    icon: FileText,
                    action: () => soon("Terms & conditions"),
                  },
                  {
                    id: "about",
                    label: "About QuickPress",
                    icon: Info,
                    action: () => soon("About QuickPress"),
                  },
                ]}
              />
              <p className="mt-3 text-center text-[11px] font-semibold text-muted-foreground">
                App Version {data.appVersion}
              </p>
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
                    action: () => soon("Account deletion"),
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

      {/* Edit profile sheet — PUT /api/profile */}
      {editing && data ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setEditing(false)}
            className="animate-overlay-in absolute inset-0 bg-brand-dark/45 backdrop-blur-sm"
          />
          <div className="animate-sheet-up relative w-full max-w-md rounded-t-4xl bg-card px-5 pb-8 pt-4 shadow-soft">
            <div className="mx-auto h-1.5 w-10 rounded-full bg-border" />
            <div className="mt-4 flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight text-foreground">Edit Profile</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setEditing(false)}
                className="flex size-9 items-center justify-center rounded-2xl bg-muted text-foreground transition-transform active:scale-[0.94]"
              >
                <X className="size-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={uploading}
              onClick={() => photoInput.current?.click()}
              className="mt-5 flex w-full items-center gap-3 rounded-3xl bg-muted/70 p-3 text-left transition-colors active:bg-muted disabled:opacity-60"
            >
              {data.user.avatarUrl ? (
                <img
                  src={data.user.avatarUrl}
                  alt=""
                  className="size-14 shrink-0 rounded-3xl object-cover"
                />
              ) : (
                <span className="flex size-14 shrink-0 items-center justify-center rounded-3xl bg-brand-dark text-lg font-black text-primary">
                  {data.user.initials}
                </span>
              )}
              <span>
                <span className="block text-sm font-bold text-foreground">
                  Upload Profile Photo
                </span>
                <span className="block text-xs text-muted-foreground">JPG or PNG, up to 5 MB</span>
              </span>
              <Camera className="ml-auto size-4 shrink-0 text-muted-foreground" />
            </button>

            <label className="mt-4 block">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Full Name
              </span>
              <input
                value={form.name}
                aria-invalid={Boolean(formErrors['name'])}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className={`mt-1.5 h-12 w-full rounded-2xl border bg-background px-4 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary ${
                  formErrors['name'] ? "border-destructive" : "border-border"
                }`}
              />
              {formErrors['name'] ? (
                <span className="mt-1 block text-[11px] font-semibold text-destructive">
                  {formErrors['name']}
                </span>
              ) : null}
            </label>

            <label className="mt-3 block">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Email Address
              </span>
              <input
                type="email"
                value={form.email}
                aria-invalid={Boolean(formErrors['email'])}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className={`mt-1.5 h-12 w-full rounded-2xl border bg-background px-4 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary ${
                  formErrors['email'] ? "border-destructive" : "border-border"
                }`}
              />
              {formErrors['email'] ? (
                <span className="mt-1 block text-[11px] font-semibold text-destructive">
                  {formErrors['email']}
                </span>
              ) : null}
            </label>

            <label className="mt-3 block">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                City
              </span>
              <input
                value={form.city}
                aria-invalid={Boolean(formErrors['city'])}
                onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                placeholder="Bengaluru"
                className={`mt-1.5 h-12 w-full rounded-2xl border bg-background px-4 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary ${
                  formErrors['city'] ? "border-destructive" : "border-border"
                }`}
              />
              {formErrors['city'] ? (
                <span className="mt-1 block text-[11px] font-semibold text-destructive">
                  {formErrors['city']}
                </span>
              ) : null}
            </label>

            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Phone className="size-3.5 shrink-0" />
              {data.user.phone} · verified, cannot be changed here
            </p>

            <button
              type="button"
              disabled={saving || !form.name.trim()}
              onClick={handleSave}
              className="ripple mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-3xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97] disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save Changes
            </button>
          </div>
        </div>
      ) : null}

      {/* Logout confirmation sheet */}
      {logoutOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setLogoutOpen(false)}
            className="animate-overlay-in absolute inset-0 bg-brand-dark/45 backdrop-blur-sm"
          />
          <div className="animate-sheet-up relative w-full max-w-md rounded-t-4xl bg-card px-5 pb-8 pt-4 shadow-soft">
            <div className="mx-auto h-1.5 w-10 rounded-full bg-border" />
            <div className="mt-5 flex flex-col items-center text-center">
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
                className="ripple h-12 flex-1 rounded-3xl border border-border bg-card text-sm font-bold text-foreground transition-all duration-300 active:scale-[0.97]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loggingOut}
                onClick={handleLogout}
                className="ripple flex h-12 flex-1 items-center justify-center gap-2 rounded-3xl bg-destructive text-sm font-bold text-destructive-foreground transition-all duration-300 active:scale-[0.97] disabled:opacity-60"
              >
                {loggingOut ? <Loader2 className="size-4 animate-spin" /> : null}
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Settings sheet — GET/PUT /api/me/settings */}
      {settingsOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setSettingsOpen(false)}
            className="animate-overlay-in absolute inset-0 bg-brand-dark/45 backdrop-blur-sm"
          />
          <div className="animate-sheet-up relative max-h-[86vh] w-full max-w-md overflow-y-auto rounded-t-4xl bg-card px-5 pb-8 pt-4 shadow-soft">
            <div className="mx-auto h-1.5 w-10 rounded-full bg-border" />
            <div className="mt-4 flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight text-foreground">Settings</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setSettingsOpen(false)}
                className="flex size-9 items-center justify-center rounded-2xl bg-muted text-foreground transition-transform active:scale-[0.94]"
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
                    onClick={() => void settings.setLanguage(language.id).catch(() => {})}
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

      <BottomNav active="profile" />
      <Toaster position="top-center" />
    </main>
  );
}
