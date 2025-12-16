import { request } from "./client";
import type { CreateMediaPayload, Media } from "./types";

export function createMedia(token: string, body: CreateMediaPayload) {
  return request<Media>("/media", { method: "POST", token, body });
}

export function listMedia(token: string, params?: { limit?: number; offset?: number }) {
  const search = new URLSearchParams();
  if (params?.limit !== undefined) search.set("limit", String(params.limit));
  if (params?.offset !== undefined) search.set("offset", String(params.offset));
  const query = search.toString() ? `?${search.toString()}` : "";
  return request<Media[]>(`/media${query}`, { token });
}

export async function uploadMedia(token: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return request<Media>("/media/upload", { method: "POST", token, body: form, headers: {} });
}
