import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Copy, Pause, Play, Plus, Users } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { ROUTES } from "@/lib/constants/routes";
import { getAccessToken } from "@/lib/api/tokenStore";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { createListeningGroup, getListeningGroup, listeningSocketUrl } from "@/lib/services/listeningService";
import { getAllSongs } from "@/lib/services/musicService";
import type { Song } from "@/types/music";

interface GroupState {
  type: "state";
  song: Song | null;
  isPlaying: boolean;
  position: number;
  revision: number;
  memberCount: number;
}

export default function GroupListeningPage() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { syncFromGroup, progress, playbackBlocked, resumePlayback } = usePlayer();
  const socketRef = useRef<WebSocket | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [groupState, setGroupState] = useState<GroupState | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "closed" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);

  useEffect(() => {
    void getAllSongs().then(setSongs).catch(() => setError(t.groupListening.loadError));
  }, [t.groupListening.loadError]);

  useEffect(() => {
    if (!inviteCode) return;
    let active = true;
    setStatus("connecting");
    void getListeningGroup(inviteCode).then(() => {
      if (!active) return;
      const token = getAccessToken();
      if (!token) throw new Error("Missing access token");
      const socket = new WebSocket(listeningSocketUrl(inviteCode), ["spotify.jwt", token]);
      socketRef.current = socket;
      socket.onopen = () => active && setStatus("connected");
      socket.onmessage = (event) => {
        if (!active) return;
        const next = JSON.parse(event.data) as GroupState;
        if (next.type !== "state") return;
        setGroupState(next);
        setSeekPreview(null);
        syncFromGroup(next.song, next.isPlaying, next.position);
      };
      socket.onerror = () => active && setStatus("error");
      socket.onclose = () => active && setStatus("closed");
    }).catch(() => {
      if (active) {
        setError(t.groupListening.groupUnavailable);
        setStatus("error");
      }
    });
    return () => {
      active = false;
      socketRef.current?.close(1000, "left group");
      socketRef.current = null;
      syncFromGroup(null, false, 0);
    };
  }, [inviteCode, syncFromGroup, t.groupListening.groupUnavailable]);

  async function createGroup() {
    setError(null);
    try {
      const group = await createListeningGroup();
      navigate(ROUTES.GROUP_LISTENING_ROOM.replace(":inviteCode", group.inviteCode));
    } catch {
      setError(t.groupListening.createError);
    }
  }

  function send(action: "play" | "pause" | "seek", songId?: string, position?: number) {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({ type: "command", action, songId, position }));
  }

  function commitSeek(position: number) {
    setSeekPreview(position);
    send("seek", undefined, position);
  }

  const inviteUrl = inviteCode ? `${window.location.origin}${ROUTES.GROUP_LISTENING_ROOM.replace(":inviteCode", inviteCode)}` : "";

  return (
    <>
      <PageHeader title={t.groupListening.title} description={t.groupListening.description} />
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-950/40 p-3 text-red-300">{error}</p>}
      {!inviteCode ? (
        <PageShell>
          <p className="mb-4 text-zinc-400">{t.groupListening.createHint}</p>
          <Button onClick={() => void createGroup()}><Plus size={18} />{t.groupListening.create}</Button>
        </PageShell>
      ) : (
        <div className="space-y-5">
          <PageShell>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-zinc-300"><Users size={18} />{t.groupListening.members.replace("{count}", String(groupState?.memberCount ?? 0))}</div>
              <span className={status === "connected" ? "text-green-400" : "text-amber-400"}>{t.groupListening.statuses[status]}</span>
              <Button variant="secondary" onClick={() => void navigator.clipboard.writeText(inviteUrl)}><Copy size={18} />{t.groupListening.copyInvite}</Button>
            </div>
          </PageShell>

          {groupState?.song && (
            <PageShell>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg" style={{ backgroundColor: groupState.song.coverColor }} />
                <div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{groupState.song.title}</h2><p className="text-sm text-zinc-400">{groupState.song.artistName}</p></div>
                <Button onClick={() => send(groupState.isPlaying ? "pause" : "play")}>
                  {groupState.isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  {groupState.isPlaying ? t.player.pause : t.player.play}
                </Button>
              </div>
              <input
                className="mt-4 w-full accent-green-500"
                type="range"
                min={0}
                max={groupState.song.durationSec}
                value={Math.min(seekPreview ?? progress, groupState.song.durationSec)}
                aria-label={t.groupListening.seek}
                onChange={(event) => setSeekPreview(Number(event.target.value))}
                onPointerUp={(event) => commitSeek(Number(event.currentTarget.value))}
                onKeyUp={(event) => commitSeek(Number(event.currentTarget.value))}
              />
              {playbackBlocked && groupState.isPlaying && (
                <Button className="mt-3" variant="secondary" onClick={() => void resumePlayback()}>
                  <Play size={18} />{t.groupListening.enableAudio}
                </Button>
              )}
            </PageShell>
          )}

          <PageShell>
            <h2 className="mb-3 font-semibold">{t.groupListening.chooseSong}</h2>
            <div className="space-y-2">
              {songs.filter((song) => song.audioFile).map((song) => (
                <button key={song.id} type="button" disabled={status !== "connected"} onClick={() => send("play", song.id, 0)} className="flex min-h-12 w-full items-center gap-3 rounded-lg p-2 text-start hover:bg-zinc-800 disabled:opacity-50">
                  <span className="h-10 w-10 shrink-0 rounded" style={{ backgroundColor: song.coverColor }} />
                  <span className="min-w-0"><span className="block truncate font-medium">{song.title}</span><span className="block truncate text-sm text-zinc-400">{song.artistName}</span></span>
                </button>
              ))}
            </div>
          </PageShell>
        </div>
      )}
    </>
  );
}
