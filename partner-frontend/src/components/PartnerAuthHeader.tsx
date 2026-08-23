import { Sparkles, Store } from "lucide-react";

/**
 * Shared QuickPress Partner brand mark matching customer frontend typography & styling.
 */
export function PartnerAuthHeader({ withTagline = true, badge = "PARTNER PANEL" }: { withTagline?: boolean; badge?: string }) {
  return (
    <div className="flex flex-col items-center select-none">
      <div className="flex items-center gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-[#111827]">
          Quick<span className="text-[#16A34A]">Press</span>
        </span>
        {badge ? (
          <span className="rounded-full bg-[#111827] px-2 py-0.5 text-[9px] font-black tracking-wider text-white uppercase">
            {badge}
          </span>
        ) : null}
      </div>

      <span className="relative mt-2 block h-[3px] w-24 overflow-hidden rounded-full bg-[#F4B400]/25">
        <span className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-gradient-to-r from-transparent via-[#F4B400] to-transparent animate-pulse" />
      </span>

      {withTagline ? (
        <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
          Laundry <span className="text-[#F4B400] font-black">|</span> Pickup{" "}
          <span className="text-[#F4B400] font-black">|</span> Delivery
        </p>
      ) : null}
    </div>
  );
}
