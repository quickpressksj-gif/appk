import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Download, Info, Package, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { InfoRow } from "../../components/RiderPrimitives";
import { RiderTopBar } from "../../components/RiderTopBar";
import { SettingsCard, SettingsSuccess } from "../../components/settings/SettingsPrimitives";
import { APP_INFO } from "../../data/rider-settings-mock";
import { riderRoutes } from "../../navigation/rider-routes";

/** App Info — version, build, about and update check. */
export function AboutScreen() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [success, setSuccess] = useState(false);

  const checkUpdates = () => {
    setChecking(true);
    window.setTimeout(() => {
      setChecking(false);
      setSuccess(true);
      window.setTimeout(() => setSuccess(false), 1100);
      toast.success("You are on the latest version");
    }, 900);
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="About"
          subtitle="App information"
          onBack={() => void navigate({ to: riderRoutes.settings })}
        />

        <div className="space-y-4 px-5 pb-32 pt-4">
          <section className="card-soft animate-rise flex flex-col items-center border border-border p-6 text-center">
            <span className="animate-pop grid size-16 place-items-center rounded-3xl bg-primary/15 text-brand-dark">
              <Package className="size-7" strokeWidth={2.2} />
            </span>
            <p className="mt-3 text-base font-black tracking-tight text-foreground">
              QuickPress Rider
            </p>
            <p className="text-[0.7rem] font-semibold text-muted-foreground">
              Version {APP_INFO.version} · Build {APP_INFO.build}
            </p>
            <span className="mt-2 rounded-full bg-secondary/15 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-brand-green">
              {APP_INFO.channel}
            </span>
          </section>

          <SettingsCard title="Details" delay={60}>
            <div>
              <InfoRow icon={Info} label="Version" value={APP_INFO.version} />
              <InfoRow icon={Package} label="Build" value={APP_INFO.build} />
              <InfoRow icon={CheckCircle2} label="Released on" value={APP_INFO.releasedOn} />
            </div>
          </SettingsCard>

          <SettingsCard title="About QuickPress Rider" delay={120}>
            <p className="text-[0.78rem] font-medium leading-relaxed text-muted-foreground">
              {APP_INFO.about}
            </p>
          </SettingsCard>

          <button
            type="button"
            disabled={checking}
            onClick={checkUpdates}
            className="ripple flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black tracking-tight text-primary-foreground shadow-cta transition-all duration-300 active:scale-[0.97] disabled:opacity-70"
          >
            {checking ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {checking ? "Checking for updates…" : "Check for updates"}
          </button>
        </div>
      </div>

      <SettingsSuccess open={success} message="App is up to date" />
      <Toaster />
    </main>
  );
}