import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Song } from "@/types/music";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  getPlayerPrefs,
  savePlayerPrefs,
} from "@/lib/services/storage";
import { canStream, recordStream } from "@/lib/services/streamService";

export type RepeatMode = "off" | "all" | "one";

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  currentIndex: number;
  isPlaying: boolean;
  progress: number;
  volume: number;
  shuffle: boolean;
  repeatMode: RepeatMode;
  isExpanded: boolean;
  streamError: string | null;
  sourcePlaylistId: string | null;
}

interface PlayerContextType extends PlayerState {
  playSong: (song: Song, queue?: Song[], sourcePlaylistId?: string) => Promise<void>;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  expand: () => void;
  collapse: () => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  stop: () => void;
  clearStreamError: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

function pickRandomIndex(current: number, length: number): number {
  if (length <= 1) return 0;
  let idx: number;
  do {
    idx = Math.floor(Math.random() * length);
  } while (idx === current);
  return idx;
}

function getAudioElement(): HTMLAudioElement {
  if (!(window as any).__playerAudio) {
    const audio = new Audio();
    audio.preload = "auto";
    (window as any).__playerAudio = audio;
  }
  return (window as any).__playerAudio;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const prefs = getPlayerPrefs();
  const [state, setState] = useState<PlayerState>({
    currentSong: null,
    queue: [],
    currentIndex: -1,
    isPlaying: false,
    progress: 0,
    volume: prefs.volume,
    shuffle: prefs.shuffle,
    repeatMode: prefs.repeatMode,
    isExpanded: false,
    streamError: null,
    sourcePlaylistId: null,
  });

  const stateRef = useRef(state);
  stateRef.current = state;
  const songIdRef = useRef<string | null>(null);

  // Persist volume, shuffle, repeatMode
  useEffect(() => {
    savePlayerPrefs({
      volume: state.volume,
      shuffle: state.shuffle,
      repeatMode: state.repeatMode,
    });
  }, [state.volume, state.shuffle, state.repeatMode]);

  // Sync volume to audio element
  useEffect(() => {
    getAudioElement().volume = state.volume / 100;
  }, [state.volume]);

  // Set up event listeners once
  useEffect(() => {
    const audio = getAudioElement();

    const onTimeUpdate = () => {
      setState((prev) => ({
        ...prev,
        progress: Math.floor(audio.currentTime),
      }));
    };

    const onEnded = () => {
      advanceToNext();
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle song changes — load new audio source
  useEffect(() => {
    const song = state.currentSong;
    if (!song || !song.audioFile) return;

    const audio = getAudioElement();

    const src = song.audioFile.startsWith("http")
      ? song.audioFile
      : `${window.location.origin}${song.audioFile}`;

    if (songIdRef.current !== song.id) {
      songIdRef.current = song.id;
      audio.src = src;
      audio.load();
      if (state.isPlaying) {
        audio.play().catch(() => {});
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentSong?.id]);

  // Handle play/pause toggling
  useEffect(() => {
    const song = state.currentSong;
    if (!song || !song.audioFile) return;

    const audio = getAudioElement();

    if (state.isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isPlaying]);

  function advanceToNext() {
    setState((prev) => {
      if (prev.repeatMode === "one") {
        const audio = getAudioElement();
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return { ...prev, progress: 0 };
      }

      const queueLen = prev.queue.length;
      if (queueLen === 0) {
        return { ...prev, progress: 0, isPlaying: false };
      }

      let nextIndex: number;
      if (prev.shuffle) {
        nextIndex = pickRandomIndex(prev.currentIndex, queueLen);
      } else {
        nextIndex = prev.currentIndex + 1;
      }

      if (nextIndex >= queueLen) {
        if (prev.repeatMode === "all") {
          nextIndex = 0;
        } else {
          return { ...prev, progress: prev.currentSong!.durationSec, isPlaying: false };
        }
      }

      recordStream(prev.queue[nextIndex].id).catch(() => {});

      return {
        ...prev,
        currentSong: prev.queue[nextIndex],
        currentIndex: nextIndex,
        progress: 0,
        isPlaying: true,
      };
    });
  }

  const playSong = useCallback(
    async (song: Song, queue?: Song[], sourcePlaylistId?: string) => {
      if (!song.audioFile) {
        setState((prev) => ({
          ...prev,
          streamError: "This song has no audio file available.",
        }));
        return;
      }

      const allowed = await canStream();
      if (!allowed) {
        setState((prev) => ({
          ...prev,
          streamError: "Daily stream limit reached. Upgrade your plan for more streams.",
        }));
        return;
      }

      recordStream(song.id).catch(() => {});

      const newQueue = queue ?? [song];
      const idx = newQueue.findIndex((s) => s.id === song.id);

      setState((prev) => ({
        ...prev,
        currentSong: song,
        queue: newQueue,
        currentIndex: idx >= 0 ? idx : 0,
        isPlaying: true,
        progress: 0,
        streamError: null,
        sourcePlaylistId: sourcePlaylistId ?? null,
      }));
    },
    []
  );

  const togglePlay = useCallback(() => {
    setState((prev) => {
      if (!prev.currentSong) return prev;
      return { ...prev, isPlaying: !prev.isPlaying };
    });
  }, []);

  const next = useCallback(() => {
    setState((prev) => {
      const queueLen = prev.queue.length;
      if (queueLen === 0 || !prev.currentSong) return prev;

      let nextIndex: number;
      if (prev.shuffle) {
        nextIndex = pickRandomIndex(prev.currentIndex, queueLen);
      } else {
        nextIndex = prev.currentIndex + 1;
      }

      if (nextIndex >= queueLen) {
        if (prev.repeatMode === "all") {
          nextIndex = 0;
        } else {
          return prev;
        }
      }

      recordStream(prev.queue[nextIndex].id).catch(() => {});

      return {
        ...prev,
        currentSong: prev.queue[nextIndex],
        currentIndex: nextIndex,
        progress: 0,
        isPlaying: true,
        streamError: null,
      };
    });
  }, []);

  const previous = useCallback(() => {
    setState((prev) => {
      if (!prev.currentSong) return prev;

      if (prev.progress > 3) {
        const audio = getAudioElement();
        audio.currentTime = 0;
        return { ...prev, progress: 0 };
      }

      let prevIndex = prev.currentIndex - 1;
      if (prevIndex < 0) {
        if (prev.repeatMode === "all") {
          prevIndex = prev.queue.length - 1;
        } else {
          prevIndex = 0;
        }
      }

      return {
        ...prev,
        currentSong: prev.queue[prevIndex],
        currentIndex: prevIndex,
        progress: 0,
        isPlaying: true,
      };
    });
  }, []);

  const seek = useCallback((time: number) => {
    const clamped = Math.max(0, Math.min(time, stateRef.current.currentSong?.durationSec ?? 0));
    const audio = getAudioElement();
    audio.currentTime = clamped;
    setState((prev) => ({
      ...prev,
      progress: clamped,
    }));
  }, []);

  const setVolume = useCallback((v: number) => {
    setState((prev) => ({ ...prev, volume: Math.max(0, Math.min(100, v)) }));
  }, []);

  const toggleShuffle = useCallback(() => {
    setState((prev) => ({ ...prev, shuffle: !prev.shuffle }));
  }, []);

  const cycleRepeat = useCallback(() => {
    setState((prev) => {
      const modes: RepeatMode[] = ["off", "all", "one"];
      const currentIdx = modes.indexOf(prev.repeatMode);
      return { ...prev, repeatMode: modes[(currentIdx + 1) % 3] };
    });
  }, []);

  const expand = useCallback(() => {
    setState((prev) => ({ ...prev, isExpanded: true }));
  }, []);

  const collapse = useCallback(() => {
    setState((prev) => ({ ...prev, isExpanded: false }));
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setState((prev) => {
      const newQueue = [...prev.queue];
      newQueue.splice(index, 1);

      let newIndex = prev.currentIndex;
      if (index < prev.currentIndex) {
        newIndex--;
      } else if (index === prev.currentIndex) {
        if (newQueue.length === 0) {
          return {
            ...prev,
            queue: [],
            currentSong: null,
            currentIndex: -1,
            isPlaying: false,
            progress: 0,
          };
        }
        if (newIndex >= newQueue.length) newIndex = 0;
        return {
          ...prev,
          queue: newQueue,
          currentSong: newQueue[newIndex],
          currentIndex: newIndex,
          progress: 0,
        };
      }

      return { ...prev, queue: newQueue, currentIndex: newIndex };
    });
  }, []);

  const reorderQueue = useCallback((from: number, to: number) => {
    setState((prev) => {
      const newQueue = [...prev.queue];
      const [moved] = newQueue.splice(from, 1);
      newQueue.splice(to, 0, moved);

      let newIndex = prev.currentIndex;
      if (from === prev.currentIndex) {
        newIndex = to;
      } else if (from < prev.currentIndex && to >= prev.currentIndex) {
        newIndex--;
      } else if (from > prev.currentIndex && to <= prev.currentIndex) {
        newIndex++;
      }

      return { ...prev, queue: newQueue, currentIndex: newIndex };
    });
  }, []);

  const stop = useCallback(() => {
    const audio = getAudioElement();
    audio.pause();
    audio.currentTime = 0;
    songIdRef.current = null;
    setState((prev) => ({
      ...prev,
      currentSong: null,
      queue: [],
      currentIndex: -1,
      isPlaying: false,
      progress: 0,
    }));
  }, []);

  const clearStreamError = useCallback(() => {
    setState((prev) => ({ ...prev, streamError: null }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        previous();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setVolume(stateRef.current.volume === 0 ? 80 : 0);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePlay, next, previous, setVolume]);

  return (
    <PlayerContext.Provider
      value={{
        ...state,
        playSong,
        togglePlay,
        next,
        previous,
        seek,
        setVolume,
        toggleShuffle,
        cycleRepeat,
        expand,
        collapse,
        removeFromQueue,
        reorderQueue,
        stop,
        clearStreamError,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
