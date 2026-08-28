# QUICKPRESS CUSTOMER PANEL
# ZERO MOCK / DUMMY / SEED AUDIT

**Audit Date**: 2026-08-28  
**Scope**: `customer-frontend`, `backend-python` APIs, services, and live Supabase PostgreSQL data layer.  
**Policy**: 100% Real Production Data · 0% Mock · 0% Dummy · 0% Demo · 0% Fake · 0% Production Seed.

---

## 1. Total Mock References Found
- **Client Transport / Auth / Services Audit**: 4 references discovered in legacy branches and preview fallbacks.
- **Status**: **100% Cleared & Enforced to Live HTTP + Firebase**.

## 2. Total Dummy References Found
- **Payment & Checkout Simulation**: Found simulated checkout fallback branch in `customer-frontend/src/api/payments/razorpay-api.ts`.
- **Status**: **100% Removed**. Razorpay orders require real cryptographic backend verification.

## 3. Total Seed References Found
- **Backend Startup Seeding**: Audit checked `backend-python/app/main.py` lifespan and `app/db/customer_seed.py`.
- **Status**: **Disabled in Production**. Real user accounts, orders, wallets, and partners come directly from live database tables.

## 4. Total Fallback References Found
- **Data Resource Resolver**: `resolveResource()` in `http-client.ts` had an optional fallback branch.
- **Status**: **100% Removed**. Unreachable backend or failed requests strictly propagate `ApiError` to the UI to render clean Error / Retry states instead of fake data.

---

## 5. Production Mock Data Removed

| File | Location | Data Type | Action Taken |
|---|---|---|---|
| `customer-frontend/src/api/core/auth-service.ts` | `authMode()` | Auth Mode Fallback | Removed `"mock"` union branch. Auth mode strictly locked to `"firebase"` & FastAPI. |
| `customer-frontend/src/api/customer/api/http-client.ts` | `resolveResource()` | Generic Fallback Branch | Completely removed `options.fallback()` fallback execution. Re-throws `ApiError`. |
| `customer-frontend/src/api/payments/razorpay-api.ts` | `simulateMockCheckout` | Payment Simulation | Completely removed simulated payment outcome function. Real Razorpay Checkout is exclusively invoked. |
| `backend-python/app/main.py` | Startup Lifespan | Runtime Seed Invocation | Verified customer, order, partner dummy seeds are not triggered on application boot. |

---

## 6. Remaining Development/Test Data
- Test fixtures inside `backend-python/tests/` (e.g. `test_order_notifications.py`, `test_order_lifecycle_e2e.py`) are strictly isolated to automated pytest runs and never imported by the production runtime.

---

## 7. Production Data Sources

| Business Domain | Production Source of Truth | Live Protocol & Database Table |
|---|---|---|
| **Customer Profile** | `GET /api/profile`, `PUT /api/profile` | Supabase PostgreSQL `users`, `customers` |
| **Partner Discovery** | `GET /api/partners/nearby`, `GET /api/partners/{id}` | Supabase PostgreSQL `partner_profiles` |
| **Services & Catalog** | `GET /api/services`, `GET /api/categories`, `GET /api/partners/{id}/services` | Supabase PostgreSQL `services`, `partner_services` |
| **Pricing & Totals** | `GET /api/cart/summary`, `GET /api/cart` | Backend server-calculated in `cart_repositories.py` |
| **Cart** | `GET /api/cart`, `POST /api/cart/items`, `PUT /api/cart/items/{id}` | Supabase PostgreSQL `carts` table |
| **Orders** | `GET /api/orders`, `GET /api/orders/{id}`, `POST /api/orders` | Supabase PostgreSQL `orders` table |
| **Payments** | `POST /api/payments/razorpay/create-order`, `POST /api/payments/razorpay/verify` | Razorpay Gateway + `payments` table |
| **Wallet & Ledger** | `GET /api/wallet`, `GET /api/wallet/history`, `POST /api/wallet/add-funds` | Supabase PostgreSQL `wallets`, `wallet_transactions` |
| **Rider & Assignment** | `GET /api/orders/{id}/tracking` | Supabase PostgreSQL `rider_profiles` |
| **Tracking & Location** | `GET /api/orders/{id}/tracking` + WebSocket push | Live GPS coordinates from `rider_profiles` / `orders` |
| **Notifications** | `GET /api/notifications`, `POST /api/notifications/fcm-token` | Supabase PostgreSQL `notifications` + Firebase FCM Push |
| **Membership** | `GET /api/membership`, `GET /api/membership/plans` | Supabase PostgreSQL `memberships`, `membership_plans` |
| **Coupons & Offers** | `GET /api/offers`, `POST /api/offers/{code}/apply` | Supabase PostgreSQL `offers` table |
| **Invoices** | `GET /api/invoices/{id}`, `GET /api/orders/{orderId}/invoice` | Supabase PostgreSQL `invoices` table |
| **Help & Support** | `GET /api/help/faqs`, `GET /api/help/tickets`, `POST /api/help/tickets` | Supabase PostgreSQL `help_faqs`, `support_tickets` |
| **CMS & Legal** | `GET /api/cms/documents/{slug}` | Supabase PostgreSQL `cms_documents` table |

---

## 8. Production Build Result
- **Command**: `bun run build:customer`
- **Result**: **PASS** (Zero TypeScript/bundler errors, clean output generated in `.output/public` and `.output/server`).

---

## 9. Database Disconnect Test
- **Behavior**: When the database/backend is unreachable or disconnected, the customer frontend displays:
  - Error state: `"Unable to connect to QuickPress server. Please try again."`
  - Zero fake fallback data is served.
- **Result**: **PASS**.

---

## 10. Real E2E Test
- **Flow**: Customer Auth → Real Location Check → Active Store (Shree Krishna Lundarys) → Real Service Menu → Server-computed Cart & Pricing → Real Razorpay / Wallet Checkout → Order Placed → 7-Stage Live Order Lifecycle → Delivery Completion → Real Invoice Generation.
- **Result**: **PASS**.

---

## 11. Remaining Production Mock Data
**NONE** (0% mock, 0% dummy, 0% demo, 0% fake, 0% production seed).
