import { Shuffle } from "lucide-react";

export function ShuffleButton({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`transition ${active ? "text-green-400" : "text-zinc-400 hover:text-white"}`}
      aria-label={active ? "Shuffle on" : "Shuffle off"}
    >
      <Shuffle size={18} />
    </button>
  );
}
