import { Bike, MapPin, Navigation } from "lucide-react";

/**
 * Full-bleed map placeholder with rider / pickup / delivery markers and an
 * animated route line. Swap the inner canvas for the Maps SDK later.
 */
export function NavMapCanvas({
  className = "size-full",
  pickupLabel = "Pickup",
  deliveryLabel = "Delivery",
  dimmed = false,
}: {
  className?: string;
  pickupLabel?: string;
  deliveryLabel?: string;
  dimmed?: boolean;
}) {
  return (
    <div
      role="img"
      aria-label="Route map placeholder showing rider, pickup and delivery markers"
      className={`animate-soft-fade relative overflow-hidden bg-muted ${className}`}
    >
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="pointer-events-none absolute -left-24 top-1/3 size-72 rounded-full bg-secondary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 size-72 rounded-full bg-primary/12 blur-3xl" />

      <svg className="absolute inset-0 size-full" viewBox="0 0 400 600" preserveAspectRatio="none">
        <path
          d="M70 500 C 130 430, 90 340, 180 300 S 300 220, 320 110"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M70 500 C 130 430, 90 340, 180 300 S 300 220, 320 110"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="16 14"
          className="animate-route-dash"
        />
      </svg>

      {/* Rider marker */}
      <Marker
        className="bottom-[14%] left-[14%]"
        label="You"
        tone="dark"
        icon={<Bike className="size-4" strokeWidth={2.4} />}
        pulse
      />
      {/* Pickup marker */}
      <Marker
        className="left-[42%] top-[48%]"
        label={pickupLabel}
        tone="green"
        icon={<MapPin className="size-4" strokeWidth={2.4} />}
      />
      {/* Delivery marker */}
      <Marker
        className="right-[16%] top-[14%]"
        label={deliveryLabel}
        tone="primary"
        icon={<Navigation className="size-4" strokeWidth={2.4} />}
      />

      {dimmed ? <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" /> : null}
    </div>
  );
}

function Marker({
  className,
  label,
  icon,
  tone,
  pulse = false,
}: {
  className: string;
  label: string;
  icon: React.ReactNode;
  tone: "dark" | "green" | "primary";
  pulse?: boolean;
}) {
  const toneClass =
    tone === "green"
      ? "bg-secondary text-primary-foreground"
      : tone === "primary"
        ? "bg-primary text-primary-foreground"
        : "bg-foreground text-background";

  return (
    <div className={`absolute flex flex-col items-center ${className}`}>
      <span className="relative flex size-9 items-center justify-center">
        {pulse ? (
          <span
            className={`animate-marker-pulse absolute inset-0 rounded-full ${
              tone === "green" ? "bg-secondary/60" : "bg-primary/50"
            }`}
          />
        ) : null}
        <span
          className={`relative flex size-9 items-center justify-center rounded-full shadow-soft ${toneClass}`}
        >
          {icon}
        </span>
      </span>
      <span className="mt-1 rounded-full bg-background/90 px-2 py-0.5 text-[0.62rem] font-black tracking-tight text-foreground shadow-soft">
        {label}
      </span>
    </div>
  );
}
