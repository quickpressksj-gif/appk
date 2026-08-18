import { Check, CheckCheck, Clock, Image, Mic } from "lucide-react";

import type { ChatMessage } from "../../data/rider-notifications-mock";

const STATUS_ICON = {
  sent: Clock,
  delivered: Check,
  read: CheckCheck,
} as const;

/** Chat bubble supporting text, image / voice placeholders and delivery status. */
export function ChatBubble({
  message,
  delay = 0,
}: {
  message: ChatMessage;
  delay?: number;
}) {
  if (message.sender === "system") {
    return (
      <div className="animate-chat-enter flex justify-center" style={{ animationDelay: `${delay}ms` }}>
        <p className="max-w-[85%] rounded-full bg-muted px-3 py-1.5 text-center text-[0.62rem] font-bold text-muted-foreground">
          {message.body}
        </p>
      </div>
    );
  }

  const mine = message.sender === "rider";
  const StatusIcon = STATUS_ICON[message.status];

  return (
    <div
      className={`animate-chat-bubble flex ${mine ? "justify-end" : "justify-start"}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`max-w-[80%] rounded-3xl px-4 py-2.5 shadow-soft ${
          mine
            ? "rounded-br-lg bg-primary/20 text-foreground"
            : "rounded-bl-lg border border-border bg-card text-foreground"
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-[0.78rem] font-semibold leading-relaxed">
          {message.body}
        </p>
        <div className="mt-1 flex items-center justify-end gap-1">
          <span className="text-[0.58rem] font-bold text-muted-foreground">{message.time}</span>
          {mine ? (
            <StatusIcon
              className={`size-3 ${message.status === "read" ? "text-brand-green" : "text-muted-foreground"}`}
              strokeWidth={2.6}
              aria-label={message.status}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Non-functional image attachment placeholder bubble. */
export function ChatImagePlaceholder({ mine = true }: { mine?: boolean }) {
  return (
    <div className={`animate-chat-bubble flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className="w-40 rounded-3xl border border-dashed border-border bg-muted/60 p-3 text-center">
        <Image className="mx-auto size-5 text-muted-foreground" strokeWidth={2.2} />
        <p className="mt-1 text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
          Photo · coming soon
        </p>
      </div>
    </div>
  );
}

/** Non-functional voice note placeholder bubble. */
export function ChatVoicePlaceholder({ mine = false }: { mine?: boolean }) {
  return (
    <div className={`animate-chat-bubble flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className="flex items-center gap-2 rounded-3xl border border-dashed border-border bg-muted/60 px-4 py-2.5">
        <Mic className="size-4 shrink-0 text-muted-foreground" strokeWidth={2.2} />
        <span className="flex items-end gap-0.5" aria-hidden>
          {[6, 12, 8, 16, 10, 14, 7].map((height, index) => (
            <span
              key={index}
              className="w-1 rounded-full bg-muted-foreground/50"
              style={{ height: `${height}px` }}
            />
          ))}
        </span>
        <span className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">
          0:12
        </span>
      </div>
    </div>
  );
}

/** Animated typing indicator shown while the other side is composing. */
export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="animate-chat-enter flex items-center gap-2" role="status" aria-live="polite">
      <div className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-2 shadow-soft">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
            style={{ animationDelay: `${dot * 140}ms` }}
          />
        ))}
      </div>
      <span className="text-[0.62rem] font-bold text-muted-foreground">{name} is typing…</span>
    </div>
  );
}
