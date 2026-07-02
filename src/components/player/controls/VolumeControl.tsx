import { useRef, useCallback } from "react";
import { Volume, Volume1, Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function VolumeControl({
  volume,
  onChange,
}: {
  volume: number;
  onChange: (v: number) => void;
}) {
  const { t } = useTranslation();
  const barRef = useRef<HTMLDivElement>(null);
  const prevVolume = useRef(volume);

  const Icon = volume === 0 ? VolumeX : volume < 34 ? Volume1 : volume < 67 ? Volume2 : Volume;

  const toggleMute = useCallback(() => {
    if (volume > 0) {
      prevVolume.current = volume;
      onChange(0);
    } else {
      onChange(prevVolume.current || 80);
    }
  }, [volume, onChange]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!barRef.current) return;
      const rect = barRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onChange(Math.round(ratio * 100));
    },
    [onChange]
  );

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={toggleMute}
        className="text-zinc-400 transition hover:text-white"
        aria-label={volume === 0 ? t.player.unmute : t.player.mute}
      >
        <Icon size={18} />
      </button>
      <div
        ref={barRef}
        className="group relative hidden h-1.5 w-24 cursor-pointer rounded-full bg-zinc-700 sm:block"
        onClick={handleClick}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-white transition group-hover:bg-green-400"
          style={{ width: `${volume}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 transition-opacity group-hover:opacity-100"
          style={{ left: `calc(${volume}% - 6px)` }}
        />
      </div>
    </div>
  );
}
