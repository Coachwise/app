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

export function listSessions(token: string) {
  return request<Session[]>("/workouts/sessions", { token });
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
