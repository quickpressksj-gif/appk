import { apiGetJson } from "../core/transport";

export type PartnerCustomer = {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  lastOrderCode: string;
};

export async function fetchPartnerCustomers(): Promise<PartnerCustomer[]> {
  return apiGetJson<PartnerCustomer[]>("/api/partner/customers");
}
