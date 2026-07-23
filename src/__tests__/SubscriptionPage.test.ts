import { describe, expect, it } from "vitest";
import { getPurchaseMode } from "@/lib/subscriptions/purchaseMode";

describe("subscription purchase matrix", () => {
  it.each([
    ["free", "silver", "upgrade"],
    ["free", "gold", "upgrade"],
    ["silver", "silver", "renew"],
    ["silver", "gold", "upgrade"],
    ["gold", "gold", "renew"],
  ] as const)("%s to %s is %s", (current, target, expected) => {
    expect(getPurchaseMode(current, target)).toBe(expected);
  });

  it.each([
    ["free", "free"],
    ["silver", "free"],
    ["gold", "free"],
    ["gold", "silver"],
  ] as const)("does not expose %s to %s", (current, target) => {
    expect(getPurchaseMode(current, target)).toBeNull();
  });
});
