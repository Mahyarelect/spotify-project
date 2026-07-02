import { useEffect, useState } from "react";
import { Menu, X, User, Bell } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/lib/hooks/useAuth";
import { ROUTES } from "@/lib/constants/routes";
import { getUnreadCount } from "@/lib/services/notificationService";
import { getSidebarNavItems } from "./navItems";
import { NavLink } from "react-router-dom";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function TopNav() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sidebarNavItems = getSidebarNavItems(t);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  const handleSignOut = () => {
    setIsMobileMenuOpen(false);
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to={ROUTES.HOME} className="text-xl font-bold text-green-400">
          {t.layout.appName}
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to={ROUTES.NOTIFICATIONS}
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
                aria-label={t.nav.notifications}
              >
                <Bell size={18} />
                {getUnreadCount(user.id) > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-green-500 px-1 text-[10px] font-bold text-black">
                    {getUnreadCount(user.id) > 9 ? "9+" : getUnreadCount(user.id)}
                  </span>
                )}
              </Link>
              <Link
                to={ROUTES.PROFILE}
                className="flex items-center gap-2 rounded-full bg-zinc-800 py-1 pl-1 pr-3 transition hover:bg-zinc-700"
              >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700">
                  <User size={14} className="text-zinc-400" />
                </div>
              )}
              <span className="text-sm font-medium text-zinc-200">
                {user.displayName}
              </span>
            </Link>
            </>
          ) : null}

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 text-zinc-100 transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 md:hidden"
            aria-label={
              isMobileMenuOpen ? t.nav.closeMenu : t.nav.openMenu
            }
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <nav
          id="mobile-navigation"
          className="border-t border-zinc-800 px-4 py-3 md:hidden"
        >
          <div className="flex flex-col gap-1">
            {sidebarNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    "rounded-lg px-3 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-green-500/10 text-green-400"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}

            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-1 rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
              >
                {t.nav.signOut}
              </button>
            ) : null}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
