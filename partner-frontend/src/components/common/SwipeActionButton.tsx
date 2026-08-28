import React, { useRef, useState, useEffect } from "react";
import { ChevronRight, Check, Loader2 } from "lucide-react";

export interface SwipeActionButtonProps {
  label: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  color?: "emerald" | "blue" | "zinc" | "amber";
  className?: string;
}

export function SwipeActionButton({
  label,
  onConfirm,
  loading = false,
  disabled = false,
  color = "emerald",
  className = "",
}: SwipeActionButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragProgress, setDragProgress] = useState(0); // 0 to 1
  const [isDragging, setIsDragging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const colorStyles = {
    emerald: {
      trackBg: "bg-emerald-950/80 border-emerald-500/30",
      fillBg: "bg-gradient-to-r from-emerald-600 to-emerald-500",
      thumbBg: "bg-emerald-500 text-white shadow-emerald-500/50",
      text: "text-emerald-100",
    },
    blue: {
      trackBg: "bg-blue-950/80 border-blue-500/30",
      fillBg: "bg-gradient-to-r from-blue-600 to-blue-500",
      thumbBg: "bg-blue-500 text-white shadow-blue-500/50",
      text: "text-blue-100",
    },
    zinc: {
      trackBg: "bg-zinc-950/80 border-zinc-700/50",
      fillBg: "bg-gradient-to-r from-zinc-700 to-zinc-600",
      thumbBg: "bg-zinc-800 text-white shadow-black/50",
      text: "text-zinc-200",
    },
    amber: {
      trackBg: "bg-amber-950/80 border-amber-500/30",
      fillBg: "bg-gradient-to-r from-amber-600 to-amber-500",
      thumbBg: "bg-amber-500 text-white shadow-amber-500/50",
      text: "text-amber-100",
    },
  }[color];

  const handleStart = (clientX: number) => {
    if (disabled || loading || confirmed) return;
    setIsDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || !containerRef.current || disabled || loading || confirmed) return;
    const rect = containerRef.current.getBoundingClientRect();
    const thumbWidth = 48;
    const maxDrag = rect.width - thumbWidth;
    const currentDrag = clientX - rect.left - thumbWidth / 2;
    const progress = Math.max(0, Math.min(1, currentDrag / maxDrag));
    setDragProgress(progress);
  };

  const handleEnd = async () => {
    if (!isDragging || disabled || loading || confirmed) return;
    setIsDragging(false);

    if (dragProgress >= 0.75) {
      // Completed swipe
      setDragProgress(1);
      setConfirmed(true);
      try {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(50);
        }
      } catch {}
      await onConfirm();
      setTimeout(() => {
        setConfirmed(false);
        setDragProgress(0);
      }, 1000);
    } else {
      // Snap back
      setDragProgress(0);
    }
  };

  // Touch event handlers
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();

  // Mouse event handlers
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX);
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };
    const onMouseUp = () => {
      if (isDragging) handleEnd();
    };

    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, dragProgress]);

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      className={`relative h-13 w-full select-none overflow-hidden rounded-full border backdrop-blur-md transition-all shadow-md ${colorStyles.trackBg} ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-[0.99]"
      } ${className}`}
    >
      {/* Fill bar behind thumb */}
      <div
        style={{
          width: `calc(${dragProgress * 100}% + ${48 * (1 - dragProgress)}px)`,
          transition: isDragging ? "none" : "width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        className={`absolute inset-y-0 left-0 rounded-full ${colorStyles.fillBg} opacity-90`}
      />

      {/* Label text in center */}
      <div className="absolute inset-0 flex items-center justify-center px-12 pointer-events-none">
        <span
          style={{ opacity: 1 - dragProgress * 0.85 }}
          className={`text-xs sm:text-sm font-black tracking-wide uppercase transition-opacity flex items-center gap-1.5 ${colorStyles.text}`}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin inline" />
          ) : confirmed ? (
            <Check className="size-4 inline text-white" />
          ) : null}
          <span>{loading ? "Processing..." : confirmed ? "Confirmed!" : label}</span>
          {!loading && !confirmed && (
            <span className="inline-flex animate-pulse text-white/70">»»</span>
          )}
        </span>
      </div>

      {/* Draggable thumb pill */}
      <div
        style={{
          transform: `translateX(calc(${dragProgress} * (100% - 46px)))`,
          transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        className={`absolute top-1 left-1 bottom-1 w-11 rounded-full flex items-center justify-center shadow-lg transition-transform ${colorStyles.thumbBg}`}
      >
        {loading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : confirmed ? (
          <Check className="size-5" />
        ) : (
          <ChevronRight className="size-5 translate-x-0.5" />
        )}
      </div>
    </div>
  );
}
