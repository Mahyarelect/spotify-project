import { useState } from "react";
import { expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubscriptionPurchaseModal } from "@/components/subscription/SubscriptionPurchaseModal";
import { I18nProvider } from "@/lib/i18n/useTranslation";
import type { PlanLimits, SubscriptionOrder } from "@/types/subscription";

const plan: PlanLimits = {
  tier: "silver",
  displayName: "Silver",
  currency: "USD",
  allowedBillingMonths: [1, 3, 6, 12],
  dailyStreamLimit: null,
  maxPlaylists: 100,
  profileImageAllowed: true,
  downloadAllowed: true,
  earlyAccess: false,
  viewStats: false,
  priceMonthly: 9.99,
};

const order: SubscriptionOrder = {
  orderId: "33333333-3333-4333-8333-333333333333",
  status: "pending",
  plan: "silver",
  months: 3,
  unitPrice: 9.99,
  totalAmount: 29.97,
  currency: "USD",
  paymentUrl: null,
  projectedExpiresAt: "2026-10-21T00:00:00Z",
  createdAt: "2026-07-21T00:00:00Z",
  paidAt: null,
};

const currentSubscription = {
  plan: "silver" as const,
  status: "active" as const,
  startsAt: "2026-01-01T00:00:00Z",
  expiresAt: "2026-07-21T00:00:00Z",
  limits: {
    dailyStreamLimit: null,
    maxPlaylists: 100,
    profileImageAllowed: true,
    downloadAllowed: true,
    earlyAccessAllowed: false,
    statisticsAllowed: false,
  },
};

it("shows the server-calculated quote before confirming an order", async () => {
  const user = userEvent.setup();
  const onCreateOrder = vi.fn().mockResolvedValue(order);
  const onConfirm = vi.fn().mockResolvedValue(undefined);

  render(
    <SubscriptionPurchaseModal
      plan={plan}
      currentSubscription={currentSubscription}
      mode="renew"
      open
      onClose={() => undefined}
      onCreateOrder={onCreateOrder}
      onConfirm={onConfirm}
    />,
  );

  await user.click(screen.getByRole("button", { name: "3mo" }));
  await user.click(screen.getByRole("button", { name: "Review server quote" }));

  expect(onCreateOrder).toHaveBeenCalledWith(3, expect.any(String));
  expect(await screen.findByText("$29.97")).toBeInTheDocument();
  expect(screen.getByText("Oct 21, 2026")).toBeInTheDocument();
  expect(screen.getByText("Renew / Extend")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "6mo" })).toBeEnabled();
  expect(screen.getByText(/Changing the duration will discard this quote/)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Confirm purchase" }));
  expect(onConfirm).toHaveBeenCalledWith(order.orderId);
});

it("discards a quote and rotates the attempt key only when duration changes", async () => {
  const user = userEvent.setup();
  const nextOrder = {
    ...order,
    orderId: "44444444-4444-4444-8444-444444444444",
    months: 6,
    totalAmount: 59.94,
  };
  const onCreateOrder = vi.fn()
    .mockResolvedValueOnce(order)
    .mockResolvedValueOnce(nextOrder);

  render(
    <SubscriptionPurchaseModal
      plan={plan}
      currentSubscription={currentSubscription}
      mode="renew"
      open
      onClose={() => undefined}
      onCreateOrder={onCreateOrder}
      onConfirm={vi.fn()}
    />,
  );

  await user.click(screen.getByRole("button", { name: "3mo" }));
  await user.click(screen.getByRole("button", { name: "Review server quote" }));
  expect(await screen.findByText("$29.97")).toBeInTheDocument();
  const firstAttemptKey = onCreateOrder.mock.calls[0][1];

  await user.click(screen.getByRole("button", { name: "3mo" }));
  expect(screen.getByText("$29.97")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "6mo" }));
  expect(screen.queryByText("$29.97")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Review server quote" })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Review server quote" }));
  expect(await screen.findByText("$59.94")).toBeInTheDocument();
  expect(onCreateOrder).toHaveBeenLastCalledWith(6, expect.any(String));
  expect(onCreateOrder.mock.calls[1][1]).not.toBe(firstAttemptKey);
});

it("visibly disables duration controls only while a quote request is busy", async () => {
  let resolveOrder: ((value: SubscriptionOrder) => void) | undefined;
  const onCreateOrder = vi.fn(() => new Promise<SubscriptionOrder>((resolve) => {
    resolveOrder = resolve;
  }));
  const user = userEvent.setup();

  render(
    <SubscriptionPurchaseModal
      plan={plan}
      currentSubscription={currentSubscription}
      mode="renew"
      open
      onClose={() => undefined}
      onCreateOrder={onCreateOrder}
      onConfirm={vi.fn()}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Review server quote" }));
  const duration = screen.getByRole("button", { name: "3mo" });
  expect(duration).toBeDisabled();
  expect(duration).toHaveClass("disabled:cursor-not-allowed", "disabled:opacity-50");

  resolveOrder?.({ ...order, months: 1 });
  await screen.findByText("$29.97");
  expect(duration).toBeEnabled();
});

function ReopenHarness() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open purchase</button>
      <SubscriptionPurchaseModal
        plan={plan}
        currentSubscription={currentSubscription}
        mode="renew"
        open={open}
        onClose={() => setOpen(false)}
        onCreateOrder={async () => order}
        onConfirm={async () => undefined}
      />
    </>
  );
}

it("resets quote and duration when the modal closes and reopens", async () => {
  const user = userEvent.setup();
  render(<ReopenHarness />);

  await user.click(screen.getByRole("button", { name: "3mo" }));
  await user.click(screen.getByRole("button", { name: "Review server quote" }));
  expect(await screen.findByText("$29.97")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Cancel" }));

  await user.click(screen.getByRole("button", { name: "Open purchase" }));

  expect(screen.queryByText("$29.97")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "1mo" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Review server quote" })).toBeInTheDocument();
});

it("resets stale quote state when the selected plan and mode change", async () => {
  const user = userEvent.setup();
  const view = render(
    <SubscriptionPurchaseModal
      plan={plan}
      currentSubscription={currentSubscription}
      mode="renew"
      open
      onClose={() => undefined}
      onCreateOrder={async () => order}
      onConfirm={async () => undefined}
    />,
  );
  await user.click(screen.getByRole("button", { name: "3mo" }));
  await user.click(screen.getByRole("button", { name: "Review server quote" }));
  expect(await screen.findByText("$29.97")).toBeInTheDocument();

  view.rerender(
    <SubscriptionPurchaseModal
      plan={{ ...plan, tier: "gold", displayName: "Gold", allowedBillingMonths: [1, 6] }}
      currentSubscription={currentSubscription}
      mode="upgrade"
      open
      onClose={() => undefined}
      onCreateOrder={async () => ({ ...order, plan: "gold" })}
      onConfirm={async () => undefined}
    />,
  );

  expect(await screen.findByRole("dialog", { name: "Upgrade to Gold" })).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByText("$29.97")).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: "1mo" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Review server quote" })).toBeInTheDocument();
});

it("renders renewal controls in Persian", () => {
  render(
    <I18nProvider language="fa" setLanguage={async () => undefined}>
      <SubscriptionPurchaseModal
        plan={plan}
        currentSubscription={currentSubscription}
        mode="renew"
        open
        onClose={() => undefined}
        onCreateOrder={vi.fn()}
        onConfirm={vi.fn()}
      />
    </I18nProvider>,
  );

  expect(screen.getByRole("dialog", { name: "تمدید نقره‌ای" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "دریافت پیش‌فاکتور از سرور" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "بستن" })).toBeInTheDocument();
});
