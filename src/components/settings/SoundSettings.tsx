import { useTranslation } from "@/lib/i18n/useTranslation";

export function SoundSettings({
  enabled,
  onChange,
  disabled = false,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg dark:text-white">{t.settings.soundHeading}</h3>
      <label className="flex items-center justify-between">
        <span className="text-sm dark:text-zinc-300">{t.settings.enableEffects}</span>
        <input type="checkbox" checked={enabled} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="rounded border-zinc-300" />
      </label>
    </div>
  );
}
