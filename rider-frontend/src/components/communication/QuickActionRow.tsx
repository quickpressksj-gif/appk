import { MessageSquare, Phone, type LucideIcon } from "lucide-react";

/** Call / message quick action row reused for customer, partner and support. */
export function QuickActionRow({
  title,
  caption,
  icon: Icon,
  onCall,
  onMessage,
  messageLabel = "Message",
  delay = 0,
}: {
  title: string;
  caption: string;
  icon: LucideIcon;
  onCall: () => void;
  onMessage: () => void;
  messageLabel?: string;
  delay?: number;
}) {
  return (
    <div
      className="card-soft animate-notify-in flex items-center gap-3 border border-border p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/15">
        <Icon className="size-4 text-brand-dark" strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.8rem] font-black tracking-tight text-foreground">
          {title}
        </span>
        <span className="block truncate text-[0.66rem] font-medium text-muted-foreground">
          {caption}
        </span>
      </span>
      <button
        type="button"
        onClick={onCall}
        aria-label={`Call ${title}`}
        className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary/15 text-brand-green transition-transform active:scale-[0.94]"
      >
        <Phone className="size-4" strokeWidth={2.4} />
      </button>
      <button
        type="button"
        onClick={onMessage}
        aria-label={`${messageLabel} ${title}`}
        className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/15 text-brand-dark transition-transform active:scale-[0.94]"
      >
        <MessageSquare className="size-4" strokeWidth={2.4} />
      </button>
    </div>
  );
}
