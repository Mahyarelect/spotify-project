import { Play, Pause } from "lucide-react";

export function PlayPauseButton({
  isPlaying,
  onClick,
  size = "md",
}: {
  isPlaying: boolean;
  onClick: () => void;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
    lg: "h-12 w-12",
  };
  const iconSize = { sm: 16, md: 18, lg: 24 };

  return (
    <button
      onClick={onClick}
      className={`flex ${sizeClasses[size]} items-center justify-center rounded-full bg-white text-black transition hover:scale-105 active:scale-95`}
      aria-label={isPlaying ? "Pause" : "Play"}
    >
      {isPlaying ? (
        <Pause size={iconSize[size]} fill="currentColor" />
      ) : (
        <Play size={iconSize[size]} fill="currentColor" className="ml-0.5" />
      )}
    </button>
  );
}
