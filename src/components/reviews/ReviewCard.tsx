import { CornerDownRight, Image as ImageIcon, Pencil, ThumbsUp, Trash2 } from "lucide-react";

import { StarRating } from "./StarRating";
import { CustomerAvatar } from "../customers/CustomerCard";
import { formatDate, type PartnerReview } from "../../data/partner-customers-mock";

/** Single review with reply management actions (UI only). */
export function ReviewCard({
  review,
  index = 0,
  onReply,
  onEditReply,
  onDeleteReply,
  onOpenCustomer,
}: {
  review: PartnerReview;
  index?: number;
  onReply: () => void;
  onEditReply: () => void;
  onDeleteReply: () => void;
  onOpenCustomer: () => void;
}) {
  return (
    <article
      className="card-soft animate-soft-fade border border-border p-4 transition-all duration-300 hover:border-primary/60"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="flex items-start gap-3">
        <CustomerAvatar
          customer={{ name: review.customerName, photo: review.customerPhoto }}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onOpenCustomer}
            className="truncate text-sm font-black tracking-tight text-foreground hover:text-brand-green-dark"
          >
            {review.customerName}
          </button>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <StarRating value={review.rating} />
            <span className="text-[0.66rem] font-semibold text-muted-foreground">
              {formatDate(review.date)}
            </span>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">
          {review.orderId}
        </span>
      </div>

      <p className="mt-3 text-[0.78rem] font-medium leading-relaxed text-foreground">{review.text}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-border px-2 py-0.5 text-[0.62rem] font-bold tracking-tight text-muted-foreground">
          {review.serviceName}
        </span>
        <span className="flex items-center gap-1 text-[0.66rem] font-semibold text-muted-foreground">
          <ThumbsUp className="size-3" />
          {review.helpfulCount} helpful
        </span>
      </div>

      {review.images > 0 ? (
        <div className="mt-3 flex items-center gap-2">
          {Array.from({ length: review.images }).map((_, imageIndex) => (
            <span
              key={imageIndex}
              aria-label="Review image placeholder"
              className="flex size-14 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/60 text-muted-foreground"
            >
              <ImageIcon className="size-4" />
            </span>
          ))}
        </div>
      ) : null}

      {review.reply ? (
        <div className="animate-soft-fade mt-3 rounded-2xl bg-muted/60 p-3">
          <p className="flex items-center gap-1 text-[0.62rem] font-bold uppercase tracking-wider text-muted-foreground">
            <CornerDownRight className="size-3" />
            Your reply · {formatDate(review.reply.date)}
          </p>
          <p className="mt-1 text-[0.74rem] font-medium leading-relaxed text-foreground">
            {review.reply.text}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onEditReply}
              className="ripple flex items-center gap-1 rounded-2xl border border-border bg-card px-3 py-1.5 text-[0.68rem] font-bold tracking-tight text-foreground transition-all duration-300 hover:border-primary/60 active:scale-[0.96]"
            >
              <Pencil className="size-3" />
              Edit
            </button>
            <button
              type="button"
              onClick={onDeleteReply}
              className="ripple flex items-center gap-1 rounded-2xl border border-destructive/40 px-3 py-1.5 text-[0.68rem] font-bold tracking-tight text-destructive transition-all duration-300 active:scale-[0.96]"
            >
              <Trash2 className="size-3" />
              Delete
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onReply}
          className="ripple mt-4 flex items-center gap-1.5 rounded-2xl bg-primary px-3.5 py-2 text-[0.7rem] font-black tracking-tight text-primary-foreground transition-all duration-300 active:scale-[0.96]"
        >
          <CornerDownRight className="size-3.5" />
          Write Reply
        </button>
      )}
    </article>
  );
}
