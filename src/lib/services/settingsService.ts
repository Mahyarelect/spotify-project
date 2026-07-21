import { apiRequest } from "@/lib/api/httpClient";
import { mapPreferences, type UserPreferencesDto } from "@/lib/api/dto";
import type { NotificationPrefs, UserPreferences } from "@/types/user";

async function updatePreferences(patch: Partial<UserPreferencesDto>): Promise<UserPreferences> {
  const response = await apiRequest<UserPreferencesDto>("users/me/preferences/", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return mapPreferences(response);
}

export function updateNotificationPrefs(prefs: NotificationPrefs): Promise<UserPreferences> {
  return updatePreferences({
    new_releases_from_followed: prefs.newReleasesFromFollowed,
    subscription_expiry: prefs.subscriptionExpiry,
    ticket_updates: prefs.ticketUpdates,
  });
}

export function updateSoundEnabled(enabled: boolean): Promise<UserPreferences> {
  return updatePreferences({ sound_enabled: enabled });
}

export function updateLanguage(lang: "en" | "fa"): Promise<UserPreferences> {
  return updatePreferences({ language: lang });
}
