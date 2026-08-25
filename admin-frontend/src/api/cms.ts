/** API client for QuickPress Website & Legal CMS admin management. */

import { apiGetJson, apiPostJson, apiPutJson, apiDeleteJson } from "@/api/core/transport";

export interface LegalDocSummary {
  slug: string;
  title: string;
  currentVersion: string;
  effectiveDate: string;
  hasDraft: boolean;
  publishedAt?: string;
  updatedAt?: string;
}

export interface LegalDocDetail {
  slug: string;
  title: string;
  currentVersion: string;
  effectiveDate: string;
  summary: string;
  content: string;
  publishedAt?: string;
  draft?: {
    title: string;
    summary: string;
    content: string;
    updatedAt: string;
    updatedBy?: string;
  };
  history?: Array<{
    version: string;
    title: string;
    effectiveDate: string;
    changeLog?: string;
    publishedAt: string;
    publishedBy?: string;
  }>;
}

export interface WebsiteFaq {
  id: string;
  category: string;
  question: string;
  answer: string;
  sortOrder: number;
  isPublished: boolean;
  updatedAt?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: "new" | "in-progress" | "resolved" | "archived";
  createdAt: string;
  notes?: string;
}

export interface WebsiteSettings {
  brandName: string;
  tagline: string;
  supportPhone: string;
  supportEmail: string;
  registeredOffice: string;
  cin?: string;
  gstin?: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export interface CMSDashboardData {
  legalDocsCount: number;
  faqsCount: number;
  totalInquiries: number;
  newInquiries: number;
  legalDocs: LegalDocSummary[];
}

export async function fetchCMSDashboard(): Promise<CMSDashboardData> {
  return apiGetJson<CMSDashboardData>("/api/admin/website/dashboard");
}

export async function fetchLegalDocs(): Promise<LegalDocSummary[]> {
  return apiGetJson<LegalDocSummary[]>("/api/admin/website/legal");
}

export async function fetchLegalDocDetail(slug: string): Promise<LegalDocDetail> {
  return apiGetJson<LegalDocDetail>(`/api/admin/website/legal/${slug}`);
}

export async function saveLegalDraft(
  slug: string,
  payload: { title: string; summary: string; content: string }
): Promise<{ ok: boolean; status: string; draft: any }> {
  return apiPostJson(`/api/admin/website/legal/${slug}/draft`, payload);
}

export async function publishLegalDoc(
  slug: string,
  changeLog: string
): Promise<{ ok: boolean; status: string; version: string }> {
  return apiPostJson(`/api/admin/website/legal/${slug}/publish`, { changeLog });
}

export async function fetchAdminFaqs(): Promise<WebsiteFaq[]> {
  return apiGetJson<WebsiteFaq[]>("/api/admin/website/faqs");
}

export async function createAdminFaq(faq: Omit<WebsiteFaq, "id"> & { id?: string }): Promise<WebsiteFaq> {
  return apiPostJson<WebsiteFaq>("/api/admin/website/faqs", faq);
}

export async function updateAdminFaq(id: string, faq: Partial<WebsiteFaq>): Promise<WebsiteFaq> {
  return apiPutJson<WebsiteFaq>(`/api/admin/website/faqs/${id}`, faq);
}

export async function deleteAdminFaq(id: string): Promise<{ ok: boolean }> {
  return apiDeleteJson<{ ok: boolean }>(`/api/admin/website/faqs/${id}`);
}

export async function fetchContactMessages(status?: string): Promise<ContactMessage[]> {
  const url = status ? `/api/admin/website/contact-messages?status=${status}` : "/api/admin/website/contact-messages";
  return apiGetJson<ContactMessage[]>(url);
}

export async function updateContactStatus(id: string, status: ContactMessage["status"]): Promise<{ ok: boolean }> {
  return apiPutJson<{ ok: boolean }>(`/api/admin/website/contact-messages/${id}/status`, { status });
}

export async function fetchWebsiteSettings(): Promise<WebsiteSettings> {
  return apiGetJson<WebsiteSettings>("/api/admin/website/settings");
}

export async function updateWebsiteSettings(settings: Partial<WebsiteSettings>): Promise<{ ok: boolean }> {
  return apiPutJson<{ ok: boolean }>("/api/admin/website/settings", settings);
}
