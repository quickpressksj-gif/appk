import { CheckCircle2, Loader2, ShieldCheck, Sparkles, X } from "lucide-react";
import React, { useEffect, useState } from "react";

interface GovtScannerOverlayProps {
  isOpen: boolean;
  title: string;
  subtitle: string;
  source: string;
  fetchedData?: Record<string, string | number | undefined | null>;
  onClose?: () => void;
}

export function GovtScannerOverlay({
  isOpen,
  title,
  subtitle,
  source,
  fetchedData,
  onClose,
}: GovtScannerOverlayProps) {
  const [phase, setPhase] = useState<"connecting" | "scanning" | "matching" | "success">("connecting");

  useEffect(() => {
    if (!isOpen) {
      setPhase("connecting");
      return;
    }
    const t1 = setTimeout(() => setPhase("scanning"), 500);
    const t2 = setTimeout(() => setPhase("matching"), 1200);
    const t3 = setTimeout(() => setPhase("success"), 1900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-amber-400/40 bg-zinc-950 p-6 text-white shadow-2xl">
        {/* Animated Scanner Laser Bar */}
        <div className="absolute -top-10 left-1/2 size-40 -translate-x-1/2 rounded-full bg-amber-500/20 blur-2xl" />

        <div className="relative flex flex-col items-center text-center">
          {/* Radar Scanner Animation Ring */}
          <div className="relative flex size-20 items-center justify-center">
            {phase !== "success" ? (
              <>
                <div className="absolute inset-0 animate-ping rounded-full bg-amber-400/20 duration-1000" />
                <div className="absolute inset-2 animate-spin rounded-full border-2 border-dashed border-amber-400" />
                <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-400 text-black shadow-lg">
                  <ShieldCheck className="size-8 stroke-[2.2]" />
                </div>
              </>
            ) : (
              <div className="flex size-16 animate-bounce items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="size-10 stroke-[2.5]" />
              </div>
            )}
          </div>

          <h3 className="mt-4 text-base font-black tracking-tight text-white">{title}</h3>
          <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>

          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[0.68rem] font-bold text-amber-300">
            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
            {source}
          </span>

          {/* Phase Progress Indicator */}
          <div className="mt-4 w-full rounded-2xl bg-zinc-900/80 p-3.5 border border-zinc-800">
            {phase === "connecting" && (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-zinc-300">
                <Loader2 className="size-3.5 animate-spin text-amber-400" />
                <span>Establishing encrypted connection...</span>
              </div>
            )}
            {phase === "scanning" && (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-300">
                <Loader2 className="size-3.5 animate-spin text-amber-400" />
                <span>Scanning Government Registry records...</span>
              </div>
            )}
            {phase === "matching" && (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-amber-300">
                <Sparkles className="size-3.5 text-amber-400 animate-pulse" />
                <span>Matching cryptographic signatures & KYC...</span>
              </div>
            )}
            {phase === "success" && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="size-4" />
                  <span>100% Genuine & Verified Successfully!</span>
                </div>

                {/* Fetched Data Preview */}
                {fetchedData && Object.keys(fetchedData).length > 0 && (
                  <div className="mt-3 space-y-1.5 rounded-xl bg-zinc-950/80 p-3 text-left border border-emerald-500/20">
                    <p className="text-[0.65rem] font-black uppercase tracking-wider text-emerald-400">
                      Auto-Fetched Official Record
                    </p>
                    {Object.entries(fetchedData).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-[0.72rem]">
                        <span className="text-zinc-400 capitalize">{k.replace(/([A-Z])/g, " $1")}:</span>
                        <span className="font-bold text-zinc-100">{String(v || "—")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {phase === "success" && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-2xl bg-amber-400 py-3 text-xs font-black text-black shadow-lg hover:bg-amber-300 active:scale-95"
            >
              Apply & Auto-Fill Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
