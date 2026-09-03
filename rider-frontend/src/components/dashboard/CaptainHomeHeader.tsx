import { Bell, ShieldCheck, User } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function CaptainHomeHeader({
  captainName = "Himanshu Pal",
  captainId = "CP-9821",
  isOnline = true,
}: {
  captainName?: string;
  captainId?: string;
  isOnline?: boolean;
}) {
  const initials = captainName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "CP";

  return (
    <div className="w-full bg-white border-b border-emerald-100 px-4 py-3.5 sm:px-6 select-none shadow-2xs">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
        {/* Left: Avatar & Rider Name */}
        <Link
          to="/profile"
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-800 text-white font-black text-base shadow-sm group-hover:scale-105 transition-transform">
            {initials}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                Captain
              </span>
              <span className="size-1 rounded-full bg-emerald-600" />
              <span className="text-[10px] font-bold text-slate-500">ID: {captainId}</span>
            </div>

            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate group-hover:text-emerald-800 transition-colors">
              {captainName}
            </h1>
          </div>
        </Link>

        {/* Right: Duty Status Badge & Profile Icon */}
        <div className="flex items-center gap-2.5">
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              isOnline
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            <span
              className={`size-2 rounded-full ${
                isOnline ? "bg-emerald-600 animate-ping" : "bg-slate-400"
              }`}
            />
            <span className="font-extrabold">{isOnline ? "ONLINE" : "OFFLINE"}</span>
          </div>

          <Link
            to="/profile"
            className="flex size-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs"
            title="Captain Profile"
          >
            <User className="size-4.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
