# QuickPress

Production-ready monorepo for the QuickPress laundry pickup & delivery platform.

```
quickpress/
├── customer-frontend/   Customer app (primary)      · TanStack Start
├── partner-frontend/    Partner store console       · TanStack Start
├── rider-frontend/      Rider delivery app          · TanStack Start
├── admin-frontend/      Admin operations console    · TanStack Start
├── backend/             THE single shared API layer (no duplicates)
└── shared/              Design system, UI, hooks, utils, types, constants, icons
```

> **Production Partner entry point:** the root build (`vite build` / the deployed
> root app) compiles `partner-frontend/src` — the real API-connected Partner
> application. The legacy mock-backed console in `./src` is kept for reference
> only and is no longer served in production. See `vite.config.ts`.


## Applications

| App               | Package                          | Dev command         | Port |
| ----------------- | -------------------------------- | ------------------- | ---- |
| Customer          | `@quickpress/customer-frontend`  | `bun run dev:customer` | 8080 |
| Partner           | `@quickpress/partner-frontend`   | `bun run dev:partner`  | 8081 |
| Rider             | `@quickpress/rider-frontend`     | `bun run dev:rider`    | 8082 |
| Admin             | `@quickpress/admin-frontend`     | `bun run dev:admin`    | 8083 |

Each frontend is fully independent: its own `package.json`, `tsconfig.json`,
`vite.config.ts`, `public/`, route tree, root layout and `styles.css`. They can
be developed, built and deployed separately (`bun run build:partner`, …).

`bun run dev` / `bun run build` at the repo root target the customer app, the
primary product surface.

## Shared code (`shared/`)

One copy of everything reusable, consumed through the `@shared/*` alias:

- `ui/` — the complete shadcn component library
- `hooks/`, `lib/` — `use-mobile`, `cn`, error capture/reporting
- `styles/theme.css` — the single design system (tokens, fonts, shadows).
  Every app's `src/styles.css` imports it, so all four apps look identical.
- `types/`, `constants/`, `theme/`, `icons/`, `assets/`

## Backend (`backend/`)

There is exactly ONE backend. Frontends never define their own API code; they
import `@backend/<domain>/<module>`:

```
backend/src/
├── core/      transport clients (/api, /api/partner, /api/rider, /api/admin)
├── customer/  home, cart, orders, wallet, offers, profile, …
├── partner/   dashboard, orders, services, earnings, wallet, profile
├── rider/     dashboard, orders, notifications, wallet, profile
└── admin/     orders, customers, partners, riders, cities, pricing, finance, …
```

Swap the mock resolvers for real `request()` calls and every app picks up the
change at once.

## Getting started

```bash
bun install          # installs all workspaces
bun run dev          # customer app
bun run dev:admin    # admin console
```

## Conventions

- Routes live in `<app>/src/routes` (TanStack Router file-based routing).
- Never hardcode colours — use the semantic tokens from `shared/src/styles/theme.css`.
- Reusable UI goes in `shared/`, never duplicated into an app.
- API access goes through `backend/`, never inline `fetch` in a screen.
