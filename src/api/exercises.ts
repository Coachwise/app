import { request } from "./client";
import type { Exercise, ExerciseCategory, ExerciseForm } from "./types";

export function listExercises(
  token: string,
  params?: { public?: boolean; search?: string; category?: string; sport?: string; page?: number; limit?: number },
) {
  const qs = new URLSearchParams();
  if (params?.public !== undefined) qs.set("public", String(params.public));
  if (params?.search) qs.set("search", params.search);
  if (params?.category) qs.set("category", params.category);
  if (params?.sport) qs.set("sport", params.sport);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return request<{ items: Exercise[]; total: number }>(`/exercises${query}`, { token });
}

export function listExerciseCategories(token: string, sport?: string) {
  const query = sport ? `?sport=${encodeURIComponent(sport)}` : "";
  return request<{ items: ExerciseCategory[] }>(`/exercises/categories${query}`, { token });
}

export function createExercise(token: string, body: ExerciseForm) {
  return request<Exercise>("/exercises", { method: "POST", token, body });
}

export function getExercise(token: string, id: string) {
  return request<Exercise>(`/exercises/${id}`, { token });
}

export function updateExercise(token: string, id: string, body: ExerciseForm) {
  return request<Exercise>(`/exercises/${id}`, { method: "PUT", token, body });
}

export function deleteExercise(token: string, id: string) {
  return request<void>(`/exercises/${id}`, { method: "DELETE", token });
}
