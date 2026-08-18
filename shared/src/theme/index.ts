/**
 * Design system reference.
 *
 * The actual tokens live in `shared/src/styles/theme.css` (the single source of
 * truth imported by every frontend's `src/styles.css`). This module only
 * re-exports the token names so TypeScript code can reference them safely
 * instead of hardcoding colours.
 */

export const COLOR_TOKENS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
] as const;

export type ColorToken = (typeof COLOR_TOKENS)[number];

export const RADIUS_TOKENS = ["sm", "md", "lg", "xl", "2xl", "3xl", "4xl"] as const;

export const SHADOW_TOKENS = ["soft", "cta"] as const;

/** Tailwind class helper for a semantic colour token, e.g. token("bg", "primary"). */
export function token(prefix: "bg" | "text" | "border" | "ring", name: ColorToken): string {
  return `${prefix}-${name}`;
}
