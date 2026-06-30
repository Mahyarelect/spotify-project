import { SkipForward, SkipBack } from "lucide-react";

export function SkipButton({
  direction,
  onClick,
  size = 18,
}: {
  direction: "forward" | "back";
  onClick: () => void;
  size?: number;
}) {
  const Icon = direction === "forward" ? SkipForward : SkipBack;

  return (
    <button
      onClick={onClick}
      className="text-zinc-400 transition hover:text-white"
      aria-label={direction === "forward" ? "Next track" : "Previous track"}
    >
      <Icon size={size} />
    </button>
  );
}
