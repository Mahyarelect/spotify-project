import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/lib/context/AuthContext";
import { RoleGuard } from "@/components/ui/RoleGuard";
import { STORAGE_KEYS } from "@/lib/services/storage";
import type { Role } from "@/types/user";

function seedUser(role: Role) {
  const mockUsers = [
    {
      id: "u1",
      email: "test@example.com",
      passwordHash: "hash",
      displayName: "Test User",
      username: "testuser",
      role,
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
  localStorage.setItem(STORAGE_KEYS.currentSessionUserId, "u1");
}

function renderGuard(allow: Role[], fallbackText?: string) {
  render(
    <MemoryRouter>
      <AuthProvider>
        <RoleGuard
          allow={allow}
          fallback={fallbackText ? <div>{fallbackText}</div> : undefined}
        >
          <div>Secret Content</div>
        </RoleGuard>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("RoleGuard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders children when user role is allowed", async () => {
    seedUser("admin");
    renderGuard(["admin", "support"]);

    const content = await screen.findByText("Secret Content");
    expect(content).toBeInTheDocument();
  });

  it("blocks children when user role is not allowed", async () => {
    seedUser("listener");
    renderGuard(["admin", "support"]);

    expect(screen.queryByText("Secret Content")).not.toBeInTheDocument();
  });

  it("shows fallback when user role is not allowed", async () => {
    seedUser("listener");
    renderGuard(["admin"], "Access Denied");

    const fallback = await screen.findByText("Access Denied");
    expect(fallback).toBeInTheDocument();
    expect(screen.queryByText("Secret Content")).not.toBeInTheDocument();
  });

  it("blocks children when no user is authenticated", async () => {
    renderGuard(["admin"]);

    expect(screen.queryByText("Secret Content")).not.toBeInTheDocument();
  });

  it("shows fallback when no user is authenticated", async () => {
    renderGuard(["admin"], "Please log in");

    const fallback = await screen.findByText("Please log in");
    expect(fallback).toBeInTheDocument();
  });
});
