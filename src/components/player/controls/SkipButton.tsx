import { SkipForward, SkipBack } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function SkipButton({
  direction,
  onClick,
  size = 18,
}: {
  direction: "forward" | "back";
  onClick: () => void;
  size?: number;
}) {
  const { t } = useTranslation();
  const Icon = direction === "forward" ? SkipForward : SkipBack;

  return (
    <button
      onClick={onClick}
      className="text-zinc-400 transition hover:text-white"
      aria-label={direction === "forward" ? t.player.nextTrack : t.player.previousTrack}
    >
      <Icon size={size} />
    </button>
  );
}
