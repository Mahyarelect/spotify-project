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
}

interface PlayerContextType extends PlayerState {
  playSong: (song: Song, queue?: Song[]) => void;
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
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Persist volume, shuffle, repeatMode
  useEffect(() => {
    savePlayerPrefs({
      volume: state.volume,
      shuffle: state.shuffle,
      repeatMode: state.repeatMode,
    });
  }, [state.volume, state.shuffle, state.repeatMode]);

  // Fake playback engine
  useEffect(() => {
    if (state.isPlaying && state.currentSong) {
      intervalRef.current = setInterval(() => {
        setState((prev) => {
          const nextProgress = prev.progress + 1;
          if (nextProgress >= prev.currentSong!.durationSec) {
            // Song ended — handle repeat mode
            if (prev.repeatMode === "one") {
              return { ...prev, progress: 0 };
            }
            // Auto-advance
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

            return {
              ...prev,
              currentSong: prev.queue[nextIndex],
              currentIndex: nextIndex,
              progress: 0,
            };
          }
          return { ...prev, progress: nextProgress };
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.isPlaying, state.currentSong]);

  const playSong = useCallback(
    (song: Song, queue?: Song[]) => {
      // Stream enforcement
      if (user) {
        if (!canStream(user.id, user.subscription.limits.dailyStreamLimit)) {
          setState((prev) => ({
            ...prev,
            streamError: `Daily stream limit reached (${user.subscription.limits.dailyStreamLimit}/day). Upgrade your plan for more streams.`,
          }));
          return;
        }
        recordStream(user.id);
      }

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
      }));
    },
    [user]
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

      // Record stream for new song
      if (user) {
        if (!canStream(user.id, user.subscription.limits.dailyStreamLimit)) {
          return {
            ...prev,
            streamError: `Daily stream limit reached (${user.subscription.limits.dailyStreamLimit}/day). Upgrade your plan for more streams.`,
            isPlaying: false,
          };
        }
        recordStream(user.id);
      }

      return {
        ...prev,
        currentSong: prev.queue[nextIndex],
        currentIndex: nextIndex,
        progress: 0,
        streamError: null,
      };
    });
  }, [user]);

  const previous = useCallback(() => {
    setState((prev) => {
      if (!prev.currentSong) return prev;

      // If more than 3 seconds in, restart current song
      if (prev.progress > 3) {
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
      };
    });
  }, []);

  const seek = useCallback((time: number) => {
    setState((prev) => ({
      ...prev,
      progress: Math.max(0, Math.min(time, prev.currentSong?.durationSec ?? 0)),
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
        // Removed current song — play next or stop
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
      } else if (
        from < prev.currentIndex &&
        to >= prev.currentIndex
      ) {
        newIndex--;
      } else if (
        from > prev.currentIndex &&
        to <= prev.currentIndex
      ) {
        newIndex++;
      }

      return { ...prev, queue: newQueue, currentIndex: newIndex };
    });
  }, []);

  const stop = useCallback(() => {
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
