/**
 * `@quickpress/shared` — the single design system + utility layer reused by
 * the customer, partner, rider and admin frontends.
 *
 * Apps import via path aliases (`@shared/ui/button`, `@shared/lib/utils`, …);
 * this barrel exists for consumers that prefer a single entry point.
 */
export * from "./constants";
export * from "./theme";
export * from "./icons";
export * from "./lib/utils";
export * from "./hooks/use-mobile";
export * from "./hooks/use-realtime";
export * from "./hooks/use-customer-realtime";
export * from "./hooks/use-partner-realtime";
export * from "./hooks/use-rider-realtime";
export * from "./hooks/use-admin-realtime";
export type * from "./types";

