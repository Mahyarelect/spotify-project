import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Play, Music } from "lucide-react";
import { useMemo } from "react";
import { getSongs } from "@/lib/services/storage";
import { ROUTES } from "@/lib/constants/routes";

export default function PlayerPage() {
  const { songId } = useParams();
  const songs = useMemo(() => getSongs(), []);
  const song = songs.find((s) => s.id === songId);

  if (!song) {
    return (
      <div className="space-y-4 py-20 text-center">
        <p className="text-zinc-400">Song not found.</p>
        <Link to={ROUTES.ALBUMS} className="text-green-400 hover:underline">
          Back to Albums & Singles
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 py-8 text-center">
      <Link
        to={ROUTES.ALBUMS}
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200"
      >
        <ArrowLeft size={16} />
        Back to Albums & Singles
      </Link>

      <div
        className="mx-auto flex aspect-square w-64 items-center justify-center rounded-2xl"
        style={{ backgroundColor: song.coverColor }}
      >
        <Music size={64} className="text-white/60" />
      </div>

      <div>
        <h1 className="text-2xl font-bold">{song.title}</h1>
        <p className="text-zinc-400">{song.artistName}</p>
      </div>

      <div className="flex items-center justify-center gap-6">
        <button className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-black transition hover:bg-green-400">
          <Play size={24} fill="currentColor" />
        </button>
      </div>

      <p className="text-xs text-zinc-500">
        Music player is a placeholder — playback will be implemented in a future phase.
      </p>
    </div>
  );
}
