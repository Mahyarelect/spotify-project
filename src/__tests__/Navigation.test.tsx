import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { en } from "@/lib/i18n/translations/en";
import { I18nProvider } from "@/lib/i18n/useTranslation";
import { getNavigationItems } from "@/components/layout/navItems";
import { TopNav } from "@/components/layout/TopNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { RoleRoute } from "@/components/routing/RoleRoute";
import { makeUser } from "./apiFixtures";

const state = vi.hoisted(() => ({
  user: null as ReturnType<typeof makeUser> | null,
  loading: false,
  logout: vi.fn(),
}));

vi.mock("@/lib/hooks/useAuth", () => ({ useAuth: () => state }));

function roleUser(role: "listener" | "artist" | "support" | "admin") {
  const user = makeUser();
  user.role = role;
  return user;
}

describe("role-aware navigation", () => {
  beforeEach(() => {
    state.user = null;
    state.loading = false;
    state.logout.mockReset().mockResolvedValue(undefined);
    document.body.style.overflow = "";
  });

  it.each([
    ["artist", "Artist Dashboard", "/artist-dashboard"],
    ["support", "Support Dashboard", "/support-dashboard"],
    ["admin", "Admin Dashboard", "/admin-dashboard"],
  ] as const)("builds the correct %s dashboard item", (role, label, route) => {
    const items = getNavigationItems(roleUser(role), en);
    expect(items).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "route", label, to: route }),
      expect.objectContaining({ kind: "action", label: "Sign Out", action: "logout" }),
    ]));
  });

  it("does not provide a dashboard item to listeners", () => {
    const items = getNavigationItems(roleUser("listener"), en);
    expect(items.some((item) => item.label.includes("Dashboard"))).toBe(false);
    expect(items.some((item) => item.label === "Subscription")).toBe(true);
  });

  it.each(["artist", "support", "admin"] as const)(
    "does not expose listener subscription navigation to %s",
    (role) => {
      const items = getNavigationItems(roleUser(role), en);
      expect(items.some((item) => item.label === "Subscription")).toBe(false);
    },
  );

  it("uses complementary mobile and desktop breakpoint classes", () => {
    state.user = roleUser("listener");
    const view = render(
      <I18nProvider language="en" setLanguage={async () => undefined}>
        <MemoryRouter>
          <TopNav />
          <Sidebar />
        </MemoryRouter>
      </I18nProvider>,
    );

    expect(screen.getByRole("button", { name: "Open navigation menu" })).toHaveClass("md:hidden");
    expect(view.container.querySelector("aside")).toHaveClass("hidden", "md:block");
  });

  it("shows the same support dashboard and logout actions in the mobile drawer", async () => {
    state.user = roleUser("support");
    const user = userEvent.setup();
    render(
      <I18nProvider language="en" setLanguage={async () => undefined}>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<TopNav />} />
            <Route path="/login" element={<div>Login destination</div>} />
          </Routes>
        </MemoryRouter>
      </I18nProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open navigation menu" }));
    const drawer = screen.getByRole("dialog", { name: "Primary navigation" });
    expect(within(drawer).getByRole("button", { name: "Close navigation menu" })).toHaveFocus();
    expect(drawer).toHaveClass("left-0");
    expect(drawer).not.toHaveClass("right-0");
    expect(document.body.style.overflow).toBe("hidden");
    expect(drawer).toHaveTextContent("Support Dashboard");
    expect(drawer).toHaveTextContent("Sign Out");
    expect(within(drawer).getAllByText("Support Dashboard")).toHaveLength(1);

    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(within(drawer).getByRole("button", { name: "Sign Out" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    const openMenu = screen.getByRole("button", { name: "Open navigation menu" });
    expect(openMenu).toHaveFocus();
    await user.click(openMenu);
    await user.click(screen.getByRole("button", { name: "Sign Out" }));
    await waitFor(() => expect(state.logout).toHaveBeenCalled());
    expect(await screen.findByText("Login destination")).toBeInTheDocument();
  });

  it("shows complete listener actions and closes on backdrop interaction", async () => {
    state.user = roleUser("listener");
    const user = userEvent.setup();
    render(
      <I18nProvider language="en" setLanguage={async () => undefined}>
        <MemoryRouter>
          <TopNav />
        </MemoryRouter>
      </I18nProvider>,
    );

    const trigger = screen.getByRole("button", { name: "Open navigation menu" });
    await user.click(trigger);
    const drawer = screen.getByRole("dialog", { name: "Primary navigation" });
    expect(drawer).toHaveTextContent("Profile");
    expect(drawer).toHaveTextContent("Settings");
    expect(drawer).toHaveTextContent("Subscription");
    expect(drawer).toHaveTextContent("Sign Out");
    expect(drawer.textContent).not.toContain("Dashboard");

    fireEvent.mouseDown(drawer.parentElement as HTMLElement);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("places the Persian drawer physically right with translated controls", async () => {
    state.user = roleUser("admin");
    const user = userEvent.setup();
    render(
      <I18nProvider language="fa" setLanguage={async () => undefined}>
        <MemoryRouter>
          <TopNav />
        </MemoryRouter>
      </I18nProvider>,
    );

    await user.click(screen.getByRole("button", { name: "باز کردن منوی پیمایش" }));
    const drawer = screen.getByRole("dialog", { name: "پیمایش اصلی" });

    expect(drawer).toHaveAttribute("dir", "rtl");
    expect(drawer).toHaveClass("right-0");
    expect(drawer).not.toHaveClass("left-0");
    expect(within(drawer).getAllByText("داشبورد مدیر")).toHaveLength(1);
    expect(drawer).toHaveTextContent("پروفایل");
    expect(drawer).toHaveTextContent("تنظیمات");
    expect(drawer).toHaveTextContent("خروج");
  });

  it("closes the drawer after route navigation and restores the hamburger", async () => {
    state.user = roleUser("listener");
    const user = userEvent.setup();
    render(
      <I18nProvider language="en" setLanguage={async () => undefined}>
        <MemoryRouter initialEntries={["/settings"]}>
          <TopNav />
          <Routes>
            <Route path="/" element={<div>Home destination</div>} />
            <Route path="/settings" element={<div>Settings destination</div>} />
          </Routes>
        </MemoryRouter>
      </I18nProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Open navigation menu" }));
    const drawer = screen.getByRole("dialog", { name: "Primary navigation" });
    await user.click(within(drawer).getByRole("link", { name: "Home" }));

    expect(await screen.findByText("Home destination")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open navigation menu" })).toHaveFocus();
  });

  it("redirects a support user away from the admin-only route", async () => {
    state.user = roleUser("support");
    render(
      <I18nProvider language="en" setLanguage={async () => undefined}>
        <MemoryRouter initialEntries={["/admin-dashboard"]}>
          <Routes>
            <Route element={<RoleRoute allow={["admin"]} />}>
              <Route path="/admin-dashboard" element={<div>Admin secret</div>} />
            </Route>
            <Route path="/support-dashboard" element={<div>Support destination</div>} />
          </Routes>
        </MemoryRouter>
      </I18nProvider>,
    );

    expect(await screen.findByText("Support destination")).toBeInTheDocument();
    expect(screen.queryByText("Admin secret")).not.toBeInTheDocument();
  });
});
