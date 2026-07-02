import { request } from "./client";

export type CoachApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CoachApplication {
  id: string;
  user_id: string;
  full_name: string;
  specialty: string;
  experience_years: number;
  certifications: string;
  bio?: string | null;
  website?: string | null;
  instagram?: string | null;
  status: CoachApplicationStatus;
  review_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoachApplicationPayload {
  full_name: string;
  specialty: string;
  experience_years?: number;
  certifications: string;
  bio?: string;
  website?: string;
  instagram?: string;
}

export function applyCoach(token: string, body: CoachApplicationPayload) {
  return request<CoachApplication>("/coaches/apply", { method: "POST", token, body });
}

// Current user's latest application (null when they have never applied).
export function getMyApplication(token: string) {
  return request<CoachApplication | null>("/coaches/application", { token });
}
