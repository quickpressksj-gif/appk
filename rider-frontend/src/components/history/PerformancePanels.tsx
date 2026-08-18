import {
  Award,
  Clock3,
  Gauge,
  Package,
  Route,
  ShieldCheck,
  Star,
  Timer,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import type { Achievement, PerformanceStat } from "../../data/rider-history-mock";
import { CounterCard, ProgressBar } from "../wallet/WalletPrimitives";

const STAT_ICONS: Record<string, LucideIcon> = {
  total: Package,
  completion: ShieldCheck,
  acceptance: Gauge,
  rating: Star,
  ontime: Timer,
  distance: Route,
  hours: Clock3,
};

export function PerformanceKpiGrid({ stats }: { stats: PerformanceStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {stats.map((stat, index) => (
        <CounterCard
          key={stat.id}
          icon={STAT_ICONS[stat.id] ?? Gauge}
          label={stat.label}
          value={stat.value}
          {...(stat.prefix ? { prefix: stat.prefix } : {})}
          {...(stat.suffix ? { suffix: stat.suffix } : {})}
          {...(stat.decimals ? { decimals: stat.decimals } : {})}
          hint={stat.hint}
          tone={stat.tone}
          delay={index * 60}
        />
      ))}
    </div>
  );
}

export function AchievementBadges({ achievements }: { achievements: Achievement[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {achievements.map((badge, index) => {
        const ratio = Math.min(badge.progress / badge.target, 1);
        return (
          <article
            key={badge.id}
            className={`card-soft animate-rise border p-4 ${
              badge.unlocked ? "border-secondary/40" : "border-border"
            }`}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="flex items-start gap-3">
              <span
                className={`animate-badge-pop flex size-11 shrink-0 items-center justify-center rounded-2xl ${
                  badge.unlocked
                    ? "bg-secondary/10 text-brand-green"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {badge.unlocked ? (
                  <Trophy className="size-5" strokeWidth={2.2} />
                ) : (
                  <Award className="size-5" strokeWidth={2.2} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black tracking-tight text-foreground">
                  {badge.title}
                </p>
                <p className="truncate text-[0.68rem] font-medium text-muted-foreground">
                  {badge.body}
                </p>
              </div>
            </div>
            {badge.unlocked ? (
              <p className="mt-3 text-[0.66rem] font-bold uppercase tracking-widest text-brand-green">
                Unlocked
              </p>
            ) : (
              <div className="mt-3">
                <ProgressBar value={ratio} />
                <p className="mt-2 text-[0.66rem] font-semibold text-muted-foreground">
                  {badge.progress} / {badge.target}
                </p>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}