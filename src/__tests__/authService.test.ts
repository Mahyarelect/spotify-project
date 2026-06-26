import { describe, it, expect, beforeEach } from "vitest";
import { login, logout, registerListener } from "@/lib/services/authService";
import { STORAGE_KEYS } from "@/lib/services/storage";

beforeEach(() => {
  localStorage.clear();
});

it("allows a newly registered listener to log in again after logout", async () => {
  const registered = await registerListener({
    displayName: "New Listener",
    email: "New.Listener@Example.COM ",
    password: "Password123!",
    birthDate: "1998-04-20",
    gender: "other",
  });

  expect(registered.role).toBe("listener");
  expect(localStorage.getItem(STORAGE_KEYS.currentSessionUserId)).toBe(registered.id);

  await logout();
  expect(localStorage.getItem(STORAGE_KEYS.currentSessionUserId)).toBeNull();

  const result = await login("new.listener@example.com", "Password123!");
  expect(result.user.id).toBe(registered.id);
  expect(result.role).toBe("listener");
  expect(localStorage.getItem(STORAGE_KEYS.currentSessionUserId)).toBe(registered.id);
});

it("rejects duplicate listener registration case-insensitively", async () => {
  await registerListener({
    displayName: "First User",
    email: "Test@Example.com",
    password: "Password123!",
    birthDate: "1995-01-01",
    gender: "male",
  });

  await expect(
    registerListener({
      displayName: "Second User",
      email: "test@example.com",
      password: "Password123!",
      birthDate: "1995-01-01",
      gender: "female",
    })
  ).rejects.toThrow("Email already exists");
});

it("rejects artist registration with existing user email", async () => {
  await registerListener({
    displayName: "Existing User",
    email: "existing@example.com",
    password: "Password123!",
    birthDate: "1995-01-01",
    gender: "male",
  });

  const { registerArtist } = await import("@/lib/services/authService");
  await expect(
    registerArtist({
      email: "existing@example.com",
      password: "Password123!",
      artistName: "Test Artist",
      portfolioUrl: "https://example.com",
    })
  ).rejects.toThrow("An account with this email already exists");
});

describe("authService.login", () => {
  beforeEach(() => {
    localStorage.clear();
    const mockUsers = [
      {
        id: "u1",
        email: "alice@example.com",
        passwordHash: "mock-hash:placeholder",
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
