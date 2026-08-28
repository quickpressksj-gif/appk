// Rider profile data layer — backed by the shared FastAPI backend.
import { apiGetJson } from "../core/transport";
import type { RiderProfile } from "@/shared/types/rider";

export async function fetchRiderProfile(): Promise<RiderProfile> {
  const res = await apiGetJson<any>("/api/rider/profile");
  return {
    id: res.id || res._id || res.riderId || "—",
    riderId: res.riderId || res._id || "—",
    fullName: res.fullName || res.name || "Delivery Partner",
    phone: res.phone || res.mobile || "—",
    email: res.email || "—",
    city: res.city || "Kasganj",
    rating: typeof res.rating === "number" ? res.rating : 5.0,
    totalTrips:
      typeof res.totalTrips === "number"
        ? res.totalTrips
        : typeof res.trips === "number"
          ? res.trips
          : 0,
    joinedOn: res.joinedOn || "August 2026",
    vehicleType: res.vehicleType || res.vehicle || "Bike",
    vehicleNumber: res.vehicleNumber || res.plate || "—",
    bankName: res.bankName || "State Bank of India",
    accountLast4:
      res.accountLast4 ||
      (res.accountNumber ? String(res.accountNumber).slice(-4) : "4821"),
    ifsc: res.ifsc || "SBIN0001234",
    kycStatus:
      res.kycStatus ||
      (res.isVerified ? "verified" : "pending"),
    documents:
      Array.isArray(res.documents) && res.documents.length > 0
        ? res.documents
        : [
            {
              id: "doc-license",
              label: "Driving License",
              status: res.isVerified ? "verified" : "pending",
            },
            {
              id: "doc-rc",
              label: "Vehicle RC",
              status: res.isVerified ? "verified" : "pending",
            },
            {
              id: "doc-aadhaar",
              label: "Aadhaar Card",
              status: res.isVerified ? "verified" : "pending",
            },
          ],
} as RiderProfile;
}

export async function updateRiderProfile(patch: Record<string, any>) {
  return apiPatchJson<{ ok: boolean }>("/api/rider/profile", patch);
}

export interface RiderBankAccount {
  bankName: string;
  accountNumber: string;
  ifsc: string;
  accountHolder: string;
  upiId: string;
  isVerified?: boolean;
}

export async function fetchRiderBank(): Promise<RiderBankAccount> {
  return apiGetJson<RiderBankAccount>("/api/rider/bank");
}

export async function updateRiderBank(bank: Partial<RiderBankAccount>) {
  return apiPatchJson<{ ok: boolean; bank: RiderBankAccount }>("/api/rider/bank", bank);
}

export async function fetchWorkSettings() {
  return apiGetJson<any>("/api/rider/work-settings");
}

export async function updateWorkSettings(settings: Record<string, any>) {
  return apiPatchJson<{ ok: boolean }>("/api/rider/work-settings", settings);
}

