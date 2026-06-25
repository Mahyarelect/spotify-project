import type { NotificationPrefs } from "@/types/user";

export function NotificationSettings({
  prefs,
  onChange,
}: {
  prefs: NotificationPrefs;
  onChange: (prefs: NotificationPrefs) => void;
}) {
  const toggles = [
    { key: "newReleasesFromFollowed" as const, label: "New releases from followed artists" },
    { key: "subscriptionExpiry" as const, label: "Subscription expiry reminders" },
    { key: "ticketUpdates" as const, label: "Support ticket updates" },
  ];

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">Notifications</h3>
      {toggles.map(({ key, label }) => (
        <label key={key} className="flex items-center justify-between">
          <span className="text-sm">{label}</span>
          <input
            type="checkbox"
            checked={prefs[key]}
            onChange={(e) => onChange({ ...prefs, [key]: e.target.checked })}
            className="rounded border-zinc-300"
          />
        </label>
      ))}
    </div>
  );
}
