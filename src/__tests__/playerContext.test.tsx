import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/lib/context/AuthContext";
import { useAuth } from "@/lib/hooks/useAuth";
import { PlayerProvider, usePlayer } from "@/lib/context/PlayerContext";
import { STORAGE_KEYS } from "@/lib/services/storage";
import type { Song } from "@/types/music";
import type { ReactNode } from "react";

const MOCK_SONG_A: Song = {
  id: "test-a",
  title: "Test Song A",
  artistName: "Test Artist",
  artistId: "u1",
  albumId: "al1",
  durationSec: 100,
  coverColor: "#000000",
  playCount: 100,
};

const MOCK_SONG_B: Song = {
  id: "test-b",
  title: "Test Song B",
  artistName: "Test Artist",
  artistId: "u1",
  albumId: "al1",
  durationSec: 200,
  coverColor: "#111111",
  playCount: 200,
};

const MOCK_SONG_C: Song = {
  id: "test-c",
  title: "Test Song C",
  artistName: "Other Artist",
  artistId: "u2",
  albumId: "al2",
  durationSec: 150,
  coverColor: "#222222",
  playCount: 50,
};

let playerActions: ReturnType<typeof usePlayer> | null = null;
let authLoaded = false;

function PlayerConsumer() {
  const player = usePlayer();
  const { user, loading } = useAuth();
  playerActions = player;

  if (!loading) authLoaded = true;

  return (
    <div>
      <span data-testid="current">{player.currentSong?.title ?? "none"}</span>
      <span data-testid="playing">{player.isPlaying ? "true" : "false"}</span>
      <span data-testid="progress">{player.progress}</span>
      <span data-testid="queue-length">{player.queue.length}</span>
      <span data-testid="repeat">{player.repeatMode}</span>
      <span data-testid="shuffle">{player.shuffle ? "true" : "false"}</span>
      <span data-testid="volume">{player.volume}</span>
      <span data-testid="expanded">{player.isExpanded ? "true" : "false"}</span>
      <span data-testid="user">{user?.planTier ?? "none"}</span>
      <span data-testid="loading">{loading ? "true" : "false"}</span>
    </div>
  );
}

function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <AuthProvider>
        <PlayerProvider>{children}</PlayerProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

function setupUser(tier: "free" | "silver" | "gold" = "silver") {
  const mockUsers = [
    {
      id: "test-user",
      email: "test@example.com",
      passwordHash: "hash",
      displayName: "Test User",
      username: "testuser",
      role: "listener",
      birthDate: "1995-01-01",
      gender: "male" as const,
      avatarUrl: null,
      planTier: tier,
      planRenewsAt: null,
      followers: [],
      following: [],
      notificationLimits: {
        newReleasesFromFollowed: true,
        subscriptionExpiry: true,
        ticketUpdates: false,
      },
      soundEnabled: true,
      language: "en" as const,
      createdAt: "2025-01-01T00:00:00Z",
    },
  ];
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(mockUsers));
  localStorage.setItem(STORAGE_KEYS.currentSessionUserId, "test-user");
}

beforeEach(() => {
  localStorage.clear();
  playerActions = null;
  authLoaded = false;
});

async function waitForAuth() {
  await waitFor(() => {
    expect(authLoaded).toBe(true);
  });
}

describe("PlayerContext", () => {
  it("starts with no current song", () => {
    render(<PlayerConsumer />, { wrapper: TestWrapper });
    expect(screen.getByTestId("current")).toHaveTextContent("none");
    expect(screen.getByTestId("playing")).toHaveTextContent("false");
    expect(screen.getByTestId("queue-length")).toHaveTextContent("0");
  });

  it("plays a song and sets it as current", async () => {
    setupUser("silver");
    render(<PlayerConsumer />, { wrapper: TestWrapper });
    await waitForAuth();

    act(() => {
      playerActions!.playSong(MOCK_SONG_A);
    });

    expect(screen.getByTestId("current")).toHaveTextContent("Test Song A");
    expect(screen.getByTestId("playing")).toHaveTextContent("true");
    expect(screen.getByTestId("queue-length")).toHaveTextContent("1");
  });

  it("sets a queue when provided", async () => {
    setupUser("silver");
    render(<PlayerConsumer />, { wrapper: TestWrapper });
    await waitForAuth();

    act(() => {
      playerActions!.playSong(MOCK_SONG_B, [MOCK_SONG_A, MOCK_SONG_B, MOCK_SONG_C]);
    });

    expect(screen.getByTestId("current")).toHaveTextContent("Test Song B");
    expect(screen.getByTestId("queue-length")).toHaveTextContent("3");
  });

  it("toggles play/pause", async () => {
    setupUser("silver");
    render(<PlayerConsumer />, { wrapper: TestWrapper });
    await waitForAuth();

    act(() => {
      playerActions!.playSong(MOCK_SONG_A);
    });
    expect(screen.getByTestId("playing")).toHaveTextContent("true");

    act(() => {
      playerActions!.togglePlay();
    });
    expect(screen.getByTestId("playing")).toHaveTextContent("false");

    act(() => {
      playerActions!.togglePlay();
    });
    expect(screen.getByTestId("playing")).toHaveTextContent("true");
  });

  it("advances to next song in queue", async () => {
    setupUser("silver");
    render(<PlayerConsumer />, { wrapper: TestWrapper });
    await waitForAuth();

    act(() => {
      playerActions!.playSong(MOCK_SONG_A, [MOCK_SONG_A, MOCK_SONG_B, MOCK_SONG_C]);
    });
    expect(screen.getByTestId("current")).toHaveTextContent("Test Song A");

    act(() => {
      playerActions!.next();
    });
    expect(screen.getByTestId("current")).toHaveTextContent("Test Song B");
  });

  it("goes to previous song", async () => {
    setupUser("silver");
    render(<PlayerConsumer />, { wrapper: TestWrapper });
    await waitForAuth();

    act(() => {
      playerActions!.playSong(MOCK_SONG_B, [MOCK_SONG_A, MOCK_SONG_B, MOCK_SONG_C]);
    });

    act(() => {
      playerActions!.previous();
    });
    expect(screen.getByTestId("current")).toHaveTextContent("Test Song A");
  });

  it("restarts current song if more than 3 seconds in", async () => {
    setupUser("silver");
    render(<PlayerConsumer />, { wrapper: TestWrapper });
    await waitForAuth();

    act(() => {
      playerActions!.playSong(MOCK_SONG_B, [MOCK_SONG_A, MOCK_SONG_B]);
    });

    act(() => {
      playerActions!.seek(10);
    });

    act(() => {
      playerActions!.previous();
    });
    expect(screen.getByTestId("current")).toHaveTextContent("Test Song B");
    expect(screen.getByTestId("progress")).toHaveTextContent("0");
  });

  it("seeks to a specific time", async () => {
    setupUser("silver");
    render(<PlayerConsumer />, { wrapper: TestWrapper });
    await waitForAuth();

    act(() => {
      playerActions!.playSong(MOCK_SONG_A);
    });

    act(() => {
      playerActions!.seek(50);
    });
    expect(screen.getByTestId("progress")).toHaveTextContent("50");
  });

  it("clamps seek to valid range", async () => {
    setupUser("silver");
    render(<PlayerConsumer />, { wrapper: TestWrapper });
    await waitForAuth();

    act(() => {
      playerActions!.playSong(MOCK_SONG_A);
    });

    act(() => {
      playerActions!.seek(999);
    });
    expect(screen.getByTestId("progress")).toHaveTextContent("100");

    act(() => {
      playerActions!.seek(-10);
    });
    expect(screen.getByTestId("progress")).toHaveTextContent("0");
  });

  it("changes volume", () => {
    setupUser("silver");
    render(<PlayerConsumer />, { wrapper: TestWrapper });

    act(() => {
      playerActions!.setVolume(50);
    });
    expect(screen.getByTestId("volume")).toHaveTextContent("50");
  });

  it("clamps volume to 0-100", () => {
    setupUser("silver");
    render(<PlayerConsumer />, { wrapper: TestWrapper });

    act(() => {
      playerActions!.setVolume(150);
    });
    expect(screen.getByTestId("volume")).toHaveTextContent("100");

    act(() => {
      playerActions!.setVolume(-10);
    });
    expect(screen.getByTestId("volume")).toHaveTextContent("0");
  });

  it("cycles repeat mode: off -> all -> one -> off", () => {
    setupUser("silver");
    render(<PlayerConsumer />, { wrapper: TestWrapper });

    expect(screen.getByTestId("repeat")).toHaveTextContent("off");

    act(() => {
      playerActions!.cycleRepeat();
    });
    expect(screen.getByTestId("repeat")).toHaveTextContent("all");

    act(() => {
      playerActions!.cycleRepeat();
    });
    expect(screen.getByTestId("repeat")).toHaveTextContent("one");

    act(() => {
      playerActions!.cycleRepeat();
    });
    expect(screen.getByTestId("repeat")).toHaveTextContent("off");
  });

  it("toggles shuffle", () => {
    setupUser("silver");
    render(<PlayerConsumer />, { wrapper: TestWrapper });

    expect(screen.getByTestId("shuffle")).toHaveTextContent("false");

    act(() => {
      playerActions!.toggleShuffle();
    });
    expect(screen.getByTestId("shuffle")).toHaveTextContent("true");

    act(() => {
      playerActions!.toggleShuffle();
    });
    expect(screen.getByTestId("shuffle")).toHaveTextContent("false");
  });

  it("expands and collapses the overlay", () => {
    setupUser("silver");
    render(<PlayerConsumer />, { wrapper: TestWrapper });

    expect(screen.getByTestId("expanded")).toHaveTextContent("false");

    act(() => {
      playerActions!.expand();
    });
    expect(screen.getByTestId("expanded")).toHaveTextContent("true");

    act(() => {
      playerActions!.collapse();
    });
    expect(screen.getByTestId("expanded")).toHaveTextContent("false");
  });

  it("stops playback and clears everything", async () => {
    setupUser("silver");
    render(<PlayerConsumer />, { wrapper: TestWrapper });
    await waitForAuth();

    act(() => {
      playerActions!.playSong(MOCK_SONG_A, [MOCK_SONG_A, MOCK_SONG_B]);
    });
    expect(screen.getByTestId("current")).toHaveTextContent("Test Song A");

    act(() => {
      playerActions!.stop();
    });
    expect(screen.getByTestId("current")).toHaveTextContent("none");
    expect(screen.getByTestId("playing")).toHaveTextContent("false");
    expect(screen.getByTestId("queue-length")).toHaveTextContent("0");
  });

  it("removes a song from the queue", async () => {
    setupUser("silver");
    render(<PlayerConsumer />, { wrapper: TestWrapper });
    await waitForAuth();

    act(() => {
      playerActions!.playSong(MOCK_SONG_A, [MOCK_SONG_A, MOCK_SONG_B, MOCK_SONG_C]);
    });
    expect(screen.getByTestId("queue-length")).toHaveTextContent("3");

    act(() => {
      playerActions!.removeFromQueue(2);
    });
    expect(screen.getByTestId("queue-length")).toHaveTextContent("2");
  });

  it("reorders the queue", async () => {
    setupUser("silver");
    render(<PlayerConsumer />, { wrapper: TestWrapper });
    await waitForAuth();

    act(() => {
      playerActions!.playSong(MOCK_SONG_A, [MOCK_SONG_A, MOCK_SONG_B, MOCK_SONG_C]);
    });

    // Move song at index 2 to index 0
    act(() => {
      playerActions!.reorderQueue(2, 0);
    });
    expect(screen.getByTestId("queue-length")).toHaveTextContent("3");
  });
});

describe("PlayerContext stream enforcement", () => {
  it("blocks playback when free user exceeds daily limit", async () => {
    setupUser("free");

    // Pre-fill 60 streams for today
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    localStorage.setItem(
      STORAGE_KEYS.streamCounts,
      JSON.stringify({ "test-user": { [dateKey]: 60 } })
    );

    render(<PlayerConsumer />, { wrapper: TestWrapper });
    await waitForAuth();

    act(() => {
      playerActions!.playSong(MOCK_SONG_A);
    });

    expect(screen.getByTestId("current")).toHaveTextContent("none");
    expect(screen.getByTestId("playing")).toHaveTextContent("false");
  });

  it("allows playback for silver users without limit", async () => {
    setupUser("silver");
    render(<PlayerConsumer />, { wrapper: TestWrapper });
    await waitForAuth();

    act(() => {
      playerActions!.playSong(MOCK_SONG_A);
    });

    expect(screen.getByTestId("current")).toHaveTextContent("Test Song A");
    expect(screen.getByTestId("playing")).toHaveTextContent("true");
  });
});
