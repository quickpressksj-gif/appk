# QuickPress — Safe Architecture Migration

## Audit findings (read-only, nothing modified)

Repo today:

```text
/backend-python      real FastAPI backend (single source of truth) — untouched by this migration
/backend/src         NOT a backend. 92 TS files: the frontends' shared API-client layer
                     (core/transport, session-store, auth-service, socket-client)
                     + customer/partner/rider/admin service modules
                     + /backend/src/mock (in-memory mock server used in dev)
/shared/src          71 files: shadcn UI kit, types, hooks, theme, error utils (frontend-safe)
/customer-frontend   69 files — imports @backend/customer/*, @backend/core/*, @shared/*
/partner-frontend    96 files
/rider-frontend      180 files
/admin-frontend      47 files
/src                 223 files — legacy duplicate Partner console (mock-backed)
/vite.config.ts      root build compiles partner-frontend; root dev serves customer-frontend
```

Key correction to the assumption in the brief: `@backend/*` is **not** Python
backend implementation source. It is TypeScript HTTP client code that already
talks to FastAPI through one transport (`backend/src/core/transport.ts`,
`VITE_API_BASE_URL`). No frontend touches MongoDB, and no frontend imports
Python. So the fix is **ownership/boundary**, not rewriting API access.

Real coupling problems:
1. Every app reaches outside its own package root (`@backend/*`, `@shared/*`),
   so no app builds from its own directory alone — this is what breaks Render.
2. `backend/src/core/transport.ts` statically imports the mock server, so mock
   fixtures ship inside production bundles (violates "no mock fallback").
3. Cross-app leakage inside `backend/src`: one folder holds customer, partner,
   rider and admin service modules together.
4. Root `vite.config.ts` + legacy `/src` create a second Partner implementation.
5. Backend CORS reads `settings.cors_origin_list` (fine); `.env` is gitignored (fine).

## Migration plan (one app at a time, no deletions)

### Phase A — Customer isolation (first, must fully pass)
- `customer-frontend/src/api/` receives the customer-owned client code copied
  from `backend/src/customer/**` plus the shared runtime it needs
  (`core/transport`, `core/errors`, `core/session-store`, `core/session-refresh`,
  `core/auth-service`, `core/firebase-*`, `core/maps-api`, `core/socket-*`).
- `customer-frontend/src/ui/` + `src/lib/` receive the shadcn/util files the
  customer app actually imports from `@shared/*` (only files it uses).
- Rewrite customer imports `@backend/... → @/api/...`, `@shared/... → @/ui/...`.
- Mock transport becomes a dynamic dev-only import so it is excluded from
  production bundles; `VITE_API_BASE_URL` missing in production keeps throwing.
- Remove `@shared`/`@backend` aliases and the external-workspace resolver from
  `customer-frontend/vite.config.ts` / `tsconfig*.json` once nothing needs them.
- Originals under `backend/src` and `shared/src` stay in place (other apps still
  use them) — nothing deleted.
- Gate: `typecheck:customer`, `build:customer`, dev-server route crawl of
  splash → login → OTP → location → home → map picker → addresses, plus a live
  API/DB check once a reachable `VITE_API_BASE_URL` is set.

### Phase B/C/D — Partner, then Rider, then Admin
Same recipe per app, only after the previous one passes its gate.

### Phase E — shared-contracts (optional, last)
Only if duplication hurts: a types/enums/constants-only package. No client code,
no secrets, no server logic.

### Root/legacy
Root `vite.config.ts` keeps building Partner and root dev keeps serving Customer
until all four apps are isolated; then it points at one app or is retired.
Legacy `/src` Partner console is left untouched (documented as legacy, not deleted).

## Blockers I need from you

1. **Backend URL.** `VITE_API_BASE_URL` is currently `http://localhost:8000`,
   unreachable from the hosted preview, so real OTP/address/DB acceptance tests
   (Phase 18 items 5–15) cannot pass here. Give me the public FastAPI HTTPS URL.
2. **Scope confirmation.** This is a large mechanical migration across ~500
   files. I will do Customer first and report before starting Partner.

## Reporting
After each app: files changed/moved, deletions (none), typecheck, build, runtime,
API, database, security and regression results, plus remaining blockers.
