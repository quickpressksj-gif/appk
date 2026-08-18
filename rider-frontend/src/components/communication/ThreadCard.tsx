import { Headphones, Store, UserRound } from "lucide-react";

import type { ChatThread } from "../../data/rider-notifications-mock";

const KIND_META: Record<ChatThread["kind"], { label: string; tone: string; icon: typeof UserRound }> = {
  customer: { label: "Customer", tone: "bg-primary/15 text-brand-dark", icon: UserRound },
  partner: { label: "Partner", tone: "bg-secondary/10 text-brand-green", icon: Store },
  support: { label: "Support", tone: "bg-muted text-muted-foreground", icon: Headphones },
};

/** Conversation row for the Communication Center list. */
export function ThreadCard({
  thread,
  delay = 0,
  onOpen,
}: {
  thread: ChatThread;
  delay?: number;
  onOpen: () => void;
}) {
  const meta = KIND_META[thread.kind];
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{ animationDelay: `${delay}ms` }}
      className={`card-soft animate-notify-in flex w-full items-start gap-3 border p-4 text-left transition-transform active:scale-[0.98] ${
        thread.unread > 0 ? "border-brand-green/40 bg-secondary/[0.04]" : "border-border"
      }`}
    >
      <span className={`relative grid size-11 shrink-0 place-items-center rounded-2xl ${meta.tone}`}>
        <span className="text-[0.7rem] font-black tracking-tight">{thread.avatarInitials}</span>
        {thread.online ? (
          <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card bg-brand-green" />
        ) : null}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-black tracking-tight text-foreground">
            {thread.name}
          </span>
          <span className="ml-auto shrink-0 text-[0.62rem] font-semibold text-muted-foreground">
            {thread.lastTime}
          </span>
        </span>
        <span className="mt-0.5 flex items-center gap-1.5">
          <Icon className="size-3 shrink-0 text-muted-foreground" strokeWidth={2.4} />
          <span className="truncate text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
            {meta.label} · {thread.orderId}
          </span>
        </span>
        <span className="mt-1 flex items-center gap-2">
          <span className="line-clamp-1 flex-1 text-[0.72rem] font-medium text-muted-foreground">
            {thread.lastMessage}
          </span>
          {thread.unread > 0 ? (
            <span className="animate-badge-pop grid size-5 shrink-0 place-items-center rounded-full bg-brand-green text-[0.6rem] font-black text-white">
              {thread.unread}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

export function CommunicationSectionHeader({
  title,
  caption,
  count,
}: {
  title: string;
  caption: string;
  count: number;
}) {
  return (
    <div className="flex items-end justify-between gap-2">
      <div className="min-w-0">
        <h2 className="text-sm font-black tracking-tight text-foreground">{title}</h2>
        <p className="text-[0.66rem] font-medium text-muted-foreground">{caption}</p>
      </div>
      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
        {count}
      </span>
    </div>
  );
}
