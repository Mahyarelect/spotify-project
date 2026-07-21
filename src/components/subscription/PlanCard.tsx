import type { PlanLimits } from "@/types/subscription";
import { Check, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatCurrency } from "@/lib/utils/currency";

export function PlanCard({
  plan,
  isCurrent,
  onSelect,
}: {
  plan: PlanLimits;
  isCurrent: boolean;
  onSelect?: () => void;
}) {
  const { t } = useTranslation();
  const tierColors = {
    free: "border-zinc-300 dark:border-zinc-600",
    silver: "border-zinc-400 dark:border-zinc-500",
    gold: "border-yellow-400",
  };

  return (
    <div className={`rounded-xl border-2 p-6 space-y-4 bg-white dark:bg-zinc-900 ${tierColors[plan.tier]} ${isCurrent ? "ring-2 ring-green-500" : ""}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold capitalize dark:text-white">{plan.tier}</h3>
        {isCurrent && <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">{t.subscription.current}</span>}
      </div>
      <div className="text-3xl font-bold dark:text-white">
        {plan.priceMonthly === 0 ? t.subscription.free : `${formatCurrency(plan.priceMonthly, plan.currency)}/mo`}
      </div>
      <ul className="space-y-2 text-sm dark:text-zinc-300">
        <li className="flex items-center gap-2">
          <Check size={16} className="text-green-500" />
          {plan.dailyStreamLimit !== null ? t.subscription.streamsPerDay.replace("{limit}", String(plan.dailyStreamLimit)) : t.subscription.unlimitedStreams}
        </li>
        <li className="flex items-center gap-2">
          <Check size={16} className="text-green-500" />
          {plan.maxPlaylists !== null ? t.subscription.playlistsLimit.replace("{limit}", String(plan.maxPlaylists)) : t.subscription.unlimitedPlaylists}
        </li>
        <li className="flex items-center gap-2">
          {plan.profileImageAllowed ? <Check size={16} className="text-green-500" /> : <X size={16} className="text-red-400" />}
          {t.subscription.profileImage}
        </li>
        <li className="flex items-center gap-2">
          {plan.downloadAllowed ? <Check size={16} className="text-green-500" /> : <X size={16} className="text-red-400" />}
          {t.subscription.downloadSongs}
        </li>
        <li className="flex items-center gap-2">
          {plan.earlyAccess ? <Check size={16} className="text-green-500" /> : <X size={16} className="text-red-400" />}
          {t.subscription.earlyAccess}
        </li>
        <li className="flex items-center gap-2">
          {plan.viewStats ? <Check size={16} className="text-green-500" /> : <X size={16} className="text-red-400" />}
          {t.subscription.viewStats}
        </li>
      </ul>
      {!isCurrent && plan.tier !== "free" && onSelect && (
        <button onClick={onSelect} className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
          {t.subscription.upgrade}
        </button>
      )}
    </div>
  );
}
