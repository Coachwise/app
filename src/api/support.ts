import { request } from "./client";

export type TicketStatus = "OPEN" | "CLOSED";
export type TicketTurn = "USER" | "ADMIN";
export type MessageSender = "USER" | "ADMIN" | "SYSTEM";

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  status: TicketStatus;
  // Whose turn it is to send next. The composer is enabled only when it is the
  // user's turn — the conversation is strictly back-and-forth.
  turn: TicketTurn;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

export interface SupportTicketListItem extends SupportTicket {
  last_body: string | null;
  last_sender: MessageSender | null;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender: MessageSender;
  body: string;
  created_at: string;
}

type Paged<T> = { items: T[]; total: number };

export function listTickets(token: string, params?: { page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const query = q.toString() ? `?${q.toString()}` : "";
  return request<Paged<SupportTicketListItem>>(`/support/tickets${query}`, { token });
}

export function getTicket(token: string, id: string) {
  return request<{ ticket: SupportTicket; messages: SupportMessage[] }>(
    `/support/tickets/${id}`,
    { token },
  );
}

export function openTicket(token: string, subject: string, body: string) {
  return request<{ ticket: SupportTicket; message: SupportMessage }>(`/support/tickets`, {
    method: "POST",
    token,
    body: { subject, body },
  });
}

export function sendMessage(token: string, ticketId: string, body: string) {
  return request<{ message: SupportMessage }>(`/support/tickets/${ticketId}/messages`, {
    method: "POST",
    token,
    body: { body },
  });
}

export function closeTicket(token: string, ticketId: string) {
  return request<{ ticket: SupportTicket }>(`/support/tickets/${ticketId}/close`, {
    method: "POST",
    token,
  });
}

/** A short, human-quotable reference for follow-ups, e.g. "3F9A2B1C". */
export function ticketRef(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}
