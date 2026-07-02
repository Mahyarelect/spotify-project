import { ROUTES } from "@/lib/constants/routes";
import type { Translations } from "@/lib/i18n/useTranslation";

export type NavItem = {
  label: string;
  to: string;
  end?: boolean;
};

export function getPublicNavItems(t: Translations): NavItem[] {
  return [
    { label: t.nav.home, to: ROUTES.HOME, end: true },
    { label: t.nav.signIn, to: ROUTES.LOGIN },
    { label: t.nav.register, to: ROUTES.REGISTER },
    { label: t.nav.registerArtist, to: ROUTES.REGISTER_ARTIST },
  ];
}

export function getPrivateNavItems(t: Translations): NavItem[] {
  return [
    { label: t.nav.home, to: ROUTES.HOME, end: true },
    { label: t.nav.profile, to: ROUTES.PROFILE },
    { label: t.nav.notifications, to: ROUTES.NOTIFICATIONS },
    { label: t.nav.subscription, to: ROUTES.SUBSCRIPTION },
    { label: t.nav.settings, to: ROUTES.SETTINGS },
  ];
}

export function getSidebarNavItems(t: Translations): NavItem[] {
  return [
    { label: t.nav.home, to: ROUTES.HOME, end: true },
    { label: t.nav.playlists, to: ROUTES.PLAYLISTS },
    { label: t.nav.albums, to: ROUTES.ALBUMS },
    { label: t.nav.notifications, to: ROUTES.NOTIFICATIONS },
    { label: t.nav.profile, to: ROUTES.PROFILE },
    { label: t.nav.settings, to: ROUTES.SETTINGS },
  ];
}
