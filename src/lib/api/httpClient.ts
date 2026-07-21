import { ApiError, type ApiErrorPayload } from "./apiError";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./tokenStore";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, "");
export const AUTH_EXPIRED_EVENT = "musicapp:auth-expired";

interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

interface TokenRefreshResponse {
  access: string;
  refresh?: string;
}

let refreshPromise: Promise<void> | null = null;

function apiUrl(path: string): string {
  return `${API_BASE_URL}/${path.replace(/^\//, "")}`;
}

async function parseError(response: Response): Promise<ApiError> {
  let payload: ApiErrorPayload;
  try {
    payload = (await response.json()) as ApiErrorPayload;
    if (!payload?.error?.message) throw new Error("Invalid API error response");
  } catch {
    payload = {
      error: {
        code: "request_failed",
        message: response.statusText || "Request failed.",
      },
    };
  }
  return new ApiError(response.status, payload);
}

function notifyAuthExpired(): void {
  clearTokens();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
  }
}

async function refreshTokens(): Promise<void> {
  if (refreshPromise) return refreshPromise;
  const refresh = getRefreshToken();
  if (!refresh) {
    notifyAuthExpired();
    throw new ApiError(401, { error: { code: "session_expired", message: "Your session has expired." } });
  }

  refreshPromise = (async () => {
    const response = await fetch(apiUrl("auth/token/refresh/"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!response.ok) {
      notifyAuthExpired();
      throw await parseError(response);
    }
    const tokens = (await response.json()) as TokenRefreshResponse;
    setTokens({ access: tokens.access, refresh: tokens.refresh ?? refresh });
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
  alreadyRetried = false,
): Promise<T> {
  const { skipAuth = false, skipRefresh = false, headers: suppliedHeaders, ...requestOptions } = options;
  const headers = new Headers(suppliedHeaders);
  const access = getAccessToken();
  if (!skipAuth && access) headers.set("Authorization", `Bearer ${access}`);
  if (requestOptions.body && !(requestOptions.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(apiUrl(path), { ...requestOptions, headers });
  if (response.status === 401 && !skipRefresh && !alreadyRetried && getRefreshToken()) {
    await refreshTokens();
    return apiRequest<T>(path, options, true);
  }
  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function resetHttpClientForTests(): void {
  refreshPromise = null;
}
