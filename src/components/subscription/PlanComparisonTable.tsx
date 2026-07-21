import type { PlanLimits } from "@/types/subscription";
import { Check, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatCurrency } from "@/lib/utils/currency";

export function PlanComparisonTable({ plans }: { plans: PlanLimits[] }) {
  const { t } = useTranslation();

  const boolFeatures = [
    { label: t.subscription.profileImage, key: "profileImageAllowed" as keyof PlanLimits },
    { label: t.subscription.downloadSongs, key: "downloadAllowed" as keyof PlanLimits },
    { label: t.subscription.earlyAccess, key: "earlyAccess" as keyof PlanLimits },
    { label: t.subscription.viewStats, key: "viewStats" as keyof PlanLimits },
  ];

  const numFeatures = [
    { label: t.subscription.streamsPerDay.replace("{limit}", ""), key: "dailyStreamLimit" as keyof PlanLimits, format: (v: PlanLimits["dailyStreamLimit"]) => (v !== null ? String(v) : "∞") },
    { label: t.subscription.unlimitedPlaylists.replace("Unlimited ", ""), key: "maxPlaylists" as keyof PlanLimits, format: (v: PlanLimits["maxPlaylists"]) => (v !== null ? String(v) : "∞") },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm dark:text-zinc-300">
        <thead>
          <tr className="border-b dark:border-zinc-700">
            <th className="text-left py-3 px-4 dark:text-white">{t.subscription.feature}</th>
            {plans.map((p) => (
              <th key={p.tier} className="text-center py-3 px-4 capitalize dark:text-white">{p.tier}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {numFeatures.map(({ label, key, format }) => (
            <tr key={key} className="border-b dark:border-zinc-700 last:border-0">
              <td className="py-3 px-4">{label}</td>
              {plans.map((p) => (
                <td key={p.tier} className="text-center py-3 px-4">
                  {format(p[key] as PlanLimits["dailyStreamLimit"])}
                </td>
              ))}
            </tr>
          ))}
          {boolFeatures.map(({ label, key }) => (
            <tr key={key} className="border-b dark:border-zinc-700 last:border-0">
              <td className="py-3 px-4">{label}</td>
              {plans.map((p) => (
                <td key={p.tier} className="text-center py-3 px-4">
                  {p[key] ? <Check size={16} className="inline text-green-500" /> : <X size={16} className="inline text-red-400" />}
                </td>
              ))}
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="py-3 px-4 dark:text-white">{t.subscription.price}</td>
            {plans.map((p) => (
              <td key={p.tier} className="text-center py-3 px-4">
                {p.priceMonthly === 0 ? t.subscription.free : `${formatCurrency(p.priceMonthly, p.currency)}/mo`}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
