import { request } from "./client";
import type { User } from "./types";

export type ConnectionStatus =
  | "none"
  | "pending_outgoing"
  | "pending_incoming"
  | "connected";

export interface ConnectionRequest {
  id: string;
  status: string;
  created_at: string;
  user: User;
}

export interface ConnectionListResponse {
  items: User[];
  total: number;
}

export interface RequestListResponse {
  items: ConnectionRequest[];
  total: number;
}

// Send a connection request to a user (POST /users/:id/connect).
export function sendConnect(token: string, userId: string) {
  return request<unknown>(`/users/${userId}/connect`, { method: "POST", token });
}

// Cancel my outgoing connection request (DELETE /users/:id/connect).
export function cancelConnect(token: string, userId: string) {
  return request<unknown>(`/users/${userId}/connect`, { method: "DELETE", token });
}

// My established connections.
export function listConnections(
  token: string,
  params?: { page?: number; limit?: number }
) {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const query = q.toString() ? `?${q.toString()}` : "";
  return request<ConnectionListResponse>(`/connections${query}`, { token });
}

// Incoming connection requests addressed to me (default status PENDING).
export function listRequests(
  token: string,
  params?: { status?: string; page?: number; limit?: number }
) {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const query = q.toString() ? `?${q.toString()}` : "";
  return request<RequestListResponse>(`/connections/requests${query}`, { token });
}

export function acceptRequest(token: string, id: string) {
  return request<unknown>(`/connections/requests/${id}/accept`, { method: "POST", token });
}

export function rejectRequest(token: string, id: string) {
  return request<unknown>(`/connections/requests/${id}/reject`, { method: "POST", token });
}
