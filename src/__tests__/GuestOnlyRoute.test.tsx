import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { GuestOnlyRoute } from "@/components/routing/GuestOnlyRoute";
import { AuthProvider } from "@/lib/context/AuthContext";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { authenticate } from "./apiFixtures";

function renderGuestOnly() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider>
        <LanguageProvider>
          <Routes>
            <Route element={<GuestOnlyRoute />}>
              <Route path="/login" element={<div>Login Page</div>} />
            </Route>
            <Route path="/" element={<div>Home Page</div>} />
          </Routes>
        </LanguageProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("GuestOnlyRoute", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders children when not authenticated", async () => {
    renderGuestOnly();
    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });

  it("redirects authenticated user away from login", async () => {
    authenticate();
    renderGuestOnly();
    expect(await screen.findByText("Home Page")).toBeInTheDocument();
  });
});
