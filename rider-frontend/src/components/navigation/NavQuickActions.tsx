import { Crosshair, LifeBuoy, Locate, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Floating quick-action buttons stacked above the bottom sheet. */
export function NavQuickActions({
  onCurrentLocation,
  onRecenter,
  onSos,
  onReportIssue,
}: {
  onCurrentLocation: () => void;
  onRecenter: () => void;
  onSos: () => void;
  onReportIssue: () => void;
}) {
  const actions: { id: string; label: string; icon: LucideIcon; onPress: () => void; tone: string }[] =
    [
      {
        id: "location",
        label: "Current location",
        icon: Locate,
        onPress: onCurrentLocation,
        tone: "text-foreground",
      },
      {
        id: "recenter",
        label: "Recenter map",
        icon: Crosshair,
        onPress: onRecenter,
        tone: "text-foreground",
      },
      {
        id: "issue",
        label: "Report issue",
        icon: TriangleAlert,
        onPress: onReportIssue,
        tone: "text-brand-dark",
      },
      {
        id: "sos",
        label: "Emergency SOS",
        icon: LifeBuoy,
        onPress: onSos,
        tone: "text-destructive",
      },
    ];

  return (
    <div className="flex flex-col items-end gap-2">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          aria-label={action.label}
          title={action.label}
          onClick={action.onPress}
          className={`glass-panel flex size-12 items-center justify-center rounded-2xl shadow-soft transition-all duration-300 active:scale-[0.94] ${action.tone}`}
        >
          <action.icon className="size-5" strokeWidth={2.2} />
        </button>
      ))}
    </div>
  );
}
