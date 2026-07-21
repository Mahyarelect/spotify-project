import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/routing/ProtectedRoute";
import { AuthProvider } from "@/lib/context/AuthContext";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { authenticate } from "./apiFixtures";

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
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("redirects unauthenticated user to /login", async () => {
    render(<TestApp />);
    const loginText = await screen.findByText("Login Page");
    expect(loginText).toBeInTheDocument();
  });

  it("renders children when authenticated", async () => {
    authenticate();
    render(<TestApp authenticated />);
    const content = await screen.findByText("Protected Content");
    expect(content).toBeInTheDocument();
  });
});
