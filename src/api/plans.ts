import { request } from "./client";
import type {
  CreatePlanPayload,
  Plan,
  PlanAssignPayload,
  PlanAssignee,
  PlanExercise,
  PlanExercisePayload,
  UpdatePlanPayload,
} from "./types";

export function listPlans(token: string, params?: { public?: boolean }) {
  const search = new URLSearchParams();
  if (params?.public !== undefined) search.set("public", String(params.public));
  const query = search.toString() ? `?${search.toString()}` : "";
  return request<Plan[]>(`/plans${query}`, { token });
}

export function createPlan(token: string, body: CreatePlanPayload) {
  return request<Plan>("/plans", { method: "POST", token, body });
}

export function getPlan(token: string, id: string) {
  return request<Plan>(`/plans/${id}`, { token });
}

export function updatePlan(token: string, id: string, body: UpdatePlanPayload) {
  return request<Plan>(`/plans/${id}`, { method: "PUT", token, body });
}

export function deletePlan(token: string, id: string) {
  return request<void>(`/plans/${id}`, { method: "DELETE", token });
}

export function addPlanExercise(token: string, planId: string, body: PlanExercisePayload) {
  return request<PlanExercise>(`/plans/${planId}/exercises`, {
    method: "POST",
    token,
    body,
  });
}

export function listPlanExercises(token: string, planId: string) {
  return request<PlanExercise[]>(`/plans/${planId}/exercises`, { token });
}

export function removePlanExercise(token: string, planId: string, exerciseId: string) {
  return request<void>(`/plans/${planId}/exercises/${exerciseId}`, { method: "DELETE", token });
}

export function assignPlan(token: string, planId: string, body: PlanAssignPayload) {
  return request<PlanAssignee>(`/plans/${planId}/assign`, { method: "POST", token, body });
}

export function listPlanAssignments(token: string, planId: string) {
  return request<PlanAssignee[]>(`/plans/${planId}/assignments`, { token });
}

export function unassignPlan(token: string, planId: string, userId: string) {
  return request<void>(`/plans/${planId}/assign/${userId}`, { method: "DELETE", token });
}
