import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiRequest,
  resetHttpClientForTests,
} from "@/lib/api/httpClient";
import { ApiError } from "@/lib/api/apiError";
import { jsonResponse } from "./apiFixtures";

describe("httpClient", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    resetHttpClientForTests();
  });

  it("attaches the access token and parses JSON", async () => {
    sessionStorage.setItem("musicapp_access_token", "access-token");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ ok: true }));

    await expect(apiRequest<{ ok: boolean }>("health/")).resolves.toEqual({ ok: true });

    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer access-token");
  });

  it("returns undefined for a 204 response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    await expect(apiRequest<void>("resource/", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("performs one shared refresh for concurrent 401 responses and retries once", async () => {
    sessionStorage.setItem("musicapp_access_token", "expired-access");
    sessionStorage.setItem("musicapp_refresh_token", "refresh-token");
    let refreshCalls = 0;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith("auth/token/refresh/")) {
        refreshCalls += 1;
        return jsonResponse({ access: "fresh-access" });
      }
      const authorization = new Headers(init?.headers).get("Authorization");
      return authorization === "Bearer fresh-access"
        ? jsonResponse({ url })
        : jsonResponse({ error: { code: "token_not_valid", message: "Token is invalid." } }, 401);
    });

    const results = await Promise.all([
      apiRequest<{ url: string }>("first/"),
      apiRequest<{ url: string }>("second/"),
    ]);

    expect(results).toHaveLength(2);
    expect(refreshCalls).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(sessionStorage.getItem("musicapp_access_token")).toBe("fresh-access");
  });

  it("throws structured backend errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        error: {
          code: "validation_error",
          message: "Please correct the highlighted fields.",
          fields: { email: ["Enter a valid email address."] },
        },
      }, 400),
    );

    const failure = apiRequest("resource/");
    await expect(failure).rejects.toBeInstanceOf(ApiError);
    await expect(failure).rejects.toMatchObject({
      status: 400,
      code: "validation_error",
      fields: { email: ["Enter a valid email address."] },
    });
  });
});
