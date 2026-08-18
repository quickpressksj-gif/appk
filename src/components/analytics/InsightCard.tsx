import type { InsightCardData } from "../../data/partner-analytics-mock";

const TONE_CLASS: Record<InsightCardData["tone"], string> = {
  primary: "bg-primary/15 text-brand-dark",
  green: "bg-secondary/10 text-brand-green",
  muted: "bg-muted text-muted-foreground",
  danger: "bg-destructive/10 text-destructive",
};

/** Business insight tile (peak hours, best service, retention…). */
export function InsightCard({ insight }: { insight: InsightCardData }) {
  return (
    <article className="card-soft animate-slide-up border border-border p-4 transition-all duration-300 hover:border-primary/60">
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-wider ${TONE_CLASS[insight.tone]}`}
      >
        {insight.title}
      </span>
      <p className="mt-3 text-lg font-black tracking-tight text-foreground">{insight.value}</p>
      <p className="mt-1 text-[0.72rem] font-medium leading-relaxed text-muted-foreground">
        {insight.detail}
      </p>
    </article>
  );
}