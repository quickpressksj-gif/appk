import { Star } from "lucide-react";

/** Read-only star rating row. */
export function StarRating({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "size-3" : "size-3.5";
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${cls} ${star <= value ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
          strokeWidth={2}
        />
      ))}
    </span>
  );
}
