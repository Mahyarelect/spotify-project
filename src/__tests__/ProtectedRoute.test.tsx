import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/routing/ProtectedRoute";
import { AuthProvider } from "@/lib/context/AuthContext";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { STORAGE_KEYS } from "@/lib/services/storage";

function TestApp({ authenticated = false }: { authenticated?: boolean }) {
  return (
    <MemoryRouter initialEntries={authenticated ? ["/protected"] : ["/protected"]}>
      <AuthProvider>
        <LanguageProvider>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/protected" element={<div>Protected Content</div>} />
            </Route>
          </Routes>
        </LanguageProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("redirects unauthenticated user to /login", async () => {
    render(<TestApp />);
    const loginText = await screen.findByText("Login Page");
    expect(loginText).toBeInTheDocument();
  });

  it("renders children when authenticated", async () => {
    const mockUsers = [
      {
        id: "u1",
        email: "test@example.com",
        passwordHash: "hash",
        displayName: "Test",
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
    render(<TestApp authenticated />);
    const content = await screen.findByText("Protected Content");
    expect(content).toBeInTheDocument();
  });
});
