import { BarChart3, TrendingUp, Users, Music } from "lucide-react";

interface RevenueChartsProps {
  totalRevenue: number;
  totalStreams: number;
  paidAmount: number;
  pendingAmount: number;
  byTier: { tier: string; count: number; revenue: number }[];
}

export function RevenueCharts({
  totalRevenue,
  totalStreams,
  paidAmount,
  pendingAmount,
  byTier,
}: RevenueChartsProps) {
  const maxRevenue = Math.max(...byTier.map((t) => t.revenue), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Total Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          color="text-green-400"
        />
        <StatCard
          icon={<Music size={20} />}
          label="Total Streams"
          value={totalStreams.toLocaleString()}
          color="text-blue-400"
        />
        <StatCard
          icon={<BarChart3 size={20} />}
          label="Paid Out"
          value={`$${paidAmount.toFixed(2)}`}
          color="text-emerald-400"
        />
        <StatCard
          icon={<Users size={20} />}
          label="Pending Payout"
          value={`$${pendingAmount.toFixed(2)}`}
          color="text-yellow-400"
        />
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-4 text-sm font-medium text-zinc-300">
          Revenue by Subscription Tier
        </h3>
        <div className="space-y-3">
          {byTier.map((tier) => (
            <div key={tier.tier} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="capitalize text-zinc-300">{tier.tier}</span>
                <span className="text-zinc-400">
                  {tier.count} users · ${tier.revenue.toFixed(2)}/mo
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{
                    width: `${(tier.revenue / maxRevenue) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
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
