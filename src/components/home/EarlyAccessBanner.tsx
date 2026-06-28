import { Lock, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Album } from "@/types/music";
import { AlbumCard } from "./AlbumCard";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/constants/routes";

export function EarlyAccessBanner({ albums }: { albums: Album[] }) {
  const { user } = useAuth();
  const isGold = user?.planTier === "gold";

  if (albums.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles size={20} className="text-yellow-400" />
        <h2 className="text-2xl font-bold tracking-tight">Early Access</h2>
      </div>

      {isGold ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      ) : (
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-2 blur-[2px] brightness-50">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-zinc-900/90 px-4 py-2">
              <Lock size={16} className="text-yellow-400" />
              <span className="text-sm font-medium text-zinc-200">
                Gold members only
              </span>
            </div>
            <Link
              to={ROUTES.SUBSCRIPTION}
              className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-400"
            >
              Upgrade to Gold
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
