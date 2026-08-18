/**
 * `@quickpress/backend` — the ONE backend/API layer for QuickPress.
 *
 * No frontend owns backend code. The customer, partner, rider and admin apps
 * all import from here (`@backend/<domain>/<module>`), so a single change to an
 * endpoint updates every application.
 *
 * Layout:
 *   core/      transport clients per namespace (/api, /api/partner, …)
 *   customer/  customer app endpoints
 *   partner/   partner console endpoints
 *   rider/     rider app endpoints
 *   admin/     admin console endpoints
 */
export * as adminApi from "./admin/admin-api";
export * as devApi from "./dev/dev-api";
export * as adminClient from "./core/admin-client";
export * as partnerClient from "./core/partner-client";
export * as riderClient from "./core/rider-client";
