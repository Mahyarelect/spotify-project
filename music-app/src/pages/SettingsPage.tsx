import { useAuth } from "@/lib/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { SoundSettings } from "@/components/settings/SoundSettings";
import { LanguageSettings } from "@/components/settings/LanguageSettings";
import { DeleteAccountDialog } from "@/components/settings/DeleteAccountDialog";
import * as userService from "@/lib/services/userService";
import * as settingsService from "@/lib/services/settingsService";
import type { NotificationPrefs } from "@/types/user";

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    newReleasesFromFollowed: true,
    subscriptionExpiry: true,
    ticketUpdates: false,
  });
  const [sound, setSound] = useState(true);
  const [language, setLanguage] = useState<"en" | "fa">("en");

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      setPrefs(user.notificationLimits);
      setSound(user.soundEnabled);
      setLanguage(user.language);
    }
  }, [user]);

  if (loading || !user) return null;

  const handleNotifChange = async (newPrefs: NotificationPrefs) => {
    setPrefs(newPrefs);
    await settingsService.updateNotificationPrefs(user.id, newPrefs);
  };

  const handleSoundChange = async (enabled: boolean) => {
    setSound(enabled);
    await settingsService.updateSoundEnabled(user.id, enabled);
  };

  const handleLanguageChange = async (lang: "en" | "fa") => {
    setLanguage(lang);
    await settingsService.updateLanguage(user.id, lang);
  };

  const handleDelete = async () => {
    await userService.deleteAccount(user.id);
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-2xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Settings</h1>
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6">
            <NotificationSettings prefs={prefs} onChange={handleNotifChange} />
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6">
            <SoundSettings enabled={sound} onChange={handleSoundChange} />
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6">
            <LanguageSettings language={language} onChange={handleLanguageChange} />
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow p-6">
            <h3 className="font-semibold text-lg mb-3 dark:text-white">Account</h3>
            <DeleteAccountDialog onDelete={handleDelete} />
          </div>
        </div>
      </div>
    </div>
  );
}
