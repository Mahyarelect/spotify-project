import { useState } from "react";
import type { PlanLimits } from "@/types/subscription";
import { BILLING_INTERVALS } from "@/lib/constants/plans";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

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

  return (
    <Modal open={open} onClose={onClose} title={`Upgrade to ${plan.tier}`}>
      <div className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          You&apos;re about to upgrade to the <strong className="capitalize dark:text-zinc-200">{plan.tier}</strong> plan at ${plan.priceMonthly}/mo.
        </p>
        <div className="space-y-1">
          <label className="block text-sm font-medium dark:text-zinc-300">Billing cycle</label>
          <div className="flex gap-2">
            {BILLING_INTERVALS.map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  months === m
                    ? "bg-green-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {m}mo
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">Payment will be processed in Phase 2 via a real payment gateway.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm(months)}>Confirm Upgrade</Button>
        </div>
      </div>
    </Modal>
  );
}
