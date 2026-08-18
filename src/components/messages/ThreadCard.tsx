import { Headset, Megaphone, PackageCheck, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { PartnerThread, ThreadKind } from "../../data/partner-notifications-mock";

const KIND_ICON: Record<ThreadKind, LucideIcon> = {
  customer: UserRound,
  order: PackageCheck,
  support: Headset,
  broadcast: Megaphone,
};

/** Sprint 3.8 — conversation row in the Communication Center. */
export function ThreadCard({
  thread,
  onOpen,
}: {
  thread: PartnerThread;
  onOpen: (id: string) => void;
}) {
  const Icon = KIND_ICON[thread.kind];

  return (
    <button
      type="button"
      onClick={() => onOpen(thread.id)}
      aria-label={`Open conversation with ${thread.name}`}
      className="card-soft animate-slide-up ripple flex w-full items-center gap-3 border border-border p-4 text-left transition-all duration-300 hover:border-primary/60 active:scale-[0.98]"
    >
      <span className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-brand-dark">
        <span className="text-[0.72rem] font-black tracking-tight">{thread.avatarInitials}</span>
        {thread.online ? (
          <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card bg-secondary" />
        ) : null}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-sm font-bold tracking-tight text-foreground">
            {thread.name}
          </p>
          <span className="shrink-0 text-[0.66rem] font-bold uppercase tracking-wider text-muted-foreground">
            {thread.lastTime}
          </span>
        </div>
        <p className="flex items-center gap-1 truncate text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
          <Icon className="size-3 shrink-0" aria-hidden="true" />
          {thread.subtitle}
        </p>
        <p className="mt-1 truncate text-[0.72rem] font-medium text-muted-foreground">
          {thread.lastMessage}
        </p>
      </div>

      {thread.unread > 0 ? (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[0.66rem] font-black text-secondary-foreground">
          {thread.unread}
        </span>
      ) : null}
    </button>
  );
}