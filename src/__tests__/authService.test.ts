import { describe, it, expect, beforeEach } from "vitest";
import { login } from "@/lib/services/authService";
import { mockHashPassword } from "@/lib/services/password";
import { STORAGE_KEYS } from "@/lib/services/storage";

describe("authService.login", () => {
  beforeEach(() => {
    localStorage.clear();
    const mockUsers = [
      {
        id: "u1",
        email: "alice@example.com",
        passwordHash: mockHashPassword("Password123!"),
        displayName: "Alice",
        username: "alice",
        role: "listener",
        birthDate: "1995-03-15",
        gender: "female" as const,
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
  });

  it("accepts correct password", async () => {
    const result = await login("alice@example.com", "Password123!");
    expect(result.user.email).toBe("alice@example.com");
    expect(result.role).toBe("listener");
  });

  it("rejects wrong password with generic error", async () => {
    await expect(
      login("alice@example.com", "WrongPassword!")
    ).rejects.toThrow("Invalid email or password");
  });

  it("rejects unknown email with same generic error", async () => {
    await expect(
      login("unknown@example.com", "Password123!")
    ).rejects.toThrow("Invalid email or password");
  });
});
