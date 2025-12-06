import { request } from "./client";
import type { User, UserUpdate } from "./types";

export function listUsers(token: string, username?: string) {
  const query = username ? `?username=${encodeURIComponent(username)}` : "";
  return request<User[]>(`/users${query}`, { token });
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
