import { grantEntitlement } from "@/lib/entitlement/grant-entitlement";
import { store } from "@/lib/store/memory";

export function handlePaymentCallback(orderNo: string, transactionId = `mock_${orderNo}`) {
  const order = store.orders.get(orderNo);
  if (!order) throw new Error("订单不存在。");
  if (store.processedCallbacks.has(transactionId)) return { order, idempotent: true };
  store.processedCallbacks.add(transactionId);
  grantEntitlement(order.productType);
  const updated = { ...order, status: "granted" as const };
  store.orders.set(orderNo, updated);
  return { order: updated, idempotent: false };
}
