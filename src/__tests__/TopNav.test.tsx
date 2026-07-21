import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TopNav } from "@/components/layout/TopNav";
import { AuthProvider } from "@/lib/context/AuthContext";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { authenticate } from "./apiFixtures";

function renderNav() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LanguageProvider>
          <TopNav />
        </LanguageProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("TopNav", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("shows the app logo", async () => {
    renderNav();
    expect(await screen.findByText("Music App")).toBeInTheDocument();
  });

  it("shows user display name when logged in", async () => {
    authenticate();
    renderNav();
    expect(await screen.findByText("Test User")).toBeInTheDocument();
  });
});
