import { request } from "./client";
import type { User, UserUpdate } from "./types";

export interface UserListResponse {
  items: User[];
  total: number;
}

export function listUsers(
  token: string,
  params?: { search?: string; coachOnly?: boolean; page?: number; limit?: number }
) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.coachOnly) q.set("coach_only", "true");
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const query = q.toString() ? `?${q.toString()}` : "";
  return request<UserListResponse>(`/users${query}`, { token });
}

export function getUser(token: string, id: string) {
  return request<User>(`/users/${id}`, { token });
}

export function getMe(token: string) {
  return request<User>("/users/me", { token });
}

export function updateMe(token: string, body: UserUpdate) {
  return request<User>("/users/me", { method: "PUT", token, body });
}

export function deleteMe(token: string) {
  return request<void>("/users/me", { method: "DELETE", token });
}
