import { ImagePlus, Send } from "lucide-react";
import { useState } from "react";

/** Sprint 3.8 — chat composer (UI only, nothing is sent to a backend). */
export function ChatComposer({
  onSend,
  onAttach,
  disabled,
}: {
  onSend: (text: string) => void;
  onAttach: () => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="glass-panel sticky bottom-0 z-20 flex items-end gap-2 px-4 py-3"
    >
      <button
        type="button"
        aria-label="Attach image"
        onClick={onAttach}
        disabled={disabled}
        className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground transition-all duration-300 hover:bg-accent active:scale-[0.94] disabled:opacity-50"
      >
        <ImagePlus className="size-5" aria-hidden="true" />
      </button>

      <label className="sr-only" htmlFor="chat-composer-input">
        Write a message
      </label>
      <textarea
        id="chat-composer-input"
        rows={1}
        value={value}
        disabled={disabled}
        placeholder={disabled ? "Read-only conversation" : "Write a message…"}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        className="min-h-11 min-w-0 flex-1 resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium tracking-tight text-foreground outline-none transition-colors focus:border-primary disabled:opacity-60"
      />

      <button
        type="submit"
        aria-label="Send message"
        disabled={disabled || !value.trim()}
        className="ripple flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-all duration-300 active:scale-[0.94] disabled:opacity-50"
      >
        <Send className="size-5" aria-hidden="true" />
      </button>
    </form>
  );
}