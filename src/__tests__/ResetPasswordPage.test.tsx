import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import { ApiError } from "@/lib/api/apiError";
import * as authService from "@/lib/services/authService";

function renderPage(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ResetPasswordPage", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("shows a controlled invalid-link state when query parameters are missing", () => {
    renderPage("/reset-password");
    expect(screen.getByRole("alert")).toHaveTextContent("incomplete");
    expect(screen.getByRole("link", { name: "Request another reset link" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });

  it("submits a valid token and presents a login link without auto-login", async () => {
    const confirm = vi.spyOn(authService, "confirmPasswordReset").mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage("/reset-password?uid=user-id&token=reset-token");

    await user.type(screen.getByLabelText("New password"), "NewPassword123!");
    await user.type(screen.getByLabelText("Confirm new password"), "NewPassword123!");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(confirm).toHaveBeenCalledWith({
      uid: "user-id",
      token: "reset-token",
      password: "NewPassword123!",
      confirmPassword: "NewPassword123!",
    });
    expect(await screen.findByText("Password updated")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to sign in" })).toHaveAttribute("href", "/login");
  });

  it("maps invalid tokens and weak passwords to translated UI states", async () => {
    vi.spyOn(authService, "confirmPasswordReset")
      .mockRejectedValueOnce(new ApiError(400, {
        error: { code: "invalid_reset_token", message: "Invalid token." },
      }))
      .mockRejectedValueOnce(new ApiError(400, {
        error: {
          code: "validation_error",
          message: "Invalid.",
          fields: { password: ["This password is too common."] },
        },
      }));
    const user = userEvent.setup();
    renderPage("/reset-password?uid=user-id&token=reset-token");

    const password = screen.getByLabelText("New password");
    const confirmation = screen.getByLabelText("Confirm new password");
    await user.type(password, "NewPassword123!");
    await user.type(confirmation, "NewPassword123!");
    await user.click(screen.getByRole("button", { name: "Reset password" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("invalid or has expired");

    await user.click(screen.getByRole("button", { name: "Reset password" }));
    expect(await screen.findByText("This password is too common.")).toBeInTheDocument();
    expect(password).toHaveAttribute("aria-invalid", "true");
  });
});
