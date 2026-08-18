import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Settings2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@shared/ui/sonner";

import { PartnerBottomNav } from "../components/PartnerBottomNav";
import { AccountSection } from "../components/settings/AccountSection";
import { AppInfoSection } from "../components/settings/AppInfoSection";
import { AppearanceSection } from "../components/settings/AppearanceSection";
import { BusinessSection } from "../components/settings/BusinessSection";
import { DocumentsSection } from "../components/settings/DocumentsSection";
import { LegalSection } from "../components/settings/LegalSection";
import { NotificationsSection } from "../components/settings/NotificationsSection";
import { SecuritySection } from "../components/settings/SecuritySection";
import { SettingsSkeleton } from "../components/settings/SettingsSkeletons";
import {
  SettingsErrorState,
  SettingsOfflineState,
} from "../components/settings/SettingsStates";
import { SettingsSuccessOverlay } from "../components/settings/SettingsSuccessOverlay";
import { useOnlineStatus } from "../components/notifications/OfflineBanner";
import { usePartnerContext } from "../context/PartnerContext";
import { usePartnerTheme } from "../hooks/use-partner-theme";
import { partnerRoutes } from "../navigation/partner-routes";
import {
  fetchPartnerSettings,
  savePartnerSettings,
  type BusinessPreferences,
  type LanguageCode,
  type NotificationChannelId,
  type PartnerAccount,
  type PartnerSettingsData,
  type SecuritySettings,
  type ThemeMode,
} from "../data/partner-settings-mock";

const SECTION_LINKS = [
  { id: "account", label: "Account" },
  { id: "business", label: "Business" },
  { id: "notifications", label: "Notifications" },
  { id: "appearance", label: "Appearance" },
  { id: "security", label: "Security" },
  { id: "documents", label: "Documents" },
  { id: "legal", label: "Legal" },
  { id: "app-info", label: "App Info" },
] as const;

/**
 * Sprint 3.10 — Partner Settings, Business Preferences & Account Management.
 * UI only: state lives in the screen and is echoed to a mock persistence layer.
 */
export function PartnerSettingsScreen() {
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const { signOut } = usePartnerContext();
  const { theme, setTheme } = usePartnerTheme();

  const [data, setData] = useState<PartnerSettingsData | null>(null);
  const [failed, setFailed] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [language, setLanguage] = useState<LanguageCode>("en");

  const load = useCallback(async () => {
    setData(null);
    setFailed(false);
    try {
      const next = await fetchPartnerSettings();
      setData(next);
      setLanguage(next.language);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const persist = useCallback((patch: Partial<PartnerSettingsData>, message: string) => {
    setData((prev) => (prev ? { ...prev, ...patch } : prev));
    void savePartnerSettings(patch);
    setSuccess(message);
    toast.success(message);
  }, []);

  const updateAccount = (patch: Partial<PartnerAccount>) => {
    if (!data) return;
    setData({ ...data, account: { ...data.account, ...patch } });
    void savePartnerSettings({ account: { ...data.account, ...patch } });
  };

  const updateBusiness = (patch: Partial<BusinessPreferences>, message: string) => {
    if (!data) return;
    persist({ business: { ...data.business, ...patch } }, message);
  };

  const updateSecurity = (patch: Partial<SecuritySettings>, message: string) => {
    if (!data) return;
    persist({ security: { ...data.security, ...patch } }, message);
  };

  const updateNotification = (id: NotificationChannelId, next: boolean, label: string) => {
    if (!data) return;
    persist(
      { notifications: { ...data.notifications, [id]: next } },
      `${label} ${next ? "on" : "off"}`,
    );
  };

  const handleTheme = (next: ThemeMode) => {
    setTheme(next);
    persist({ theme: next }, `${next === "system" ? "System" : next === "dark" ? "Dark" : "Light"} theme applied`);
  };

  const handleLanguage = (next: LanguageCode) => {
    setLanguage(next);
    persist({ language: next }, next === "hi" ? "भाषा हिन्दी सेट की गई" : "Language set to English");
  };

  const handleSignOut = (message: string) => {
    signOut();
    toast.success(message);
    navigate({ to: partnerRoutes.auth });
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto w-full max-w-md md:max-w-3xl lg:max-w-6xl">
        <header className="sticky top-0 z-30">
          <div className="glass-panel flex items-center gap-2 px-4 py-3">
            <button
              type="button"
              aria-label="Go back"
              onClick={() => navigate({ to: partnerRoutes.profile })}
              className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground transition-all duration-300 hover:bg-accent active:scale-[0.94]"
            >
              <ArrowLeft className="size-5" aria-hidden="true" />
            </button>
            <div className="min-w-0 flex-1 text-center md:text-left md:pl-2">
              <h1 className="truncate text-sm font-bold tracking-tight text-foreground">Settings</h1>
              <p className="truncate text-[0.68rem] font-medium text-muted-foreground">
                Account, business preferences & app
              </p>
            </div>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
              <Settings2 className="size-5" aria-hidden="true" />
            </span>
          </div>
        </header>

        <div className="px-5 pb-32 pt-4 lg:pb-16">
          {!online ? (
            <div className="mb-5">
              <SettingsOfflineState onRetry={() => void load()} />
            </div>
          ) : null}

          {failed ? (
            <SettingsErrorState onRetry={() => void load()} />
          ) : !data ? (
            <SettingsSkeleton />
          ) : (
            <div className="lg:flex lg:items-start lg:gap-8">
              <nav
                aria-label="Settings sections"
                className="hidden lg:sticky lg:top-24 lg:block lg:w-52 lg:shrink-0"
              >
                <ul className="card-soft border border-border p-2">
                  {SECTION_LINKS.map((link) => (
                    <li key={link.id}>
                      <a
                        href={`#${link.id}`}
                        className="block rounded-xl px-3 py-2 text-xs font-bold tracking-tight text-muted-foreground transition-colors duration-300 hover:bg-accent/60 hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="min-w-0 flex-1 space-y-7 md:columns-2 md:gap-6 md:space-y-0 md:[&>*]:mb-6 md:[&>*]:break-inside-avoid">
                <AccountSection
                  account={data.account}
                  onChange={updateAccount}
                  onNotify={(message) => persist({}, message)}
                  onLogout={() => handleSignOut("Signed out")}
                  onLogoutAll={() => handleSignOut("Signed out from all devices")}
                  delay={0}
                />
                <BusinessSection business={data.business} onChange={updateBusiness} delay={40} />
                <NotificationsSection
                  notifications={data.notifications}
                  onChange={updateNotification}
                  delay={80}
                />
                <AppearanceSection
                  theme={theme}
                  language={language}
                  onThemeChange={handleTheme}
                  onLanguageChange={handleLanguage}
                  delay={120}
                />
                <SecuritySection
                  security={data.security}
                  onChange={updateSecurity}
                  onNotify={(message) => persist({}, message)}
                  delay={160}
                />
                <DocumentsSection
                  documents={data.documents}
                  onNotify={(message) => persist({}, message)}
                  delay={200}
                />
                <LegalSection delay={240} />
                <AppInfoSection
                  appInfo={data.appInfo}
                  onNotify={(message) => persist({}, message)}
                  delay={280}
                />
              </div>
            </div>
          )}
        </div>

        <div className="lg:hidden">
          <PartnerBottomNav active="profile" />
        </div>
      </div>

      <SettingsSuccessOverlay message={success} onDone={() => setSuccess(null)} />
      <Toaster />
    </main>
  );
}
