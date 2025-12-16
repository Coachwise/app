import { request } from "./client";
import type { Tag } from "./types";

export interface TagSearchResponse {
  tags: Tag[];
  total_count: number;
}

export function searchTags(
  token: string,
  params?: { query?: string; sport_type?: string; limit?: number; offset?: number }
) {
  const search = new URLSearchParams();
  if (params?.query) search.set("query", params.query);
  if (params?.sport_type) search.set("sport_type", params.sport_type);
  if (params?.limit !== undefined) search.set("limit", String(params.limit));
  if (params?.offset !== undefined) search.set("offset", String(params.offset));
  const query = search.toString() ? `?${search.toString()}` : "";
  return request<TagSearchResponse>(`/tags/search${query}`, { token });
}
