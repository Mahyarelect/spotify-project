import { useState, useCallback, useEffect } from "react";
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
  getArtistListenerCount,
  getArtistRevenue,
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
    const works = getWorksByArtist(user.displayName);
    setSongs(works.songs);
    setAlbums(works.albums);
    setTotalStreams(works.songs.reduce((sum, s) => sum + s.playCount, 0));
    setListenerCount(getArtistListenerCount(user.displayName));
    setRevenue(getArtistRevenue(user.displayName));
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

  function handleDeleteSong(songId: string) {
    if (!window.confirm("Delete this song? This cannot be undone.")) return;
    deleteSong(songId);
    triggerRefresh();
  }

  function handleDeleteAlbum(albumId: string) {
    if (
      !window.confirm(
        "Delete this album and all its songs? This cannot be undone."
      )
    )
      return;
    deleteAlbum(albumId);
    triggerRefresh();
  }

  function handleFormSubmit(data: WorkFormData) {
    if (!user) return;

    if (formType === "single") {
      if (editingSong) {
        updateSong(editingSong.id, {
          title: data.title,
          genre: data.genre || undefined,
          releaseYear: data.releaseYear
            ? parseInt(data.releaseYear)
            : undefined,
          collaborators: data.collaborators
            ? data.collaborators.split(",").map((c) => c.trim())
            : undefined,
          lyrics: data.lyrics || undefined,
          durationSec: data.durationSec,
          coverColor: data.coverColor,
        });
      } else {
        const album = createAlbum({
          title: data.title,
          artistName: user.displayName,
          coverColor: data.coverColor || "#1a1a2e",
          releaseDate: new Date().toISOString().split("T")[0],
          isEarlyAccess: false,
          genre: data.genre || undefined,
        });

        createSong({
          title: data.title,
          artistName: user.displayName,
          artistId: user.id,
          albumId: album.id,
          durationSec: data.durationSec || 210,
          coverColor: data.coverColor || "#1a1a2e",
          lyrics: data.lyrics || undefined,
          genre: data.genre || undefined,
          releaseYear: data.releaseYear
            ? parseInt(data.releaseYear)
            : undefined,
          collaborators: data.collaborators
            ? data.collaborators.split(",").map((c) => c.trim())
            : undefined,
        });
      }
    } else {
      if (editingAlbum) {
        updateAlbum(editingAlbum.id, {
          title: data.title,
          coverColor: data.coverColor || "#1a1a2e",
          releaseDate: data.releaseDate,
          isEarlyAccess: data.isEarlyAccess,
          genre: data.genre || undefined,
        });
      } else {
        createAlbum({
          title: data.title,
          artistName: user.displayName,
          coverColor: data.coverColor || "#1a1a2e",
          releaseDate: data.releaseDate,
          isEarlyAccess: data.isEarlyAccess,
          genre: data.genre || undefined,
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
          <p>Only verified artists can access this dashboard.</p>
        </div>
      }
    >
      <PageShell>
        <PageHeader
          title="Artist Dashboard"
          description={`Welcome back, ${user.displayName}`}
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={openNewAlbum}>
                <Disc3 size={16} className="mr-1 inline" />
                New Album
              </Button>
              <Button onClick={openNewSingle}>
                <Music size={16} className="mr-1 inline" />
                New Single
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
