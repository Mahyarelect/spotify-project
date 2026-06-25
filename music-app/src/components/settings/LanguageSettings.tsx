export function LanguageSettings({
  language,
  onChange,
}: {
  language: "en" | "fa";
  onChange: (lang: "en" | "fa") => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg dark:text-white">Language</h3>
      <select
        value={language}
        onChange={(e) => onChange(e.target.value as "en" | "fa")}
        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100 border-zinc-300"
      >
        <option value="en">English</option>
        <option value="fa">Persian (فارسی)</option>
      </select>
    </div>
  );
}
