import { MessageSquare, Star } from "lucide-react";

import { StarRating } from "./StarRating";
import type { ReviewAnalytics } from "../../data/partner-customers-mock";

/** Premium analytics cards + rating distribution bars. */
export function ReviewAnalyticsCards({
  analytics,
  activeRating,
  onRatingSelect,
}: {
  analytics: ReviewAnalytics;
  activeRating: number | null;
  onRatingSelect: (rating: number | null) => void;
}) {
  const stars = [5, 4, 3, 2, 1] as const;

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="card-soft animate-soft-fade border border-border p-4">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
            <Star className="size-4" strokeWidth={2.2} />
          </span>
          <p className="mt-3 text-2xl font-black tracking-tight text-foreground">
            {analytics.average.toFixed(1)}
          </p>
          <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Average Rating
          </p>
          <div className="mt-1">
            <StarRating value={Math.round(analytics.average)} size="sm" />
          </div>
        </div>

        <div className="card-soft animate-soft-fade border border-border p-4" style={{ animationDelay: "60ms" }}>
          <span className="flex size-9 items-center justify-center rounded-2xl bg-secondary/10 text-brand-green">
            <MessageSquare className="size-4" strokeWidth={2.2} />
          </span>
          <p className="mt-3 text-2xl font-black tracking-tight text-foreground">{analytics.total}</p>
          <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Total Reviews
          </p>
          <p className="mt-1 text-[0.68rem] font-medium text-brand-green">
            {analytics.replied} replied
          </p>
        </div>

        {([5, 4] as const).map((star, index) => (
          <RatingCountCard
            key={star}
            star={star}
            count={analytics.counts[star]}
            total={analytics.total}
            delay={120 + index * 60}
            active={activeRating === star}
            onSelect={() => onRatingSelect(activeRating === star ? null : star)}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {([3, 2, 1] as const).map((star, index) => (
          <RatingCountCard
            key={star}
            star={star}
            count={analytics.counts[star]}
            total={analytics.total}
            delay={240 + index * 60}
            active={activeRating === star}
            onSelect={() => onRatingSelect(activeRating === star ? null : star)}
          />
        ))}
      </div>

      <div className="card-soft animate-soft-fade border border-border p-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
          Rating distribution
        </p>
        <div className="mt-3 space-y-2">
          {stars.map((star) => {
            const count = analytics.counts[star];
            const pct = analytics.total ? Math.round((count / analytics.total) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="w-8 shrink-0 text-[0.68rem] font-bold text-muted-foreground">
                  {star}★
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-[0.68rem] font-bold text-foreground">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RatingCountCard({
  star,
  count,
  total,
  delay,
  active,
  onSelect,
}: {
  star: number;
  count: number;
  total: number;
  delay: number;
  active: boolean;
  onSelect: () => void;
}) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      style={{ animationDelay: `${delay}ms` }}
      className={`card-soft animate-soft-fade border p-4 text-left transition-all duration-300 active:scale-[0.97] ${
        active ? "border-brand-green bg-secondary/5" : "border-border hover:border-primary/60"
      }`}
    >
      <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground">
        {star}★ Count
      </span>
      <p className="mt-1 text-xl font-black tracking-tight text-foreground">{count}</p>
      <p className="text-[0.66rem] font-medium text-muted-foreground">{pct}% of reviews</p>
    </button>
  );
}
