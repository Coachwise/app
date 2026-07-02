import { request } from "./client";
import type { Message, User } from "./types";

export interface Thread {
  chat_id: string;
  peer: User;
  last_message: string;
  last_at: string;
  last_sender_id: string;
  unread_count: number;
}

export interface ThreadListResponse {
  items: Thread[];
  total: number;
}

// Conversation list (paginated {items, total}).
export function listThreads(token: string, params?: { page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const query = q.toString() ? `?${q.toString()}` : "";
  return request<ThreadListResponse>(`/messages/threads${query}`, { token });
}

// Messages exchanged with a peer (newest first).
export function listMessages(
  token: string,
  peerId: string,
  params?: { limit?: number; offset?: number }
) {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.offset) q.set("offset", String(params.offset));
  const query = q.toString() ? `?${q.toString()}` : "";
  return request<Message[]>(`/messages/${peerId}${query}`, { token });
}

export function sendMessage(
  token: string,
  body: { recipient_id: string; body: string; media_id?: string }
) {
  return request<Message>(`/messages`, { method: "POST", token, body });
}

export function markRead(token: string, peerId: string) {
  return request<{ message: string }>(`/messages/${peerId}/read`, { method: "POST", token });
}
