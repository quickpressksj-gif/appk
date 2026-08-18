import { Check, CheckCheck, Clock, ImageIcon } from "lucide-react";

import type { ChatMessage } from "../../data/partner-notifications-mock";

function StatusIcon({ status }: { status: ChatMessage["status"] }) {
  if (status === "sent") return <Clock className="size-3" aria-hidden="true" />;
  if (status === "delivered") return <Check className="size-3" aria-hidden="true" />;
  return <CheckCheck className="size-3 text-brand-green-dark" aria-hidden="true" />;
}

/** Sprint 3.8 — chat bubble with text / image placeholder, time and status. */
export function ChatBubble({ message }: { message: ChatMessage }) {
  const mine = message.from === "partner";

  return (
    <div className={`animate-slide-up flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-3xl border px-4 py-3 shadow-soft sm:max-w-[65%] ${
          mine
            ? "border-primary/40 bg-primary/12 text-foreground"
            : "border-border bg-card text-foreground"
        }`}
      >
        {message.type === "image" ? (
          <div className="flex h-28 w-44 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border bg-muted text-muted-foreground">
            <ImageIcon className="size-5" aria-hidden="true" />
            <span className="px-2 text-center text-[0.62rem] font-bold uppercase tracking-wider">
              {message.imageLabel ?? "Image attachment"}
            </span>
          </div>
        ) : null}

        {message.text ? (
          <p className="text-[0.8rem] font-medium leading-relaxed">{message.text}</p>
        ) : null}

        <div
          className={`mt-1.5 flex items-center gap-1 text-[0.62rem] font-bold uppercase tracking-wider text-muted-foreground ${
            mine ? "justify-end" : "justify-start"
          }`}
        >
          <span>{message.time}</span>
          {mine ? (
            <>
              <StatusIcon status={message.status} />
              <span className="sr-only">{message.status}</span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}