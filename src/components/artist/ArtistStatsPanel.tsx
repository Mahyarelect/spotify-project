import { BarChart3, Headphones, Music } from "lucide-react";

interface ArtistStatsPanelProps {
  totalStreams: number;
  followerCount: number;
  songCount: number;
  albumCount: number;
}

export function ArtistStatsPanel({
  totalStreams,
  followerCount,
  songCount,
  albumCount,
}: ArtistStatsPanelProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-300">
        <BarChart3 size={16} className="text-green-400" />
        Artist Statistics
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<Headphones size={18} />}
          label="Total Streams"
          value={totalStreams.toLocaleString()}
        />
        <StatCard
          icon={<Headphones size={18} />}
          label="Followers"
          value={followerCount.toLocaleString()}
        />
        <StatCard
          icon={<Music size={18} />}
          label="Songs"
          value={songCount.toString()}
        />
        <StatCard
          icon={<Music size={18} />}
          label="Albums"
          value={albumCount.toString()}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3 text-center">
      <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center text-zinc-400">
        {icon}
      </div>
      <p className="text-lg font-bold text-zinc-100">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}
