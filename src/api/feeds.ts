import { request } from "./client";
import type {
  Feed,
  FeedComment,
  FeedCommentPayload,
  FeedCreatePayload,
} from "./types";

export interface FeedListResponse {
  feeds: Feed[];
  total_count: number;
}

export function listFeeds(
  token: string,
  params?: { limit?: number; offset?: number; user_id?: string }
) {
  const search = new URLSearchParams();
  if (params?.limit !== undefined) search.set("limit", String(params.limit));
  if (params?.offset !== undefined) search.set("offset", String(params.offset));
  if (params?.user_id) search.set("user_id", params.user_id);
  const query = search.toString() ? `?${search.toString()}` : "";
  return request<FeedListResponse>(`/feeds${query}`, { token });
}

export function createFeed(token: string, body: FeedCreatePayload) {
  return request<Feed>("/feeds", { method: "POST", token, body });
}

export function getFeed(token: string, id: string) {
  return request<Feed>(`/feeds/${id}`, { token });
}

export function deleteFeed(token: string, id: string) {
  return request<{ message: string }>(`/feeds/${id}`, { method: "DELETE", token });
}

export function likeFeed(token: string, id: string) {
  return request<{ message: string }>(`/feeds/${id}/like`, { method: "POST", token });
}

export function unlikeFeed(token: string, id: string) {
  return request<{ message: string }>(`/feeds/${id}/like`, { method: "DELETE", token });
}

export function listComments(token: string, feedId: string) {
  return request<{ comments: FeedComment[] }>(`/feeds/${feedId}/comments`, { token });
}

export function createComment(token: string, feedId: string, body: FeedCommentPayload) {
  return request<FeedComment>(`/feeds/${feedId}/comments`, { method: "POST", token, body });
}
