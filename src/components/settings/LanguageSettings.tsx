import { useTranslation } from "@/lib/i18n/useTranslation";

export function LanguageSettings({
  language,
  onChange,
  disabled = false,
}: {
  language: "en" | "fa";
  onChange: (lang: "en" | "fa") => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg dark:text-white">{t.settings.languageHeading}</h3>
      <select
        value={language}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as "en" | "fa")}
        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100 border-zinc-300"
      >
        <option value="en">{t.settings.english}</option>
        <option value="fa">{t.settings.persian}</option>
      </select>
    </div>
  );
}
