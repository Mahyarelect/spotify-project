import { Headphones, Users, DollarSign, Music } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface ArtistStatsCardsProps {
  totalStreams: number;
  listenerCount: number;
  revenue: number;
  songCount: number;
}

export function ArtistStatsCards({
  totalStreams,
  listenerCount,
  revenue,
  songCount,
}: ArtistStatsCardsProps) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<Headphones size={20} />}
        label={t.artistDashboard.totalStreams}
        value={totalStreams.toLocaleString()}
        color="text-green-400"
      />
      <StatCard
        icon={<Users size={20} />}
        label={t.artistDashboard.listeners}
        value={listenerCount.toLocaleString()}
        color="text-blue-400"
      />
      <StatCard
        icon={<DollarSign size={20} />}
        label={t.artistDashboard.revenue}
        value={`$${revenue.toFixed(2)}`}
        color="text-yellow-400"
      />
      <StatCard
        icon={<Music size={20} />}
        label={t.artistDashboard.publishedWorks}
        value={songCount.toString()}
        color="text-purple-400"
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className={`mb-2 ${color}`}>{icon}</div>
      <p className="text-2xl font-bold text-zinc-100">{value}</p>
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  );
}
