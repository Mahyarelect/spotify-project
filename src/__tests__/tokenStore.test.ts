import { beforeEach, describe, expect, it } from "vitest";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  clearTokens,
  getAccessToken,
  getRefreshToken,
} from "@/lib/api/tokenStore";

const legacyAccessKey = ["music", "app_access_token"].join("");
const legacyRefreshKey = ["music", "app_refresh_token"].join("");

describe("tokenStore namespace migration", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("moves legacy session tokens to the Spotify namespace", () => {
    sessionStorage.setItem(legacyAccessKey, "legacy-access");
    sessionStorage.setItem(legacyRefreshKey, "legacy-refresh");

    expect(getAccessToken()).toBe("legacy-access");
    expect(getRefreshToken()).toBe("legacy-refresh");
    expect(sessionStorage.getItem(ACCESS_TOKEN_KEY)).toBe("legacy-access");
    expect(sessionStorage.getItem(REFRESH_TOKEN_KEY)).toBe("legacy-refresh");
    expect(sessionStorage.getItem(legacyAccessKey)).toBeNull();
    expect(sessionStorage.getItem(legacyRefreshKey)).toBeNull();
  });

  it("keeps current tokens when both namespaces exist", () => {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, "current-access");
    sessionStorage.setItem(legacyAccessKey, "legacy-access");

    expect(getAccessToken()).toBe("current-access");
    expect(sessionStorage.getItem(legacyAccessKey)).toBeNull();
  });

  it("clears current and transitional legacy keys on logout", () => {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, "access");
    sessionStorage.setItem(REFRESH_TOKEN_KEY, "refresh");
    sessionStorage.setItem(legacyAccessKey, "legacy-access");
    sessionStorage.setItem(legacyRefreshKey, "legacy-refresh");

    clearTokens();

    expect(sessionStorage.length).toBe(0);
  });
});
