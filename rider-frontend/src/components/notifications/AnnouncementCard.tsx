import { Megaphone, Pin } from "lucide-react";

import type { Announcement } from "../../data/rider-notifications-mock";

const TAG_TONE: Record<Announcement["tag"], string> = {
  Policy: "bg-muted text-muted-foreground",
  Feature: "bg-primary/15 text-brand-dark",
  Zone: "bg-secondary/10 text-brand-green",
  Safety: "bg-destructive/10 text-destructive",
  Payout: "bg-primary/25 text-brand-dark",
};

/** Company announcement card with pinned highlight and tag chip. */
export function AnnouncementCard({
  announcement,
  delay = 0,
}: {
  announcement: Announcement;
  delay?: number;
}) {
  return (
    <article
      className={`card-soft animate-rise border p-5 ${
        announcement.pinned ? "border-brand-green/40 bg-secondary/[0.04]" : "border-border"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-2xl bg-primary/15">
          <Megaphone className="size-4 text-brand-dark" strokeWidth={2.2} />
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest ${
            TAG_TONE[announcement.tag]
          }`}
        >
          {announcement.tag}
        </span>
        {announcement.pinned ? (
          <span className="flex items-center gap-1 text-[0.6rem] font-bold uppercase tracking-widest text-brand-green">
            <Pin className="size-3" strokeWidth={2.4} /> Pinned
          </span>
        ) : null}
        <span className="ml-auto text-[0.62rem] font-semibold text-muted-foreground">
          {announcement.date}
        </span>
      </div>

      <h3 className="mt-3 text-sm font-black tracking-tight text-foreground">
        {announcement.title}
      </h3>
      <p className="mt-1 text-[0.72rem] font-medium leading-relaxed text-muted-foreground">
        {announcement.body}
      </p>
    </article>
  );
}