import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/lib/context/AuthContext";
import { RoleGuard } from "@/components/ui/RoleGuard";
import type { Role } from "@/types/user";
import { authenticate } from "./apiFixtures";

function seedUser(role: Role) {
  authenticate(role);
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
    sessionStorage.clear();
    vi.restoreAllMocks();
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
