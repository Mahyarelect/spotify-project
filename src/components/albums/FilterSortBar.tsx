import { ArrowUpDown } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export type SortOption = "playCount-desc" | "playCount-asc" | "releaseDate-desc" | "releaseDate-asc";

export function FilterSortBar({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
}) {
  const { t } = useTranslation();

  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "playCount-desc", label: t.albums.sortMostListeners },
    { value: "playCount-asc", label: t.albums.sortLeastListeners },
    { value: "releaseDate-desc", label: t.albums.sortNewestFirst },
    { value: "releaseDate-asc", label: t.albums.sortOldestFirst },
  ];

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown size={16} className="text-zinc-400" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
