import { describe, it, expect, beforeEach } from "vitest";
import {
  createPlaylist,
  deletePlaylist,
  getUserPlaylists,
  canCreatePlaylist,
  renamePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
} from "@/lib/services/playlistService";
import { STORAGE_KEYS } from "@/lib/services/storage";

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(STORAGE_KEYS.playlists, JSON.stringify([]));
});

describe("playlistService.createPlaylist", () => {
  it("creates a playlist and persists it", () => {
    const playlist = createPlaylist("u1", "My Playlist", "A description");

    expect(playlist.id).toMatch(/^pl_/);
    expect(playlist.title).toBe("My Playlist");
    expect(playlist.description).toBe("A description");
    expect(playlist.createdBy).toBe("u1");
    expect(playlist.songIds).toEqual([]);

    const stored = getUserPlaylists("u1");
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(playlist.id);
  });

  it("trims whitespace from title", () => {
    const playlist = createPlaylist("u1", "  Spaced Title  ");
    expect(playlist.title).toBe("Spaced Title");
  });
});

describe("playlistService.deletePlaylist", () => {
  it("removes the playlist", () => {
    const p1 = createPlaylist("u1", "First");
    createPlaylist("u1", "Second");

    expect(getUserPlaylists("u1")).toHaveLength(2);

    deletePlaylist(p1.id);

    const remaining = getUserPlaylists("u1");
    expect(remaining).toHaveLength(1);
    expect(remaining[0].title).toBe("Second");
  });
});

describe("playlistService.renamePlaylist", () => {
  it("renames an existing playlist", () => {
    const p = createPlaylist("u1", "Old Name");
    renamePlaylist(p.id, "New Name");

    const stored = getUserPlaylists("u1");
    expect(stored[0].title).toBe("New Name");
  });
});

describe("playlistService.addSongToPlaylist", () => {
  it("adds a song to the playlist", () => {
    const p = createPlaylist("u1", "My Playlist");
    addSongToPlaylist(p.id, "s1");

    const stored = getUserPlaylists("u1");
    expect(stored[0].songIds).toContain("s1");
  });

  it("does not add duplicate songs", () => {
    const p = createPlaylist("u1", "My Playlist");
    addSongToPlaylist(p.id, "s1");
    addSongToPlaylist(p.id, "s1");

    const stored = getUserPlaylists("u1");
    expect(stored[0].songIds).toEqual(["s1"]);
  });
});

describe("playlistService.removeSongFromPlaylist", () => {
  it("removes a song from the playlist", () => {
    const p = createPlaylist("u1", "My Playlist");
    addSongToPlaylist(p.id, "s1");
    addSongToPlaylist(p.id, "s2");
    removeSongFromPlaylist(p.id, "s1");

    const stored = getUserPlaylists("u1");
    expect(stored[0].songIds).toEqual(["s2"]);
  });
});

describe("playlistService uses backend-provided limits", () => {
  it("allows playlist creation under the provided limit", () => {
    expect(canCreatePlaylist("u1", 6)).toBe(true);
  });

  it("free user cannot create playlists at the limit", () => {
    for (let i = 0; i < 6; i++) {
      createPlaylist("u1", `Playlist ${i}`);
    }
    expect(canCreatePlaylist("u1", 6)).toBe(false);
  });

  it("gold user can always create playlists", () => {
    for (let i = 0; i < 20; i++) {
      createPlaylist("u1", `Playlist ${i}`);
    }
    expect(canCreatePlaylist("u1", null)).toBe(true);
  });
});
