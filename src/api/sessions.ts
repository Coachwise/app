import { request } from "./client";
import type {
  CreateSessionPayload,
  CreateWorkoutLogPayload,
  Session,
  UpdateSessionPayload,
  UpdateWorkoutLogPayload,
  WorkoutLog,
} from "./types";

export function createSession(token: string, body: CreateSessionPayload) {
  return request<Session>("/workouts/sessions", { method: "POST", token, body });
}

export function listSessions(token: string, params?: { status?: string; page?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  const query = search.toString() ? `?${search.toString()}` : "";
  return request<{
    items: Session[];
    total: number;
  }>(`/workouts/sessions${query}`, { token });
}

export function listActiveSessions(token: string) {
  return request<Session[]>("/workouts/sessions/active", { token });
}

export function getSession(token: string, id: string) {
  return request<Session>(`/workouts/sessions/${id}`, { token });
}

export function updateSession(token: string, id: string, body: UpdateSessionPayload) {
  return request<Session>(`/workouts/sessions/${id}`, { method: "PUT", token, body });
}

export function getSessionLogs(token: string, sessionId: string) {
  return request<WorkoutLog[]>(`/workouts/sessions/${sessionId}/logs`, { token });
}

export function createWorkoutLog(token: string, body: CreateWorkoutLogPayload) {
  return request<WorkoutLog>("/workouts/logs", { method: "POST", token, body });
}

export function updateWorkoutLog(token: string, id: string, body: UpdateWorkoutLogPayload) {
  return request<WorkoutLog>(`/workouts/logs/${id}`, { method: "PUT", token, body });
}

// Note: backend delete is placeholder; keep for API parity
export function deleteWorkoutLog(token: string, id: string) {
  return request<unknown>(`/workouts/logs/${id}`, { method: "DELETE", token });
}

export interface DailyAnalytics {
  date: string;
  sessions_count: number;
  total_duration?: number | null; // minutes
  plans_completed: string[];
  exercises_completed: number;
  total_sets: number;
  total_reps?: number | null;
  total_volume?: number | null;
}

export function listDailyAnalytics(token: string, params?: { limit?: number; offset?: number }) {
  const search = new URLSearchParams();
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.offset) search.set("offset", String(params.offset));
  const query = search.toString() ? `?${search.toString()}` : "";
  return request<{ items: DailyAnalytics[]; total: number }>(`/workouts/sessions/analytics/daily${query}`, { token });
}
