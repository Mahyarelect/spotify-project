import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
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
  createdAt: "2026-07-21T00:00:00Z",
  paidAt: null,
};

it("shows the server-calculated quote before confirming an order", async () => {
  const user = userEvent.setup();
  const onCreateOrder = vi.fn().mockResolvedValue(order);
  const onConfirm = vi.fn().mockResolvedValue(undefined);

  render(
    <UpgradeModal
      plan={plan}
      open
      onClose={() => undefined}
      onCreateOrder={onCreateOrder}
      onConfirm={onConfirm}
    />,
  );

  await user.click(screen.getByRole("button", { name: "3mo" }));
  await user.click(screen.getByRole("button", { name: "Review server quote" }));

  expect(onCreateOrder).toHaveBeenCalledWith(3);
  expect(await screen.findByText("$29.97")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Confirm Upgrade" }));
  expect(onConfirm).toHaveBeenCalledWith(order.orderId);
});
