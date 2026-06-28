import type { Playlist } from "@/types/music";
import type { PlanTier } from "@/types/user";
import { getPlaylists, savePlaylists } from "./storage";
import { getPlanLimits } from "@/lib/constants/plans";

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `pl_${crypto.randomUUID()}`;
  }
  return `pl_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

const COVER_COLORS = [
  "#1b1b2f",
  "#2d132c",
  "#1a1a40",
  "#3c1642",
  "#0f3460",
  "#16213e",
  "#1a1a2e",
  "#533483",
  "#2c3e50",
  "#1e3a5f",
];

function randomColor(): string {
  return COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)];
}

export function getUserPlaylists(userId: string): Playlist[] {
  return getPlaylists().filter((p) => p.createdBy === userId);
}

export function getPlaylistCount(userId: string): number {
  return getUserPlaylists(userId).length;
}

export function canCreatePlaylist(userId: string, tier: PlanTier): boolean {
  const limits = getPlanLimits(tier);
  if (limits.maxPlaylists === null) return true;
  return getPlaylistCount(userId) < limits.maxPlaylists;
}

export function getPlaylistLimit(tier: PlanTier): number | null {
  return getPlanLimits(tier).maxPlaylists;
}

export function createPlaylist(
  userId: string,
  title: string,
  description?: string
): Playlist {
  const all = getPlaylists();
  const playlist: Playlist = {
    id: createId(),
    title: title.trim(),
    coverColor: randomColor(),
    songIds: [],
    createdBy: userId,
    description: description?.trim(),
  };
  all.push(playlist);
  savePlaylists(all);
  return playlist;
}

export function deletePlaylist(playlistId: string): void {
  const all = getPlaylists().filter((p) => p.id !== playlistId);
  savePlaylists(all);
}

export function renamePlaylist(playlistId: string, newTitle: string): void {
  const all = getPlaylists();
  const idx = all.findIndex((p) => p.id === playlistId);
  if (idx === -1) return;
  all[idx] = { ...all[idx], title: newTitle.trim() };
  savePlaylists(all);
}

export function addSongToPlaylist(playlistId: string, songId: string): void {
  const all = getPlaylists();
  const idx = all.findIndex((p) => p.id === playlistId);
  if (idx === -1) return;
  if (all[idx].songIds.includes(songId)) return;
  all[idx] = { ...all[idx], songIds: [...all[idx].songIds, songId] };
  savePlaylists(all);
}

export function removeSongFromPlaylist(
  playlistId: string,
  songId: string
): void {
  const all = getPlaylists();
  const idx = all.findIndex((p) => p.id === playlistId);
  if (idx === -1) return;
  all[idx] = {
    ...all[idx],
    songIds: all[idx].songIds.filter((id) => id !== songId),
  };
  savePlaylists(all);
}

export function getPlaylistById(playlistId: string): Playlist | undefined {
  return getPlaylists().find((p) => p.id === playlistId);
}
