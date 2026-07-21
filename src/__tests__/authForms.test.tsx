import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ArtistRegisterForm } from "@/components/auth/ArtistRegisterForm";
import { ApiError } from "@/lib/api/apiError";
import * as authService from "@/lib/services/authService";

const auth = vi.hoisted(() => ({
  login: vi.fn(),
  registerListener: vi.fn(),
}));

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: auth.login,
    registerListener: auth.registerListener,
    logout: vi.fn(),
    refreshUser: vi.fn(),
  }),
}));

describe("API-backed authentication forms", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    auth.login.mockReset();
    auth.registerListener.mockReset();
  });

  it("redirects login according to the backend user role", async () => {
    auth.login.mockResolvedValue({ role: "admin" });
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/admin-dashboard" element={<div>Admin destination</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Email"), "admin@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Admin destination")).toBeInTheDocument();
  });

  it("maps backend registration field errors into the form", async () => {
    auth.registerListener.mockRejectedValue(new ApiError(400, {
      error: {
        code: "validation_error",
        message: "Please correct the highlighted fields.",
        fields: { email: ["Backend email error."] },
      },
    }));
    const user = userEvent.setup();
    render(<MemoryRouter><RegisterForm /></MemoryRouter>);

    await user.type(screen.getByLabelText("Display Name"), "Listener");
    await user.type(screen.getByLabelText("Email"), "listener@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.type(screen.getByLabelText("Confirm Password"), "Password123!");
    await user.type(screen.getByLabelText("Birth Date"), "2000-04-20");
    await user.selectOptions(screen.getByRole("combobox"), "other");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByText("Backend email error.")).toBeInTheDocument();
  });

  it("shows the pending state after an artist application is accepted", async () => {
    vi.spyOn(authService, "registerArtist").mockResolvedValue({
      id: "application-id",
      status: "pending",
      submittedAt: "2026-07-21T00:00:00Z",
    });
    const user = userEvent.setup();
    render(<MemoryRouter><ArtistRegisterForm /></MemoryRouter>);

    await user.type(screen.getByLabelText("Email"), "artist@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.type(screen.getByLabelText("Confirm Password"), "Password123!");
    await user.type(screen.getByLabelText("Artist / Stage Name"), "Artist");
    await user.type(screen.getByLabelText("Portfolio URL"), "https://example.com/portfolio");
    await user.click(screen.getByRole("button", { name: "Submit Application" }));

    expect(await screen.findByText("Application Submitted")).toBeInTheDocument();
  });
});
