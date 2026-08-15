import type { Role } from "@/types/user";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  REGISTER_ARTIST: "/register-artist",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  PROFILE: "/profile",
  PROFILE_BY_USERNAME: "/profile/:username",
  EDIT_PROFILE: "/profile/edit",
  SETTINGS: "/settings",
  SUBSCRIPTION: "/subscription",

  ARTIST_DASHBOARD: "/artist-dashboard",
  SUPPORT_DASHBOARD: "/support-dashboard",
  ADMIN_DASHBOARD: "/admin-dashboard",
  PLAYLISTS: "/playlists",
  ALBUMS: "/albums",
  ALBUM_DETAIL: "/album/:albumId",
  ARTIST: "/artist/:artistName",
  PLAYER: "/player/:songId",
  MUSIC_LIBRARY: "/music",
  NOTIFICATIONS: "/notifications",
  GROUP_LISTENING: "/listen",
  GROUP_LISTENING_ROOM: "/listen/:inviteCode",
} as const;

export const ROLE_HOME_ROUTE: Record<Role, string> = {
  listener: ROUTES.HOME,
  artist: ROUTES.ARTIST_DASHBOARD,
  support: ROUTES.SUPPORT_DASHBOARD,
  admin: ROUTES.ADMIN_DASHBOARD,
};

export function getDashboardRoute(role: Role): string | null {
  return role === "listener" ? null : ROLE_HOME_ROUTE[role];
}
