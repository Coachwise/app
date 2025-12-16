import { request } from "./client";
import type { Chat, Message, MessageCreatePayload, UUID } from "./types";

export function sendMessage(token: string, body: MessageCreatePayload) {
  return request<Message>("/messages", { method: "POST", token, body });
}

export function listChatMessages(
  token: string,
  chat_id: UUID,
  params?: { limit?: number; offset?: number }
) {
  const search = new URLSearchParams();
  if (params?.limit !== undefined) search.set("limit", String(params.limit));
  if (params?.offset !== undefined) search.set("offset", String(params.offset));
  const query = search.toString() ? `?${search.toString()}` : "";
  return request<Message[]>(`/messages/${chat_id}${query}`, { token });
}

export function markChatRead(token: string, chat_id: UUID) {
  return request<{ message: string }>(`/messages/${chat_id}/read`, {
    method: "POST",
    token,
  });
}

// Placeholder: listing user chats would go here when endpoint exists
export type { Chat };
