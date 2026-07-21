import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { SoundSettings } from "@/components/settings/SoundSettings";
import { LanguageSettings } from "@/components/settings/LanguageSettings";
import { DeleteAccountDialog } from "@/components/settings/DeleteAccountDialog";
import { useAuth } from "@/lib/hooks/useAuth";
import * as settingsService from "@/lib/services/settingsService";
import * as userService from "@/lib/services/userService";
import { ROUTES } from "@/lib/constants/routes";
import type { NotificationPrefs } from "@/types/user";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [sound, setSound] = useState(true);
  const [language, setLanguage] = useState<"en" | "fa">("en");

  useEffect(() => {
    if (!user) return;
    setPrefs({
      newReleasesFromFollowed: user.preferences.newReleasesFromFollowed,
      subscriptionExpiry: user.preferences.subscriptionExpiry,
      ticketUpdates: user.preferences.ticketUpdates,
    });
    setSound(user.preferences.soundEnabled);
    setLanguage(user.preferences.language);
  }, [user]);

  if (!user || !prefs) return null;

  async function handleNotifChange(nextPrefs: NotificationPrefs) {
    setPrefs(nextPrefs);
    await settingsService.updateNotificationPrefs(nextPrefs);
    await refreshUser();
  }

  async function handleSoundChange(enabled: boolean) {
    setSound(enabled);
    await settingsService.updateSoundEnabled(enabled);
    await refreshUser();
  }

  async function handleLanguageChange(lang: "en" | "fa") {
    setLanguage(lang);
    await settingsService.updateLanguage(lang);
    await refreshUser();
  }

  async function handleDeleteAccount(currentPassword: string) {
    await userService.deleteAccount(currentPassword);
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  }

  return (
    <>
      <PageHeader title={t.settings.title} description={t.settings.description} />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <PageShell>
            <NotificationSettings prefs={prefs} onChange={handleNotifChange} />
          </PageShell>
          <PageShell>
            <SoundSettings enabled={sound} onChange={handleSoundChange} />
          </PageShell>
          <PageShell>
            <LanguageSettings language={language} onChange={handleLanguageChange} />
          </PageShell>
        </div>
        <div className="space-y-6">
          <PageShell className="h-fit">
            <h2 className="text-lg font-semibold">{t.settings.subscriptionHeading}</h2>
            <p className="mt-2 text-sm text-zinc-400">{t.settings.currentPlan.replace("{planTier}", user.subscription.plan)}</p>
            <Link
              to={ROUTES.SUBSCRIPTION}
              className="mt-4 inline-flex rounded-full bg-green-500 px-4 py-2 text-sm font-medium text-black"
            >
              {t.settings.manageSubscription}
            </Link>
          </PageShell>
          <PageShell className="h-fit border-red-900/60">
            <h3 className="font-semibold text-lg mb-3">{t.settings.accountHeading}</h3>
            <DeleteAccountDialog onDelete={handleDeleteAccount} />
          </PageShell>
        </div>
      </div>
    </>
  );
}
