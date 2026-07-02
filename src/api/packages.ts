import { request } from "./client";
import type {
  CoachClient,
  CoachPackage,
  PackagePayload,
  PackageSubscription,
  PlanAssignPayload,
} from "./types";

// The coach's own packages.
export function listPackages(token: string, params?: { page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const query = q.toString() ? `?${q.toString()}` : "";
  return request<{ items: CoachPackage[]; total: number }>(`/packages${query}`, { token });
}

export function getPackage(token: string, id: string) {
  return request<CoachPackage>(`/packages/${id}`, { token });
}

export function createPackage(token: string, body: PackagePayload) {
  return request<CoachPackage>("/packages", { method: "POST", token, body });
}

export function updatePackage(token: string, id: string, body: PackagePayload) {
  return request<CoachPackage>(`/packages/${id}`, { method: "PUT", token, body });
}

export function deletePackage(token: string, id: string) {
  return request<void>(`/packages/${id}`, { method: "DELETE", token });
}

// Replace the set of plans bundled into a package.
export function setPackagePlans(token: string, id: string, planIds: string[]) {
  return request<CoachPackage>(`/packages/${id}/plans`, {
    method: "PUT",
    token,
    body: { plan_ids: planIds },
  });
}

// Coach enrolls a client in the package (creates the client relationship) and
// assigns its bundled plans.
export function assignPackage(token: string, id: string, body: PlanAssignPayload) {
  return request<unknown>(`/packages/${id}/assign`, { method: "POST", token, body });
}

// Athlete subscribes themselves to an active package (becomes the coach's client).
export function subscribePackage(token: string, id: string) {
  return request<unknown>(`/packages/${id}/subscribe`, { method: "POST", token });
}

// Coach removes a client's subscription to a package (also unassigns its plans).
export function unsubscribeClient(token: string, id: string, userId: string) {
  return request<void>(`/packages/${id}/subscribers/${userId}`, { method: "DELETE", token });
}

// The current user's active package subscriptions.
export function mySubscriptions(token: string) {
  return request<{ items: PackageSubscription[]; total: number }>(`/packages/subscriptions`, { token });
}

// A coach's active packages (athlete-facing, e.g. tier comparison).
export function listCoachPackages(token: string, coachId: string) {
  return request<{ items: CoachPackage[]; total: number }>(`/coaches/${coachId}/packages`, {
    token,
  });
}

// The coach's clients (their connections) enriched with assigned plans.
export function listCoachClients(token: string, params?: { page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const query = q.toString() ? `?${q.toString()}` : "";
  return request<{ items: CoachClient[]; total: number }>(`/coaches/clients${query}`, { token });
}
