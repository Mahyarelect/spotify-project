import { useState } from "react";
import { CreditCard, Check } from "lucide-react";
import type { PlanLimits } from "@/types/subscription";

interface SubscriptionPriceFormProps {
  plans: PlanLimits[];
  onSave: (prices: { silver: number; gold: number }) => void;
}

export function SubscriptionPriceForm({
  plans,
  onSave,
}: SubscriptionPriceFormProps) {
  const silverPlan = plans.find((p) => p.tier === "silver");
  const goldPlan = plans.find((p) => p.tier === "gold");

  const [silverPrice, setSilverPrice] = useState(
    silverPlan?.priceMonthly?.toString() ?? "9.99"
  );
  const [goldPrice, setGoldPrice] = useState(
    goldPlan?.priceMonthly?.toString() ?? "14.99"
  );
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const s = parseFloat(silverPrice);
    const g = parseFloat(goldPrice);
    if (isNaN(s) || isNaN(g) || s < 0 || g < 0) return;
    onSave({ silver: s, gold: g });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-300">
        <CreditCard size={16} className="text-green-400" />
        Subscription Pricing
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm text-zinc-400">
              Silver (monthly)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                $
              </span>
              <input
                type="number"
                value={silverPrice}
                onChange={(e) => setSilverPrice(e.target.value)}
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-7 pr-3 text-sm text-zinc-100 focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-sm text-zinc-400">
              Gold (monthly)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                $
              </span>
              <input
                type="number"
                value={goldPrice}
                onChange={(e) => setGoldPrice(e.target.value)}
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-7 pr-3 text-sm text-zinc-100 focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3 text-xs text-zinc-500">
          <p>Free tier: $0.00 (hardcoded)</p>
          <p className="mt-1">
            Changes take effect immediately and are stored in the database.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          {saved ? (
            <>
              <Check size={16} />
              Saved!
            </>
          ) : (
            "Save Prices"
          )}
        </button>
      </div>
    </div>
  );
}
