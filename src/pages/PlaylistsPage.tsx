import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useAuth } from "@/lib/hooks/useAuth";
import { getAllSongs } from "@/lib/services/musicService";
import * as playlistService from "@/lib/services/playlistService";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { PlaylistCardExpandable } from "@/components/playlists/PlaylistCardExpandable";
import { CreatePlaylistModal } from "@/components/playlists/CreatePlaylistModal";
import { EmptyPlaylistState } from "@/components/playlists/EmptyPlaylistState";
import type { Playlist } from "@/types/music";

export default function PlaylistsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const songs = useMemo(() => getAllSongs(), []);

  const [playlists, setPlaylists] = useState<Playlist[]>(() =>
    user ? playlistService.getUserPlaylists(user.id) : []
  );
  const [showCreate, setShowCreate] = useState(false);

  const refresh = useCallback(() => {
    if (!user) return;
    setPlaylists(playlistService.getUserPlaylists(user.id));
  }, [user]);

  if (!user) return null;

  const limit = user.subscription.limits.maxPlaylists;
  const limitReached = limit !== null && playlists.length >= limit;

  const handleCreate = (title: string, description?: string) => {
    playlistService.createPlaylist(user.id, title, description);
    refresh();
    setShowCreate(false);
  };

  const handleRename = (playlistId: string, newTitle: string) => {
    playlistService.renamePlaylist(playlistId, newTitle);
    refresh();
  };

  const handleDelete = (playlistId: string) => {
    playlistService.deletePlaylist(playlistId);
    refresh();
  };

  const handleRemoveSong = (playlistId: string, songId: string) => {
    playlistService.removeSongFromPlaylist(playlistId, songId);
    refresh();
  };

  const limitDisplay = limit !== null ? limit : "unlimited";

  return (
    <div className="space-y-8">
      <PageHeader
        title={t.playlists.title}
        description={t.playlists.description.replace("{count}", String(playlists.length)).replace("{limit}", String(limitDisplay))}
        actions={
          <Button onClick={() => setShowCreate(true)} disabled={limitReached}>
            {limitReached ? t.playlists.limitReached : t.playlists.newPlaylist}
          </Button>
        }
      />

      {playlists.length === 0 ? (
        <EmptyPlaylistState onCreateClick={() => setShowCreate(true)} />
      ) : (
        <div className="space-y-3">
          {playlists.map((pl) => (
            <PlaylistCardExpandable
              key={pl.id}
              playlist={pl}
              songs={songs}
              onRename={(newTitle) => handleRename(pl.id, newTitle)}
              onDelete={() => handleDelete(pl.id)}
              onRemoveSong={(songId) => handleRemoveSong(pl.id, songId)}
            />
          ))}
        </div>
      )}

      <CreatePlaylistModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
        limitReached={limitReached}
        limit={limit}
      />
    </div>
  );
}
