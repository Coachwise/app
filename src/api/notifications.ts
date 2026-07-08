import { request } from "./client";
import type { Notification } from "./types";

type Paged<T> = { items: T[]; total: number };

export function listNotifications(token: string, params?: { page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const query = q.toString() ? `?${q.toString()}` : "";
  return request<Paged<Notification>>(`/notifications${query}`, { token });
}

export function unreadCount(token: string) {
  return request<{ count: number }>(`/notifications/unread-count`, { token });
}

export function markRead(token: string, id: string) {
  return request<void>(`/notifications/${id}/read`, { method: "POST", token });
}

export function markAllRead(token: string) {
  return request<void>(`/notifications/read-all`, { method: "POST", token });
}
