import { Image, Mic, Send, Zap } from "lucide-react";
import { useState } from "react";

/** Chat composer with quick replies plus image / voice placeholders. */
export function ChatComposer({
  quickReplies,
  onSend,
  onPlaceholder,
}: {
  quickReplies: string[];
  onSend: (text: string) => void;
  onPlaceholder: (kind: "image" | "voice") => void;
}) {
  const [value, setValue] = useState("");
  const [showQuick, setShowQuick] = useState(false);

  const submit = () => {
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
  };

  return (
    <div className="glass-panel fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t border-border px-4 pb-4 pt-3 sm:max-w-2xl">
      {showQuick ? (
        <div className="animate-notify-in -mx-4 mb-2 flex gap-2 overflow-x-auto px-4 pb-1">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => {
                onSend(reply);
                setShowQuick(false);
              }}
              className="min-h-11 shrink-0 rounded-full border border-border bg-card px-3 text-[0.68rem] font-bold text-foreground"
            >
              {reply}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="flex items-end gap-2"
      >
        <button
          type="button"
          aria-label="Quick replies"
          aria-pressed={showQuick}
          onClick={() => setShowQuick((prev) => !prev)}
          className={`grid size-11 shrink-0 place-items-center rounded-full transition-colors ${
            showQuick ? "bg-primary/20 text-brand-dark" : "bg-muted text-muted-foreground"
          }`}
        >
          <Zap className="size-4" strokeWidth={2.4} />
        </button>

        <div className="flex min-h-11 flex-1 items-center gap-2 rounded-3xl border border-border bg-card px-3">
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Type a message"
            aria-label="Message"
            className="min-w-0 flex-1 bg-transparent py-3 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            aria-label="Attach photo (coming soon)"
            onClick={() => onPlaceholder("image")}
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground"
          >
            <Image className="size-4" strokeWidth={2.2} />
          </button>
          <button
            type="button"
            aria-label="Record voice note (coming soon)"
            onClick={() => onPlaceholder("voice")}
            className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground"
          >
            <Mic className="size-4" strokeWidth={2.2} />
          </button>
        </div>

        <button
          type="submit"
          aria-label="Send message"
          disabled={!value.trim()}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/25 text-brand-dark transition-transform active:scale-[0.94] disabled:opacity-40"
        >
          <Send className="size-4" strokeWidth={2.4} />
        </button>
      </form>
    </div>
  );
}
