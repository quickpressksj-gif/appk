import { apiGetJson } from "../core/transport";

export interface CaptainSlideItem {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  highlight: string;
  color: string;
}

export interface CaptainGuidelineItem {
  title: string;
  desc: string;
}

export interface CaptainGuidelinesResponse {
  ok: boolean;
  platformName: string;
  slides: CaptainSlideItem[];
  guidelines: CaptainGuidelineItem[];
}

export interface CaptainSupportResponse {
  ok: boolean;
  helplinePhone: string;
  supportEmail: string;
  whatsappUrl: string;
  emergencySosNumber: string;
  workingHours: string;
  hubAddress: string;
}

/** GET /api/rider/guidelines — Dynamic guidelines and SOP from Admin Settings */
export async function fetchCaptainGuidelines(): Promise<CaptainGuidelinesResponse> {
  return await apiGetJson<CaptainGuidelinesResponse>("/api/rider/guidelines");
}

/** GET /api/rider/support — 24/7 Support helpline & emergency channels from Admin Settings */
export async function fetchCaptainSupport(): Promise<CaptainSupportResponse> {
  return await apiGetJson<CaptainSupportResponse>("/api/rider/support");
}
