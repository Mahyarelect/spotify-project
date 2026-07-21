import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteAccount,
  followUser,
  getCurrentUser,
  getUserByUsername,
  unfollowUser,
  updateProfile,
} from "@/lib/services/userService";
import { jsonResponse, makeUserDto } from "./apiFixtures";

const publicProfile = {
  id: "22222222-2222-4222-8222-222222222222",
  username: "artist",
  display_name: "Artist",
  avatar_url: null,
  bio: "Bio",
  role: "artist" as const,
  artist_verified: true,
  plan: "gold" as const,
  followers_count: 10,
  following_count: 2,
  is_following: true,
};

describe("userService", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("does not request /me when no session token exists", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(getCurrentUser()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps the private /me response without exposing password data", async () => {
    sessionStorage.setItem("musicapp_access_token", "access");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(makeUserDto()));

    const user = await getCurrentUser();

    expect(user?.displayName).toBe("Test User");
    expect(user?.subscription.limits.dailyStreamLimit).toBe(60);
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("maps public profiles and keeps private fields absent", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(publicProfile));

    const profile = await getUserByUsername("artist");

    expect(profile.isFollowing).toBe(true);
    expect(profile.followersCount).toBe(10);
    expect(profile).not.toHaveProperty("email");
  });

  it("uses idempotent username follow endpoints", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(publicProfile))
      .mockResolvedValueOnce(jsonResponse({ ...publicProfile, is_following: false }));

    await followUser("artist");
    await unfollowUser("artist");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/users/artist/follow/");
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe("POST");
    expect((fetchMock.mock.calls[1][1] as RequestInit).method).toBe("DELETE");
  });

  it("sends profile changes as multipart data", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(makeUserDto()));
    const avatar = new File(["image"], "avatar.png", { type: "image/png" });

    await updateProfile({ displayName: "Changed", bio: "Updated", avatar });

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(request.body).toBeInstanceOf(FormData);
    expect((request.body as FormData).get("display_name")).toBe("Changed");
    expect((request.body as FormData).get("avatar")).toBe(avatar);
    expect(new Headers(request.headers).has("Content-Type")).toBe(false);
  });

  it("requires the current password for account deletion", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    await deleteAccount("Password123!");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/users/me/",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ current_password: "Password123!" }),
      }),
    );
  });
});
