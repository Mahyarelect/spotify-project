import { ListMusic } from "lucide-react";

export function EmptyPlaylistState({
  onCreateClick,
}: {
  onCreateClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
        <ListMusic size={28} className="text-zinc-400" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-zinc-100">
          No playlists yet
        </h3>
        <p className="text-sm text-zinc-400">
          Create your first playlist to start organizing your music.
        </p>
      </div>
      <button
        onClick={onCreateClick}
        className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
      >
        Create Your First Playlist
      </button>
    </div>
  );
}
