# QuickPress architecture

```text
customer-frontend ─┐
partner-frontend  ─┤
rider-frontend    ─┼── HTTPS (VITE_API_BASE_URL) ──> backend-python (FastAPI)
admin-frontend    ─┘                                        │
                                                            ├── MongoDB (source of truth)
                                                            ├── Firebase Admin (identity verification)
                                                            ├── Razorpay / Cloudinary
                                                            └── Google Maps (server key)
```

## Boundaries (enforced)

- `backend-python/` is the single source of truth: identity, roles, orders,
  addresses, payments, wallets, notifications, business rules, persistence.
- Each frontend is **self-contained**. Everything it compiles lives under its own
  `src/`:
  - `src/api/**` — typed HTTP clients for the FastAPI backend
    (`src/api/core/transport.ts` is the single transport; base URL comes from
    `VITE_API_BASE_URL`).
  - `src/shared/**` — frontend-safe UI kit, hooks, types, theme.
- No frontend imports another frontend, `../shared`, `../backend`, or any Python
  source. No frontend has database credentials or server secrets.
- Dev fixtures (`src/api/mock/**`) are loaded through a lazy `import()` guarded by
  `import.meta.env.DEV`, and `transportMode()` throws in production when
  `VITE_API_BASE_URL` is missing — production never falls back to mock data.

## Independent commands

| App      | dev                     | typecheck                 | build                   |
| -------- | ----------------------- | ------------------------- | ----------------------- |
| Customer | `npm run dev:customer`  | `npm run typecheck:customer` | `npm run build:customer` |
| Partner  | `npm run dev:partner`   | `npm run typecheck:partner`  | `npm run build:partner`  |
| Rider    | `npm run dev:rider`     | `npm run typecheck:rider`    | `npm run build:rider`    |
| Admin    | `npm run dev:admin`     | `npm run typecheck:admin`    | `npm run build:admin`    |

Each app also builds from its own directory with plain `npm install && npm run build`
(this is what `render.yaml` does per service, `rootDir` = the app folder).

## Legacy (kept, not deleted)

- `backend/src/**` and `shared/src/**` are the pre-migration shared sources. They
  are no longer imported by any app; they remain for reference/history.
- `src/**` is the legacy mock-backed Partner console. The shipped Partner app is
  `partner-frontend/`.
- Root `vite.config.ts` still serves `customer-frontend/src` for the Lovable
  preview; production deploys use the per-app configs.
