import { Lightbulb, MapPin, Sparkles, TrendingUp, type LucideIcon } from "lucide-react";

import type { InsightCard } from "../../data/rider-analytics-mock";

const TONE: Record<InsightCard["tone"], { icon: LucideIcon; tile: string }> = {
  good: { icon: TrendingUp, tile: "bg-secondary/15 text-brand-green" },
  info: { icon: MapPin, tile: "bg-primary/15 text-brand-dark" },
  warn: { icon: Lightbulb, tile: "bg-destructive/10 text-destructive" },
};

/** Performance insight card. */
export function InsightTile({ insight, delay = 0 }: { insight: InsightCard; delay?: number }) {
  const tone = TONE[insight.tone];
  const Icon = tone.icon;

  return (
    <div
      className="card-soft animate-rise border border-border p-4 transition-all duration-300 hover:border-primary/60"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${tone.tile}`}>
          <Icon className="size-4" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
            {insight.title}
          </p>
          <p className="mt-1 text-sm font-black tracking-tight text-foreground">{insight.value}</p>
          <p className="mt-1 text-[0.68rem] font-medium leading-relaxed text-muted-foreground">
            {insight.body}
          </p>
        </div>
      </div>
    </div>
  );
}

export function InsightCardGrid({ insights }: { insights: InsightCard[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {insights.map((insight, index) => (
        <InsightTile key={insight.id} insight={insight} delay={index * 55} />
      ))}
    </div>
  );
}

/** Small hero banner used above the insight grid. */
export function InsightHighlight({ headline, body }: { headline: string; body: string }) {
  return (
    <div className="card-soft animate-rise flex items-center gap-3 border border-border p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-brand-dark">
        <Sparkles className="size-5" strokeWidth={2.2} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-black tracking-tight text-foreground">{headline}</p>
        <p className="text-[0.68rem] font-medium text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
