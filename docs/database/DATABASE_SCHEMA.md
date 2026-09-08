# Database Schema Documentation

This document describes the schema used for the Car Care mobile-first web app, implemented in PostgreSQL on Supabase.

---

## Tables Overview

### 1. `profiles`
Extends Supabase `auth.users` table with business-specific customer profile data.
- `id` (UUID, PK, references `auth.users.id` on delete cascade)
- `first_name` (text, nullable)
- `last_name` (text, nullable)
- `phone` (text, nullable)
- `avatar_url` (text, nullable)
- `created_at` (timestamp with time zone, default `now()`)
- `updated_at` (timestamp with time zone, default `now()`)

### 2. `vehicles`
Stores customer vehicles saved to their profile or added during booking.
- `id` (UUID, PK, default `gen_random_uuid()`)
- `user_id` (UUID, FK -> `profiles.id` on delete cascade)
- `vehicle_type` (text, not null) — e.g., `'sedan'`, `'suv'`, `'truck'`, `'van'`
- `make` (text, not null)
- `model` (text, not null)
- `year` (integer, not null)
- `color` (text, nullable)
- `license_plate` (text, nullable)
- `created_at` (timestamp with time zone, default `now()`)
- `updated_at` (timestamp with time zone, default `now()`)

### 3. `addresses`
Saved service locations for users.
- `id` (UUID, PK, default `gen_random_uuid()`)
- `user_id` (UUID, FK -> `profiles.id` on delete cascade)
- `label` (text, nullable) — e.g. "Home", "Office"
- `street_address` (text, not null)
- `apt_suite` (text, nullable)
- `city` (text, not null)
- `state` (text, not null)
- `zip_code` (text, not null)
- `is_default` (boolean, default false)
- `created_at` (timestamp with time zone, default `now()`)
- `updated_at` (timestamp with time zone, default `now()`)

### 4. `services`
Available car care service packages.
- `id` (UUID, PK, default `gen_random_uuid()`)
- `name` (text, not null)
- `slug` (text, unique, not null)
- `description` (text)
- `duration_minutes` (integer, not null)
- `features` (jsonb / text array, not null)
- `is_popular` (boolean, default false)
- `is_active` (boolean, default true)
- `created_at` (timestamp with time zone, default `now()`)

### 5. `vehicle_pricing`
Price of each base service according to vehicle size/category.
- `id` (UUID, PK, default `gen_random_uuid()`)
- `service_id` (UUID, FK -> `services.id` on delete cascade)
- `vehicle_type` (text, not null) — matches `vehicles.vehicle_type` or pricing tiers
- `price` (numeric(10, 2), not null)
- `created_at` (timestamp with time zone, default `now()`)
- Unique constraint on `(service_id, vehicle_type)`

### 6. `addons`
Add-on services that can be added to any base service.
- `id` (UUID, PK, default `gen_random_uuid()`)
- `name` (text, not null)
- `slug` (text, unique, not null)
- `description` (text)
- `price` (numeric(10, 2), not null)
- `duration_minutes` (integer, default 0)
- `is_active` (boolean, default true)
- `created_at` (timestamp with time zone, default `now()`)

### 7. `bookings`
Core booking record linking customer, vehicle, service, address, and schedule.
- `id` (UUID, PK, default `gen_random_uuid()`)
- `user_id` (UUID, FK -> `profiles.id`, nullable for guests)
- `service_id` (UUID, FK -> `services.id`, not null)
- `vehicle_id` (UUID, FK -> `vehicles.id`, nullable if ad-hoc vehicle details stored)
- `address_id` (UUID, FK -> `addresses.id`, nullable if snapshot)
- `scheduled_date` (date, not null)
- `scheduled_time_slot` (text, not null)
- `status` (text, not null, default `'confirmed'`) — `'pending'`, `'confirmed'`, `'in_progress'`, `'completed'`, `'cancelled'`
- `total_price` (numeric(10, 2), not null)
- `notes` (text, nullable)
- `address_snapshot` (jsonb, nullable) — snapshot of street, city, state, zip
- `vehicle_snapshot` (jsonb, nullable) — snapshot of make, model, year, type
- `created_at` (timestamp with time zone, default `now()`)
- `updated_at` (timestamp with time zone, default `now()`)

### 8. `booking_addons`
Join table linking bookings with selected add-ons at historical prices.
- `id` (UUID, PK, default `gen_random_uuid()`)
- `booking_id` (UUID, FK -> `bookings.id` on delete cascade)
- `addon_id` (UUID, FK -> `addons.id`)
- `price_at_booking` (numeric(10, 2), not null)
- `created_at` (timestamp with time zone, default `now()`)

---

## Row-Level Security (RLS) Policies

All tables have RLS enabled:
- `profiles`: Users can read and update their own profile (`auth.uid() = id`).
- `vehicles` & `addresses`: Users can CRUD their own records (`auth.uid() = user_id`).
- `services`, `vehicle_pricing`, `addons`: Public read access (`true`) for active records.
- `bookings`: Users can view/create their own bookings (`auth.uid() = user_id`).
- `booking_addons`: Users can view their own booking add-ons via `booking_id` relationship.

---

## Indexes & Performance
- Index on `bookings(user_id)`
- Index on `bookings(scheduled_date, scheduled_time_slot)` for schedule collision lookups
- Index on `vehicles(user_id)`
- Index on `addresses(user_id)`
- Index on `vehicle_pricing(service_id, vehicle_type)`
