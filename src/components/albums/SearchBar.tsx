import { Search, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const defaultPlaceholder = placeholder ?? t.albums.searchPlaceholder;
  return (
    <div className="relative">
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={defaultPlaceholder}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-10 pr-10 text-sm text-zinc-100 placeholder-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
