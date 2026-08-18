// Rider app domain types. These mirror the shared QuickPress backend contracts
// consumed by customer-frontend and partner-frontend. UI only — no backend.

export type RiderSession = {
  riderId: string;
  phone: string;
  fullName: string;
  isVerified: boolean;
  isOnboarded: boolean;
  isNewRider: boolean;
};

export type VehicleType = "bike" | "scooter" | "ev-scooter" | "cycle" | "mini-truck";

export type RiderRegistrationPayload = {
  photoName: string;
  fullName: string;
  phone: string;
  email: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  drivingLicense: string;
  aadhaar: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  serviceCity: string;
};

export type RiderDashboard = {
  riderName: string;
  isOnline: boolean;
  todayDeliveries: number;
  todayEarnings: number;
  pendingPickups: number;
  pendingDeliveries: number;
  completedDeliveries: number;
  rating: number;
  onlineMinutes: number;
};

export type RiderTaskType = "pickup" | "delivery";

export type RiderOrderStatus =
  | "assigned"
  | "accepted"
  | "arriving"
  | "picked"
  | "at-partner"
  | "ready-for-delivery"
  | "delivered"
  | "cancelled"
  | "failed";

export type RiderOrder = {
  id: string;
  code: string;
  taskType: RiderTaskType;
  status: RiderOrderStatus;
  customerName: string;
  customerPhone: string;
  partnerName: string;
  partnerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  distanceKm: number;
  etaMinutes: number;
  estimatedEarning: number;
  itemCount: number;
  slot: string;
  placedAt: string;
  paymentMode: "online" | "cod";
  timeline: { id: string; label: string; time: string; done: boolean }[];
};

export type RiderWalletSummary = {
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  availableBalance: number;
  bankLast4: string;
  incentiveProgress: number;
};

export type RiderTransaction = {
  id: string;
  title: string;
  date: string;
  amount: number;
  direction: "credit" | "debit";
  status: "success" | "pending";
  kind: "trip" | "incentive" | "withdrawal" | "penalty" | "tip";
};

export type RiderNotificationKind =
  | "new-order"
  | "pickup-reminder"
  | "delivery-reminder"
  | "payment"
  | "system";

export type RiderNotification = {
  id: string;
  kind: RiderNotificationKind;
  title: string;
  body: string;
  time: string;
  unread: boolean;
};

export type RiderProfile = {
  riderId: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  rating: number;
  totalTrips: number;
  joinedOn: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  bankName: string;
  accountLast4: string;
  ifsc: string;
  kycStatus: "verified" | "pending" | "rejected";
  documents: { id: string; label: string; status: "verified" | "pending" | "rejected" }[];
};

export type RiderHistoryEntry = {
  id: string;
  code: string;
  customerName: string;
  partnerName: string;
  date: string;
  amount: number;
  distanceKm: number;
  outcome: "completed" | "cancelled" | "failed";
};
