import { MessageSquareOff, SearchX } from "lucide-react";

/** Empty states for reviews. */
export function ReviewEmptyState({
  variant,
  onAction,
}: {
  variant: "no-reviews" | "no-results";
  onAction?: () => void;
}) {
  const copy =
    variant === "no-results"
      ? {
          icon: SearchX,
          title: "No reviews match this filter",
          body: "Try another rating filter or reset the sort to Latest.",
          action: "Reset filters",
        }
      : {
          icon: MessageSquareOff,
          title: "No reviews yet",
          body: "Reviews from completed orders will appear here so you can reply to every customer.",
          action: undefined,
        };

  const Icon = copy.icon;

  return (
    <div className="card-soft animate-soft-fade mt-4 flex flex-col items-center border border-border px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-3xl bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </span>
      <p className="mt-3 text-sm font-black tracking-tight text-foreground">{copy.title}</p>
      <p className="mt-1 max-w-xs text-xs font-medium text-muted-foreground">{copy.body}</p>
      {copy.action && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="ripple mt-4 rounded-2xl bg-primary px-4 py-2 text-[0.72rem] font-black tracking-tight text-primary-foreground transition-all duration-300 active:scale-[0.96]"
        >
          {copy.action}
        </button>
      ) : null}
    </div>
  );
}
