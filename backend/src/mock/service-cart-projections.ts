/**
 * Service Details + Smart Cart projections for the mock backend.
 *
 * These mirror the FastAPI responses in `backend-python`
 * (`app/api/services.py`, `app/api/cart.py`) so the customer app consumes an
 * identical contract in mock and live mode:
 *
 *   GET /api/services/{id}           → ServiceDetailData (hero, items, faq, …)
 *   GET /api/services/{id}/faq       → FaqItem[]
 *   GET /api/services/{id}/related   → RelatedService[]
 *   GET /api/services/{id}/partners  → ServicePartner[]
 *   GET /api/cart                    → { items, store, charges, totals }
 *
 * Pricing lives here (and in the Python `compute_totals`) — never in the app.
 */

import type { ServiceEntity } from "@shared/types";

import type { Charges, Totals } from "../customer/cart-api";
import type { MockDb } from "./db";
import { SEED_CART_CHARGES, SEED_CART_FULFILMENT, SEED_CART_ITEM_DESCRIPTIONS } from "./seed";

/** Authoritative money math — the single implementation for mock mode. */
export function computeCartTotals(
  items: { price: number; qty: number }[],
  charges: Charges,
  couponDiscount = 0,
): Totals {
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const itemsTotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const active = count > 0;
  const pickup = active ? charges.pickup : 0;
  const delivery = active ? charges.delivery : 0;
  const handling = active ? charges.handling : 0;
  const discount = active ? Math.min(charges.discount, itemsTotal) : 0;
  const coupon = active ? Math.min(couponDiscount, Math.max(0, itemsTotal - discount)) : 0;
  const taxable = Math.max(0, itemsTotal + pickup + delivery + handling - discount - coupon);
  const gst = Math.round(taxable * charges.gstRate);
  return {
    count,
    itemsTotal,
    pickup,
    delivery,
    handling,
    gst,
    discount,
    couponDiscount: coupon,
    grandTotal: Math.max(0, taxable + gst),
  };
}

/** Cart lines for one customer, in the shape the app renders. */
export function cartItemsFor(db: MockDb, accountId: string) {
  return db.carts
    .filter((item) => item.accountId === accountId)
    .map((item) => ({
      id: item.id,
      itemId: item.id,
      serviceId: item.serviceId,
      partnerId: item.partnerId,
      name: item.name,
      description: SEED_CART_ITEM_DESCRIPTIONS[item.id] ?? item.name,
      price: item.price,
      unit: item.unit,
      qty: item.qty,
      image: item.image,
      lineTotal: item.price * item.qty,
    }));
}

export function cartStoreFor(db: MockDb, accountId: string) {
  const partnerId = db.carts.find((item) => item.accountId === accountId)?.partnerId ?? null;
  const partner = db.partners.find((entry) => entry.id === partnerId) ?? db.partners[0];
  if (!partner) return null;
  return {
    id: partner.id,
    name: partner.name,
    image: partner.image,
    rating: partner.rating,
    reviews: SEED_CART_FULFILMENT.reviews,
    pickupEta: SEED_CART_FULFILMENT.pickupEta,
    deliveryEta: SEED_CART_FULFILMENT.deliveryEta,
  };
}

/** GET /api/cart — items + store + server computed totals. */
export function cartStateFor(db: MockDb, accountId: string, couponDiscount = 0) {
  const items = cartItemsFor(db, accountId);
  return {
    items,
    store: cartStoreFor(db, accountId),
    charges: SEED_CART_CHARGES,
    totals: computeCartTotals(items, SEED_CART_CHARGES, couponDiscount),
  };
}

const CARE_INSTRUCTIONS = [
  "Sorted by fabric and colour before every wash",
  "Washed at the temperature recommended on the care label",
  "Premium, skin friendly detergents on every load",
  "Quality checked and packed in reusable covers",
];

function faqFor(service: ServiceEntity) {
  return [
    {
      id: `${service.id}-faq-1`,
      question: `How long does ${service.name} take?`,
      answer: "Standard turnaround is 24 hours, with express delivery available at checkout.",
    },
    {
      id: `${service.id}-faq-2`,
      question: "How is the price calculated?",
      answer: `${service.name} is billed ${service.unit} at ₹${service.price}, confirmed after pickup weighing.`,
    },
    {
      id: `${service.id}-faq-3`,
      question: "What if I am not happy with the result?",
      answer: "We re-clean the item free of charge within 48 hours of delivery.",
    },
  ];
}

/** GET /api/services/{id}/related */
export function relatedServicesFor(db: MockDb, service: ServiceEntity) {
  return db.services
    .filter((entry) => entry.id !== service.id)
    .slice(0, 4)
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      price: entry.price,
      unit: entry.unit,
      image: entry.image,
    }));
}

/** GET /api/services/{id}/partners */
export function servicePartnersFor(db: MockDb, service: ServiceEntity) {
  return db.partners
    .filter((partner) => partner.services.some((entry) => entry.id === service.id))
    .slice(0, 8)
    .map((partner) => {
      const offering = partner.services.find((entry) => entry.id === service.id);
      return {
        id: partner.id,
        name: partner.name,
        logo: partner.image,
        rating: partner.rating,
        reviewsCount: partner.totalOrders,
        area: partner.area,
        pickupTime: SEED_CART_FULFILMENT.pickupEta,
        deliveryTime: SEED_CART_FULFILMENT.deliveryEta,
        price: offering?.price ?? service.price,
        offerLabel: partner.rating >= 4.7 ? "20% OFF up to ₹100" : null,
      };
    });
}

/** GET /api/services/{id} — full detail payload. */
export function serviceDetailFor(db: MockDb, service: ServiceEntity) {
  const items = db.services
    .filter((entry) => entry.categoryId === service.categoryId || entry.popular)
    .slice(0, 6)
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      price: entry.price,
      unit: entry.unit,
      eta: "24 hrs",
      image: entry.image,
    }));

  const reviews = db.reviews.slice(0, 5).map((review) => ({
    id: review.id,
    name: review.customerName,
    initials: review.initials,
    rating: review.rating,
    text: review.text,
    when: review.createdAt,
  }));

  return {
    // Listing screens read the flat service card from this endpoint too.
    ...service,
    service: {
      id: service.id,
      name: service.name,
      shortDescription: service.description,
      image: service.image,
      rating: 4.9,
      ordersCompleted: "10K+",
      pickupEta: SEED_CART_FULFILMENT.pickupEta,
      deliveryEta: SEED_CART_FULFILMENT.deliveryEta,
      startingPrice: service.price,
      about: service.description,
      included: [
        "Doorstep pickup and delivery",
        "Fabric wise sorting and treatment",
        "Quality check before packing",
      ],
      benefits: ["24 hour turnaround", "Free re-clean guarantee", "Live order tracking"],
    },
    packages: [
      {
        id: `${service.id}-standard`,
        name: "Standard",
        price: service.price,
        delivery: "24 hrs",
        benefits: ["Doorstep pickup", "Quality check"],
      },
      {
        id: `${service.id}-express`,
        name: "Express",
        price: Math.round(service.price * 1.5),
        delivery: "8 hrs",
        benefits: ["Priority processing", "Same day delivery"],
        tag: "Fastest",
      },
    ],
    items,
    addons: [
      { id: "addon-fold", name: "Premium folding", note: "Boutique style packing", price: 29 },
      {
        id: "addon-fragrance",
        name: "Fabric fragrance",
        note: "Long lasting freshness",
        price: 19,
      },
    ],
    reviews,
    charges: {
      pickup: SEED_CART_CHARGES.pickup,
      handling: SEED_CART_CHARGES.handling,
      discount: SEED_CART_CHARGES.discount,
    },
    careInstructions: CARE_INSTRUCTIONS,
    faq: faqFor(service),
    related: relatedServicesFor(db, service),
    partners: servicePartnersFor(db, service),
  };
}
