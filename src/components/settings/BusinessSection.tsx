import {
  CalendarDays,
  Clock3,
  DoorClosed,
  Gauge,
  MapPin,
  Palmtree,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import { useState } from "react";

import {
  formatHolidayDate,
  formatTime12h,
  WEEK_DAYS,
  type BusinessPreferences,
  type HolidayEntry,
} from "../../data/partner-settings-mock";
import { SettingsEmptyState } from "./SettingsStates";
import { SettingsSheet } from "./SettingsSheet";
import {
  PrimaryButton,
  SettingsCard,
  SettingsSection,
  SettingsStepper,
  SettingsTimeField,
  SettingsToggleRow,
} from "./SettingsPrimitives";

/** Sprint 3.10 — Business preferences: hours, closures and service radius. */
export function BusinessSection({
  business,
  onChange,
  delay = 0,
}: {
  business: BusinessPreferences;
  onChange: (patch: Partial<BusinessPreferences>, message: string) => void;
  delay?: number;
}) {
  const [holidaySheet, setHolidaySheet] = useState(false);
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayLabel, setHolidayLabel] = useState("");

  const toggleDay = (day: string) => {
    const next = business.weeklyOff.includes(day)
      ? business.weeklyOff.filter((item) => item !== day)
      : [...business.weeklyOff, day];
    onChange({ weeklyOff: next }, "Weekly off updated");
  };

  const addHoliday = () => {
    if (!holidayDate) return;
    const entry: HolidayEntry = {
      id: `h${Date.now()}`,
      date: holidayDate,
      label: holidayLabel.trim() || "Shop holiday",
    };
    onChange({ holidays: [...business.holidays, entry] }, "Holiday added");
    setHolidayDate("");
    setHolidayLabel("");
    setHolidaySheet(false);
  };

  const removeHoliday = (id: string) => {
    onChange(
      { holidays: business.holidays.filter((item) => item.id !== id) },
      "Holiday removed",
    );
  };

  return (
    <SettingsSection
      id="business"
      icon={Clock3}
      title="Business Settings"
      description="Hours, availability and service area"
      delay={delay}
    >
      <div className="card-soft border border-border p-4">
        <p className="text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground">
          Business Hours
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <SettingsTimeField
            id="opening-time"
            label="Opening Time"
            value={business.openingTime}
            hint={formatTime12h(business.openingTime)}
            onChange={(openingTime) => onChange({ openingTime }, "Business hours updated")}
          />
          <SettingsTimeField
            id="closing-time"
            label="Closing Time"
            value={business.closingTime}
            hint={formatTime12h(business.closingTime)}
            onChange={(closingTime) => onChange({ closingTime }, "Business hours updated")}
          />
        </div>

        <p className="mt-5 text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground">
          Weekly Off
        </p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Weekly off days">
          {WEEK_DAYS.map((day) => {
            const active = business.weeklyOff.includes(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={active}
                onClick={() => toggleDay(day)}
                className={`rounded-2xl border px-3 py-2 text-[0.7rem] font-bold tracking-tight transition-all duration-300 active:scale-[0.96] ${
                  active
                    ? "border-primary bg-primary/15 text-brand-dark"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50"
                }`}
              >
                {day.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 card-soft border border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground">
            Holiday Calendar
          </p>
          <button
            type="button"
            onClick={() => setHolidaySheet(true)}
            className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1.5 text-[0.66rem] font-bold tracking-tight text-brand-dark transition-all duration-300 active:scale-[0.96]"
          >
            <Plus className="size-3" aria-hidden="true" /> Add
          </button>
        </div>

        {business.holidays.length === 0 ? (
          <div className="mt-3">
            <SettingsEmptyState
              title="No holidays planned"
              body="Add festival or maintenance days so customers see you as closed."
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {business.holidays.map((holiday) => (
              <li
                key={holiday.id}
                className="animate-soft-fade flex items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3"
              >
                <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold tracking-tight text-foreground">
                    {holiday.label}
                  </p>
                  <p className="truncate text-[0.68rem] font-medium text-muted-foreground">
                    {formatHolidayDate(holiday.date)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${holiday.label}`}
                  onClick={() => removeHoliday(holiday.id)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive transition-all duration-300 active:scale-[0.94]"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-3">
        <SettingsCard>
          <SettingsToggleRow
            icon={Palmtree}
            label="Vacation Mode"
            description={`Paused ${formatHolidayDate(business.vacationFrom)} – ${formatHolidayDate(business.vacationTo)}`}
            checked={business.vacationMode}
            onChange={(vacationMode) =>
              onChange(
                { vacationMode },
                vacationMode ? "Vacation mode on" : "Vacation mode off",
              )
            }
          />
          <SettingsToggleRow
            icon={DoorClosed}
            label="Temporary Closure"
            description={`Auto-reopens after ${business.temporaryClosureMinutes} minutes`}
            checked={business.temporaryClosure}
            onChange={(temporaryClosure) =>
              onChange(
                { temporaryClosure },
                temporaryClosure ? "Shop temporarily closed" : "Shop reopened",
              )
            }
          />
          <SettingsStepper
            id="closure-minutes"
            label="Closure Duration"
            value={business.temporaryClosureMinutes}
            suffix="min"
            min={15}
            max={240}
            step={15}
            onChange={(temporaryClosureMinutes) =>
              onChange({ temporaryClosureMinutes }, "Closure duration updated")
            }
          />
          <SettingsToggleRow
            icon={Zap}
            label="Auto Accept Orders"
            description="Skip manual confirmation for new orders"
            checked={business.autoAcceptOrders}
            onChange={(autoAcceptOrders) =>
              onChange({ autoAcceptOrders }, "Auto accept updated")
            }
          />
          <SettingsStepper
            id="auto-reject"
            label="Auto Reject Timeout"
            value={business.autoRejectTimeoutMinutes}
            suffix="min"
            min={2}
            max={30}
            onChange={(autoRejectTimeoutMinutes) =>
              onChange({ autoRejectTimeoutMinutes }, "Auto reject timeout updated")
            }
          />
        </SettingsCard>
      </div>

      <div className="mt-3">
        <SettingsCard>
          <RadiusRow
            icon={MapPin}
            label="Pickup Radius"
            value={business.pickupRadiusKm}
            onChange={(pickupRadiusKm) => onChange({ pickupRadiusKm }, "Pickup radius updated")}
          />
          <RadiusRow
            icon={Gauge}
            label="Delivery Radius"
            value={business.deliveryRadiusKm}
            onChange={(deliveryRadiusKm) =>
              onChange({ deliveryRadiusKm }, "Delivery radius updated")
            }
          />
        </SettingsCard>
      </div>

      <SettingsSheet
        open={holidaySheet}
        title="Add holiday"
        subtitle="Customers cannot place orders on this date"
        onClose={() => setHolidaySheet(false)}
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="holiday-date"
              className="text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground"
            >
              Date
            </label>
            <div className="field-focus mt-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
              <input
                id="holiday-date"
                type="date"
                value={holidayDate}
                onChange={(event) => setHolidayDate(event.target.value)}
                className="w-full bg-transparent text-sm font-semibold tracking-tight text-foreground outline-none"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="holiday-label"
              className="text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground"
            >
              Reason
            </label>
            <div className="field-focus mt-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
              <input
                id="holiday-label"
                type="text"
                value={holidayLabel}
                placeholder="Festival, maintenance, staff leave…"
                onChange={(event) => setHolidayLabel(event.target.value)}
                className="w-full bg-transparent text-sm font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <PrimaryButton onClick={addHoliday}>Add to calendar</PrimaryButton>
        </div>
      </SettingsSheet>
    </SettingsSection>
  );
}

function RadiusRow({
  icon: Icon,
  label,
  value,
  onChange,
}: {
  icon: typeof MapPin;
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  const id = `${label.toLowerCase().replace(/\s+/g, "-")}-range`;

  return (
    <div className="px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
          <Icon className="size-4" strokeWidth={2.1} aria-hidden="true" />
        </span>
        <label htmlFor={id} className="min-w-0 flex-1 truncate text-sm font-bold tracking-tight text-foreground">
          {label}
        </label>
        <span className="shrink-0 text-sm font-black tracking-tight text-brand-green">
          {value} km
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={1}
        max={25}
        step={1}
        value={value}
        aria-valuetext={`${value} kilometres`}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
      />
      <div className="mt-1 flex justify-between text-[0.62rem] font-semibold uppercase tracking-widest text-muted-foreground">
        <span>1 km</span>
        <span>25 km</span>
      </div>
    </div>
  );
}

