import { describe, it, expect, beforeEach } from "vitest";
import { followUser, unfollowUser, deleteAccount } from "@/lib/services/userService";
import { getUsers, STORAGE_KEYS } from "@/lib/services/storage";

function seedUsers() {
  const users = [
    {
      id: "u1",
      email: "alice@example.com",
      passwordHash: "hash",
      displayName: "Alice",
      username: "alice",
      role: "listener" as const,
      birthDate: "1995-01-01",
      gender: "female" as const,
      avatarUrl: null,
      planTier: "free" as const,
      planRenewsAt: null,
      followers: [],
      following: [],
      notificationLimits: { newReleasesFromFollowed: true, subscriptionExpiry: true, ticketUpdates: false },
      soundEnabled: true,
      language: "en" as const,
      createdAt: "2025-01-01T00:00:00Z",
    },
    {
      id: "u2",
      email: "bob@example.com",
      passwordHash: "hash",
      displayName: "Bob",
      username: "bob",
      role: "listener" as const,
      birthDate: "1995-01-01",
      gender: "male" as const,
      avatarUrl: null,
      planTier: "free" as const,
      planRenewsAt: null,
      followers: [],
      following: [],
      notificationLimits: { newReleasesFromFollowed: true, subscriptionExpiry: true, ticketUpdates: false },
      soundEnabled: true,
      language: "en" as const,
      createdAt: "2025-01-01T00:00:00Z",
    },
  ];
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

describe("userService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("cannot follow self", async () => {
    seedUsers();
    await expect(followUser("u1", "u1")).rejects.toThrow("Cannot follow yourself");
  });

  it("following same user twice does not duplicate IDs", async () => {
    seedUsers();
    await followUser("u1", "u2");
    await followUser("u1", "u2");
    const users = getUsers();
    const alice = users.find((u) => u.id === "u1")!;
    const bob = users.find((u) => u.id === "u2")!;
    expect(alice.following.filter((id) => id === "u2")).toHaveLength(1);
    expect(bob.followers.filter((id) => id === "u1")).toHaveLength(1);
  });

  it("unfollow removes both sides", async () => {
    seedUsers();
    await followUser("u1", "u2");
    await unfollowUser("u1", "u2");
    const users = getUsers();
    const alice = users.find((u) => u.id === "u1")!;
    const bob = users.find((u) => u.id === "u2")!;
    expect(alice.following).not.toContain("u2");
    expect(bob.followers).not.toContain("u1");
  });

  it("delete account removes user and session", async () => {
    seedUsers();
    localStorage.setItem(STORAGE_KEYS.currentSessionUserId, "u1");
    await deleteAccount("u1");
    const users = getUsers();
    expect(users.find((u) => u.id === "u1")).toBeUndefined();
    expect(localStorage.getItem(STORAGE_KEYS.currentSessionUserId)).toBeNull();
  });
});
