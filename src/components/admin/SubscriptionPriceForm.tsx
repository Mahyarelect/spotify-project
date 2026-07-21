import { useEffect, useState } from "react";
import { CreditCard, Check } from "lucide-react";
import type { PlanLimits } from "@/types/subscription";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface SubscriptionPriceFormProps {
  plans: PlanLimits[];
  onSave: (prices: { silver: number; gold: number }) => Promise<void> | void;
}

export function SubscriptionPriceForm({ plans, onSave }: SubscriptionPriceFormProps) {
  const { t } = useTranslation();
  const silverPlan = plans.find((plan) => plan.tier === "silver");
  const goldPlan = plans.find((plan) => plan.tier === "gold");
  const [silverPrice, setSilverPrice] = useState("");
  const [goldPrice, setGoldPrice] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (silverPlan) setSilverPrice(String(silverPlan.priceMonthly));
    if (goldPlan) setGoldPrice(String(goldPlan.priceMonthly));
  }, [silverPlan, goldPlan]);

  async function handleSave() {
    const silver = Number.parseFloat(silverPrice);
    const gold = Number.parseFloat(goldPrice);
    if (!Number.isFinite(silver) || !Number.isFinite(gold) || silver < 0 || gold < 0) {
      setError("Enter valid non-negative prices.");
      return;
    }
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await onSave({ silver, gold });
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save prices.");
    } finally {
      setSaving(false);
    }
  }

  const ready = Boolean(silverPlan && goldPlan);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-300">
        <CreditCard size={16} className="text-green-400" />
        {t.admin.pricingTitle}
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { tier: "silver", label: t.admin.silver, value: silverPrice, setValue: setSilverPrice, plan: silverPlan },
            { tier: "gold", label: t.admin.gold, value: goldPrice, setValue: setGoldPrice, plan: goldPlan },
          ].map((item) => (
            <div className="space-y-1" key={item.tier}>
              <label className="block text-sm text-zinc-400">{item.label}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                  {item.plan?.currency ?? ""}
                </span>
                <input
                  type="number"
                  value={item.value}
                  onChange={(event) => item.setValue(event.target.value)}
                  min="0"
                  step="0.01"
                  disabled={!ready || saving}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 pl-12 pr-3 text-sm text-zinc-100 focus:border-green-500 focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3 text-xs text-zinc-500">
          <p>{t.admin.freeNote}</p>
          <p className="mt-1">{t.admin.changesNote}</p>
        </div>

        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button
          onClick={handleSave}
          disabled={!ready || saving}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {saved ? <><Check size={16} />{t.admin.saved}</> : saving ? "Saving…" : t.admin.savePrices}
        </button>
      </div>
    </div>
  );
}
