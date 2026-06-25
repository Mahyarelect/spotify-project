export function SoundSettings({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg dark:text-white">Sound</h3>
      <label className="flex items-center justify-between">
        <span className="text-sm dark:text-zinc-300">Enable UI sound effects</span>
        <input type="checkbox" checked={enabled} onChange={(e) => onChange(e.target.checked)} className="rounded border-zinc-300" />
      </label>
    </div>
  );
}
