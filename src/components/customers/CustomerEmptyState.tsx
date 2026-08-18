import { SearchX, UserRoundX } from "lucide-react";

/** Empty states for customers: none at all vs. no search results. */
export function CustomerEmptyState({
  variant,
  onAction,
}: {
  variant: "no-customers" | "no-results";
  onAction?: () => void;
}) {
  const copy =
    variant === "no-results"
      ? {
          icon: SearchX,
          title: "No matching customers",
          body: "Try a different name, mobile number or customer ID, or clear the active filters.",
          action: "Clear search & filters",
        }
      : {
          icon: UserRoundX,
          title: "No customers yet",
          body: "Once customers place their first order with your shop, they will show up here.",
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
