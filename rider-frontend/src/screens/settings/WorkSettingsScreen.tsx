import { useNavigate } from "@tanstack/react-router";
import { Clock4, Languages, MapPin, Power, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Toaster } from "@/shared/ui/sonner";

import { RiderTopBar } from "../../components/RiderTopBar";
import {
  SettingsCard,
  SettingsChoice,
  SettingsSuccess,
  SettingsToggle,
} from "../../components/settings/SettingsPrimitives";
import { useRiderSettings } from "../../context/RiderSettingsContext";
import {
  PREFERRED_AREAS,
  PREFERRED_SHIFTS,
  RIDER_LANGUAGES,
} from "../../data/rider-settings-mock";
import { riderRoutes } from "../../navigation/rider-routes";

const AREA_OPTIONS = PREFERRED_AREAS.map((area) => ({ id: area, label: area }));
const SHIFT_OPTIONS = PREFERRED_SHIFTS.map((shift) => ({
  id: shift.id as string,
  label: shift.label,
  hint: shift.hint,
}));
const LANGUAGE_OPTIONS = RIDER_LANGUAGES.map((language) => ({ id: language as string, label: language }));

/** Work Settings — availability, auto accept, area, shift and language. */
export function WorkSettingsScreen() {
  const navigate = useNavigate();
  const { work, updateWork } = useRiderSettings();
  const [success, setSuccess] = useState(false);

  const confirm = (message: string) => {
    setSuccess(true);
    window.setTimeout(() => setSuccess(false), 900);
    toast.success(message);
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="relative mx-auto w-full max-w-md sm:max-w-2xl">
        <RiderTopBar
          title="Work Settings"
          subtitle="How and where you take deliveries"
          onBack={() => void navigate({ to: riderRoutes.settings })}
        />

        <div className="space-y-4 px-5 pb-32 pt-4">
          <section className="card-soft animate-rise flex items-center gap-4 border border-border p-5">
            <span
              className={`grid size-12 shrink-0 place-items-center rounded-3xl transition-colors duration-300 ${
                work.online ? "bg-secondary/15 text-brand-green" : "bg-muted text-muted-foreground"
              }`}
            >
              <Power className="size-5" strokeWidth={2.3} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black tracking-tight text-foreground">
                {work.online ? "You are online" : "You are offline"}
              </p>
              <p className="text-[0.7rem] font-medium text-muted-foreground">
                {work.online
                  ? "Receiving new delivery assignments."
                  : "No new assignments until you go online."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={work.online}
              aria-label="Online status"
              onClick={() => {
                updateWork("online", !work.online);
                confirm(!work.online ? "You are now online" : "You are now offline");
              }}
              className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-300 ${
                work.online ? "bg-secondary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 size-6 rounded-full bg-card shadow-soft transition-all duration-300 ${
                  work.online ? "left-7" : "left-1"
                }`}
              />
            </button>
          </section>

          <SettingsCard title="Auto accept" caption="Take matching orders without tapping" delay={60}>
            <div className="divide-y divide-border">
              <SettingsToggle
                icon={Zap}
                label="Auto accept orders"
                hint="Automatically accept nearby orders inside your preferred area."
                checked={work.autoAccept}
                onChange={(next) => {
                  updateWork("autoAccept", next);
                  confirm(next ? "Auto accept enabled" : "Auto accept disabled");
                }}
              />
            </div>
            <div className={`pt-3 ${work.autoAccept ? "" : "opacity-50"}`}>
              <div className="flex items-center justify-between">
                <span className="text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground">
                  Pickup radius
                </span>
                <span className="text-xs font-black text-foreground">
                  {work.autoAcceptRadiusKm} km
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={12}
                step={1}
                value={work.autoAcceptRadiusKm}
                disabled={!work.autoAccept}
                aria-label="Auto accept radius in kilometres"
                onChange={(event) => updateWork("autoAcceptRadiusKm", Number(event.target.value))}
                className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-[var(--primary)]"
              />
            </div>
          </SettingsCard>

          <SettingsCard title="Preferred area" caption="Where you want assignments from" delay={120}>
            <div className="mb-3 flex items-center gap-2 text-[0.7rem] font-bold text-muted-foreground">
              <MapPin className="size-3.5" />
              Currently {work.preferredArea}
            </div>
            <SettingsChoice
              options={AREA_OPTIONS}
              value={work.preferredArea}
              onChange={(next) => {
                updateWork("preferredArea", next);
                confirm(`Preferred area set to ${next}`);
              }}
            />
          </SettingsCard>

          <SettingsCard title="Preferred shift" caption="Your usual working hours" delay={180}>
            <div className="mb-3 flex items-center gap-2 text-[0.7rem] font-bold text-muted-foreground">
              <Clock4 className="size-3.5" />
              {PREFERRED_SHIFTS.find((shift) => shift.id === work.preferredShift)?.hint ?? "Flexible"}
            </div>
            <SettingsChoice
              options={SHIFT_OPTIONS}
              value={work.preferredShift}
              onChange={(next) => {
                updateWork("preferredShift", next);
                confirm("Preferred shift updated");
              }}
            />
          </SettingsCard>

          <SettingsCard title="Language" caption="App language for this device" delay={240}>
            <div className="mb-3 flex items-center gap-2 text-[0.7rem] font-bold text-muted-foreground">
              <Languages className="size-3.5" />
              {work.language}
            </div>
            <SettingsChoice
              options={LANGUAGE_OPTIONS}
              value={work.language}
              columns={3}
              onChange={(next) => {
                updateWork("language", next);
                confirm(`Language set to ${next}`);
              }}
            />
          </SettingsCard>
        </div>
      </div>

      <SettingsSuccess open={success} message="Work settings saved" />
      <Toaster />
    </main>
  );
}