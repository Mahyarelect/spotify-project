import { useState } from "react";
import type { PlanLimits } from "@/types/subscription";
import { BILLING_INTERVALS } from "@/lib/constants/plans";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function UpgradeModal({
  plan,
  open,
  onClose,
  onConfirm,
}: {
  plan: PlanLimits;
  open: boolean;
  onClose: () => void;
  onConfirm: (months: number) => void;
}) {
  const [months, setMonths] = useState(1);
  const { t } = useTranslation();

  return (
    <Modal open={open} onClose={onClose} title={t.subscription.upgradeTitle.replace("{tier}", plan.tier)}>
      <div className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t.subscription.upgradePrompt.replace("{tier}", plan.tier).replace("{price}", String(plan.priceMonthly))}
        </p>
        <div className="space-y-1">
          <label className="block text-sm font-medium dark:text-zinc-300">{t.subscription.billingCycle}</label>
          <div className="flex gap-2">
            {(plan.allowedBillingMonths ?? [...BILLING_INTERVALS]).map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  months === m
                    ? "bg-green-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {t.subscription.months.replace("{m}", String(m))}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">{t.subscription.paymentNotice}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose}>{t.subscription.cancel}</Button>
          <Button onClick={() => onConfirm(months)}>{t.subscription.confirmUpgrade}</Button>
        </div>
      </div>
    </Modal>
  );
}
