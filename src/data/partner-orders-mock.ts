/**
 * Sprint 3.3 — UI-only mock data for the Partner Order Management module.
 *
 * Nothing here touches a backend. Every export below is a future API
 * integration point (see PARTNER_SPRINT_3_3_ORDER_MANAGEMENT_REPORT.md).
 *
 * NOTE: no `Date.now()` / `new Date()` at module scope — SSR and the client
 * must render identical markup, so relative times are stored as plain labels
 * plus a numeric `placedMinutesAgo` used for sorting.
 */

export type OrderStage =
  | "new"
  | "accepted"
  | "pickup_pending"
  | "washing"
  | "dry_cleaning"
  | "ironing"
  | "ready"
  | "completed"
  | "cancelled";

export type PaymentStatus = "paid" | "pending" | "refunded";
export type PaymentMode = "cod" | "online";
export type OrderDay = "today" | "tomorrow" | "past";

export type ManagedOrderItem = {
  id: string;
  name: string;
  service: string;
  qty: number;
  price: number;
};

export type OrderTimelineEntry = {
  id: string;
  label: string;
  time: string;
  note?: string;
};

export type ManagedOrder = {
  id: string;
  code: string;
  stage: OrderStage;
  customerName: string;
  customerRating: number;
  customerPhone: string;
  customerOrders: number;
  pickupAddress: string;
  deliveryAddress: string;
  pickupTime: string;
  pickupDay: OrderDay;
  deliveryEta: string;
  distanceKm: number;
  services: string[];
  itemCount: number;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentMode: PaymentMode;
  placedAt: string;
  placedMinutesAgo: number;
  specialInstructions: string;
  items: ManagedOrderItem[];
  charges: {
    subtotal: number;
    pickupFee: number;
    taxes: number;
    discount: number;
    total: number;
  };
  timeline: OrderTimelineEntry[];
  invoiceNo: string | null;
  cancelReason: string | null;
  assignedRider: string | null;
};

/* ------------------------------------------------------------------ */
/* Stage metadata                                                      */
/* ------------------------------------------------------------------ */

export const ORDER_TABS: { id: OrderStage; label: string; short: string }[] = [
  { id: "new", label: "New Orders", short: "New" },
  { id: "accepted", label: "Accepted", short: "Accepted" },
  { id: "pickup_pending", label: "Pickup Pending", short: "Pickup" },
  { id: "washing", label: "Washing", short: "Washing" },
  { id: "dry_cleaning", label: "Dry Cleaning", short: "Dry Clean" },
  { id: "ironing", label: "Ironing", short: "Ironing" },
  { id: "ready", label: "Ready for Delivery", short: "Ready" },
  { id: "completed", label: "Completed", short: "Done" },
  { id: "cancelled", label: "Cancelled", short: "Cancelled" },
];

export const STAGE_LABEL: Record<OrderStage, string> = {
  new: "New",
  accepted: "Accepted",
  pickup_pending: "Pickup Pending",
  washing: "Washing",
  dry_cleaning: "Dry Cleaning",
  ironing: "Ironing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STAGE_TONE: Record<OrderStage, string> = {
  new: "bg-primary/15 text-brand-dark",
  accepted: "bg-primary/15 text-brand-dark",
  pickup_pending: "bg-primary/10 text-brand-dark",
  washing: "bg-secondary/10 text-brand-green",
  dry_cleaning: "bg-secondary/10 text-brand-green",
  ironing: "bg-secondary/10 text-brand-green",
  ready: "bg-secondary/15 text-brand-green-dark",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

/** Vertical status timeline shown on the order details screen. */
export const TIMELINE_STEPS = [
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "picked", label: "Picked Up" },
  { key: "processing", label: "Processing" },
  { key: "ironing", label: "Ironing" },
  { key: "ready", label: "Ready" },
  { key: "delivered", label: "Delivered" },
] as const;

/** How far down the timeline a given stage sits. */
export const STAGE_TIMELINE_INDEX: Record<OrderStage, number> = {
  new: 0,
  accepted: 1,
  pickup_pending: 1,
  washing: 3,
  dry_cleaning: 3,
  ironing: 4,
  ready: 5,
  completed: 6,
  cancelled: 0,
};

export const HIGH_VALUE_THRESHOLD = 1500;

/* ------------------------------------------------------------------ */
/* Mock orders — TODO(api): GET /api/partner/orders                    */
/* ------------------------------------------------------------------ */

function charges(subtotal: number, discount = 0) {
  const pickupFee = 30;
  const taxes = Math.round(subtotal * 0.05);
  return {
    subtotal,
    pickupFee,
    taxes,
    discount,
    total: subtotal + pickupFee + taxes - discount,
  };
}

export const managedOrders: ManagedOrder[] = [
  {
    id: "o-48210",
    code: "QP-48210",
    stage: "new",
    customerName: "Ananya Sharma",
    customerRating: 4.9,
    customerPhone: "+91 98450 22110",
    customerOrders: 24,
    pickupAddress: "402, Prestige Palms, 12th Main, Indiranagar, Bengaluru 560038",
    deliveryAddress: "402, Prestige Palms, 12th Main, Indiranagar, Bengaluru 560038",
    pickupTime: "Today · 10:30 AM",
    pickupDay: "today",
    deliveryEta: "Tomorrow · 7:00 PM",
    distanceKm: 1.2,
    services: ["Wash & Fold", "Ironing"],
    itemCount: 12,
    amount: 745,
    paymentStatus: "pending",
    paymentMode: "cod",
    placedAt: "Today · 9:12 AM",
    placedMinutesAgo: 18,
    specialInstructions: "Please use mild detergent. Ring the bell twice.",
    items: [
      { id: "i1", name: "Cotton Shirts", service: "Wash & Fold", qty: 5, price: 250 },
      { id: "i2", name: "Trousers", service: "Ironing", qty: 4, price: 240 },
      { id: "i3", name: "Bedsheet (Double)", service: "Wash & Fold", qty: 3, price: 180 },
    ],
    charges: charges(670),
    timeline: [{ id: "t1", label: "Order placed", time: "Today · 9:12 AM" }],
    invoiceNo: null,
    cancelReason: null,
    assignedRider: null,
  },
  {
    id: "o-48209",
    code: "QP-48209",
    stage: "new",
    customerName: "Rohit Verma",
    customerRating: 4.4,
    customerPhone: "+91 99000 41288",
    customerOrders: 3,
    pickupAddress: "A-7, Green Meadows, HSR Layout Sector 2, Bengaluru 560102",
    deliveryAddress: "A-7, Green Meadows, HSR Layout Sector 2, Bengaluru 560102",
    pickupTime: "Today · 12:15 PM",
    pickupDay: "today",
    deliveryEta: "Sat · 6:30 PM",
    distanceKm: 3.8,
    services: ["Dry Clean"],
    itemCount: 6,
    amount: 1890,
    paymentStatus: "paid",
    paymentMode: "online",
    placedAt: "Today · 9:40 AM",
    placedMinutesAgo: 42,
    specialInstructions: "Blazer has a stain on the left sleeve.",
    items: [
      { id: "i1", name: "Wool Blazer", service: "Dry Clean", qty: 2, price: 900 },
      { id: "i2", name: "Silk Saree", service: "Dry Clean", qty: 2, price: 700 },
      { id: "i3", name: "Formal Coat", service: "Dry Clean", qty: 2, price: 200 },
    ],
    charges: charges(1800, 50),
    timeline: [{ id: "t1", label: "Order placed", time: "Today · 9:40 AM" }],
    invoiceNo: null,
    cancelReason: null,
    assignedRider: null,
  },
  {
    id: "o-48207",
    code: "QP-48207",
    stage: "accepted",
    customerName: "Vikram Nair",
    customerRating: 4.7,
    customerPhone: "+91 90080 76512",
    customerOrders: 11,
    pickupAddress: "18, Lake View Road, Koramangala 5th Block, Bengaluru 560095",
    deliveryAddress: "18, Lake View Road, Koramangala 5th Block, Bengaluru 560095",
    pickupTime: "Today · 11:15 AM",
    pickupDay: "today",
    deliveryEta: "Tomorrow · 5:00 PM",
    distanceKm: 2.1,
    services: ["Dry Clean", "Ironing"],
    itemCount: 9,
    amount: 1280,
    paymentStatus: "paid",
    paymentMode: "online",
    placedAt: "Today · 8:05 AM",
    placedMinutesAgo: 95,
    specialInstructions: "Deliver to the security desk if not at home.",
    items: [
      { id: "i1", name: "Suit (2-piece)", service: "Dry Clean", qty: 1, price: 750 },
      { id: "i2", name: "Formal Shirts", service: "Ironing", qty: 8, price: 400 },
    ],
    charges: charges(1150),
    timeline: [
      { id: "t1", label: "Order placed", time: "Today · 8:05 AM" },
      { id: "t2", label: "Accepted by store", time: "Today · 8:22 AM" },
    ],
    invoiceNo: null,
    cancelReason: null,
    assignedRider: null,
  },
  {
    id: "o-48204",
    code: "QP-48204",
    stage: "accepted",
    customerName: "Sneha Kulkarni",
    customerRating: 5,
    customerPhone: "+91 97400 33221",
    customerOrders: 38,
    pickupAddress: "C-104, Sobha Dew Flower, JP Nagar 7th Phase, Bengaluru 560078",
    deliveryAddress: "C-104, Sobha Dew Flower, JP Nagar 7th Phase, Bengaluru 560078",
    pickupTime: "Tomorrow · 9:00 AM",
    pickupDay: "tomorrow",
    deliveryEta: "Sun · 8:00 PM",
    distanceKm: 6.4,
    services: ["Premium Care"],
    itemCount: 4,
    amount: 2350,
    paymentStatus: "pending",
    paymentMode: "cod",
    placedAt: "Today · 7:30 AM",
    placedMinutesAgo: 130,
    specialInstructions: "Premium packaging requested.",
    items: [
      { id: "i1", name: "Designer Lehenga", service: "Premium Care", qty: 1, price: 1500 },
      { id: "i2", name: "Sherwani", service: "Premium Care", qty: 3, price: 750 },
    ],
    charges: charges(2250),
    timeline: [
      { id: "t1", label: "Order placed", time: "Today · 7:30 AM" },
      { id: "t2", label: "Accepted by store", time: "Today · 7:44 AM" },
    ],
    invoiceNo: null,
    cancelReason: null,
    assignedRider: null,
  },
  {
    id: "o-48201",
    code: "QP-48201",
    stage: "pickup_pending",
    customerName: "Imran Qureshi",
    customerRating: 4.2,
    customerPhone: "+91 88840 65903",
    customerOrders: 7,
    pickupAddress: "24, Church Street, Ashok Nagar, Bengaluru 560001",
    deliveryAddress: "24, Church Street, Ashok Nagar, Bengaluru 560001",
    pickupTime: "Today · 10:00 AM",
    pickupDay: "today",
    deliveryEta: "Tomorrow · 4:00 PM",
    distanceKm: 0.8,
    services: ["Wash & Iron"],
    itemCount: 15,
    amount: 820,
    paymentStatus: "pending",
    paymentMode: "cod",
    placedAt: "Today · 7:02 AM",
    placedMinutesAgo: 160,
    specialInstructions: "Call before arriving.",
    items: [
      { id: "i1", name: "Mixed Laundry (kg)", service: "Wash & Iron", qty: 6, price: 540 },
      { id: "i2", name: "Kurta", service: "Wash & Iron", qty: 9, price: 210 },
    ],
    charges: charges(750),
    timeline: [
      { id: "t1", label: "Order placed", time: "Today · 7:02 AM" },
      { id: "t2", label: "Accepted by store", time: "Today · 7:15 AM" },
      { id: "t3", label: "Pickup started", time: "Today · 9:50 AM" },
    ],
    invoiceNo: null,
    cancelReason: null,
    assignedRider: null,
  },
  {
    id: "o-48199",
    code: "QP-48199",
    stage: "washing",
    customerName: "Meera Iyer",
    customerRating: 4.8,
    customerPhone: "+91 98860 12045",
    customerOrders: 19,
    pickupAddress: "77, Brigade Gateway, Rajajinagar, Bengaluru 560055",
    deliveryAddress: "77, Brigade Gateway, Rajajinagar, Bengaluru 560055",
    pickupTime: "Today · 8:00 AM",
    pickupDay: "today",
    deliveryEta: "Tomorrow · 12:00 PM",
    distanceKm: 4.5,
    services: ["Wash & Fold", "Shoe Care"],
    itemCount: 18,
    amount: 990,
    paymentStatus: "paid",
    paymentMode: "online",
    placedAt: "Yesterday · 8:20 PM",
    placedMinutesAgo: 760,
    specialInstructions: "Separate whites and colours.",
    items: [
      { id: "i1", name: "Mixed Laundry (kg)", service: "Wash & Fold", qty: 8, price: 640 },
      { id: "i2", name: "Sneakers", service: "Shoe Care", qty: 2, price: 260 },
    ],
    charges: charges(900),
    timeline: [
      { id: "t1", label: "Order placed", time: "Yesterday · 8:20 PM" },
      { id: "t2", label: "Accepted by store", time: "Yesterday · 8:31 PM" },
      { id: "t3", label: "Picked up", time: "Today · 8:10 AM" },
      { id: "t4", label: "Washing started", time: "Today · 8:45 AM" },
    ],
    invoiceNo: null,
    cancelReason: null,
    assignedRider: null,
  },
  {
    id: "o-48195",
    code: "QP-48195",
    stage: "dry_cleaning",
    customerName: "Aditya Rao",
    customerRating: 4.6,
    customerPhone: "+91 91480 78320",
    customerOrders: 5,
    pickupAddress: "9, Cunningham Road, Vasanth Nagar, Bengaluru 560052",
    deliveryAddress: "9, Cunningham Road, Vasanth Nagar, Bengaluru 560052",
    pickupTime: "Today · 7:45 AM",
    pickupDay: "today",
    deliveryEta: "Sat · 11:00 AM",
    distanceKm: 5.2,
    services: ["Dry Clean"],
    itemCount: 5,
    amount: 1650,
    paymentStatus: "paid",
    paymentMode: "online",
    placedAt: "Yesterday · 6:05 PM",
    placedMinutesAgo: 880,
    specialInstructions: "Handle the velvet jacket with care.",
    items: [
      { id: "i1", name: "Velvet Jacket", service: "Dry Clean", qty: 1, price: 700 },
      { id: "i2", name: "Woollen Overcoat", service: "Dry Clean", qty: 4, price: 850 },
    ],
    charges: charges(1550),
    timeline: [
      { id: "t1", label: "Order placed", time: "Yesterday · 6:05 PM" },
      { id: "t2", label: "Accepted by store", time: "Yesterday · 6:18 PM" },
      { id: "t3", label: "Picked up", time: "Today · 7:50 AM" },
      { id: "t4", label: "Dry cleaning started", time: "Today · 8:30 AM" },
    ],
    invoiceNo: null,
    cancelReason: null,
    assignedRider: null,
  },
  {
    id: "o-48190",
    code: "QP-48190",
    stage: "ironing",
    customerName: "Priya Menon",
    customerRating: 4.5,
    customerPhone: "+91 96320 99871",
    customerOrders: 14,
    pickupAddress: "31, 100 Feet Road, Defence Colony, Bengaluru 560038",
    deliveryAddress: "31, 100 Feet Road, Defence Colony, Bengaluru 560038",
    pickupTime: "Yesterday · 5:30 PM",
    pickupDay: "past",
    deliveryEta: "Today · 6:00 PM",
    distanceKm: 2.9,
    services: ["Ironing"],
    itemCount: 22,
    amount: 660,
    paymentStatus: "pending",
    paymentMode: "cod",
    placedAt: "Yesterday · 3:12 PM",
    placedMinutesAgo: 1050,
    specialInstructions: "Crisp collars, no starch on kurtas.",
    items: [
      { id: "i1", name: "Shirts", service: "Ironing", qty: 12, price: 360 },
      { id: "i2", name: "Kurta", service: "Ironing", qty: 10, price: 240 },
    ],
    charges: charges(600),
    timeline: [
      { id: "t1", label: "Order placed", time: "Yesterday · 3:12 PM" },
      { id: "t2", label: "Accepted by store", time: "Yesterday · 3:20 PM" },
      { id: "t3", label: "Picked up", time: "Yesterday · 5:35 PM" },
      { id: "t4", label: "Washing complete", time: "Today · 7:10 AM" },
      { id: "t5", label: "Ironing started", time: "Today · 9:05 AM" },
    ],
    invoiceNo: null,
    cancelReason: null,
    assignedRider: null,
  },
  {
    id: "o-48188",
    code: "QP-48188",
    stage: "ready",
    customerName: "Dev Kapoor",
    customerRating: 4.9,
    customerPhone: "+91 99720 45510",
    customerOrders: 41,
    pickupAddress: "12, Palace Cross Road, Sadashivanagar, Bengaluru 560080",
    deliveryAddress: "Tower B, WeWork Galaxy, Residency Road, Bengaluru 560025",
    pickupTime: "Yesterday · 2:45 PM",
    pickupDay: "past",
    deliveryEta: "Today · 2:45 PM",
    distanceKm: 7.1,
    services: ["Premium Care", "Ironing"],
    itemCount: 8,
    amount: 2150,
    paymentStatus: "paid",
    paymentMode: "online",
    placedAt: "Yesterday · 11:02 AM",
    placedMinutesAgo: 1290,
    specialInstructions: "Deliver to office reception before 4 PM.",
    items: [
      { id: "i1", name: "Tuxedo", service: "Premium Care", qty: 1, price: 1200 },
      { id: "i2", name: "Dress Shirts", service: "Ironing", qty: 7, price: 800 },
    ],
    charges: charges(2000, 40),
    timeline: [
      { id: "t1", label: "Order placed", time: "Yesterday · 11:02 AM" },
      { id: "t2", label: "Accepted by store", time: "Yesterday · 11:14 AM" },
      { id: "t3", label: "Picked up", time: "Yesterday · 2:50 PM" },
      { id: "t4", label: "Processing complete", time: "Today · 8:00 AM" },
      { id: "t5", label: "Ironing complete", time: "Today · 10:20 AM" },
      { id: "t6", label: "Ready for delivery", time: "Today · 10:35 AM" },
    ],
    invoiceNo: null,
    cancelReason: null,
    assignedRider: null,
  },
  {
    id: "o-48180",
    code: "QP-48180",
    stage: "ready",
    customerName: "Farhan Ali",
    customerRating: 4.1,
    customerPhone: "+91 89040 21763",
    customerOrders: 2,
    pickupAddress: "56, Bannerghatta Main Road, BTM Layout, Bengaluru 560076",
    deliveryAddress: "56, Bannerghatta Main Road, BTM Layout, Bengaluru 560076",
    pickupTime: "Yesterday · 9:15 AM",
    pickupDay: "past",
    deliveryEta: "Today · 7:30 PM",
    distanceKm: 8.6,
    services: ["Wash & Fold"],
    itemCount: 10,
    amount: 540,
    paymentStatus: "pending",
    paymentMode: "cod",
    placedAt: "Yesterday · 8:00 AM",
    placedMinutesAgo: 1500,
    specialInstructions: "",
    items: [{ id: "i1", name: "Mixed Laundry (kg)", service: "Wash & Fold", qty: 6, price: 480 }],
    charges: charges(480),
    timeline: [
      { id: "t1", label: "Order placed", time: "Yesterday · 8:00 AM" },
      { id: "t2", label: "Accepted by store", time: "Yesterday · 8:12 AM" },
      { id: "t3", label: "Picked up", time: "Yesterday · 9:20 AM" },
      { id: "t4", label: "Processing complete", time: "Today · 6:40 AM" },
      { id: "t5", label: "Ready for delivery", time: "Today · 9:15 AM" },
    ],
    invoiceNo: null,
    cancelReason: null,
    assignedRider: null,
  },
  {
    id: "o-48174",
    code: "QP-48174",
    stage: "completed",
    customerName: "Kavya Reddy",
    customerRating: 4.8,
    customerPhone: "+91 98450 66017",
    customerOrders: 27,
    pickupAddress: "88, Whitefield Main Road, Bengaluru 560066",
    deliveryAddress: "88, Whitefield Main Road, Bengaluru 560066",
    pickupTime: "2 days ago · 10:00 AM",
    pickupDay: "past",
    deliveryEta: "Delivered · Yesterday 6:20 PM",
    distanceKm: 12.4,
    services: ["Wash & Iron", "Dry Clean"],
    itemCount: 16,
    amount: 1740,
    paymentStatus: "paid",
    paymentMode: "online",
    placedAt: "2 days ago · 9:10 AM",
    placedMinutesAgo: 2900,
    specialInstructions: "",
    items: [
      { id: "i1", name: "Mixed Laundry (kg)", service: "Wash & Iron", qty: 9, price: 810 },
      { id: "i2", name: "Silk Kurta Set", service: "Dry Clean", qty: 7, price: 800 },
    ],
    charges: charges(1610),
    timeline: [
      { id: "t1", label: "Order placed", time: "2 days ago · 9:10 AM" },
      { id: "t2", label: "Accepted by store", time: "2 days ago · 9:18 AM" },
      { id: "t3", label: "Picked up", time: "2 days ago · 10:05 AM" },
      { id: "t4", label: "Processing complete", time: "Yesterday · 11:00 AM" },
      { id: "t5", label: "Ironing complete", time: "Yesterday · 2:10 PM" },
      { id: "t6", label: "Ready for delivery", time: "Yesterday · 3:00 PM" },
      { id: "t7", label: "Delivered", time: "Yesterday · 6:20 PM" },
    ],
    invoiceNo: "INV-2026-48174",
    cancelReason: null,
    assignedRider: "Sanjay K.",
  },
  {
    id: "o-48170",
    code: "QP-48170",
    stage: "completed",
    customerName: "Nikhil Bose",
    customerRating: 4.3,
    customerPhone: "+91 90190 55803",
    customerOrders: 9,
    pickupAddress: "5, Richmond Road, Shanthala Nagar, Bengaluru 560025",
    deliveryAddress: "5, Richmond Road, Shanthala Nagar, Bengaluru 560025",
    pickupTime: "3 days ago · 4:30 PM",
    pickupDay: "past",
    deliveryEta: "Delivered · 2 days ago 7:45 PM",
    distanceKm: 3.3,
    services: ["Ironing"],
    itemCount: 25,
    amount: 700,
    paymentStatus: "paid",
    paymentMode: "cod",
    placedAt: "3 days ago · 2:00 PM",
    placedMinutesAgo: 4300,
    specialInstructions: "",
    items: [{ id: "i1", name: "Shirts & Trousers", service: "Ironing", qty: 25, price: 640 }],
    charges: charges(640),
    timeline: [
      { id: "t1", label: "Order placed", time: "3 days ago · 2:00 PM" },
      { id: "t2", label: "Accepted by store", time: "3 days ago · 2:06 PM" },
      { id: "t3", label: "Picked up", time: "3 days ago · 4:35 PM" },
      { id: "t4", label: "Ironing complete", time: "2 days ago · 1:10 PM" },
      { id: "t5", label: "Ready for delivery", time: "2 days ago · 2:00 PM" },
      { id: "t6", label: "Delivered", time: "2 days ago · 7:45 PM" },
    ],
    invoiceNo: "INV-2026-48170",
    cancelReason: null,
    assignedRider: "Rajesh P.",
  },
  {
    id: "o-48166",
    code: "QP-48166",
    stage: "cancelled",
    customerName: "Tanvi Deshpande",
    customerRating: 3.9,
    customerPhone: "+91 93420 71104",
    customerOrders: 1,
    pickupAddress: "14, Sarjapur Road, Bellandur, Bengaluru 560103",
    deliveryAddress: "14, Sarjapur Road, Bellandur, Bengaluru 560103",
    pickupTime: "Yesterday · 1:00 PM",
    pickupDay: "past",
    deliveryEta: "—",
    distanceKm: 9.8,
    services: ["Wash & Fold"],
    itemCount: 7,
    amount: 430,
    paymentStatus: "refunded",
    paymentMode: "online",
    placedAt: "Yesterday · 12:10 PM",
    placedMinutesAgo: 1620,
    specialInstructions: "",
    items: [{ id: "i1", name: "Mixed Laundry (kg)", service: "Wash & Fold", qty: 5, price: 400 }],
    charges: charges(400),
    timeline: [
      { id: "t1", label: "Order placed", time: "Yesterday · 12:10 PM" },
      { id: "t2", label: "Cancelled by customer", time: "Yesterday · 12:38 PM" },
    ],
    invoiceNo: null,
    cancelReason: "Customer cancelled — rescheduling to next week.",
    assignedRider: null,
  },
  {
    id: "o-48160",
    code: "QP-48160",
    stage: "cancelled",
    customerName: "Harsh Vardhan",
    customerRating: 4,
    customerPhone: "+91 97390 30044",
    customerOrders: 4,
    pickupAddress: "62, Old Airport Road, Domlur, Bengaluru 560071",
    deliveryAddress: "62, Old Airport Road, Domlur, Bengaluru 560071",
    pickupTime: "2 days ago · 6:00 PM",
    pickupDay: "past",
    deliveryEta: "—",
    distanceKm: 4.1,
    services: ["Dry Clean"],
    itemCount: 3,
    amount: 1560,
    paymentStatus: "refunded",
    paymentMode: "cod",
    placedAt: "2 days ago · 5:10 PM",
    placedMinutesAgo: 3400,
    specialInstructions: "",
    items: [{ id: "i1", name: "Woollen Suit", service: "Dry Clean", qty: 3, price: 1480 }],
    charges: charges(1480),
    timeline: [
      { id: "t1", label: "Order placed", time: "2 days ago · 5:10 PM" },
      { id: "t2", label: "Rejected by store", time: "2 days ago · 5:25 PM" },
    ],
    invoiceNo: null,
    cancelReason: "Rejected by store — pickup slot outside service hours.",
    assignedRider: null,
  },
];
