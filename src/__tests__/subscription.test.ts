import { describe, it, expect, beforeEach } from "vitest";
import { upgradePlan } from "@/lib/services/userService";
import { mockHashPassword } from "@/lib/services/password";
import { STORAGE_KEYS } from "@/lib/services/storage";

function setupUser() {
  const mockUsers = [
    {
      id: "u1",
      email: "test@example.com",
      passwordHash: mockHashPassword("Password123!"),
      displayName: "Test User",
      username: "test",
      role: "listener" as const,
      birthDate: "1995-01-01",
      gender: "male" as const,
      avatarUrl: null,
      planTier: "free" as const,
      planRenewsAt: null,
      followers: [],
      following: [],
      notificationLimits: {
        newReleasesFromFollowed: true,
        subscriptionExpiry: true,
        ticketUpdates: false,
      },
      soundEnabled: true,
      language: "en" as const,
      createdAt: "2025-01-01T00:00:00Z",
    },
  ];
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(mockUsers));
}

describe("subscription upgrade", () => {
  beforeEach(() => {
    localStorage.clear();
    setupUser();
  });

  it("sets later renewal date for 3 months than 1 month", async () => {
    setupUser();
    const user1 = await upgradePlan("u1", "silver", 1);
    const renews1 = new Date(user1.planRenewsAt!);

    setupUser();
    const user3 = await upgradePlan("u1", "silver", 3);
    const renews3 = new Date(user3.planRenewsAt!);

    expect(renews3.getTime()).toBeGreaterThan(renews1.getTime());
  });

  it("rejects free user avatar change in updateProfile", async () => {
    const { updateProfile } = await import("@/lib/services/userService");
    const updated = await updateProfile("u1", { avatarUrl: "http://evil.com/photo.jpg" });
    expect(updated.avatarUrl).toBeNull();
  });
});
