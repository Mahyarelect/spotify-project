import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/lib/hooks/useAuth";
import { ROUTES } from "@/lib/constants/routes";
import { privateNavItems, publicNavItems } from "./navItems";

function desktopNavClass({ isActive }: { isActive: boolean }) {
  return [
    "rounded-full px-3 py-2 text-sm font-medium transition",
    isActive ? "bg-green-500 text-black" : "text-zinc-300 hover:bg-zinc-800 hover:text-white",
  ].join(" ");
}

function mobileNavClass({ isActive }: { isActive: boolean }) {
  return [
    "w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition",
    isActive ? "bg-green-500 text-black" : "text-zinc-300 hover:bg-zinc-800 hover:text-white",
  ].join(" ");
}

export function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = user ? privateNavItems : publicNavItems;

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
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to={ROUTES.HOME} className="text-xl font-bold text-green-400">
          Music App
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={desktopNavClass}>
              {item.label}
            </NavLink>
          ))}

          {user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              Sign Out
            </button>
          ) : null}
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 text-zinc-100 transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 md:hidden"
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {isMobileMenuOpen ? (
        <nav id="mobile-navigation" className="border-t border-zinc-800 px-4 py-3 md:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={mobileNavClass}>
                {item.label}
              </NavLink>
            ))}

            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
              >
                Sign Out
              </button>
            ) : null}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
