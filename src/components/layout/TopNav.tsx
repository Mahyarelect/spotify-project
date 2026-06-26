import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/hooks/useAuth";
import { ROUTES } from "@/lib/constants/routes";

function navClass({ isActive }: { isActive: boolean }) {
  return [
    "rounded-full px-3 py-2 text-sm font-medium transition",
    isActive ? "bg-green-500 text-black" : "text-zinc-300 hover:bg-zinc-800 hover:text-white",
  ].join(" ");
}

export function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link to={ROUTES.HOME} className="text-xl font-bold text-green-400">
          Music App
        </Link>

        <nav className="flex flex-wrap items-center gap-2">
          <NavLink to={ROUTES.HOME} className={navClass} end>
            Home
          </NavLink>

          {user ? (
            <>
              <NavLink to={ROUTES.PROFILE} className={navClass}>
                Profile
              </NavLink>
              <NavLink to={ROUTES.SUBSCRIPTION} className={navClass}>
                Subscription
              </NavLink>
              <NavLink to={ROUTES.SETTINGS} className={navClass}>
                Settings
              </NavLink>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-full px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <NavLink to={ROUTES.LOGIN} className={navClass}>
                Sign In
              </NavLink>
              <NavLink to={ROUTES.REGISTER} className={navClass}>
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
