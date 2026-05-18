import { createId } from "@/lib/utils/ids";
import { MOCK_USER_ID, store } from "@/lib/store/memory";

export const PRODUCTS: Record<string, { amountCents: number; label: string }> = {
  bazi_30d: { amountCents: 990, label: "八字会员 30 天" },
  bazi_90d: { amountCents: 1990, label: "八字会员 90 天" },
  yijing_1: { amountCents: 390, label: "易经 1 次" },
  yijing_3: { amountCents: 990, label: "易经 3 次" },
  yijing_9: { amountCents: 1990, label: "易经 9 次" }
};

export function createOrder(productType: string) {
  const product = PRODUCTS[productType];
  if (!product) throw new Error("未知商品。");
  const orderNo = createId("order");
  const order = {
    orderNo,
    userId: MOCK_USER_ID,
    productType,
    amountCents: product.amountCents,
    status: "created" as const,
    createdAt: new Date().toISOString()
  };
  store.orders.set(orderNo, order);
  return { ...order, paymentParams: { provider: "mock", orderNo, amountCents: product.amountCents } };
}
