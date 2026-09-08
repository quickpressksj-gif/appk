import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, Loader2, Sparkles, type LucideIcon } from "lucide-react";
import { triggerHaptic } from "../../lib/captain-audio";

interface SlideToConfirmProps {
  onConfirm: () => void | Promise<void>;
  label?: string;
  confirmingLabel?: string;
  variant?: "yellow" | "emerald" | "amber" | "dark" | "teal";
  disabled?: boolean;
  icon?: LucideIcon;
  className?: string;
}

export function SlideToConfirm({
  onConfirm,
  label = "SLIDE TO CONFIRM",
  confirmingLabel = "PROCESSING...",
  variant = "emerald",
  disabled = false,
  icon: CustomIcon = ChevronRight,
  className = "",
}: SlideToConfirmProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0); // 0 to 1
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const startXRef = useRef(0);
  const maxDragRef = useRef(0);

  const updateDimensions = useCallback(() => {
    if (containerRef.current && thumbRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const thumbWidth = thumbRef.current.clientWidth;
      maxDragRef.current = Math.max(0, containerWidth - thumbWidth - 8); // 4px padding each side
    }
  }, []);

  useEffect(() => {
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [updateDimensions]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || isBusy || isConfirmed) return;
    updateDimensions();
    setIsDragging(true);
    startXRef.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || disabled || isBusy || isConfirmed) return;
    const maxDrag = maxDragRef.current;
    if (maxDrag <= 0) return;

    const currentX = e.clientX;
    const delta = Math.max(0, Math.min(maxDrag, currentX - startXRef.current));
    const progress = delta / maxDrag;
    setDragProgress(progress);

    if (progress >= 0.88) {
      triggerHaptic([30, 40, 80]);
    }
  };

  const handlePointerUp = async (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || disabled || isBusy || isConfirmed) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (dragProgress >= 0.82) {
      // Trigger confirmation
      setIsConfirmed(true);
      setDragProgress(1);
      triggerHaptic([80, 50, 120]);
      setIsBusy(true);

      try {
        await onConfirm();
      } catch {
        // Reset if failed
        setIsConfirmed(false);
        setDragProgress(0);
      } finally {
        setIsBusy(false);
        setIsConfirmed(false);
        setDragProgress(0);
      }
    } else {
      // Snap back
      setDragProgress(0);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setDragProgress(0);
  };

  // Color variants
  const variantStyles = {
    yellow: {
      track: "bg-amber-400 text-slate-950 border-amber-500 shadow-amber-400/30",
      thumb: "bg-slate-950 text-amber-300 shadow-slate-950/40",
      progress: "bg-amber-300",
      textColor: "text-slate-950 font-black",
    },
    emerald: {
      track: "bg-emerald-950 text-white border-emerald-700 shadow-emerald-950/40",
      thumb: "bg-emerald-500 text-emerald-950 shadow-emerald-500/50",
      progress: "bg-emerald-900",
      textColor: "text-emerald-100 font-black",
    },
    amber: {
      track: "bg-amber-950 text-white border-amber-700 shadow-amber-950/40",
      thumb: "bg-amber-400 text-amber-950 shadow-amber-400/50",
      progress: "bg-amber-900",
      textColor: "text-amber-100 font-black",
    },
    teal: {
      track: "bg-slate-900 text-white border-teal-700 shadow-teal-950/40",
      thumb: "bg-teal-400 text-slate-950 shadow-teal-400/50",
      progress: "bg-teal-900/40",
      textColor: "text-teal-100 font-black",
    },
    dark: {
      track: "bg-slate-950 text-white border-slate-800 shadow-black/40",
      thumb: "bg-white text-slate-950 shadow-white/40",
      progress: "bg-slate-800",
      textColor: "text-white font-black",
    },
  }[variant];

  const thumbOffset = dragProgress * maxDragRef.current;

  return (
    <div
      ref={containerRef}
      className={`relative h-[62px] w-full select-none overflow-hidden rounded-2xl border-2 p-1 shadow-lg transition-all ${variantStyles.track} ${
        disabled ? "opacity-40 cursor-not-allowed pointer-events-none" : "cursor-pointer"
      } ${className}`}
      style={{ touchAction: "none" }}
    >
      {/* Active Fill Track */}
      <div
        className={`absolute inset-y-0 left-0 rounded-xl transition-all ${variantStyles.progress}`}
        style={{
          width: `calc(${dragProgress * 100}% + 56px)`,
          opacity: isDragging ? 0.75 : 0.4,
        }}
      />

      {/* Track Center Label & Shimmer Arrows */}
      <div className="absolute inset-0 flex items-center justify-center gap-1.5 px-16 pointer-events-none">
        {isBusy ? (
          <span className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300">
            <Loader2 className="size-4 animate-spin text-amber-300" />
            {confirmingLabel}
          </span>
        ) : (
          <div className="flex items-center gap-1">
            <span
              className={`text-xs sm:text-sm uppercase tracking-wider text-center ${variantStyles.textColor}`}
            >
              {label}
            </span>
            <div className="flex items-center text-amber-400/80 animate-pulse">
              <ChevronRight className="size-4 -mr-2 opacity-60" />
              <ChevronRight className="size-4 -mr-2 opacity-80" />
              <ChevronRight className="size-4" />
            </div>
          </div>
        )}
      </div>

      {/* Draggable Slider Thumb */}
      <div
        ref={thumbRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{
          transform: `translateX(${thumbOffset}px)`,
          transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)",
        }}
        className={`relative z-10 flex h-full aspect-square items-center justify-center rounded-xl shadow-md transition-shadow active:scale-95 cursor-grab active:cursor-grabbing ${variantStyles.thumb}`}
      >
        {isBusy ? (
          <Loader2 className="size-6 animate-spin" />
        ) : isConfirmed ? (
          <Sparkles className="size-6 animate-bounce" />
        ) : (
          <CustomIcon className="size-6 stroke-[2.8]" />
        )}
      </div>
    </div>
  );
}
