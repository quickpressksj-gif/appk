import { Lock, Sparkles, Trophy } from "lucide-react";

import type { AchievementTier, RiderAchievement } from "../../data/rider-analytics-mock";

const TIER_LABEL: Record<AchievementTier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

const TIER_TONE: Record<AchievementTier, string> = {
  bronze: "bg-primary/15 text-brand-dark",
  silver: "bg-muted text-foreground",
  gold: "bg-secondary/15 text-brand-green",
  platinum: "bg-primary/25 text-brand-dark",
};

/** Premium achievement badge card with progress ring + unlock state. */
export function AchievementBadge({
  achievement,
  delay = 0,
}: {
  achievement: RiderAchievement;
  delay?: number;
}) {
  const pct = Math.min(100, Math.round((achievement.progress / achievement.target) * 100));

  return (
    <div
      className={`card-soft animate-rise relative overflow-hidden border p-4 transition-all duration-300 ${
        achievement.unlocked ? "border-secondary/40" : "border-border"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3">
        <span
          className={`animate-badge-pop grid size-11 shrink-0 place-items-center rounded-2xl text-lg ${
            achievement.unlocked ? TIER_TONE[achievement.tier] : "bg-muted text-muted-foreground"
          }`}
          aria-hidden="true"
        >
          {achievement.unlocked ? achievement.emoji : <Lock className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-black tracking-tight text-foreground">
              {achievement.title}
            </p>
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[0.55rem] font-black uppercase tracking-widest ${TIER_TONE[achievement.tier]}`}
            >
              {TIER_LABEL[achievement.tier]}
            </span>
          </div>
          <p className="mt-0.5 text-[0.68rem] font-medium text-muted-foreground">
            {achievement.body}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="animate-bar-grow h-full rounded-full bg-secondary"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[0.62rem] font-bold text-muted-foreground">
          <span>
            {achievement.progress.toLocaleString("en-IN")} / {achievement.target.toLocaleString("en-IN")}
          </span>
          {achievement.unlocked ? (
            <span className="flex items-center gap-1 text-brand-green">
              <Trophy className="size-3" />
              {achievement.unlockedOn ? `Unlocked ${achievement.unlockedOn}` : "Unlocked"}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Sparkles className="size-3" />
              {pct}% complete
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function AchievementGrid({ achievements }: { achievements: RiderAchievement[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {achievements.map((achievement, index) => (
        <AchievementBadge key={achievement.id} achievement={achievement} delay={index * 55} />
      ))}
    </div>
  );
}

/** Compact summary strip: unlocked count + next badge in line. */
export function AchievementSummary({ achievements }: { achievements: RiderAchievement[] }) {
  const unlocked = achievements.filter((item) => item.unlocked).length;
  const next = achievements
    .filter((item) => !item.unlocked)
    .sort((a, b) => b.progress / b.target - a.progress / a.target)[0];

  return (
    <div className="card-soft animate-rise flex items-center gap-3 border border-border p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-secondary/15 text-brand-green">
        <Trophy className="size-5" strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black tracking-tight text-foreground">
          {unlocked} of {achievements.length} badges unlocked
        </p>
        <p className="truncate text-[0.68rem] font-medium text-muted-foreground">
          {next ? `Next up · ${next.title} (${next.progress}/${next.target})` : "All badges earned"}
        </p>
      </div>
    </div>
  );
}
