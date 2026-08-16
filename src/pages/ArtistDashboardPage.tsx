import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useAuth } from "@/lib/hooks/useAuth";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { RoleGuard } from "@/components/ui/RoleGuard";
import { ArtistStatsCards } from "@/components/artist-dashboard/ArtistStatsCards";
import { ArtistWorksTable } from "@/components/artist-dashboard/ArtistWorksTable";
import {
  WorkForm,
  type WorkType,
  type WorkFormData,
} from "@/components/artist-dashboard/WorkForm";
import {
  getWorksByArtist,
  getArtistStatistics,
  createSong,
  updateSong,
  deleteSong,
  createAlbum,
  updateAlbum,
  deleteAlbum,
} from "@/lib/services/artistWorkService";
import type { Song, Album } from "@/types/music";
import { Music, Disc3 } from "lucide-react";

export default function ArtistDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [refreshKey, setRefresh] = useState(0);
  const triggerRefresh = useCallback(() => setRefresh((k) => k + 1), []);

  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [totalStreams, setTotalStreams] = useState(0);
  const [listenerCount, setListenerCount] = useState(0);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      const [works, statistics] = await Promise.all([
        getWorksByArtist(user!.displayName),
        getArtistStatistics(),
      ]);
      if (cancelled) return;
      const bySong = new Map(statistics.songs.map((row) => [row.songId, row]));
      setSongs(works.songs.map((song) => ({
        ...song,
        playCount: bySong.get(song.id)?.totalStreams ?? 0,
        uniqueListeners: bySong.get(song.id)?.uniqueListeners ?? 0,
        revenue: bySong.get(song.id)?.revenue ?? 0,
      })));
      setAlbums(works.albums);
      setTotalStreams(statistics.totalStreams);
      setListenerCount(statistics.uniqueListeners);
      setRevenue(statistics.revenue);
    }

    load();
    return () => { cancelled = true; };
  }, [user, refreshKey]);

  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<WorkType>("single");
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);

  function openNewSingle() {
    setFormType("single");
    setEditingSong(null);
    setEditingAlbum(null);
    setShowForm(true);
  }

  function openNewAlbum() {
    setFormType("album");
    setEditingSong(null);
    setEditingAlbum(null);
    setShowForm(true);
  }

  function handleEditSong(song: Song) {
    setFormType("single");
    setEditingSong(song);
    setEditingAlbum(null);
    setShowForm(true);
  }

  function handleEditAlbum(album: Album) {
    setFormType("album");
    setEditingAlbum(album);
    setEditingSong(null);
    setShowForm(true);
  }

  async function handleDeleteSong(songId: string) {
    if (!window.confirm(t.artistDashboard.deleteSongConfirm)) return;
    await deleteSong(songId);
    triggerRefresh();
  }

  async function handleDeleteAlbum(albumId: string) {
    if (!window.confirm(t.artistDashboard.deleteAlbumConfirm)) return;
    await deleteAlbum(albumId);
    triggerRefresh();
  }

  async function handleFormSubmit(data: WorkFormData) {
    if (!user) return;

    if (formType === "single") {
      if (editingSong) {
        await updateSong(editingSong.id, {
          title: data.title,
          genre: data.genre || undefined,
          lyrics: data.lyrics || undefined,
          collaborators: data.collaborators.split(",").map((name) => name.trim()).filter(Boolean),
          coverImage: data.coverImage,
          audioFile: data.audioFile,
        });
      } else {
        const album = await createAlbum({
          title: data.title,
          coverColor: data.coverColor || "#1a1a2e",
          releaseDate: new Date().toISOString().split("T")[0],
          isEarlyAccess: false,
          genre: data.genre || undefined,
          coverImage: data.coverImage,
        });

        await createSong({
          title: data.title,
          albumId: album.id,
          durationSec: data.durationSec || 210,
          coverColor: data.coverColor || "#1a1a2e",
          lyrics: data.lyrics || undefined,
          collaborators: data.collaborators.split(",").map((name) => name.trim()).filter(Boolean),
          genre: data.genre || undefined,
          releaseYear: data.releaseYear ? parseInt(data.releaseYear) : undefined,
          coverImage: data.coverImage,
          audioFile: data.audioFile,
        });
      }
    } else {
      if (editingAlbum) {
        await updateAlbum(editingAlbum.id, {
          title: data.title,
          genre: data.genre || undefined,
          coverImage: data.coverImage,
          isEarlyAccess: data.isEarlyAccess,
        });
      } else {
        await createAlbum({
          title: data.title,
          coverColor: data.coverColor || "#1a1a2e",
          releaseDate: data.releaseDate,
          isEarlyAccess: data.isEarlyAccess,
          genre: data.genre || undefined,
          coverImage: data.coverImage,
        });
      }
    }

    setShowForm(false);
    setEditingSong(null);
    setEditingAlbum(null);
    triggerRefresh();
  }

  if (!user) return null;

  return (
    <RoleGuard
      allow={["artist"]}
      fallback={
        <div className="py-20 text-center text-zinc-400">
          <p>{t.artistDashboard.accessDenied}</p>
        </div>
      }
    >
      <PageShell>
        <PageHeader
          title={t.artistDashboard.title}
          description={t.artistDashboard.welcome.replace("{displayName}", user.displayName)}
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={openNewAlbum}>
                <Disc3 size={16} className="me-1 inline" />
                {t.artistDashboard.newAlbum}
              </Button>
              <Button onClick={openNewSingle}>
                <Music size={16} className="me-1 inline" />
                {t.artistDashboard.newSingle}
              </Button>
            </div>
          }
        />

        <ArtistStatsCards
          totalStreams={totalStreams}
          listenerCount={listenerCount}
          revenue={revenue}
          songCount={songs.length}
        />

        <ArtistWorksTable
          songs={songs}
          albums={albums}
          onEditSong={handleEditSong}
          onDeleteSong={handleDeleteSong}
          onEditAlbum={handleEditAlbum}
          onDeleteAlbum={handleDeleteAlbum}
        />

        {showForm && (
          <WorkForm
            type={formType}
            initialData={editingSong ?? editingAlbum ?? undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingSong(null);
              setEditingAlbum(null);
            }}
          />
        )}
      </PageShell>
    </RoleGuard>
  );
}
