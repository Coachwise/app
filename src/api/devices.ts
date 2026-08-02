import { request } from "./client";

export type DevicePlatform = "android" | "ios" | "web";

export function registerDevice(
  token: string,
  body: { token: string; platform: DevicePlatform; locale?: string }
) {
  return request<void, typeof body>(`/devices`, { method: "POST", token, body });
}

export function unregisterDevice(token: string, deviceToken: string) {
  return request<void, { token: string }>(`/devices`, {
    method: "DELETE",
    token,
    body: { token: deviceToken },
  });
}
