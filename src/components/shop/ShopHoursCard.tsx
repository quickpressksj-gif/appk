import { CalendarOff, Clock3, DoorClosed, Plane, Sunrise, Sunset } from "lucide-react";

import { ToggleRow } from "../PartnerPrimitives";
import { formatTimeLabel, WEEKLY_OFF_OPTIONS, type BusinessHours } from "../../data/partner-shop-mock";

function TimeField({
  id,
  label,
  icon: Icon,
  value,
  onChange,
}: {
  id: string;
  label: string;
  icon: typeof Clock3;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground"
      >
        {label}
      </label>
      <div className="field-focus mt-2 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <input
          id={id}
          type="time"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold tracking-tight text-foreground outline-none"
        />
      </div>
      <p className="mt-1.5 text-[0.66rem] font-medium text-muted-foreground">
        {formatTimeLabel(value)}
      </p>
    </div>
  );
}

/** Business hours — opening, closing, weekly off, holiday & temporary closure. */
export function ShopHoursCard({
  hours,
  onChange,
}: {
  hours: BusinessHours;
  onChange: (patch: Partial<BusinessHours>) => void;
}) {
  return (
    <div className="mt-4 space-y-3">
      <div className="card-soft border border-border p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TimeField
            id="opening-time"
            label="Opening Time"
            icon={Sunrise}
            value={hours.openingTime}
            onChange={(value) => onChange({ openingTime: value })}
          />
          <TimeField
            id="closing-time"
            label="Closing Time"
            icon={Sunset}
            value={hours.closingTime}
            onChange={(value) => onChange({ closingTime: value })}
          />
        </div>

        <div className="mt-4">
          <label
            htmlFor="weekly-off"
            className="text-[0.66rem] font-bold uppercase tracking-widest text-muted-foreground"
          >
            Weekly Off
          </label>
          <div className="field-focus mt-2 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
            <CalendarOff className="size-4 shrink-0 text-muted-foreground" />
            <select
              id="weekly-off"
              value={hours.weeklyOff}
              onChange={(event) => onChange({ weeklyOff: event.target.value })}
              className="min-w-0 flex-1 appearance-none bg-transparent text-sm font-semibold tracking-tight text-foreground outline-none"
            >
              {WEEKLY_OFF_OPTIONS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <ToggleRow
        icon={Plane}
        label="Holiday Mode"
        description="Pause orders during a planned break"
        checked={hours.holidayMode}
        onChange={(next) => onChange({ holidayMode: next })}
      />
      <ToggleRow
        icon={DoorClosed}
        label="Temporarily Closed"
        description="Stop new orders for a few hours"
        checked={hours.temporarilyClosed}
        onChange={(next) => onChange({ temporarilyClosed: next })}
      />
    </div>
  );
}
