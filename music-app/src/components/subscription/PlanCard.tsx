import type { PlanLimits } from "@/types/subscription";
import { Check, X } from "lucide-react";

export function PlanCard({
  plan,
  isCurrent,
  onSelect,
}: {
  plan: PlanLimits;
  isCurrent: boolean;
  onSelect?: () => void;
}) {
  const tierColors = {
    free: "border-zinc-300 dark:border-zinc-600",
    silver: "border-zinc-400 dark:border-zinc-500",
    gold: "border-yellow-400",
  };

  return (
    <div className={`rounded-xl border-2 p-6 space-y-4 ${tierColors[plan.tier]} ${isCurrent ? "ring-2 ring-green-500" : ""}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold capitalize">{plan.tier}</h3>
        {isCurrent && <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">Current</span>}
      </div>
      <div className="text-3xl font-bold">
        {plan.priceMonthly === 0 ? "Free" : `$${plan.priceMonthly}/mo`}
      </div>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2">
          <Check size={16} className="text-green-500" />
          {plan.dailyStreamLimit !== null ? `${plan.dailyStreamLimit} streams/day` : "Unlimited streams"}
        </li>
        <li className="flex items-center gap-2">
          <Check size={16} className="text-green-500" />
          {plan.maxPlaylists !== null ? `${plan.maxPlaylists} playlists` : "Unlimited playlists"}
        </li>
        <li className="flex items-center gap-2">
          {plan.profileImageAllowed ? <Check size={16} className="text-green-500" /> : <X size={16} className="text-red-400" />}
          Profile image
        </li>
        <li className="flex items-center gap-2">
          {plan.downloadAllowed ? <Check size={16} className="text-green-500" /> : <X size={16} className="text-red-400" />}
          Download songs
        </li>
        <li className="flex items-center gap-2">
          {plan.earlyAccess ? <Check size={16} className="text-green-500" /> : <X size={16} className="text-red-400" />}
          Early access to new releases
        </li>
        <li className="flex items-center gap-2">
          {plan.viewStats ? <Check size={16} className="text-green-500" /> : <X size={16} className="text-red-400" />}
          View song/listener stats
        </li>
      </ul>
      {!isCurrent && plan.tier !== "free" && onSelect && (
        <button onClick={onSelect} className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
          Upgrade
        </button>
      )}
    </div>
  );
}
