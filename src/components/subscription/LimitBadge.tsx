export function LimitBadge({
  current,
  max,
  label,
}: {
  current: number;
  max: number | null;
  label: string;
}) {
  const display = max !== null ? `${current}/${max}` : `${current}/∞`;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 rounded-full">
      {label}: {display}
    </span>
  );
}
