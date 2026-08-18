import { X } from "lucide-react";
import { useState } from "react";

import { StarRating } from "./StarRating";
import type { PartnerReview } from "../../data/partner-customers-mock";

/** Bottom sheet used to write or edit a reply. UI only — nothing is persisted. */
export function ReviewReplySheet({
  review,
  mode,
  onClose,
  onSubmit,
}: {
  review: PartnerReview;
  mode: "create" | "edit";
  onClose: () => void;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState(mode === "edit" ? (review.reply?.text ?? "") : "");
  const trimmed = text.trim();

  return (
    <div className="animate-overlay-in fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === "edit" ? "Edit reply" : "Write reply"}
        className="animate-slide-up w-full max-w-md rounded-t-3xl border border-border bg-card p-5 shadow-soft sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black tracking-tight text-foreground">
              {mode === "edit" ? "Edit your reply" : "Reply to review"}
            </p>
            <p className="truncate text-[0.7rem] font-semibold text-muted-foreground">
              {review.customerName} · {review.serviceName} · {review.orderId}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close reply sheet"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground transition-all duration-300 active:scale-[0.94]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-muted/60 p-3">
          <StarRating value={review.rating} />
          <p className="mt-1.5 text-[0.74rem] font-medium leading-relaxed text-foreground">
            {review.text}
          </p>
        </div>

        <label className="mt-4 block">
          <span className="text-[0.66rem] font-bold uppercase tracking-wider text-muted-foreground">
            Your reply
          </span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={4}
            maxLength={400}
            placeholder="Thank the customer or explain how you'll fix the issue…"
            className="mt-1.5 w-full resize-none rounded-2xl border border-border bg-background px-3.5 py-3 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted-foreground"
          />
          <span className="mt-1 block text-right text-[0.64rem] font-semibold text-muted-foreground">
            {text.length}/400
          </span>
        </label>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="ripple flex-1 rounded-2xl border border-border bg-card px-4 py-3 text-[0.75rem] font-bold tracking-tight text-foreground transition-all duration-300 active:scale-[0.97]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!trimmed}
            onClick={() => onSubmit(trimmed)}
            className="ripple flex-1 rounded-2xl bg-primary px-4 py-3 text-[0.75rem] font-black tracking-tight text-primary-foreground transition-all duration-300 active:scale-[0.97] disabled:opacity-50"
          >
            {mode === "edit" ? "Update Reply" : "Post Reply"}
          </button>
        </div>
      </div>
    </div>
  );
}
