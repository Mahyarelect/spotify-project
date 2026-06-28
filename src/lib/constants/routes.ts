import type { Role } from "@/types/user";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  REGISTER_ARTIST: "/register-artist",
  FORGOT_PASSWORD: "/forgot-password",
  PROFILE: "/profile",
  PROFILE_BY_USERNAME: "/profile/:username",
  EDIT_PROFILE: "/profile/edit",
  SETTINGS: "/settings",
  SUBSCRIPTION: "/subscription",

  ARTIST_DASHBOARD: "/artist-dashboard",
  ADMIN_DASHBOARD: "/admin-dashboard",
  PLAYLISTS: "/playlists",
  ALBUMS: "/albums",
  MUSIC_LIBRARY: "/music",
} as const;

export const ROLE_HOME_ROUTE: Record<Role, string> = {
  listener: ROUTES.HOME,
  artist: ROUTES.ARTIST_DASHBOARD,
  support: ROUTES.ADMIN_DASHBOARD,
  admin: ROUTES.ADMIN_DASHBOARD,
};
