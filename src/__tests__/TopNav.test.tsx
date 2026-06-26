import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TopNav } from "@/components/layout/TopNav";
import { AuthProvider } from "@/lib/context/AuthContext";
import { STORAGE_KEYS } from "@/lib/services/storage";
import { mockHashPassword } from "@/lib/services/password";

function renderNav() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <TopNav />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("TopNav", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows Sign In and Register when logged out", async () => {
    renderNav();
    expect(await screen.findByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Register")).toBeInTheDocument();
  });

  it("shows Profile, Subscription, Settings, Sign Out when logged in", async () => {
    const mockUsers = [
      {
        id: "u1",
        email: "test@example.com",
        passwordHash: mockHashPassword("Password123!"),
        displayName: "Test User",
        username: "test",
        role: "listener",
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
    renderNav();
    expect(await screen.findByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Subscription")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Sign Out")).toBeInTheDocument();
  });
});
