import { Languages } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useTranslation();

  return (
    <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200">
      <Languages size={18} aria-hidden="true" />
      {!compact && <span>{t.language.label}</span>}
      <select
        value={language}
        onChange={(event) => void setLanguage(event.target.value as "en" | "fa")}
        aria-label={t.language.selectLabel}
        className="min-h-10 bg-transparent font-medium text-zinc-100 outline-none"
      >
        <option value="en" className="bg-zinc-900">{t.language.english}</option>
        <option value="fa" className="bg-zinc-900">{t.language.persian}</option>
      </select>
    </label>
  );
}
