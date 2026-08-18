import { Flame, Sparkles, Target, Trophy } from "lucide-react";

import { formatINR, type IncentiveCard } from "../../data/rider-wallet-mock";
import { ProgressBar } from "./WalletPrimitives";

const ICONS = [Flame, Sparkles, Target, Trophy];

export function IncentiveCardGrid({ cards }: { cards: IncentiveCard[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((card, index) => {
        const Icon = ICONS[index % ICONS.length] ?? Trophy;
        const ratio = Math.min(card.current / card.target, 1);
        return (
          <article
            key={card.id}
            className="card-soft animate-rise border border-border p-4"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${
                  card.tone === "green"
                    ? "bg-secondary/10 text-brand-green"
                    : "bg-primary/15 text-brand-dark"
                }`}
              >
                <Icon className="size-4" strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black tracking-tight text-foreground">
                  {card.title}
                </p>
                <p className="truncate text-[0.68rem] font-medium text-muted-foreground">
                  {card.description}
                </p>
              </div>
              <p className="shrink-0 text-sm font-black tracking-tight text-brand-green">
                {formatINR(card.reward)}
              </p>
            </div>

            <div className="mt-3">
              <ProgressBar value={ratio} tone={card.tone === "green" ? "green" : "primary"} />
            </div>
            <div className="mt-2 flex items-center justify-between text-[0.66rem] font-semibold text-muted-foreground">
              <span>
                {card.current} / {card.target} {card.unit}
              </span>
              <span>{card.expiresIn}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function AchievementRewardList({
  rewards,
}: {
  rewards: { id: string; title: string; body: string; reward: string; unlocked: boolean }[];
}) {
  return (
    <div className="space-y-3">
      {rewards.map((item, index) => (
        <div
          key={item.id}
          className="card-soft animate-slide-in flex items-center gap-3 border border-border p-4"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${
              item.unlocked ? "bg-secondary/10 text-brand-green" : "bg-muted text-muted-foreground"
            }`}
          >
            <Trophy className="size-4" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold tracking-tight text-foreground">{item.title}</p>
            <p className="truncate text-[0.68rem] font-medium text-muted-foreground">{item.body}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[0.64rem] font-black tracking-tight ${
              item.unlocked ? "bg-secondary/10 text-brand-green" : "bg-muted text-muted-foreground"
            }`}
          >
            {item.unlocked ? item.reward : "Locked"}
          </span>
        </div>
      ))}
    </div>
  );
}