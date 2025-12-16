import { config } from "@/config";

const API_URL = config.apiURL;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions<TBody = unknown> {
  method?: HttpMethod;
  token?: string;
  body?: TBody;
  headers?: Record<string, string>;
}

export async function request<TResponse, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {}
): Promise<TResponse> {
  const { method = "GET", token, body, headers = {} } = options;

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const finalHeaders: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  if (!isFormData && !finalHeaders["Content-Type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: isFormData ? (body as BodyInit) : body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const errorMessage = data?.error || res.statusText;
    throw new Error(errorMessage);
  }

  return data as TResponse;
}

export { API_URL };
