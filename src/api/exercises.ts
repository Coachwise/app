import { request } from "./client";
import type { Exercise, ExerciseForm } from "./types";

export function listExercises(token: string, params?: { public?: boolean; name?: string }) {
  const search = new URLSearchParams();
  if (params?.public !== undefined) search.set("public", String(params.public));
  if (params?.name) search.set("name", params.name);
  const query = search.toString() ? `?${search.toString()}` : "";
  return request<Exercise[]>(`/exercises${query}`, { token });
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
