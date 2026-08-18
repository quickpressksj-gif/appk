import { MapPin } from "lucide-react";

export function LocationDetecting({
  label = "Fetching location…",
}: {
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
    >
      <div className="relative flex size-40 items-center justify-center">
        <span className="absolute size-32 rounded-full bg-muted" />
        <span className="locate-ring absolute size-32 rounded-full bg-secondary/25" />
        <span
          className="locate-ring absolute size-32 rounded-full bg-secondary/20"
          style={{ animationDelay: "0.7s" }}
        />
        <MapPin className="locate-bob relative size-10 fill-brand-green text-brand-green" />
      </div>

      <p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
