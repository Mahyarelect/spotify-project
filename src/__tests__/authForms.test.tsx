import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ArtistRegisterForm } from "@/components/auth/ArtistRegisterForm";
import { ApiError } from "@/lib/api/apiError";
import * as authService from "@/lib/services/authService";
import { I18nProvider } from "@/lib/i18n/useTranslation";
import type { ReactNode } from "react";

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

function renderLocalized(component: ReactNode, language: "en" | "fa" = "en") {
  return render(
    <I18nProvider language={language} setLanguage={async () => undefined}>
      <MemoryRouter>{component}</MemoryRouter>
    </I18nProvider>,
  );
}

async function fillListenerForm(user: ReturnType<typeof userEvent.setup>, password = "Password123!") {
  await user.type(screen.getByLabelText(/Display Name|نام نمایشی/), "Listener");
  await user.type(screen.getByLabelText(/^Email$|^ایمیل$/), "listener@example.com");
  await user.type(screen.getByLabelText(/^Password$|^رمز عبور$/), password);
  await user.type(screen.getByLabelText(/Confirm Password|تأیید رمز عبور/), password);
  await user.type(screen.getByLabelText(/Birth Date|تاریخ تولد/), "2000-04-20");
  await user.selectOptions(screen.getByRole("combobox"), "other");
  await user.click(screen.getByRole("checkbox"));
}

async function fillArtistForm(user: ReturnType<typeof userEvent.setup>, password = "Password123!") {
  await user.type(screen.getByLabelText(/^Email$|^ایمیل$/), "artist@example.com");
  await user.type(screen.getByLabelText(/^Password$|^رمز عبور$/), password);
  await user.type(screen.getByLabelText(/Confirm Password|تأیید رمز عبور/), password);
  await user.type(screen.getByLabelText(/Artist \/ Stage Name|نام هنری/), "Artist");
  await user.type(screen.getByLabelText(/Portfolio URL|آدرس نمونه کار/), "https://example.com/portfolio");
}

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

  it("returns to a protected listening-room invite after login", async () => {
    auth.login.mockResolvedValue({ role: "listener" });
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={[{
        pathname: "/login",
        state: { from: { pathname: "/listen/invite-123", search: "?shared=1", hash: "" } },
      }]}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/listen/:inviteCode" element={<div>Listening room destination</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Email"), "listener@example.com");
    await user.type(screen.getByLabelText("Password"), "Password123!");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Listening room destination")).toBeInTheDocument();
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
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-describedby");
  });

  it("focuses and visibly marks a weak listener password", async () => {
    const user = userEvent.setup();
    renderLocalized(<RegisterForm />);
    await fillListenerForm(user, "short");

    await user.click(screen.getByRole("button", { name: "Create Account" }));

    const password = screen.getByLabelText("Password");
    expect(password).toHaveFocus();
    expect(password).toHaveAttribute("aria-invalid", "true");
    expect(password).toHaveAttribute("aria-describedby", "password-error");
    expect(password).toHaveClass("border-red-500");
    expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
    expect(screen.getByText("Please correct the highlighted fields.")).toBeInTheDocument();
    expect(password).toHaveValue("short");
  });

  it("focuses and visibly marks a weak artist password", async () => {
    const user = userEvent.setup();
    renderLocalized(<ArtistRegisterForm />);
    await fillArtistForm(user, "short");

    await user.click(screen.getByRole("button", { name: "Submit Application" }));

    const password = screen.getByLabelText("Password");
    expect(password).toHaveFocus();
    expect(password).toHaveAttribute("aria-invalid", "true");
    expect(password).toHaveAttribute("aria-describedby", "password-error");
    expect(password).toHaveClass("border-red-500");
    expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
    expect(password).toHaveValue("short");
  });

  it("localizes a backend common-password error on the listener password field", async () => {
    auth.registerListener.mockRejectedValue(new ApiError(400, {
      error: {
        code: "validation_error",
        message: "Please correct the highlighted fields.",
        fields: { password: ["This password is too common."] },
      },
    }));
    const user = userEvent.setup();
    renderLocalized(<RegisterForm />, "fa");
    await fillListenerForm(user);

    await user.click(screen.getByRole("button", { name: "ایجاد حساب کاربری" }));

    const password = screen.getByLabelText("رمز عبور");
    expect(await screen.findByText("این رمز عبور بیش از حد رایج است.")).toBeInTheDocument();
    expect(password).toHaveFocus();
    expect(password).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("لطفاً فیلدهای مشخص‌شده را اصلاح کنید.")).toBeInTheDocument();
  });

  it("localizes a backend similarity error on the artist password field", async () => {
    vi.spyOn(authService, "registerArtist").mockRejectedValue(new ApiError(400, {
      error: {
        code: "validation_error",
        message: "Please correct the highlighted fields.",
        fields: { password: ["The password is too similar to the artist name."] },
      },
    }));
    const user = userEvent.setup();
    renderLocalized(<ArtistRegisterForm />, "fa");
    await fillArtistForm(user);

    await user.click(screen.getByRole("button", { name: "ارسال درخواست" }));

    const password = screen.getByLabelText("رمز عبور");
    expect(await screen.findByText("رمز عبور بیش از حد به اطلاعات حساب شما شبیه است."))
      .toBeInTheDocument();
    expect(password).toHaveFocus();
    expect(password).toHaveAttribute("aria-invalid", "true");
  });

  it("renders natural Persian privacy copy without toggling from the policy link", async () => {
    const user = userEvent.setup();
    renderLocalized(<RegisterForm />, "fa");
    const checkbox = screen.getByRole("checkbox");
    const agreement = document.getElementById("accept-policy-label");

    expect(agreement).toHaveTextContent("من سیاست حریم خصوصی را قبول می‌کنم.");
    expect(screen.getByLabelText("ایمیل")).toHaveAttribute("dir", "ltr");
    expect(screen.getByLabelText("رمز عبور")).toHaveAttribute("dir", "ltr");

    await user.click(screen.getByRole("button", { name: "سیاست حریم خصوصی" }));

    expect(checkbox).not.toBeChecked();
    expect(screen.getByRole("dialog", { name: "سیاست حریم خصوصی" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "بستن" }));
    await user.click(screen.getByText("من"));

    expect(checkbox).toBeChecked();
  });

  it("renders the complete Persian artist prompt with locale-owned punctuation", () => {
    renderLocalized(<LoginForm />, "fa");
    const link = screen.getByRole("link", { name: "به‌عنوان هنرمند ثبت‌نام کنید" });
    const prompt = link.closest("p");

    expect(prompt).toHaveTextContent("می‌خواهید به‌عنوان هنرمند ثبت‌نام کنید؟");
    expect(prompt?.textContent).not.toContain("?");
  });

  it("does not show a highlighted-fields summary for an unmapped server error", async () => {
    auth.registerListener.mockRejectedValue(new ApiError(503, {
      error: {
        code: "service_unavailable",
        message: "Service unavailable.",
      },
    }));
    const user = userEvent.setup();
    renderLocalized(<RegisterForm />);
    await fillListenerForm(user);

    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByText("Service unavailable.")).toBeInTheDocument();
    expect(screen.queryByText("Please correct the highlighted fields.")).not.toBeInTheDocument();
  });

  it("focuses and visibly marks the first invalid registration field", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><RegisterForm /></MemoryRouter>);

    await user.click(screen.getByRole("button", { name: "Create Account" }));

    const displayName = screen.getByLabelText("Display Name");
    expect(displayName).toHaveFocus();
    expect(displayName).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Please correct the highlighted fields.")).toBeInTheDocument();
  });

  it("keeps password values while showing a stable confirmation mismatch", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><RegisterForm /></MemoryRouter>);

    const password = screen.getByLabelText("Password");
    const confirmation = screen.getByLabelText("Confirm Password");
    await user.type(password, "Password123!");
    await user.type(confirmation, "Different123!");
    await user.tab();

    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
    await user.clear(password);
    await user.type(password, "AnotherPassword123!");
    expect(confirmation).toHaveValue("Different123!");
    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
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
