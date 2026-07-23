import { useRef, useState } from "react";
import type { CurrentSubscription } from "@/types/user";
import type { PlanLimits, PurchaseMode, SubscriptionOrder } from "@/types/subscription";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatCurrency } from "@/lib/utils/currency";
import { createSubscriptionAttemptKey } from "@/lib/services/subscriptionService";

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-zinc-900 dark:text-white">{value}</dd>
    </div>
  );
}

export function SubscriptionPurchaseModal({
  plan,
  currentSubscription,
  mode,
  open,
  onClose,
  onCreateOrder,
  onConfirm,
}: {
  plan: PlanLimits;
  currentSubscription: CurrentSubscription;
  mode: PurchaseMode;
  open: boolean;
  onClose: () => void;
  onCreateOrder: (months: number, idempotencyKey: string) => Promise<SubscriptionOrder>;
  onConfirm: (orderId: string) => Promise<void>;
}) {
  const billingMonths = plan.allowedBillingMonths ?? [];
  const [months, setMonths] = useState(billingMonths[0] ?? 1);
  const [order, setOrder] = useState<SubscriptionOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attemptKey = useRef(createSubscriptionAttemptKey());
  const { t, lang } = useTranslation();
  const locale = lang === "fa" ? "fa-IR" : "en-US";
  const planName = t.profile.plans[plan.tier];
  const currentPlanName = t.profile.plans[currentSubscription.plan];
  const formatDate = (value: string | null) => value
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value))
    : t.subscription.noExpiration;

  const chooseMonths = (nextMonths: number) => {
    setMonths(nextMonths);
    setOrder(null);
    setError(null);
    attemptKey.current = createSubscriptionAttemptKey();
  };

  const createOrder = async () => {
    setBusy(true);
    setError(null);
    try {
      setOrder(await onCreateOrder(months, attemptKey.current));
    } catch {
      setError(t.subscription.createError);
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
    } catch {
      setError(t.subscription.confirmError);
      setBusy(false);
    }
  };

  const title = (mode === "renew" ? t.subscription.renewTitle : t.subscription.upgradeTitle)
    .replace("{tier}", planName);

  return (
    <Modal open={open} onClose={busy ? () => undefined : onClose} title={title}>
      <div className="max-h-[75vh] space-y-4 overflow-y-auto pe-1">
        <dl className="grid grid-cols-2 gap-3 rounded-lg bg-zinc-100 p-3 text-sm dark:bg-zinc-800/70">
          <Detail label={t.subscription.currentPlanLabel} value={currentPlanName} />
          <Detail label={t.subscription.currentExpiration} value={formatDate(currentSubscription.expiresAt)} />
          <Detail label={t.subscription.targetPlan} value={planName} />
          <Detail
            label={t.subscription.purchaseMode}
            value={mode === "renew" ? t.subscription.renewMode : t.subscription.upgradeMode}
          />
        </dl>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium dark:text-zinc-300">{t.subscription.duration}</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {billingMonths.map((month) => (
              <button
                key={month}
                type="button"
                disabled={busy || Boolean(order)}
                aria-pressed={months === month}
                onClick={() => chooseMonths(month)}
                className={`min-h-11 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  months === month
                    ? "bg-green-600 text-white"
                    : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {t.subscription.months.replace("{m}", String(month))}
              </button>
            ))}
          </div>
        </fieldset>

        {order && (
          <dl className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-300 p-4 text-sm dark:border-zinc-700 dark:bg-zinc-900/60">
            <Detail
              label={t.subscription.unitPrice}
              value={formatCurrency(order.unitPrice, order.currency, locale)}
            />
            <Detail
              label={t.subscription.serverTotal}
              value={formatCurrency(order.totalAmount, order.currency, locale)}
            />
            <Detail
              label={t.subscription.orderStatus}
              value={t.subscription.orderStatuses[order.status]}
            />
            <Detail label={t.subscription.projectedExpiration} value={formatDate(order.projectedExpiresAt)} />
          </dl>
        )}

        {error && <p role="alert" className="rounded-lg bg-red-950/30 p-3 text-sm text-red-500">{error}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={busy}>{t.subscription.cancel}</Button>
          {!order ? (
            <Button onClick={createOrder} disabled={busy || billingMonths.length === 0}>
              {busy ? t.subscription.creatingOrder : t.subscription.reviewQuote}
            </Button>
          ) : order.paymentUrl ? (
            <a
              href={order.paymentUrl}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              {t.subscription.continuePayment}
            </a>
          ) : (
            <Button onClick={confirmOrder} disabled={busy || order.status !== "pending"}>
              {busy ? t.subscription.confirming : t.subscription.confirmPurchase}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
