import {
  Bell,
  CircleDollarSign,
  Disc3,
  Gauge,
  Home,
  ListMusic,
  LogIn,
  LogOut,
  Settings,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getDashboardRoute, ROUTES } from "@/lib/constants/routes";
import type { Translations } from "@/lib/i18n/useTranslation";
import type { Role, User } from "@/types/user";

export type NavigationItem =
  | {
      kind: "route";
      label: string;
      to: string;
      icon: LucideIcon;
      end?: boolean;
    }
  | {
      kind: "action";
      label: string;
      action: "logout";
      icon: LucideIcon;
    };

export function getDashboardLabel(role: Role, t: Translations): string | null {
  if (role === "artist") return t.nav.artistDashboard;
  if (role === "support") return t.nav.supportDashboard;
  if (role === "admin") return t.nav.adminDashboard;
  return null;
}

export function getNavigationItems(user: User | null, t: Translations): NavigationItem[] {
  if (!user) {
    return [
      { kind: "route", label: t.nav.home, to: ROUTES.HOME, icon: Home, end: true },
      { kind: "route", label: t.nav.signIn, to: ROUTES.LOGIN, icon: LogIn },
      { kind: "route", label: t.nav.register, to: ROUTES.REGISTER, icon: UserRoundPlus },
      { kind: "route", label: t.nav.registerArtist, to: ROUTES.REGISTER_ARTIST, icon: UserRoundPlus },
    ];
  }

  const items: NavigationItem[] = [
    { kind: "route", label: t.nav.home, to: ROUTES.HOME, icon: Home, end: true },
  ];
  const dashboardRoute = getDashboardRoute(user.role);
  const dashboardLabel = getDashboardLabel(user.role, t);
  if (dashboardRoute && dashboardLabel) {
    items.push({ kind: "route", label: dashboardLabel, to: dashboardRoute, icon: Gauge });
  }

  items.push(
    { kind: "route", label: t.nav.playlists, to: ROUTES.PLAYLISTS, icon: ListMusic },
    { kind: "route", label: t.nav.albums, to: ROUTES.ALBUMS, icon: Disc3 },
    { kind: "route", label: t.nav.notifications, to: ROUTES.NOTIFICATIONS, icon: Bell },
    { kind: "route", label: t.nav.profile, to: ROUTES.PROFILE, icon: UserRound },
  );
  if (user.role === "listener") {
    items.push({
      kind: "route",
      label: t.nav.subscription,
      to: ROUTES.SUBSCRIPTION,
      icon: CircleDollarSign,
    });
  }
  items.push(
    { kind: "route", label: t.nav.settings, to: ROUTES.SETTINGS, icon: Settings },
    { kind: "action", label: t.nav.signOut, action: "logout", icon: LogOut },
  );
  return items;
}
