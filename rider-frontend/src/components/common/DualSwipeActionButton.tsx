import React, { useRef, useState, useEffect } from "react";
import { Check, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export interface DualSwipeActionButtonProps {
  acceptLabel?: string;
  rejectLabel?: string;
  onAccept: () => void | Promise<void>;
  onReject: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * ↔️ Dual-Direction Swipe Button:
 * - Swipe Right (→) to Accept (Emerald)
 * - Swipe Left (←) to Reject (Rose/Red)
 */
export function DualSwipeActionButton({
  acceptLabel = "Swipe Right to Accept",
  rejectLabel = "Swipe Left to Reject",
  onAccept,
  onReject,
  loading = false,
  disabled = false,
  className = "",
}: DualSwipeActionButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offsetPercent, setOffsetPercent] = useState(0); // -1 (full left) to +1 (full right)
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "accepted" | "rejected">("idle");
  const startXRef = useRef<number>(0);

  const handleStart = (clientX: number) => {
    if (disabled || loading || status !== "idle") return;
    setIsDragging(true);
    startXRef.current = clientX;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || !containerRef.current || disabled || loading || status !== "idle") return;
    const rect = containerRef.current.getBoundingClientRect();
    const maxDistance = (rect.width - 56) / 2;
    const deltaX = clientX - startXRef.current;
    const clampedOffset = Math.max(-maxDistance, Math.min(maxDistance, deltaX));
    setOffsetPercent(clampedOffset / maxDistance);
  };

  const handleEnd = async () => {
    if (!isDragging || disabled || loading || status !== "idle") return;
    setIsDragging(false);

    if (offsetPercent >= 0.7) {
      // Swiped Right -> Accept
      setOffsetPercent(1);
      setStatus("accepted");
      try {
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50);
      } catch {}
      await onAccept();
      setTimeout(() => {
        setStatus("idle");
        setOffsetPercent(0);
      }, 1200);
    } else if (offsetPercent <= -0.7) {
      // Swiped Left -> Reject
      setOffsetPercent(-1);
      setStatus("rejected");
      try {
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50);
      } catch {}
      await onReject();
      setTimeout(() => {
        setStatus("idle");
        setOffsetPercent(0);
      }, 1200);
    } else {
      // Snap back to center
      setOffsetPercent(0);
    }
  };

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();

  // Mouse handlers
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
  }, [isDragging, offsetPercent]);

  const isSwipingRight = offsetPercent > 0.05;
  const isSwipingLeft = offsetPercent < -0.05;

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      className={`relative h-14 w-full select-none overflow-hidden rounded-full border border-zinc-200/80 bg-zinc-950 p-1 shadow-lg transition-all ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
      } ${className}`}
    >
      {/* Right Drag Background Fill (Emerald) */}
      <div
        style={{
          width: isSwipingRight ? `${(offsetPercent / 2 + 0.5) * 100}%` : "50%",
          opacity: isSwipingRight ? Math.min(1, offsetPercent * 1.4) : 0,
          transition: isDragging ? "none" : "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        className="absolute inset-y-0 right-0 bg-gradient-to-l from-emerald-600 to-emerald-500 rounded-r-full pointer-events-none"
      />

      {/* Left Drag Background Fill (Rose/Red) */}
      <div
        style={{
          width: isSwipingLeft ? `${(Math.abs(offsetPercent) / 2 + 0.5) * 100}%` : "50%",
          opacity: isSwipingLeft ? Math.min(1, Math.abs(offsetPercent) * 1.4) : 0,
          transition: isDragging ? "none" : "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-600 to-rose-500 rounded-l-full pointer-events-none"
      />

      {/* Center Track Labels */}
      <div className="absolute inset-0 flex items-center justify-between px-5 pointer-events-none text-[11px] sm:text-xs font-black uppercase tracking-wider">
        {/* Left Reject Hint */}
        <span
          className={`flex items-center gap-1 transition-opacity ${
            isSwipingLeft ? "text-white" : "text-rose-400/80"
          }`}
          style={{ opacity: isSwipingRight ? 0.2 : 1 }}
        >
          <ChevronLeft className="size-4 shrink-0 animate-pulse" />
          <span>Reject</span>
        </span>

        {/* Status in Center */}
        {loading ? (
          <span className="flex items-center gap-1.5 text-zinc-300 font-bold">
            <Loader2 className="size-3.5 animate-spin" />
            <span>Processing</span>
          </span>
        ) : status === "accepted" ? (
          <span className="flex items-center gap-1.5 text-emerald-300 font-black">
            <Check className="size-4" />
            <span>Accepted!</span>
          </span>
        ) : status === "rejected" ? (
          <span className="flex items-center gap-1.5 text-rose-300 font-black">
            <X className="size-4" />
            <span>Rejected!</span>
          </span>
        ) : (
          <span className="text-[10px] text-zinc-500 font-bold tracking-widest hidden sm:inline">
            • SLIDE •
          </span>
        )}

        {/* Right Accept Hint */}
        <span
          className={`flex items-center gap-1 transition-opacity ${
            isSwipingRight ? "text-white" : "text-emerald-400/80"
          }`}
          style={{ opacity: isSwipingLeft ? 0.2 : 1 }}
        >
          <span>Accept</span>
          <ChevronRight className="size-4 shrink-0 animate-pulse" />
        </span>
      </div>

      {/* Center Draggable Knob */}
      <div
        style={{
          transform: `translateX(calc(${offsetPercent} * ((100% - 52px) / 2)))`,
          transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        className={`absolute inset-y-1 left-[calc(50%-24px)] w-12 rounded-full flex items-center justify-center shadow-xl transition-colors border ${
          status === "accepted" || isSwipingRight
            ? "bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/50"
            : status === "rejected" || isSwipingLeft
            ? "bg-rose-500 border-rose-400 text-white shadow-rose-500/50"
            : "bg-white border-zinc-200 text-zinc-900 shadow-black/40"
        }`}
      >
        {loading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : status === "accepted" || (isSwipingRight && offsetPercent > 0.6) ? (
          <Check className="size-5" />
        ) : status === "rejected" || (isSwipingLeft && offsetPercent < -0.6) ? (
          <X className="size-5" />
        ) : (
          <div className="flex items-center gap-0.5">
            <ChevronLeft className="size-3.5 text-zinc-400" />
            <ChevronRight className="size-3.5 text-zinc-400" />
          </div>
        )}
      </div>
    </div>
  );
}
