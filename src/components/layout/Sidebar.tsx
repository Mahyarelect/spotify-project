import { NavLink } from "react-router-dom";
import { Home, ListMusic, Disc3, User, Settings } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";

const links = [
  { to: ROUTES.HOME, label: "Home", icon: Home, end: true },
  { to: ROUTES.PLAYLISTS, label: "Playlists", icon: ListMusic },
  { to: ROUTES.ALBUMS, label: "Albums & Singles", icon: Disc3 },
  { to: ROUTES.PROFILE, label: "Profile", icon: User },
  { to: ROUTES.SETTINGS, label: "Settings", icon: Settings },
];

function navClass({ isActive }: { isActive: boolean }) {
  return [
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-green-500/10 text-green-400"
      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
  ].join(" ");
}

export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-zinc-800 bg-zinc-950 md:block">
      <nav className="flex flex-col gap-1 p-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={navClass}
          >
            <link.icon size={18} />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
