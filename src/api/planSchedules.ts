import { request } from "./client";
import type {
  CreatePlanSchedulePayload,
  PlanSchedule,
  UpdatePlanSchedulePayload,
} from "./types";

export function listPlanSchedules(
  token: string,
  params?: { from?: string; to?: string; status?: string; page?: number; limit?: number }
) {
  const search = new URLSearchParams();
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  if (params?.status) search.set("status", params.status);
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  const query = search.toString() ? `?${search.toString()}` : "";
  return request<{
    items: PlanSchedule[];
    total: number;
  }>(`/schedules${query}`, { token });
}

export function getPlanSchedule(token: string, id: string) {
  return request<PlanSchedule>(`/schedules/${id}`, { token });
}

export function createPlanSchedule(token: string, body: CreatePlanSchedulePayload) {
  return request<PlanSchedule>("/schedules", { method: "POST", token, body });
}

export function updatePlanSchedule(token: string, id: string, body: UpdatePlanSchedulePayload) {
  return request<PlanSchedule>(`/schedules/${id}`, { method: "PATCH", token, body });
}

export function deletePlanSchedule(token: string, id: string) {
  return request<void>(`/schedules/${id}`, { method: "DELETE", token });
}
