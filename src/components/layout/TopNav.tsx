import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, ChevronDown, Menu, User, X } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import { ROUTES } from "@/lib/constants/routes";
import { getUnreadCount } from "@/lib/services/notificationService";
import { getNavigationItems } from "./navItems";
import { useTranslation } from "@/lib/i18n/useTranslation";

const PROFILE_MENU_ROUTES = new Set<string>([
  ROUTES.PROFILE,
  ROUTES.SETTINGS,
  ROUTES.SUBSCRIPTION,
  ROUTES.ARTIST_DASHBOARD,
  ROUTES.SUPPORT_DASHBOARD,
  ROUTES.ADMIN_DASHBOARD,
]);

function routeClass({ isActive }: { isActive: boolean }) {
  return [
    "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
    isActive
      ? "bg-green-500/10 text-green-400"
      : "text-zinc-300 hover:bg-zinc-800 hover:text-white",
  ].join(" ");
}

export function TopNav() {
  const { user, logout } = useAuth();
  const { t, direction } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const items = useMemo(() => getNavigationItems(user, t), [t, user]);
  const unreadCount = user ? getUnreadCount(user.id) : 0;

  const profileItems = items.filter((item) =>
    item.kind === "action"
    || (item.kind === "route" && PROFILE_MENU_ROUTES.has(item.to)),
  );

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    document.body.style.overflow = "hidden";
    const focusable = () => Array.from(
      drawerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    focusable()[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      if (elements.length === 0) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      menuButton?.focus();
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!profileOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) setProfileOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [profileOpen]);

  async function handleLogout() {
    setMobileOpen(false);
    setProfileOpen(false);
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  }

  function renderItem(item: (typeof items)[number]) {
    const Icon = item.icon;
    if (item.kind === "action") {
      return (
        <button
          key={item.action}
          type="button"
          onClick={() => void handleLogout()}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
        >
          <Icon size={18} aria-hidden="true" />
          {item.label}
        </button>
      );
    }
    return (
      <NavLink key={item.to} to={item.to} end={item.end} className={routeClass}>
        <Icon size={18} aria-hidden="true" />
        {item.label}
      </NavLink>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to={ROUTES.HOME} className="text-xl font-bold text-green-400">
          {t.layout.appName}
        </Link>

        <div className="flex items-center gap-2">
          {user && (
            <>
              <Link
                to={ROUTES.NOTIFICATIONS}
                className="relative flex min-h-11 min-w-11 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
                aria-label={t.nav.notifications}
              >
                <Bell size={19} aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute end-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-green-500 px-1 text-[10px] font-bold text-black">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              <div ref={profileMenuRef} className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  aria-label={t.nav.openProfileMenu}
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                  className="flex min-h-11 items-center gap-2 rounded-full bg-zinc-800 py-1 pe-3 ps-1 transition hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700">
                      <User size={16} aria-hidden="true" className="text-zinc-300" />
                    </span>
                  )}
                  <span className="max-w-36 truncate text-sm font-medium text-zinc-100">{user.displayName}</span>
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={`transition ${profileOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {profileOpen && (
                  <div
                    role="menu"
                    className="absolute end-0 mt-2 w-64 rounded-xl border border-zinc-700 bg-zinc-900 p-2 shadow-2xl"
                  >
                    {profileItems.map(renderItem)}
                  </div>
                )}
              </div>
            </>
          )}

          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-zinc-700 text-zinc-100 transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500 md:hidden"
            aria-label={mobileOpen ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen && createPortal(
        <div
          className="fixed inset-0 z-50 bg-black/60 md:hidden"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMobileOpen(false);
          }}
        >
          <nav
            ref={drawerRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label={t.nav.primaryNavigation}
            dir={direction}
            className="absolute inset-y-0 w-[min(88vw,22rem)] overflow-y-auto bg-zinc-950 p-4 text-zinc-100 shadow-2xl [inset-inline-start:0]"
          >
            <div className="mb-4 flex items-center justify-between">
              <strong>{t.nav.menu}</strong>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label={t.nav.closeMenu}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="flex flex-col gap-1">{items.map(renderItem)}</div>
          </nav>
        </div>,
        document.body,
      )}
    </header>
  );
}
