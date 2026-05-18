import { describe, expect, it } from "vitest";
import { getYijingCredits } from "@/lib/entitlement/check-entitlement";
import { createOrder } from "@/lib/payment/create-order";
import { handlePaymentCallback } from "@/lib/payment/handle-callback";

describe("mock payment", () => {
  it("grants entitlement once for duplicated callbacks", () => {
    const before = getYijingCredits();
    const order = createOrder("yijing_3");
    handlePaymentCallback(order.orderNo, "txn_1");
    handlePaymentCallback(order.orderNo, "txn_1");
    expect(getYijingCredits()).toBe(before + 3);
  });
});
