import { useMemo } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/constants/routes";
import {
  getAllSongs,
  getAllAlbums,
  getAllPlaylists,
  getRecentlyPlayed,
} from "@/lib/services/musicService";

import { SectionHeading } from "@/components/home/SectionHeading";
import { HorizontalCardScroller } from "@/components/home/HorizontalCardScroller";
import { PlaylistCard } from "@/components/home/PlaylistCard";
import { AlbumCard } from "@/components/home/AlbumCard";
import { SongRow } from "@/components/home/SongRow";
import { EarlyAccessBanner } from "@/components/home/EarlyAccessBanner";

export default function HomePage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  const songs = useMemo(() => getAllSongs(), []);
  const albums = useMemo(() => getAllAlbums(), []);
  const playlists = useMemo(() => getAllPlaylists(), []);

  const recentEntries = useMemo(
    () => (user ? getRecentlyPlayed(user.id) : []),
    [user]
  );

  const recentPlaylists = useMemo(() => {
    const playlistMap = new Map(playlists.map((p) => [p.id, p]));
    return recentEntries
      .map((e) => playlistMap.get(e.playlistId))
      .filter(Boolean);
  }, [recentEntries, playlists]);

  const newAlbums = useMemo(
    () =>
      [...albums]
        .filter((a) => !a.isEarlyAccess)
        .sort(
          (a, b) =>
            new Date(b.releaseDate).getTime() -
            new Date(a.releaseDate).getTime()
        ),
    [albums]
  );

  const popularSongs = useMemo(
    () => [...songs].sort((a, b) => b.playCount - a.playCount),
    [songs]
  );

  const earlyAccessAlbums = useMemo(
    () => albums.filter((a) => a.isEarlyAccess),
    [albums]
  );

  if (loading) {
    return <p className="text-center text-zinc-400">{t.home.loading}</p>;
  }

  if (!user) {
    return (
      <div className="space-y-4 py-20 text-center">
        <h1 className="text-3xl font-bold">{t.home.title}</h1>
        <p className="text-zinc-400">{t.home.tagline}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to={ROUTES.LOGIN}
            className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700"
          >
            {t.home.signIn}
          </Link>
          <Link
            to={ROUTES.REGISTER}
            className="rounded-lg bg-zinc-700 px-6 py-3 font-medium text-zinc-200 hover:bg-zinc-600"
          >
            {t.home.register}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold tracking-tight">
        {t.home.welcome.replace("{displayName}", user.displayName)}
      </h1>

      {recentPlaylists.length > 0 && (
        <section className="space-y-4">
          <SectionHeading title={t.home.recentlyListened} />
          <HorizontalCardScroller>
            {recentPlaylists.map(
              (playlist) =>
                playlist && <PlaylistCard key={playlist.id} playlist={playlist} />
            )}
          </HorizontalCardScroller>
        </section>
      )}

      <section className="space-y-4">
        <SectionHeading title={t.home.newAlbums} />
        <HorizontalCardScroller>
          {newAlbums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </HorizontalCardScroller>
      </section>

      <section className="space-y-4">
        <SectionHeading title={t.home.popularSongs} />
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
          {popularSongs.map((song, i) => (
            <SongRow key={song.id} song={song} index={i} queue={popularSongs} />
          ))}
        </div>
      </section>

      <section>
        <EarlyAccessBanner albums={earlyAccessAlbums} />
      </section>
    </div>
  );
}
