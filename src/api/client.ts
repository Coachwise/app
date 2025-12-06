import type { AuthTokens } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions<TBody = unknown> {
  method?: HttpMethod;
  token?: string;
  body?: TBody;
  headers?: Record<string, string>;
}

async function request<TResponse, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {}
): Promise<TResponse> {
  const { method = "GET", token, body, headers = {} } = options;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const errorMessage = data?.error || res.statusText;
    throw new Error(errorMessage);
  }

  return data as TResponse;
}

export function setAuthHeader(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type RequestFn = typeof request;

export { request, API_URL };

// Convenience helpers for token management (caller stores tokens)
export function hasTokens(tokens?: Partial<AuthTokens>): tokens is AuthTokens {
  return Boolean(tokens?.access_token && tokens?.refresh_token);
}
