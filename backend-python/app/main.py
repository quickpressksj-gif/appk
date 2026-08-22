"""QuickPress FastAPI application — Sprint 1 (Auth) + Sprint 2.1 (Customer Home)."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.addresses import router as addresses_router
from app.api.health import router as health_router
from app.api.admin import router as admin_router
from app.api.admin_payments import router as admin_payments_router
from app.api.availability import router as availability_router
from app.api.auth import router as auth_router
from app.api.cart import router as cart_router
from app.api.checkout import router as checkout_router
from app.api.earnings import router as earnings_router
from app.api.help import router as help_router
from app.api.home import router as home_router
from app.api.invoices import router as invoices_router
from app.api.maps import router as maps_router
from app.api.membership import router as membership_router
from app.api.notifications import router as notifications_router
from app.api.orders import router as orders_router
# Sprint 5.2: partner domain (orders, profile, services, wallet, reviews).
from app.api.partner import router as partner_router
from app.api.partners import router as partners_router
from app.api.payments import router as payments_router
from app.api.profile import router as profile_router
from app.api.razorpay import router as razorpay_router
from app.api.referral import router as referral_router
from app.api.rider import public_router as rider_public_router
from app.api.rider import router as rider_router
from app.api.services import router as services_router
from app.api.uploads import router as uploads_router
from app.api.wallet import router as wallet_router
from app.api.wallet_ledger import router as wallet_ledger_router
from app.api.webhooks import router as webhooks_router
from app.config import get_settings
from app.db.admin_repositories import ADMIN_SEED
from app.db.availability_seed import AVAILABILITY_SEED
from app.db.cart_repositories import CART_SEED
from app.db.rider_repositories import RIDER_SEED
from app.db.client import database
from app.db.catalog_repositories import catalog
from app.db.membership_repositories import MEMBERSHIP_SEED
from app.db.identity_seed import align_partner_identities
from app.db.partner_repositories import PARTNER_SEED
from app.db.service_content import SERVICE_CONTENT_SEED
from app.db.support_repositories import SUPPORT_SEED

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Strict startup order — every step must succeed before the next one runs:
    #   a. connect to MongoDB
    #   b/c/d. schema migrations: backfill canonical identity fields and replace
    #          legacy plain unique indexes with partial unique indexes
    #   e. verify the migrated indexes
    #   f. seeds + align_partner_identities()
    #   g. serve traffic
    await database.connect()
    report = await database.run_migrations()
    await database.verify_migrations()
    if report:
        logger.info("Identity index migrations complete: %s", report)
    await database.ensure_indexes()
    await catalog.ensure_seed()

    # Sprint 5.2: rider profiles, deliveries, wallet and analytics collections.
    await database.upsert_seed(RIDER_SEED)
    # Sprint 2.3: editorial service content, cart charges and coupons.
    # Sprint 2.9 adds the membership plan / benefit catalogue to the same loop.
    # Sprint 2.11 adds the FAQ category / FAQ content catalogue.
    # Sprint 2.12 adds service availability, delivery zones and business hours.
    for seed in (SERVICE_CONTENT_SEED, CART_SEED, MEMBERSHIP_SEED, SUPPORT_SEED, AVAILABILITY_SEED):
        for name, documents in seed.items():
            collection = database.collection(name)
            for document in documents:
                await collection.update_one(
                    {"_id": document["_id"]},
                    {"$set": {k: v for k, v in document.items() if k != "_id"}},
                    upsert=True,
                )
    # Sprint 5.2: partner domain seed (idempotent).
    await database.upsert_seed(PARTNER_SEED)
    # Sprint 5.2: admin domain seed (idempotent).
    await database.upsert_seed(ADMIN_SEED)
    # P0: one partner identity — catalog partner ids ARE partner profile ids.
    await align_partner_identities()
    yield
    await database.disconnect()



def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="QuickPress API", version="1.0.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|.*\.onrender\.com|.*quickpress\.online)(:\d+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(auth_router, prefix=settings.api_prefix)
    # Sprint 2.6: profile / photo / settings. Registered before the home router
    # so its richer GET /api/profile wins over the Home header projection.
    app.include_router(profile_router, prefix=settings.api_prefix)
    app.include_router(home_router, prefix=settings.api_prefix)
    # Registered after home so `/partners/nearby` keeps matching before `/partners/{id}`.
    app.include_router(partners_router, prefix=settings.api_prefix)
    # Sprint 2.3: service details + smart cart.
    app.include_router(services_router, prefix=settings.api_prefix)
    app.include_router(cart_router, prefix=settings.api_prefix)
    # Sprint 2.4: checkout, address book and order creation.
    app.include_router(checkout_router, prefix=settings.api_prefix)
    app.include_router(addresses_router, prefix=settings.api_prefix)
    app.include_router(orders_router, prefix=settings.api_prefix)
    # Sprint 2.12: availability engine, service areas and smart reorder history.
    app.include_router(availability_router, prefix=settings.api_prefix)
    # Sprint 2.7: notification engine.
    app.include_router(notifications_router, prefix=settings.api_prefix)
    # Sprint 2.8: referral & rewards system.
    app.include_router(referral_router, prefix=settings.api_prefix)
    # Sprint 2.9: membership plans, subscriptions and benefits.
    app.include_router(membership_router, prefix=settings.api_prefix)
    # Sprint 2.10: wallet, add funds, payment methods, payments and refunds.
    app.include_router(wallet_router, prefix=settings.api_prefix)
    # Production integration: Cloudinary-backed media uploads.
    app.include_router(maps_router, prefix=settings.api_prefix)
    app.include_router(uploads_router, prefix=settings.api_prefix)
    app.include_router(payments_router, prefix=settings.api_prefix)
    # Sprint 2.11: GST invoices and the Help Center (FAQs + support tickets).
    app.include_router(invoices_router, prefix=settings.api_prefix)
    app.include_router(help_router, prefix=settings.api_prefix)
    # Sprint 5.2: partner domain — dashboard, profile, orders, services, wallet.
    app.include_router(partner_router, prefix=settings.api_prefix)
    # Sprint 5.2: rider domain (dashboard, orders, wallet, notifications).
    app.include_router(rider_public_router, prefix=settings.api_prefix)
    app.include_router(rider_router, prefix=settings.api_prefix)
    # Sprint 5.2: admin domain — dashboard, orders, customers, partners, riders.
    app.include_router(admin_router, prefix=settings.api_prefix)
    # Sprint 5.6 (P0 #2): production payment rails. Registered AFTER the legacy
    # Sprint 2.10 routers so existing paths (/payments, /refunds, /wallet,
    # /partner/earnings, /rider/earnings) keep their current handlers; only the
    # gateway-specific paths below are added.
    app.include_router(razorpay_router, prefix=settings.api_prefix)
    app.include_router(wallet_ledger_router, prefix=settings.api_prefix)
    app.include_router(admin_payments_router, prefix=settings.api_prefix)
    app.include_router(earnings_router, prefix=settings.api_prefix)
    # Razorpay server-to-server webhooks (HMAC verified, unauthenticated by design).
    app.include_router(webhooks_router, prefix=settings.api_prefix)

    # Health check + meta (countries list) mounted exactly once under /api.
    app.include_router(health_router, prefix=settings.api_prefix)  # → /api/health, /api/countries

    # Root health endpoint for Render default health check and probes → /health
    @app.get("/health", tags=["health"], summary="Health check (root)")
    async def root_health() -> dict:
        from app.api.health import health as get_health_status  # noqa: PLC0415
        return await get_health_status()

    return app


app = create_app()
