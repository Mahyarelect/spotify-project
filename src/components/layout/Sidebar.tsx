import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { ROUTES } from "@/lib/constants/routes";
import { getNavigationItems } from "./navItems";

function navClass({ isActive }: { isActive: boolean }) {
  return [
    "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-green-500/10 text-green-400"
      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
  ].join(" ");
}

export function Sidebar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = getNavigationItems(user, t);

  async function handleLogout() {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  }

  return (
    <aside className="hidden w-60 shrink-0 bg-zinc-950 [border-inline-end:1px_solid_rgb(39_39_42)] md:block">
      <nav aria-label={t.nav.primaryNavigation} className="flex h-full flex-col gap-1 p-4">
        {items.map((item) => {
          const Icon = item.icon;
          if (item.kind === "action") {
            return (
              <button
                key={item.action}
                type="button"
                onClick={() => void handleLogout()}
                className="mt-auto flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-start text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
              >
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </button>
            );
          }
          return (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
              <Icon size={18} aria-hidden="true" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
