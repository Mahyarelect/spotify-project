import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Music } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getAllSongs } from "@/lib/services/musicService";
import { ROUTES } from "@/lib/constants/routes";
import { usePlayer } from "@/lib/hooks/usePlayer";
import type { Song } from "@/types/music";

export default function PlayerPage() {
  const { t } = useTranslation();
  const { songId } = useParams();
  const navigate = useNavigate();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { currentSong, playSong, expand } = usePlayer();

  useEffect(() => {
    getAllSongs().then((s) => {
      setSongs(s);
      setLoaded(true);
    });
  }, []);

  const song = songs.find((s) => s.id === songId);

  useEffect(() => {
    if (song) {
      if (!currentSong || currentSong.id !== song.id) {
        playSong(song, songs);
      }
      expand();
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [song?.id, currentSong, playSong, expand, songs, navigate]);

  if (!loaded) {
    return <p className="p-8 text-center text-zinc-400">{t.player.loading}</p>;
  }

  if (!song) {
    return (
      <div className="space-y-4 py-20 text-center">
        <p className="text-zinc-400">{t.player.notFound}</p>
        <Link to={ROUTES.ALBUMS} className="text-green-400 hover:underline">
          {t.player.backToAlbums}
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
        {t.player.backToAlbums}
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

      <p className="text-xs text-zinc-500">
        {t.player.loading}
      </p>
    </div>
  );
}
