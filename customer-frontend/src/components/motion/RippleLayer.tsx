import { useEffect } from "react";

/**
 * App-wide material-style touch ripple. Listens once on the document and
 * paints an ink circle at the pointer position inside the pressed control,
 * so every existing button gets the effect without touching its markup.
 */
export function RippleLayer() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const host = target?.closest<HTMLElement>(
        'button, [role="button"], a[href], [data-ripple]',
      );
      if (!host || host.hasAttribute("disabled") || host.dataset["noRipple"] === "true") return;

      const rect = host.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const computed = window.getComputedStyle(host);
      if (computed.position === "static") host.style.position = "relative";
      if (computed.overflow === "visible") host.style.overflow = "hidden";

      const size = Math.max(rect.width, rect.height) * 1.6;
      const ink = document.createElement("span");
      ink.className = "qpc-ripple-ink";
      ink.style.width = `${size}px`;
      ink.style.height = `${size}px`;
      ink.style.left = `${event.clientX - rect.left - size / 2}px`;
      ink.style.top = `${event.clientY - rect.top - size / 2}px`;
      host.appendChild(ink);

      const cleanup = () => ink.remove();
      ink.addEventListener("animationend", cleanup, { once: true });
      window.setTimeout(cleanup, 800);
    };

    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return null;
}
