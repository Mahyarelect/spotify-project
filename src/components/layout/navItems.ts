import { ROUTES } from "@/lib/constants/routes";

export type NavItem = {
  label: string;
  to: string;
  end?: boolean;
};

export const publicNavItems: NavItem[] = [
  { label: "Home", to: ROUTES.HOME, end: true },
  { label: "Sign In", to: ROUTES.LOGIN },
  { label: "Register", to: ROUTES.REGISTER },
  { label: "Register as Artist", to: ROUTES.REGISTER_ARTIST },
];

export const privateNavItems: NavItem[] = [
  { label: "Home", to: ROUTES.HOME, end: true },
  { label: "Profile", to: ROUTES.PROFILE },
  { label: "Subscription", to: ROUTES.SUBSCRIPTION },
  { label: "Settings", to: ROUTES.SETTINGS },
];

export const sidebarNavItems: NavItem[] = [
  { label: "Home", to: ROUTES.HOME, end: true },
  { label: "Playlists", to: ROUTES.PLAYLISTS },
  { label: "Albums & Singles", to: ROUTES.ALBUMS },
  { label: "Profile", to: ROUTES.PROFILE },
  { label: "Settings", to: ROUTES.SETTINGS },
];
