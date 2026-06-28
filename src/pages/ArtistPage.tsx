import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";

export default function ArtistPage() {
  const { artistName } = useParams();
  const decoded = artistName ? decodeURIComponent(artistName) : "Unknown";

  return (
    <div className="space-y-6">
      <Link
        to={ROUTES.ALBUMS}
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200"
      >
        <ArrowLeft size={16} />
        Back to Albums & Singles
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800">
          <User size={36} className="text-zinc-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{decoded}</h1>
          <p className="text-sm text-zinc-400">Artist</p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <p className="text-zinc-400">
          Artist profile page is a placeholder — full artist pages will be implemented in a future phase.
        </p>
      </div>
    </div>
  );
}
