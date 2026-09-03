import { Bell, Search, ShieldCheck } from "lucide-react";

export function RiderDesktopTopBar({
  title = "Captain Hub",
  subtitle = "Accept live laundry pickups & track earnings",
  captainName = "Delivery Captain",
  isOnline = true,
  onToggleStatus,
  searchQuery = "",
  onSearchChange,
}: {
  title?: string;
  subtitle?: string;
  captainName?: string;
  isOnline?: boolean;
  onToggleStatus?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}) {
  return (
    <header className="sticky top-0 z-20 hidden h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-8 backdrop-blur-md md:flex select-none">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-xl font-black tracking-tight text-slate-900">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-xs font-semibold text-slate-500 mt-0.5">{subtitle}</p>
        ) : null}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {onSearchChange ? (
          <div className="relative w-64 lg:w-72">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search orders, pickups..."
              className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
            />
          </div>
        ) : null}

        {/* Duty Status Pill */}
        <button
          type="button"
          onClick={onToggleStatus}
          className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs ${
            isOnline
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-100 text-slate-600"
          }`}
        >
          <span
            className={`size-2 rounded-full ${
              isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
            }`}
          />
          <span className="font-extrabold">{isOnline ? "ON DUTY" : "OFF DUTY"}</span>
        </button>

        {/* SOS Button */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.href = "tel:112";
            }
          }}
          className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-600 shadow-2xs hover:bg-rose-100 active:scale-95 transition-all cursor-pointer"
        >
          SOS
        </button>
      </div>
    </header>
  );
}
