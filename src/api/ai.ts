import { request } from "./client";

export type AiRole = "user" | "assistant";
export type AiStatus = "pending" | "awaiting_approval" | "done" | "failed";

// One proposed/executed action stored on an assistant message. Writes render as
// approval cards; the client runs them and reports the result.
export interface AiAction {
  name: string;
  args?: Record<string, unknown>;
  kind: string; // "write"
  status: string; // pending | done | failed
  result?: unknown;
}

export interface AiMessage {
  id: string;
  conversation_id: string;
  role: AiRole;
  text: string;
  actions: AiAction[];
  status: AiStatus;
  model?: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  created_at: string;
}

export interface AiConversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiActionResult {
  ok: boolean;
  result?: unknown;
  error?: string;
}

export function listConversations(token: string, params?: { page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return request<{ items: AiConversation[]; total: number }>(`/ai/conversations${query}`, { token });
}

export function startConversation(token: string, body: { title?: string; text?: string }) {
  return request<{ conversation: AiConversation; message: AiMessage | null }>("/ai/conversations", {
    method: "POST",
    token,
    body,
  });
}

export function getConversation(token: string, id: string) {
  return request<{ conversation: AiConversation; messages: AiMessage[] }>(`/ai/conversations/${id}`, { token });
}

export function sendMessage(token: string, conversationId: string, text: string) {
  return request<AiMessage>(`/ai/conversations/${conversationId}/messages`, {
    method: "POST",
    token,
    body: { text },
  });
}

// reportResults sends client-executed write outcomes (aligned by index to the
// message's proposals) and gets back the next pending assistant turn.
export function reportResults(token: string, conversationId: string, messageId: string, results: AiActionResult[]) {
  return request<AiMessage>(`/ai/conversations/${conversationId}/messages/${messageId}/result`, {
    method: "POST",
    token,
    body: { results },
  });
}
