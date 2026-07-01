import { Repeat, Repeat1 } from "lucide-react";
import type { RepeatMode } from "@/lib/hooks/usePlayer";

export function RepeatButton({
  mode,
  onCycle,
}: {
  mode: RepeatMode;
  onCycle: () => void;
}) {
  const Icon = mode === "one" ? Repeat1 : Repeat;
  const isActive = mode !== "off";

  return (
    <button
      onClick={onCycle}
      className={`relative transition ${isActive ? "text-green-400" : "text-zinc-400 hover:text-white"}`}
      aria-label={`Repeat: ${mode}`}
    >
      <Icon size={18} />
      {mode === "one" && (
        <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-400 text-[8px] font-bold text-black">
          1
        </span>
      )}
    </button>
  );
}
