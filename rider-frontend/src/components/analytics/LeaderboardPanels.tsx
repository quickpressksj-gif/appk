import { Crown, Medal, TrendingDown, TrendingUp, Trophy } from "lucide-react";

import {
  LEADERBOARD_SCOPES,
  type LeaderboardRankCard,
  type LeaderboardRow,
  type LeaderboardScope,
} from "../../data/rider-analytics-mock";

/** Rank cards: city / area / weekly / monthly (UI only). */
export function RankCardGrid({ ranks }: { ranks: LeaderboardRankCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ranks.map((rank, index) => {
        const up = rank.movement >= 0;
        const MovementIcon = up ? TrendingUp : TrendingDown;
        return (
          <div
            key={rank.id}
            className="card-soft animate-rise border border-border p-4"
            style={{ animationDelay: `${index * 55}ms` }}
          >
            <p className="text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
              {rank.label}
            </p>
            <p className="mt-1.5 text-xl font-black tracking-tight text-foreground tabular-nums">
              #{rank.rank}
            </p>
            <p className="text-[0.62rem] font-semibold text-muted-foreground">
              of {rank.total.toLocaleString("en-IN")} riders
            </p>
            <span
              className={`mt-2 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.6rem] font-black ${
                up ? "bg-secondary/15 text-brand-green" : "bg-destructive/10 text-destructive"
              }`}
            >
              <MovementIcon className="size-3" />
              {Math.abs(rank.movement)} spots
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Scope switcher chips for the leaderboard. */
export function LeaderboardScopeTabs({
  scope,
  onScope,
}: {
  scope: LeaderboardScope;
  onScope: (next: LeaderboardScope) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {LEADERBOARD_SCOPES.map((item) => {
        const active = item.id === scope;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            onClick={() => onScope(item.id)}
            className={`min-h-9 rounded-full px-3 py-2 text-[0.7rem] font-black tracking-tight transition-all duration-300 active:scale-[0.97] ${
              active
                ? "bg-primary/15 text-brand-dark ring-1 ring-primary/40"
                : "border border-border bg-card text-muted-foreground"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function rankBadge(rank: number) {
  if (rank === 1) return { icon: Crown, tone: "bg-secondary/20 text-brand-green" };
  if (rank === 2) return { icon: Trophy, tone: "bg-primary/20 text-brand-dark" };
  if (rank === 3) return { icon: Medal, tone: "bg-primary/15 text-brand-dark" };
  return null;
}

/** Top riders list (UI only). */
export function TopRidersList({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <div className="space-y-2.5">
      {rows.map((row, index) => {
        const badge = rankBadge(row.rank);
        const Icon = badge?.icon;
        return (
          <div
            key={row.id}
            className={`card-soft animate-rise flex items-center gap-3 border p-3.5 ${
              row.isMe ? "border-secondary/50 bg-secondary/5" : "border-border"
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-2xl text-xs font-black ${
                badge ? badge.tone : "bg-muted text-muted-foreground"
              }`}
            >
              {Icon ? <Icon className="size-4" strokeWidth={2.2} /> : `#${row.rank}`}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black tracking-tight text-foreground">
                {row.name}
                {row.isMe ? (
                  <span className="ml-1.5 rounded-full bg-secondary/15 px-1.5 py-0.5 text-[0.55rem] font-black uppercase tracking-widest text-brand-green">
                    You
                  </span>
                ) : null}
              </p>
              <p className="truncate text-[0.66rem] font-medium text-muted-foreground">
                {row.zone} · {row.deliveries} deliveries
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-black tabular-nums text-foreground">{row.score}</p>
              <p className="text-[0.58rem] font-bold uppercase tracking-widest text-muted-foreground">
                score
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
