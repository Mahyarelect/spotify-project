import { beforeEach, describe, expect, it, vi } from "vitest";
import { addSongToPlaylist, canCreatePlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeSongFromPlaylist, renamePlaylist } from "@/lib/services/playlistService";

const playlist = {
  id: "playlist-1", title: "Focus", cover_color: "#1b1b2f", created_by: "user-1",
  created_by_name: "Listener", description: "Work music", song_count: 1,
  songs: [{ song: "song-1", song_title: "Song", song_artist: "Artist", song_duration: 180, position: 0 }],
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

describe("playlistService backend contract", () => {
  it("maps the authenticated user's playlists", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([playlist]));
    await expect(getUserPlaylists()).resolves.toEqual([{
      id: "playlist-1", title: "Focus", coverColor: "#1b1b2f", createdBy: "user-1",
      description: "Work music", songIds: ["song-1"],
    }]);
    expect(fetchMock.mock.calls[0][0]).toContain("music/playlists/mine/");
  });

  it("creates a trimmed playlist through the API", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(playlist, 201));
    await expect(createPlaylist("  Focus  ", "  Work music  ")).resolves.toMatchObject({ id: "playlist-1" });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ title: "Focus", cover_color: "#1b1b2f", description: "Work music" }),
    });
  });

  it("uses the backend list to enforce finite limits", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => jsonResponse([playlist]));
    await expect(canCreatePlaylist(1)).resolves.toBe(false);
    await expect(canCreatePlaylist(2)).resolves.toBe(true);
    await expect(canCreatePlaylist(null)).resolves.toBe(true);
  });

  it("sends update, delete, add, and remove mutations", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    await renamePlaylist("playlist-1", "  New name  ");
    await deletePlaylist("playlist-1");
    await addSongToPlaylist("playlist-1", "song-2");
    await removeSongFromPlaylist("playlist-1", "song-2");
    expect(fetchMock.mock.calls.map(([, init]) => init?.method)).toEqual(["PATCH", "DELETE", "POST", "DELETE"]);
    expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify({ title: "New name" }));
    expect(fetchMock.mock.calls[2][1]?.body).toBe(JSON.stringify({ song_id: "song-2" }));
  });

  it("returns undefined when a public playlist cannot be loaded", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ detail: "Not found" }, 404));
    await expect(getPlaylistById("missing")).resolves.toBeUndefined();
  });
});
