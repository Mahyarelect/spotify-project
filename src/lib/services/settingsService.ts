import type { NotificationPrefs } from "@/types/user";
import { updateProfile } from "./userService";

export async function updateNotificationPrefs(
  userId: string,
  prefs: NotificationPrefs
): Promise<void> {
  await updateProfile(userId, { notificationLimits: prefs });
}

export async function updateSoundEnabled(
  userId: string,
  enabled: boolean
): Promise<void> {
  await updateProfile(userId, { soundEnabled: enabled });
}

export async function updateLanguage(
  userId: string,
  lang: "en" | "fa"
): Promise<void> {
  await updateProfile(userId, { language: lang });
}
