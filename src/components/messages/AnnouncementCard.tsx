import { CalendarClock, Megaphone, PartyPopper, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  ANNOUNCEMENT_KIND_LABEL,
  type AnnouncementKind,
  type PartnerAnnouncement,
} from "../../data/partner-notifications-mock";

const KIND_ICON: Record<AnnouncementKind, LucideIcon> = {
  platform: Megaphone,
  maintenance: Wrench,
  campaign: CalendarClock,
  festival: PartyPopper,
};

const KIND_TONE: Record<AnnouncementKind, string> = {
  platform: "bg-primary/15 text-brand-dark",
  maintenance: "bg-destructive/10 text-destructive",
  campaign: "bg-secondary/15 text-brand-green-dark",
  festival: "bg-muted text-muted-foreground",
};

/** Sprint 3.8 — platform announcement card. */
export function AnnouncementCard({ announcement }: { announcement: PartnerAnnouncement }) {
  const Icon = KIND_ICON[announcement.kind];

  return (
    <article className="card-soft animate-slide-up flex gap-3 border border-border p-4 transition-all duration-300 hover:border-primary/60">
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${KIND_TONE[announcement.kind]}`}
      >
        <Icon className="size-5" strokeWidth={2.1} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="min-w-0 text-sm font-bold tracking-tight text-foreground">
            {announcement.title}
          </p>
          <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wider text-muted-foreground">
            {announcement.tag}
          </span>
        </div>
        <p className="mt-1 text-[0.72rem] font-medium text-muted-foreground">{announcement.body}</p>
        <p className="mt-2 text-[0.66rem] font-bold uppercase tracking-wider text-muted-foreground">
          {ANNOUNCEMENT_KIND_LABEL[announcement.kind]} · {announcement.date}
        </p>
      </div>
    </article>
  );
}