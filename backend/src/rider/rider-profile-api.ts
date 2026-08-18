// Rider profile data layer — backed by the shared mock/live backend.
import { apiGetJson } from "../core/transport";
import type { RiderProfile } from "@shared/types/rider";

export async function fetchRiderProfile(): Promise<RiderProfile> {
  return apiGetJson<RiderProfile>("/api/rider/profile");
}
