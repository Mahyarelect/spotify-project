import { useState } from "react";
import type { PlanLimits, SubscriptionOrder } from "@/types/subscription";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatCurrency } from "@/lib/utils/currency";

export function UpgradeModal({
  plan,
  open,
  onClose,
  onCreateOrder,
  onConfirm,
}: {
  plan: PlanLimits;
  open: boolean;
  onClose: () => void;
  onCreateOrder: (months: number) => Promise<SubscriptionOrder>;
  onConfirm: (orderId: string) => Promise<void>;
}) {
  const billingMonths = plan.allowedBillingMonths ?? [];
  const [months, setMonths] = useState(billingMonths[0] ?? 1);
  const [order, setOrder] = useState<SubscriptionOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const createOrder = async () => {
    setBusy(true);
    setError(null);
    try {
      setOrder(await onCreateOrder(months));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create order.");
    } finally {
      setBusy(false);
    }
  };

  const confirmOrder = async () => {
    if (!order) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(order.orderId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to confirm order.");
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={busy ? () => undefined : onClose} title={t.subscription.upgradeTitle.replace("{tier}", plan.displayName ?? plan.tier)}>
      <div className="space-y-4">
        {!order ? (
          <>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {t.subscription.upgradePrompt
                .replace("{tier}", plan.displayName ?? plan.tier)
                .replace("${price}", formatCurrency(plan.priceMonthly, plan.currency))}
            </p>
            <div className="space-y-1">
              <label className="block text-sm font-medium dark:text-zinc-300">{t.subscription.billingCycle}</label>
              <div className="flex gap-2">
                {billingMonths.map((month) => (
                  <button
                    key={month}
                    type="button"
                    disabled={busy}
                    onClick={() => setMonths(month)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      months === month
                        ? "bg-green-600 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {t.subscription.months.replace("{m}", String(month))}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-4 text-sm">
            <p className="text-zinc-400">Server order total</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {formatCurrency(order.totalAmount, order.currency)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {order.months} month{order.months === 1 ? "" : "s"} · {order.orderId}
            </p>
          </div>
        )}

        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={busy}>{t.subscription.cancel}</Button>
          {!order ? (
            <Button onClick={createOrder} disabled={busy || billingMonths.length === 0}>
              {busy ? "Creating order…" : "Review server quote"}
            </Button>
          ) : order.paymentUrl ? (
            <a href={order.paymentUrl} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
              Continue to payment
            </a>
          ) : (
            <Button onClick={confirmOrder} disabled={busy}>
              {busy ? "Confirming…" : t.subscription.confirmUpgrade}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
