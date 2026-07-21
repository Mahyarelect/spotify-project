const ACCESS_TOKEN_KEY = "musicapp_access_token";
const REFRESH_TOKEN_KEY = "musicapp_refresh_token";

function storage(): Storage | null {
  return typeof window !== "undefined" && window.sessionStorage ? window.sessionStorage : null;
}

export function getAccessToken(): string | null {
  return storage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
}

export function getRefreshToken(): string | null {
  return storage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
}

export function setTokens(tokens: { access: string; refresh: string }): void {
  storage()?.setItem(ACCESS_TOKEN_KEY, tokens.access);
  storage()?.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
}

export function clearTokens(): void {
  storage()?.removeItem(ACCESS_TOKEN_KEY);
  storage()?.removeItem(REFRESH_TOKEN_KEY);
}

export function hasSessionTokens(): boolean {
  return Boolean(getAccessToken() || getRefreshToken());
}
