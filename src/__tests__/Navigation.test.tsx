import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { en } from "@/lib/i18n/translations/en";
import { I18nProvider } from "@/lib/i18n/useTranslation";
import { getNavigationItems } from "@/components/layout/navItems";
import { TopNav } from "@/components/layout/TopNav";
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
    expect(drawer).toHaveTextContent("Support Dashboard");
    expect(drawer).toHaveTextContent("Sign Out");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const openMenu = screen.getByRole("button", { name: "Open navigation menu" });
    expect(openMenu).toHaveFocus();
    await user.click(openMenu);
    await user.click(screen.getByRole("button", { name: "Sign Out" }));
    await waitFor(() => expect(state.logout).toHaveBeenCalled());
    expect(await screen.findByText("Login destination")).toBeInTheDocument();
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
