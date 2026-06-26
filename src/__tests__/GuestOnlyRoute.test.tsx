import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { GuestOnlyRoute } from "@/components/routing/GuestOnlyRoute";
import { AuthProvider } from "@/lib/context/AuthContext";
import { STORAGE_KEYS } from "@/lib/services/storage";
import { mockHashPassword } from "@/lib/services/password";

function renderGuestOnly() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider>
        <Routes>
          <Route element={<GuestOnlyRoute />}>
            <Route path="/login" element={<div>Login Page</div>} />
          </Route>
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("GuestOnlyRoute", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders children when not authenticated", async () => {
    renderGuestOnly();
    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });

  it("redirects authenticated user away from login", async () => {
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
    renderGuestOnly();
    expect(await screen.findByText("Home Page")).toBeInTheDocument();
  });
});
