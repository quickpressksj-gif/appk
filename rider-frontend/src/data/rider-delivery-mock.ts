/**
 * Realistic mock data for the Rider Delivery Order Management module.
 * UI-only sprint: no backend, no Socket.IO, no Google Maps.
 */

export type DeliveryStatus =
  | "new"
  | "accepted"
  | "reached-partner"
  | "picked-up"
  | "on-the-way"
  | "delivered"
  | "cancelled";

export type DeliveryPaymentType = "Cash on Delivery" | "Paid Online" | "UPI on Delivery";

export type DeliveryTimelineStep = {
  id: DeliveryStatus | "assigned";
  label: string;
  time: string | null;
  done: boolean;
};

export type OrderedService = {
  id: string;
  name: string;
  qty: number;
  price: number;
};

export type DeliveryOrder = {
  id: string;
  orderId: string;
  status: DeliveryStatus;
  customerName: string;
  customerPhone: string;
  customerNote?: string;
  partnerName: string;
  partnerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupTime: string;
  etaMinutes: number;
  etaLabel: string;
  distanceKm: number;
  paymentType: DeliveryPaymentType;
  codAmount: number | null;
  orderTotal: number;
  riderPayout: number;
  priority: "normal" | "high";
  placedAt: string;
  isToday: boolean;
  services: OrderedService[];
  specialInstructions: string;
  cancellationReason?: string;
  timeline: DeliveryTimelineStep[];
};

export const DELIVERY_TABS: { id: DeliveryStatus; label: string; short: string }[] = [
  { id: "new", label: "New Delivery", short: "New" },
  { id: "accepted", label: "Accepted", short: "Accepted" },
  { id: "reached-partner", label: "Reached Partner", short: "At Partner" },
  { id: "picked-up", label: "Picked Up", short: "Picked" },
  { id: "on-the-way", label: "On The Way", short: "On Way" },
  { id: "delivered", label: "Delivered", short: "Done" },
  { id: "cancelled", label: "Cancelled", short: "Cancelled" },
];

export const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, string> = {
  new: "New Delivery",
  accepted: "Accepted",
  "reached-partner": "Reached Partner",
  "picked-up": "Picked Up",
  "on-the-way": "On The Way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const DELIVERY_STATUS_TONE: Record<DeliveryStatus, string> = {
  new: "bg-primary/15 text-brand-dark",
  accepted: "bg-primary/15 text-brand-dark",
  "reached-partner": "bg-secondary/10 text-brand-green",
  "picked-up": "bg-secondary/10 text-brand-green",
  "on-the-way": "bg-secondary/10 text-brand-green",
  delivered: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

/** Canonical progress order used by the timeline + progress tracker. */
export const DELIVERY_PROGRESS: { id: DeliveryTimelineStep["id"]; label: string }[] = [
  { id: "assigned", label: "Assigned" },
  { id: "accepted", label: "Accepted" },
  { id: "reached-partner", label: "Reached Partner" },
  { id: "picked-up", label: "Picked Up" },
  { id: "on-the-way", label: "On The Way" },
  { id: "delivered", label: "Delivered" },
];

export const DELIVERY_FILTERS = [
  { id: "today", label: "Today" },
  { id: "cod", label: "COD" },
  { id: "online", label: "Online Payment" },
  { id: "priority", label: "High Priority" },
  { id: "nearest", label: "Nearest" },
] as const;

export type DeliveryFilterId = (typeof DELIVERY_FILTERS)[number]["id"];

export const DELIVERY_SORTS = [
  { id: "latest", label: "Latest" },
  { id: "nearest", label: "Nearest" },
  { id: "amount", label: "Highest Amount" },
  { id: "eta", label: "ETA" },
] as const;

export type DeliverySortId = (typeof DELIVERY_SORTS)[number]["id"];

function timeline(reached: number, times: (string | null)[]): DeliveryTimelineStep[] {
  return DELIVERY_PROGRESS.map((step, index) => ({
    id: step.id,
    label: step.label,
    time: times[index] ?? null,
    done: index <= reached,
  }));
}

export const riderDeliveriesMock: DeliveryOrder[] = [
  {
    id: "d1",
    orderId: "QP-84213",
    status: "new",
    customerName: "Neha Sharma",
    customerPhone: "+91 98200 41288",
    partnerName: "SparkleWash Laundry",
    partnerPhone: "+91 98670 22110",
    pickupAddress: "Shop 4, Veera Desai Road, Andheri West, Mumbai 400053",
    deliveryAddress: "B-1204, Lodha Aurum, Jogeshwari East, Mumbai 400060",
    pickupTime: "4:20 PM",
    etaMinutes: 24,
    etaLabel: "5:05 PM",
    distanceKm: 3.4,
    paymentType: "Cash on Delivery",
    codAmount: 640,
    orderTotal: 640,
    riderPayout: 68,
    priority: "high",
    placedAt: "Today · 3:58 PM",
    isToday: true,
    services: [
      { id: "s1", name: "Wash & Fold", qty: 6, price: 300 },
      { id: "s2", name: "Steam Ironing", qty: 8, price: 240 },
      { id: "s3", name: "Stain Treatment", qty: 2, price: 100 },
    ],
    specialInstructions: "Call before reaching the gate. Security requires a visitor pass.",
    timeline: timeline(0, ["3:58 PM"]),
  },
  {
    id: "d2",
    orderId: "QP-84219",
    status: "new",
    customerName: "Rahul Kapoor",
    customerPhone: "+91 99304 55120",
    partnerName: "FreshFold Dry Clean",
    partnerPhone: "+91 98211 77451",
    pickupAddress: "12 Linking Road, Bandra West, Mumbai 400050",
    deliveryAddress: "Flat 802, Sea Breeze, Khar West, Mumbai 400052",
    pickupTime: "4:45 PM",
    etaMinutes: 18,
    etaLabel: "5:25 PM",
    distanceKm: 1.9,
    paymentType: "Paid Online",
    codAmount: null,
    orderTotal: 420,
    riderPayout: 52,
    priority: "normal",
    placedAt: "Today · 4:12 PM",
    isToday: true,
    services: [{ id: "s1", name: "Dry Clean · Formals", qty: 4, price: 420 }],
    specialInstructions: "Hand over to the customer only, no doorstep drop.",
    timeline: timeline(0, ["4:12 PM"]),
  },
  {
    id: "d3",
    orderId: "QP-84190",
    status: "accepted",
    customerName: "Ishita Patel",
    customerPhone: "+91 90040 18822",
    partnerName: "CleanCrate Laundromat",
    partnerPhone: "+91 98330 66129",
    pickupAddress: "Unit 9, Chandivali Farm Road, Powai, Mumbai 400072",
    deliveryAddress: "A-604, Raheja Vihar, Powai, Mumbai 400072",
    pickupTime: "4:05 PM",
    etaMinutes: 15,
    etaLabel: "4:50 PM",
    distanceKm: 2.2,
    paymentType: "UPI on Delivery",
    codAmount: 355,
    orderTotal: 355,
    riderPayout: 45,
    priority: "normal",
    placedAt: "Today · 3:30 PM",
    isToday: true,
    services: [
      { id: "s1", name: "Wash & Iron", qty: 5, price: 255 },
      { id: "s2", name: "Shoe Cleaning", qty: 1, price: 100 },
    ],
    specialInstructions: "Collect the empty QuickPress bag from the previous order.",
    timeline: timeline(1, ["3:30 PM", "3:41 PM"]),
  },
  {
    id: "d4",
    orderId: "QP-84177",
    status: "reached-partner",
    customerName: "Aditya Rao",
    customerPhone: "+91 98198 30012",
    partnerName: "SparkleWash Laundry",
    partnerPhone: "+91 98670 22110",
    pickupAddress: "Shop 4, Veera Desai Road, Andheri West, Mumbai 400053",
    deliveryAddress: "302, Oberoi Splendor, JVLR, Mumbai 400060",
    pickupTime: "3:50 PM",
    etaMinutes: 21,
    etaLabel: "4:40 PM",
    distanceKm: 4.6,
    paymentType: "Cash on Delivery",
    codAmount: 890,
    orderTotal: 890,
    riderPayout: 82,
    priority: "high",
    placedAt: "Today · 3:05 PM",
    isToday: true,
    services: [
      { id: "s1", name: "Premium Dry Clean", qty: 3, price: 690 },
      { id: "s2", name: "Curtain Wash", qty: 1, price: 200 },
    ],
    specialInstructions: "Fragile garment bag — keep flat inside the delivery box.",
    timeline: timeline(2, ["3:05 PM", "3:12 PM", "3:48 PM"]),
  },
  {
    id: "d5",
    orderId: "QP-84150",
    status: "picked-up",
    customerName: "Sneha Iyer",
    customerPhone: "+91 90290 71340",
    partnerName: "Bubble & Beyond",
    partnerPhone: "+91 98920 41190",
    pickupAddress: "Ground Floor, Hiranandani Estate, Thane West 400607",
    deliveryAddress: "C-1102, Rustomjee Azziano, Thane West 400607",
    pickupTime: "3:25 PM",
    etaMinutes: 12,
    etaLabel: "4:15 PM",
    distanceKm: 1.4,
    paymentType: "Paid Online",
    codAmount: null,
    orderTotal: 510,
    riderPayout: 48,
    priority: "normal",
    placedAt: "Today · 2:40 PM",
    isToday: true,
    services: [{ id: "s1", name: "Wash & Fold", qty: 9, price: 510 }],
    specialInstructions: "Drop at reception if the customer does not answer.",
    timeline: timeline(3, ["2:40 PM", "2:48 PM", "3:18 PM", "3:25 PM"]),
  },
  {
    id: "d6",
    orderId: "QP-84121",
    status: "on-the-way",
    customerName: "Vikram Desai",
    customerPhone: "+91 98110 22874",
    partnerName: "FreshFold Dry Clean",
    partnerPhone: "+91 98211 77451",
    pickupAddress: "12 Linking Road, Bandra West, Mumbai 400050",
    deliveryAddress: "701, Vasant Vihar, Santacruz East, Mumbai 400055",
    pickupTime: "3:10 PM",
    etaMinutes: 9,
    etaLabel: "4:02 PM",
    distanceKm: 2.8,
    paymentType: "Cash on Delivery",
    codAmount: 1240,
    orderTotal: 1240,
    riderPayout: 96,
    priority: "high",
    placedAt: "Today · 2:15 PM",
    isToday: true,
    services: [
      { id: "s1", name: "Dry Clean · Sherwani", qty: 1, price: 850 },
      { id: "s2", name: "Steam Ironing", qty: 6, price: 390 },
    ],
    specialInstructions: "Customer will pay exact cash. Carry the COD receipt book.",
    timeline: timeline(4, ["2:15 PM", "2:22 PM", "3:02 PM", "3:10 PM", "3:16 PM"]),
  },
  {
    id: "d7",
    orderId: "QP-84088",
    status: "delivered",
    customerName: "Priya Nair",
    customerPhone: "+91 90048 12290",
    partnerName: "CleanCrate Laundromat",
    partnerPhone: "+91 98330 66129",
    pickupAddress: "Unit 9, Chandivali Farm Road, Powai, Mumbai 400072",
    deliveryAddress: "B-905, Nahar Amrit Shakti, Chandivali, Mumbai 400072",
    pickupTime: "1:20 PM",
    etaMinutes: 0,
    etaLabel: "Delivered 2:05 PM",
    distanceKm: 1.1,
    paymentType: "Paid Online",
    codAmount: null,
    orderTotal: 380,
    riderPayout: 42,
    priority: "normal",
    placedAt: "Today · 12:40 PM",
    isToday: true,
    services: [{ id: "s1", name: "Wash & Iron", qty: 7, price: 380 }],
    specialInstructions: "Left with the customer, OTP verified.",
    timeline: timeline(5, ["12:40 PM", "12:46 PM", "1:12 PM", "1:20 PM", "1:28 PM", "2:05 PM"]),
  },
  {
    id: "d8",
    orderId: "QP-84042",
    status: "delivered",
    customerName: "Kabir Malhotra",
    customerPhone: "+91 98337 44018",
    partnerName: "Bubble & Beyond",
    partnerPhone: "+91 98920 41190",
    pickupAddress: "Ground Floor, Hiranandani Estate, Thane West 400607",
    deliveryAddress: "12th Floor, Lodha Amara, Thane West 400607",
    pickupTime: "11:10 AM",
    etaMinutes: 0,
    etaLabel: "Delivered 11:58 AM",
    distanceKm: 2.6,
    paymentType: "Cash on Delivery",
    codAmount: 720,
    orderTotal: 720,
    riderPayout: 64,
    priority: "normal",
    placedAt: "Today · 10:30 AM",
    isToday: true,
    services: [
      { id: "s1", name: "Wash & Fold", qty: 8, price: 440 },
      { id: "s2", name: "Blanket Cleaning", qty: 1, price: 280 },
    ],
    specialInstructions: "Cash collected in full.",
    timeline: timeline(5, ["10:30 AM", "10:38 AM", "11:02 AM", "11:10 AM", "11:20 AM", "11:58 AM"]),
  },
  {
    id: "d9",
    orderId: "QP-83998",
    status: "cancelled",
    customerName: "Meera Joshi",
    customerPhone: "+91 99678 33021",
    partnerName: "SparkleWash Laundry",
    partnerPhone: "+91 98670 22110",
    pickupAddress: "Shop 4, Veera Desai Road, Andheri West, Mumbai 400053",
    deliveryAddress: "504, Sun Residency, Vile Parle East, Mumbai 400057",
    pickupTime: "—",
    etaMinutes: 0,
    etaLabel: "Cancelled",
    distanceKm: 5.2,
    paymentType: "Paid Online",
    codAmount: null,
    orderTotal: 460,
    riderPayout: 0,
    priority: "normal",
    placedAt: "Yesterday · 6:40 PM",
    isToday: false,
    services: [{ id: "s1", name: "Dry Clean · Casuals", qty: 3, price: 460 }],
    specialInstructions: "—",
    cancellationReason:
      "Customer cancelled before pickup — requested a reschedule to the next morning slot.",
    timeline: timeline(1, ["6:40 PM", "6:48 PM"]),
  },
  {
    id: "d10",
    orderId: "QP-83955",
    status: "cancelled",
    customerName: "Rohan Gupta",
    customerPhone: "+91 98209 66713",
    partnerName: "FreshFold Dry Clean",
    partnerPhone: "+91 98211 77451",
    pickupAddress: "12 Linking Road, Bandra West, Mumbai 400050",
    deliveryAddress: "22, Pali Hill, Bandra West, Mumbai 400050",
    pickupTime: "—",
    etaMinutes: 0,
    etaLabel: "Cancelled",
    distanceKm: 0.9,
    paymentType: "Cash on Delivery",
    codAmount: 250,
    orderTotal: 250,
    riderPayout: 0,
    priority: "normal",
    placedAt: "Yesterday · 1:05 PM",
    isToday: false,
    services: [{ id: "s1", name: "Steam Ironing", qty: 5, price: 250 }],
    specialInstructions: "—",
    cancellationReason: "Partner marked the order unavailable — machine breakdown at the store.",
    timeline: timeline(0, ["1:05 PM"]),
  },
];

/** Next status for the primary action of each stage. */
export const NEXT_STATUS: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  new: "accepted",
  accepted: "reached-partner",
  "reached-partner": "picked-up",
  "picked-up": "on-the-way",
  "on-the-way": "delivered",
};

/** Simulated fetch so the module exercises skeletons and pull-to-refresh. */
export function loadRiderDeliveriesMock(delay = 700): Promise<DeliveryOrder[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(riderDeliveriesMock), delay);
  });
}

export function loadRiderDeliveryMock(id: string, delay = 550): Promise<DeliveryOrder | null> {
  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve(
          riderDeliveriesMock.find((item) => item.id === id || item.orderId === id) ?? null,
        ),
      delay,
    );
  });
}
