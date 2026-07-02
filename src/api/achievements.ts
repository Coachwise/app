import { request } from "./client";
import type { Achievement, AchievementLayout, UserAchievements } from "./types";

// A user's profile achievements: derived PRs + coach-granted badges.
export function getUserAchievements(token: string, userId: string) {
  return request<UserAchievements>(`/users/${userId}/achievements`, { token });
}

// Coach grants a badge to an athlete.
export function grantAchievement(token: string, body: { athlete_id: string; title: string; description?: string }) {
  return request<Achievement>("/achievements", { method: "POST", token, body });
}

export function deleteAchievement(token: string, id: string) {
  return request<void>(`/achievements/${id}`, { method: "DELETE", token });
}

// Save the current user's curated profile layout (order + hidden item keys).
export function saveLayout(token: string, layout: AchievementLayout) {
  return request<AchievementLayout>("/achievements/layout", { method: "PUT", token, body: layout });
}
