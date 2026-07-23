import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useAuth } from "@/lib/hooks/useAuth";
import { PlanCard } from "@/components/subscription/PlanCard";
import { PlanComparisonTable } from "@/components/subscription/PlanComparisonTable";
import { SubscriptionPurchaseModal } from "@/components/subscription/SubscriptionPurchaseModal";
import * as subscriptionService from "@/lib/services/subscriptionService";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { getPurchaseMode } from "@/lib/subscriptions/purchaseMode";
import type { PlanLimits, PurchaseMode } from "@/types/subscription";

export default function SubscriptionPage() {
  const { t, lang } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState<PlanLimits[]>([]);
  const [selection, setSelection] = useState<{ plan: PlanLimits; mode: PurchaseMode } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPlans() {
      try {
        setPlans(await subscriptionService.getPlans(controller.signal));
      } catch {
        if (!controller.signal.aborted) {
          setError(t.subscription.loadError);
        }
      }
    }

    void loadPlans();
    return () => controller.abort();
  }, [t.subscription.loadError]);

  if (!user) return null;

  const handleCreateOrder = async (months: number, idempotencyKey: string) => {
    if (!selection) throw new Error(t.subscription.selectPlanError);
    return subscriptionService.createOrder(selection.plan.tier, months, idempotencyKey);
  };

  const handleConfirmOrder = async (orderId: string) => {
    await subscriptionService.confirmMockOrder(orderId);
    await refreshUser();
    setSelection(null);
  };

  const renewal = user.subscription.expiresAt
    ? ` \u00b7 ${t.subscription.renews.replace(
        "{date}",
        new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-US").format(
          new Date(user.subscription.expiresAt),
        ),
      )}`
    : "";

  return (
    <>
      <PageHeader
        title={t.subscription.title}
        description={`${t.subscription.currentPlan.replace("{planTier}", user.subscription.plan)}${renewal}`}
      />

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-950/50 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6 mb-10">
        {plans.map((plan) => {
          const mode = getPurchaseMode(user.subscription.plan, plan.tier);
          return (
            <PlanCard
              key={plan.tier}
              plan={plan}
              isCurrent={user.subscription.plan === plan.tier}
              onSelect={mode ? () => setSelection({ plan, mode }) : undefined}
              actionLabel={
                mode === "renew"
                  ? t.subscription.renew
                  : mode === "upgrade"
                    ? t.subscription.upgrade
                    : undefined
              }
            />
          );
        })}
      </div>

      <PageShell>
        <h2 className="text-lg font-semibold mb-4">{t.subscription.planComparison}</h2>
        <PlanComparisonTable plans={plans} />
      </PageShell>

      {selection && (
        <SubscriptionPurchaseModal
          plan={selection.plan}
          currentSubscription={user.subscription}
          mode={selection.mode}
          open
          onClose={() => setSelection(null)}
          onCreateOrder={handleCreateOrder}
          onConfirm={handleConfirmOrder}
        />
      )}
    </>
  );
}
