export const ACCESS_TOKEN_KEY = "spotify_access_token";
export const REFRESH_TOKEN_KEY = "spotify_refresh_token";

const LEGACY_ACCESS_TOKEN_KEY = ["music", "app_access_token"].join("");
const LEGACY_REFRESH_TOKEN_KEY = ["music", "app_refresh_token"].join("");

function migrateLegacyTokens(store: Storage): void {
  for (const [currentKey, legacyKey] of [
    [ACCESS_TOKEN_KEY, LEGACY_ACCESS_TOKEN_KEY],
    [REFRESH_TOKEN_KEY, LEGACY_REFRESH_TOKEN_KEY],
  ] as const) {
    const legacyValue = store.getItem(legacyKey);
    if (store.getItem(currentKey) === null && legacyValue !== null) {
      store.setItem(currentKey, legacyValue);
    }
    store.removeItem(legacyKey);
  }
}

function storage(): Storage | null {
  if (typeof window === "undefined" || !window.sessionStorage) return null;
  migrateLegacyTokens(window.sessionStorage);
  return window.sessionStorage;
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
  const store = storage();
  store?.removeItem(ACCESS_TOKEN_KEY);
  store?.removeItem(REFRESH_TOKEN_KEY);
  store?.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  store?.removeItem(LEGACY_REFRESH_TOKEN_KEY);
}

export function hasSessionTokens(): boolean {
  return Boolean(getAccessToken() || getRefreshToken());
}
