import { config } from "@/config";
import { ApiError } from "./errors";
import { report } from "@/lib/report";

const API_URL = config.apiURL;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions<TBody = unknown> {
  method?: HttpMethod;
  token?: string;
  body?: TBody;
  headers?: Record<string, string>;
  /** Internal: set after a refresh retry so we don't loop. */
  _retried?: boolean;
}

// The AuthProvider registers a handler that swaps an expired access token for a
// fresh one (using the stored refresh token). Kept here to avoid a circular
// import between the client and the auth context.
type RefreshHandler = () => Promise<string | null>;
let refreshHandler: RefreshHandler | null = null;
export function setTokenRefreshHandler(fn: RefreshHandler | null) {
  refreshHandler = fn;
}

export async function request<TResponse, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {}
): Promise<TResponse> {
  const { method = "GET", token, body, headers = {}, _retried = false } = options;

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const buildHeaders = (authToken?: string): Record<string, string> => {
    const h: Record<string, string> = {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    };
    if (!isFormData && !h["Content-Type"]) h["Content-Type"] = "application/json";
    return h;
  };

  const doFetch = (authToken?: string) =>
    fetch(`${API_URL}${path}`, {
      method,
      headers: buildHeaders(authToken),
      body: isFormData ? (body as BodyInit) : body ? JSON.stringify(body) : undefined,
    });

  let res = await doFetch(token);

  // Access token likely expired → refresh once and retry with a fresh one.
  if (res.status === 401 && token && refreshHandler && !_retried) {
    const fresh = await refreshHandler();
    if (fresh) res = await doFetch(fresh);
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    // A 5xx is the server's bug, not the caller's — report it, tagged with the
    // request id the API echoed, so this report and the server-side alert join
    // up. 4xx is expected (bad input, expired token) and is left to the caller.
    if (res.status >= 500) {
      report({
        kind: "api",
        message: `${res.status} ${method} ${path}: ${data?.error || res.statusText}`,
        requestId: res.headers.get("X-Request-ID") ?? undefined,
        url: `${API_URL}${path}`,
      });
    }
    throw new ApiError({
      code: data?.code,
      message: data?.error || res.statusText,
      status: res.status,
      field: data?.field,
      rule: data?.rule,
    });
  }

  return data as TResponse;
}

export { API_URL };
