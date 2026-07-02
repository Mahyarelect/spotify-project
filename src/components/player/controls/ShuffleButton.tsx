import { Shuffle } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function ShuffleButton({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onToggle}
      className={`transition ${active ? "text-green-400" : "text-zinc-400 hover:text-white"}`}
      aria-label={active ? t.player.shuffleOn : t.player.shuffleOff}
    >
      <Shuffle size={18} />
    </button>
  );
}
