import { Outlet } from "react-router-dom";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { PlayerBar } from "@/components/player/PlayerBar";
import { PlayerOverlay } from "@/components/player/PlayerOverlay";

export function AppLayout() {
  const { user } = useAuth();
  const { currentSong } = usePlayer();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50">
      <TopNav />
      <div className="flex flex-1">
        {user ? <Sidebar /> : null}
        <main
          className={`mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8 ${
            currentSong ? "pb-24 sm:pb-28" : ""
          }`}
        >
          <Outlet />
        </main>
      </div>
      <PlayerBar />
      <PlayerOverlay />
    </div>
  );
}
