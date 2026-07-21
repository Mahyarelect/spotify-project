import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AVATAR_MAX_BYTES,
  validateAvatarFile,
} from "@/lib/validation/profileSchemas";
import {
  updateLanguage,
  updateNotificationPrefs,
  updateSoundEnabled,
} from "@/lib/services/settingsService";
import { jsonResponse } from "./apiFixtures";

const preferences = {
  new_releases_from_followed: true,
  subscription_expiry: false,
  ticket_updates: true,
  sound_enabled: true,
  language: "en" as const,
};

describe("avatar validation", () => {
  it("accepts supported image files up to 5 MB", () => {
    expect(validateAvatarFile(new File(["png"], "avatar.png", { type: "image/png" }))).toBeNull();
  });

  it("rejects unsupported types and oversized files before upload", () => {
    expect(validateAvatarFile(new File(["gif"], "avatar.gif", { type: "image/gif" })))
      .toContain("JPEG, PNG, and WebP");
    const oversized = new File([new Uint8Array(AVATAR_MAX_BYTES + 1)], "large.webp", { type: "image/webp" });
    expect(validateAvatarFile(oversized)).toContain("5 MB");
  });
});

describe("settingsService", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("persists notification preferences through the preferences endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(preferences));

    const saved = await updateNotificationPrefs({
      newReleasesFromFollowed: true,
      subscriptionExpiry: false,
      ticketUpdates: true,
    });

    expect(saved.subscriptionExpiry).toBe(false);
    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)).toEqual({
      new_releases_from_followed: true,
      subscription_expiry: false,
      ticket_updates: true,
    });
  });

  it("persists sound and language as separate partial updates", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ ...preferences, sound_enabled: false }))
      .mockResolvedValueOnce(jsonResponse({ ...preferences, language: "fa" }));

    await updateSoundEnabled(false);
    await updateLanguage("fa");

    expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)).toEqual({ sound_enabled: false });
    expect(JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string)).toEqual({ language: "fa" });
  });
});
