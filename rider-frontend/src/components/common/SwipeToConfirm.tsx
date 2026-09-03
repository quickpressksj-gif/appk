import React, { useRef, useState, useEffect } from "react";
import { ChevronsRight, Loader2 } from "lucide-react";

interface SwipeToConfirmProps {
  label: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
}

/**
 * 🛵 Rapido Captain Style Swipe-To-Confirm Slider
 * Eliminates false pocket taps with deliberate touch drag gesture.
 */
export function SwipeToConfirm({
  label,
  onConfirm,
  disabled = false,
  busy = false,
  className = "",
}: SwipeToConfirmProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const startX = useRef(0);

  const maxDrag = containerRef.current
    ? containerRef.current.clientWidth - 56
    : 240;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || busy || triggered) return;
    setIsDragging(true);
    startX.current = e.clientX - dragX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || disabled || busy || triggered) return;
    const currentMax = containerRef.current
      ? containerRef.current.clientWidth - 56
      : 240;
    const newX = Math.max(0, Math.min(e.clientX - startX.current, currentMax));
    setDragX(newX);

    // If dragged >= 85%, trigger confirmation
    if (newX >= currentMax * 0.85) {
      setIsDragging(false);
      setTriggered(true);
      setDragX(currentMax);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(60);
      }
      void onConfirm();
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    // If not triggered, spring back to start
    if (!triggered) {
      setDragX(0);
    }
  };

  // Reset slider if busy ends without trigger or on prop change
  useEffect(() => {
    if (!busy && !disabled) {
      setTriggered(false);
      setDragX(0);
    }
  }, [busy, disabled]);

  const progress = maxDrag > 0 ? dragX / maxDrag : 0;

  return (
    <div
      ref={containerRef}
      className={`relative flex h-14 w-full select-none items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-1 transition-all ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Progress fill bar */}
      <div
        className="absolute inset-y-0 left-0 rounded-2xl bg-amber-400 transition-[width] duration-75 ease-out"
        style={{ width: `${Math.max(56, dragX + 56)}px` }}
      />

      {/* Centered Guide Text with subtle shimmer */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-14">
        {busy ? (
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900">
            <Loader2 className="size-4 animate-spin" />
            <span>Processing...</span>
          </div>
        ) : (
          <span
            className="truncate text-xs font-black uppercase tracking-wider text-slate-700 transition-opacity duration-150"
            style={{ opacity: Math.max(0.2, 1 - progress * 1.5) }}
          >
            {label}
          </span>
        )}
      </div>

      {/* Draggable Knob */}
      <div
        onPointerDown={handlePointerDown}
        style={{ transform: `translateX(${dragX}px)` }}
        className={`relative z-10 flex size-12 shrink-0 cursor-grab items-center justify-center rounded-xl bg-slate-950 text-amber-400 shadow-md transition-transform ${
          isDragging ? "cursor-grabbing scale-105" : "transition-[transform] duration-200 ease-out"
        }`}
      >
        {busy ? (
          <Loader2 className="size-5 animate-spin text-amber-400" />
        ) : (
          <ChevronsRight className="size-6 animate-pulse" strokeWidth={2.5} />
        )}
      </div>
    </div>
  );
}
