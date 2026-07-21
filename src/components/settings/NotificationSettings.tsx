import type { NotificationPrefs } from "@/types/user";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function NotificationSettings({
  prefs,
  onChange,
  disabled = false,
}: {
  prefs: NotificationPrefs;
  onChange: (prefs: NotificationPrefs) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const toggles = [
    { key: "newReleasesFromFollowed" as const, label: t.settings.newReleases },
    { key: "subscriptionExpiry" as const, label: t.settings.subscriptionExpiry },
    { key: "ticketUpdates" as const, label: t.settings.ticketUpdates },
  ];

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg dark:text-white">{t.settings.notificationsHeading}</h3>
      {toggles.map(({ key, label }) => (
        <label key={key} className="flex items-center justify-between">
          <span className="text-sm dark:text-zinc-300">{label}</span>
          <input
            type="checkbox"
            checked={prefs[key]}
            disabled={disabled}
            onChange={(e) => onChange({ ...prefs, [key]: e.target.checked })}
            className="rounded border-zinc-300"
          />
        </label>
      ))}
    </div>
  );
}
